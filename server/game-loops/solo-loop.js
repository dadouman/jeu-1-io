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
            session.checkpoints.push(checkpointTime);
            
            // Ajouter les gems au joueur en solo
            const gemsEarned = calculateGemsForLevel(session.currentLevel);
            addGems(player, gemsEarned);
            
            console.log(`🎯 [SOLO] Joueur ${playerId} a terminé le niveau ${session.currentLevel} en ${checkpointTime.toFixed(1)}s | +${gemsEarned}💎 (Total: ${player.gems}💎)`);
            
            // Augmenter le niveau
            session.currentLevel++;
            
            // Vérifier si le jeu est terminé (20 niveaux pour solo standard, 10 pour express)
            const maxLevel = session.mode === 'solo-express' ? 10 : 20;
            if (session.currentLevel > maxLevel) {
                session.totalTime = (Date.now() - session.startTime) / 1000;
                console.log(`🏁 [${session.mode.toUpperCase()}] Joueur ${playerId} a terminé la session! Temps total: ${session.totalTime.toFixed(1)}s`);
                
                // Envoyer le résultat au client
                const socket = io.sockets.sockets.get(playerId);
                if (socket) {
                    socket.emit('soloGameFinished', {
                        totalTime: session.totalTime,
                        checkpoints: session.checkpoints,
                        finalLevel: maxLevel,
                        mode: session.mode
                    });
                }
                
                // Supprimer la session solo
                delete soloSessions[playerId];
            } else {
                // Générer le prochain niveau
                const mazeSize = calculateMazeSize(session.currentLevel, session.mode);
                session.map = generateMaze(mazeSize.width, mazeSize.height);
                session.coin = getRandomEmptyPosition(session.map);
                
                // Téléporter le joueur à une position safe
                const safePos = getRandomEmptyPosition(session.map);
                player.x = safePos.x;
                player.y = safePos.y;
                
                // Vérifier si un shop s'ouvre après ce niveau
                const completedLevel = session.currentLevel - 1;
                const isShopAfterThisLevel = isShopLevel(completedLevel) && completedLevel < maxLevel;
                
                // Envoyer les nouvelles données (mapData ET levelUpdate)
                // IMPORTANT: On n'envoie PAS de transition, on enchaine directement
                const socket = io.sockets.sockets.get(playerId);
                if (socket) {
                    socket.emit('mapData', session.map);
                    socket.emit('levelUpdate', session.currentLevel);
                    
                    if (isShopAfterThisLevel) {
                        // Relancer le levelStartTime après la shop duration
                        session.levelStartTime = Date.now() + SHOP_DURATION;
                        socket.emit('shopOpen', { items: getShopItemsForMode(session.mode), level: completedLevel });
                        console.log(`🏪 [${session.mode.toUpperCase()}] Shop ouvert pour le joueur ${playerId} après niveau ${completedLevel}`);
                    } else {
                        // Relancer le levelStartTime immédiatement (pas de transition)
                        session.levelStartTime = Date.now();
                    }
                }
            }
        }
        
        // Envoyer l'état du jeu au joueur (avec les gems)
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('state', { players: { [playerId]: player }, coin: session.coin, playerGems: player.gems });
        }
    }
}

module.exports = { processSoloGameLoop };
