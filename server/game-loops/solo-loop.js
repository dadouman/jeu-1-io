// server/game-loops/solo-loop.js
// Boucle de jeu pour mode solo (20 niveaux)

const { generateMaze, getRandomEmptyPosition } = require('../../utils/map');
const { calculateGemsForLevel, addGems } = require('../../utils/gems');
const { isShopLevel } = require('../../utils/shop');

function processSoloGameLoop(soloSessions, io, { 
    calculateMazeSize, 
    getShopItemsForMode 
}, { 
    mongoURI, 
    SoloRunModel,
    TRANSITION_DURATION, 
    SHOP_DURATION 
}) {
    for (const playerId in soloSessions) {
        const session = soloSessions[playerId];
        const player = session.player;
        const dist = Math.hypot(player.x - session.coin.x, player.y - session.coin.y);
        
        // --- COLLISION AVEC LA PIÈCE ---
        if (dist < 30) {
            // En solo, on track le temps du checkpoint
            const checkpointTime = (Date.now() - session.levelStartTime) / 1000;
            session.splitTimes.push(checkpointTime);
            
            // Ajouter les gems au joueur en solo
            const gemsEarned = calculateGemsForLevel(session.currentLevel);
            addGems(player, gemsEarned);
            
            console.log(`🎯 [SOLO] Joueur ${playerId} a terminé le niveau ${session.currentLevel} en ${checkpointTime.toFixed(1)}s | +${gemsEarned}💎 (Total: ${player.gems}💎)`);
            
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
                
                // Supprimer la session solo et continuer à la session suivante
                delete soloSessions[playerId];
                continue;  // ← IMPORTANT: ne pas accéder à session après suppression
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
                
                // Vérifier si un shop s'ouvre après ce niveau
                const completedLevel = session.currentLevel - 1;
                const isShopAfterThisLevel = isShopLevel(completedLevel) && completedLevel < maxLevel;
                
                // Envoyer les nouvelles données (mapData ET levelUpdate)
                // IMPORTANT: On n'envoie PAS de transition, on enchaine directement
                const socket = io.sockets.sockets.get(playerId);
                if (socket && socket.connected) {
                    socket.emit('mapData', session.map);
                    socket.emit('levelUpdate', session.currentLevel);
                    
                    if (isShopAfterThisLevel) {
                        // Relancer le levelStartTime après la shop duration
                        session.levelStartTime = Date.now() + SHOP_DURATION;
                        socket.emit('shopOpen', { items: getShopItemsForMode('solo'), level: completedLevel });
                        console.log(`🏪 [SOLO] Shop ouvert pour le joueur ${playerId} après niveau ${completedLevel}`);
                    } else {
                        // Relancer le levelStartTime immédiatement (pas de transition)
                        session.levelStartTime = Date.now();
                    }
                }
            }
        }
        
        // Envoyer l'état du jeu au joueur (avec les gems) - SEULEMENT si la session existe toujours
        if (soloSessions[playerId]) {
            const socket = io.sockets.sockets.get(playerId);
            if (socket && socket.connected) {
                socket.emit('state', { players: { [playerId]: player }, coin: session.coin, playerGems: player.gems });
            }
        }
    }
}

module.exports = { processSoloGameLoop };
