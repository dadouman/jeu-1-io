// server/game-loops/solo-loop.js
// Boucle de jeu pour mode solo (20 niveaux)

const { generateMaze, getRandomEmptyPosition } = require('../../utils/map');
const { calculateGemsForLevel, addGems } = require('../../utils/gems');
const GameMode = require('../../utils/GameMode');
const { ShopManager } = require('../../utils/ShopManager');

function processSoloGameLoop(soloSessions, io, { 
    calculateMazeSize, 
    getShopItemsForMode 
}, { 
    mongoURI, 
    SoloRunModel,
    TRANSITION_DURATION, 
    SHOP_DURATION 
}) {
    // Initialiser les ShopManagers au première fois (cache)
    if (!processSoloGameLoop.shopManagers) {
        processSoloGameLoop.shopManagers = {};
    }

    for (const playerId of Object.keys(soloSessions)) {
        const session = soloSessions[playerId];
        if (!session) continue; // La session a peut-être été supprimée
        const player = session.player;
        
        // === GESTION DU COUNTDOWN (3 secondes) ===
        if (session.countdownActive && session.countdownStartTime) {
            const countdownElapsed = Date.now() - session.countdownStartTime;
            if (countdownElapsed >= 3000) {
                session.countdownActive = false;
                session.levelStartTime = Date.now(); // Démarrer le vrai timer APRÈS countdown
                console.log(`✅ [SOLO] Countdown terminé pour joueur ${playerId}, timer démarre`);
            }
        }
        
        // Créer un ShopManager pour cette session s'il n'existe pas
        if (!processSoloGameLoop.shopManagers[playerId]) {
            const gameMode = new GameMode('solo');
            processSoloGameLoop.shopManagers[playerId] = new ShopManager(gameMode);
        }
        const shopManager = processSoloGameLoop.shopManagers[playerId];
        
        // Vérifier si le shop est terminé et réinitialiser levelStartTime
        if (session.shopEndTime && Date.now() >= session.shopEndTime) {
            session.levelStartTime = Date.now();
            session.shopEndTime = null;
            shopManager.closeShop();  // ← Synchroniser le ShopManager
            console.log(`✅ [SOLO] Shop fermé pour le joueur ${playerId}, niveau ${session.currentLevel} commence`);
        }
        
        // ⚠️ Si shopEndTime est null mais ShopManager croit qu'il est ouvert, c'est qu'on a quitté via validateShop
        // Synchroniser dans ce cas aussi
        if (!session.shopEndTime && shopManager.isShopCurrentlyActive) {
            shopManager.closeShop();
            session.levelStartTime = Date.now();
            console.log(`✅ [SOLO] Shop fermé (validation client) pour le joueur ${playerId}, niveau ${session.currentLevel} commence`);
        }
        
        const dist = Math.hypot(player.x - session.coin.x, player.y - session.coin.y);

        // --- COLLISION AVEC LA PIÈCE ---
        // Vérifier si les collisions sont bloquées par le shop
        const isCollisionBlocked = shopManager.shouldBlockCollisions();
        
        if (dist < 30 && !isCollisionBlocked) {
            // En solo, on track le temps du checkpoint
            // ⚠️ IMPORTANT: levelStartTime ne doit PAS être null à ce stade (sinon NaN)
            if (!session.levelStartTime) {
                console.error(`❌ [SOLO] ERREUR: levelStartTime est null pour le joueur ${playerId} au niveau ${session.currentLevel}`);
                continue; // Sauter cet itération (pas fermer la fonction!)
            }
            
            const checkpointTime = (Date.now() - session.levelStartTime) / 1000;
            session.splitTimes.push(checkpointTime);
            
            // Ajouter les gems au joueur en solo
            const gemsEarned = calculateGemsForLevel(session.currentLevel);
            addGems(player, gemsEarned);
            
            console.log(`🎯 [SOLO] Joueur ${playerId} a terminé le niveau ${session.currentLevel} en ${checkpointTime.toFixed(1)}s | +${gemsEarned}💎 (Total: ${player.gems}💎)`);
            
            // Réinitialiser le timer pour le prochain niveau
            session.levelStartTime = Date.now();
            
            // Augmenter le niveau
            session.currentLevel++;
            
            // Vérifier si le jeu est terminé (10 niveaux pour solo)
            const maxLevel = 10;
            if (session.currentLevel > maxLevel) {
                session.totalTime = (Date.now() - session.startTime) / 1000;
                console.log(`🏁 [SOLO] Joueur ${playerId} a terminé la session! Temps total: ${session.totalTime.toFixed(1)}s`);
                
                // Envoyer le résultat au client
                const socket = io.sockets.sockets.get(playerId);
                console.log(`   Socket existe: ${!!socket}, Connected: ${socket ? socket.connected : false}`);
                if (socket && socket.connected) {
                    console.log(`   📤 Envoi de soloGameFinished au client ${playerId}`);
                    socket.emit('soloGameFinished', {
                        totalTime: session.totalTime,
                        splitTimes: session.splitTimes,
                        finalLevel: maxLevel,
                        mode: 'solo'
                    });
                } else {
                    console.log(`   ❌ Socket non disponible ou déconnectée pour ${playerId}`);
                }
                
                // Nettoyer les ressources
                shopManager.reset();
                delete processSoloGameLoop.shopManagers[playerId];
                delete soloSessions[playerId];
                continue;
            } else {
                // Générer le prochain niveau
                const mazeSize = calculateMazeSize(session.currentLevel, 'solo');
                session.map = generateMaze(mazeSize.width, mazeSize.height);
                session.coin = getRandomEmptyPosition(session.map);
                
                // Téléporter le joueur à une position safe
                const safePos = getRandomEmptyPosition(session.map);
                player.x = safePos.x;
                player.y = safePos.y;
                player.checkpoint = null;  // Réinitialiser checkpoint
                player.trail = [];          // Réinitialiser rope
                
                // Envoyer les nouvelles données (mapData ET levelUpdate)
                const socket = io.sockets.sockets.get(playerId);
                if (socket && socket.connected) {
                    socket.emit('mapData', session.map);
                    socket.emit('levelUpdate', session.currentLevel);
                    
                    // Vérifier si un shop s'ouvre après ce niveau complété
                    const completedLevel = session.currentLevel - 1;
                    if (shopManager.openShop(completedLevel)) {
                        // ✅ ShopManager gère tout - pas besoin de gérer currentShopLevel
                        session.coin = getRandomEmptyPosition(session.map);
                        // Mémoriser le temps de fin du shop pour réinitialiser levelStartTime après
                        session.shopEndTime = Date.now() + SHOP_DURATION;
                        // ⚠️ NE PAS RÉINITIALISER levelStartTime ici - il sera réinitialisé quand le shop ferme
                        socket.emit('shopOpen', { items: getShopItemsForMode('solo'), level: completedLevel });
                        console.log(`🏪 [SOLO] Shop ouvert pour le joueur ${playerId} après niveau ${completedLevel}`);
                    } else {
                        // Pas de shop, relancer le niveau immédiatement
                        session.levelStartTime = Date.now();
                        session.shopEndTime = null;
                    }
                }
            }
        }
        
        // Envoyer l'état du jeu au joueur via soloGameState - SEULEMENT si la session existe toujours
        if (soloSessions[playerId] && session) {
            session.sendGameState();
        }
    }
}

module.exports = { processSoloGameLoop };
