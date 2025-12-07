// server/socket-events.js - Gestion des événements Socket.io

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { checkWallCollision } = require('../utils/collisions');
const { initializePlayerForMode } = require('../utils/player');
const { generateRandomFeatureWeighted } = require('./utils/solo-utils');
const { purchaseItem } = require('../utils/shop');
const { emitToLobby } = require('./utils');
const { 
    startRestartVote, 
    submitRestartVote, 
    checkRestartVote, 
    restartGame 
} = require('./vote');

// --- FONCTION DE DASH ---
function performDash(player, playerId, gameMap) {
    let dashDx = 0;
    let dashDy = 0;
    
    let direction = player.lastDirection || 'right';
    
    if (direction === 'up') dashDy = -1;
    if (direction === 'down') dashDy = 1;
    if (direction === 'left') dashDx = -1;
    if (direction === 'right') dashDx = 1;

    const dashDistance = 15;
    let currentX = player.x;
    let currentY = player.y;
    let stepsCount = 0;
    const maxSteps = 20;

    while (stepsCount < maxSteps) {
        const nextX = currentX + dashDx * dashDistance;
        const nextY = currentY + dashDy * dashDistance;

        if (checkWallCollision(nextX, nextY, gameMap)) {
            break;
        }

        currentX = nextX;
        currentY = nextY;
        stepsCount++;
    }

    player.x = currentX;
    player.y = currentY;
}

// --- FONCTION D'INITIALISATION DES ÉVÉNEMENTS ---
function initializeSocketEvents(io, lobbies, soloSessions, playerModes, { 
    SoloRunModel, 
    mongoURI 
}, {
    startRestartVoteFunc,
    submitRestartVoteFunc,
    checkRestartVoteFunc,
    restartGameFunc
}) {
    
    io.on('connection', (socket) => {
        console.log('Joueur connecté : ' + socket.id);
        
        socket.emit('init', socket.id);
        socket.emit('modeSelectionRequired', { message: 'Veuillez sélectionner un mode' });

        // --- SÉLECTION DU MODE DE JEU ---
        socket.on('selectGameMode', (data) => {
            let mode = data.mode; // 'classic', 'infinite', ou 'solo'
            
            playerModes[socket.id] = mode;
            
            if (mode === 'solo') {
                console.log(`🎮 Joueur ${socket.id} sélectionne le mode: SOLO (10 niveaux)`);
                
                const startPos = getRandomEmptyPosition(generateMaze(15, 15));
                const player = initializePlayerForMode(startPos, 0, 'solo');
                
                // Débloquer aléatoirement une feature au départ en solo
                const unlockedFeature = generateRandomFeatureWeighted();
                player.purchasedFeatures[unlockedFeature] = true;
                console.log(`   ⚡ Feature débloquée gratuitement: ${unlockedFeature}`);
                
                soloSessions[socket.id] = {
                    currentLevel: 1,
                    map: generateMaze(15, 15),
                    coin: getRandomEmptyPosition(generateMaze(15, 15)),
                    player: player,
                    startTime: Date.now(),
                    levelStartTime: Date.now(),
                    checkpoints: [],
                    totalTime: 0
                };
                
                const session = soloSessions[socket.id];
                socket.emit('mapData', session.map);
                socket.emit('levelUpdate', session.currentLevel);
                socket.emit('gameModSelected', { mode: 'solo' });
                
                console.log(`   Session SOLO (10 niveaux) créée pour joueur ${socket.id}`);
            } else {
                if (!lobbies[mode]) {
                    socket.emit('error', { message: 'Mode invalide' });
                    return;
                }
                
                const lobby = lobbies[mode];
                console.log(`🎮 Joueur ${socket.id} sélectionne le mode: ${mode === 'classic' ? '40 NIVEAUX' : 'INFINI'}`);
                
                const playerIndex = Object.keys(lobby.players).length;
                const startPos = getRandomEmptyPosition(lobby.map);
                lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, mode);
                
                socket.emit('mapData', lobby.map);
                socket.emit('levelUpdate', lobby.currentLevel);
                socket.emit('highScoreUpdate', lobby.currentRecord);
                socket.emit('gameModSelected', { mode: mode });
                
                emitToLobby(mode, 'playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                }, io, lobbies);
                
                console.log(`   ${lobby.players[socket.id].skin} rejoint ${mode} (${Object.keys(lobby.players).length} joueur(s))`);
            }
        });

        // --- SAUVEGARDER LES RÉSULTATS SOLO ---
        socket.on('saveSoloResults', async (data) => {
            const playerId = socket.id;
            const { totalTime, checkpoints, playerSkin, mode, finalLevel } = data;
            
            console.log(`💾 [SOLO] Sauvegarde du résultat: ${playerSkin} - Temps: ${totalTime.toFixed(2)}s (${finalLevel} niveaux)`);
            
            if (mongoURI) {
                try {
                    // Chercher le meilleur temps personnel existant
                    const previousBestRuns = await SoloRunModel
                        .find({ playerId, mode: 'solo' })
                        .sort({ totalTime: 1 })
                        .limit(1)
                        .exec();
                    
                    const personalBestTime = previousBestRuns.length > 0 
                        ? Math.min(previousBestRuns[0].totalTime, totalTime)
                        : totalTime;
                    
                    const soloRun = new SoloRunModel({
                        playerId,
                        playerSkin,
                        mode: 'solo',
                        totalTime,
                        checkpoints,
                        finalLevel,
                        personalBestTime
                    });
                    
                    await soloRun.save();
                    console.log(`✅ [SOLO] Résultat sauvegardé - Meilleur temps: ${personalBestTime.toFixed(2)}s`);
                    
                    // Envoyer le meilleur temps personnel au client
                    socket.emit('personalBestTimeUpdated', { personalBestTime });
                } catch (err) {
                    console.error(`❌ Erreur lors de la sauvegarde du résultat solo:`, err);
                }
            }
        });

        // --- OBTENIR LE LEADERBOARD SOLO ---
        socket.on('getSoloLeaderboard', async () => {
            console.log(`📊 Demande du leaderboard solo`);
            
            if (mongoURI) {
                try {
                    const topScores = await SoloRunModel
                        .find({})
                        .sort({ totalTime: 1 })
                        .limit(20)
                        .exec();
                    
                    socket.emit('soloLeaderboard', { scores: topScores });
                } catch (err) {
                    console.error(`❌ Erreur lors de la récupération du leaderboard solo:`, err);
                    socket.emit('soloLeaderboard', { scores: [] });
                }
            } else {
                socket.emit('soloLeaderboard', { scores: [] });
            }
        });

        // --- DÉCONNEXION ---
        socket.on('disconnect', () => { 
            const mode = playerModes[socket.id];
            
            if (mode === 'solo') {
                delete soloSessions[socket.id];
                console.log(`🎯 Joueur ${socket.id} déconnecté du mode solo`);
            } else if (mode && lobbies[mode]) {
                const lobby = lobbies[mode];
                delete lobby.players[socket.id];
                console.log(`Joueur ${socket.id} déconnecté de ${mode} (${Object.keys(lobby.players).length} joueur(s) restant(s))`);
                
                emitToLobby(mode, 'playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                }, io, lobbies);
            }
            delete playerModes[socket.id];
        });

        // --- MOUVEMENT ---
        socket.on('movement', (input) => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            let player, map;
            
            if (mode === 'solo') {
                const session = soloSessions[socket.id];
                if (!session) return;
                player = session.player;
                map = session.map;
            } else {
                const lobby = lobbies[mode];
                if (!lobby) return;
                player = lobby.players[socket.id];
                if (!player) return;
                map = lobby.map;
            }

            const speed = 3 + (player.purchasedFeatures?.speedBoost ? 1 : 0);
            let nextX = player.x;
            let nextY = player.y;

            let moveX = 0;
            let moveY = 0;

            if (input.left) moveX -= speed;
            if (input.right) moveX += speed;
            if (input.up) moveY -= speed;
            if (input.down) moveY += speed;

            if (moveX !== 0 && moveY !== 0) {
                const diagonal = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX = (moveX / diagonal) * speed;
                moveY = (moveY / diagonal) * speed;
            }

            nextX = player.x + moveX;
            nextY = player.y + moveY;

            if (!checkWallCollision(nextX, nextY, map)) {
                player.x = nextX;
                player.y = nextY;
            } else if (moveX !== 0 && moveY !== 0) {
                if (!checkWallCollision(player.x + moveX, player.y, map)) {
                    player.x += moveX;
                }
                else if (!checkWallCollision(player.x, player.y + moveY, map)) {
                    player.y += moveY;
                }
            } else if (moveX !== 0) {
                if (!checkWallCollision(player.x + moveX, player.y, map)) {
                    player.x += moveX;
                }
            } else if (moveY !== 0) {
                if (!checkWallCollision(player.x, player.y + moveY, map)) {
                    player.y += moveY;
                }
            }

            if (input.left) player.lastDirection = 'left';
            if (input.right) player.lastDirection = 'right';
            if (input.up) player.lastDirection = 'up';
            if (input.down) player.lastDirection = 'down';

            if (player.purchasedFeatures && player.purchasedFeatures.rope) {
                const lastTrailPoint = player.trail[player.trail.length - 1];
                if (!lastTrailPoint || Math.hypot(lastTrailPoint.x - player.x, lastTrailPoint.y - player.y) >= 4) {
                    player.trail.push({ x: player.x, y: player.y });
                    if (player.trail.length > 500) {
                        player.trail.shift();
                    }
                }
            } else {
                player.trail = [];
            }
            
            if (mode === 'solo') {
                soloSessions[socket.id].player = player;
            }
        });

        // --- CHECKPOINTS ---
        socket.on('checkpoint', (actions) => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            // Solo: gérer le joueur solo
            if (mode === 'solo') {
                const session = soloSessions[socket.id];
                if (!session) return;
                const player = session.player;
                
                if (actions.setCheckpoint) {
                    if (!player.purchasedFeatures.checkpoint) {
                        socket.emit('error', { message: '🚩 Checkpoint non acheté ! Rendez-vous au magasin' });
                    } else {
                        player.checkpoint = { x: player.x, y: player.y };
                        socket.emit('checkpointUpdate', player.checkpoint);
                    }
                }
                if (actions.teleportCheckpoint && player.checkpoint) {
                    if (!player.purchasedFeatures.checkpoint) {
                        socket.emit('error', { message: '🚩 Checkpoint non acheté !' });
                    } else {
                        player.x = player.checkpoint.x;
                        player.y = player.checkpoint.y;
                    }
                }
                if (actions.dash) {
                    if (!player.purchasedFeatures.dash) {
                        socket.emit('error', { message: '⚡ Dash non acheté ! Rendez-vous au magasin' });
                    } else {
                        socket.emit('dashActivated');
                    }
                }
                return;
            }
            
            const lobby = lobbies[mode];
            if (!lobby) return;
            const player = lobby.players[socket.id];
            if (!player) return;

            if (actions.setCheckpoint) {
                if (!player.purchasedFeatures.checkpoint) {
                    socket.emit('error', { message: '🚩 Checkpoint non acheté ! Rendez-vous au magasin (niveau 5, 10, 15...)' });
                } else {
                    player.checkpoint = {
                        x: player.x,
                        y: player.y
                    };
                    socket.emit('checkpointUpdate', player.checkpoint);
                }
            }

            if (actions.teleportCheckpoint && player.checkpoint) {
                if (!player.purchasedFeatures.checkpoint) {
                    socket.emit('error', { message: '🚩 Checkpoint non acheté !' });
                } else {
                    player.x = player.checkpoint.x;
                    player.y = player.checkpoint.y;
                }
            }

            if (actions.dash) {
                if (!player.purchasedFeatures.dash) {
                    socket.emit('error', { message: '⚡ Dash non acheté ! Rendez-vous au magasin' });
                } else {
                    performDash(player, socket.id, lobby.map);
                }
            }
        });

        // --- SYSTÈME DE VOTE POUR REDÉMARRER ---
        socket.on('proposeRestart', () => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            // Les votes ne s'appliquent qu'aux modes multijoueur (classic/infinite)
            if (mode === 'solo') return;
            
            const lobby = lobbies[mode];
            if (!lobby) return;
            const player = lobby.players[socket.id];
            if (!player) return;
            
            const result = startRestartVote(socket.id, mode, io, lobbies);
            if (result.success) {
                socket.emit('restartVoteProposed', { success: true });
            } else {
                socket.emit('restartVoteProposed', { success: false, message: result.message });
            }
        });

        socket.on('voteRestart', (data) => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            // Les votes ne s'appliquent qu'aux modes multijoueur (classic/infinite)
            if (mode === 'solo') return;
            
            const lobby = lobbies[mode];
            if (!lobby) return;
            const player = lobby.players[socket.id];
            if (!player) return;
            
            const voteValue = data.vote === true;
            const result = submitRestartVote(socket.id, voteValue, mode, lobbies);
            
            if (result.success) {
                const shouldRestart = checkRestartVote(mode, lobbies, io);
                if (shouldRestart) {
                    restartGame(mode, io, lobbies, generateMaze, getRandomEmptyPosition, initializePlayerForMode, playerModes);
                }
            }
        });

        // --- SYSTÈME DE SHOP ---
        socket.on('shopPurchase', (data) => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            const lobby = lobbies[mode];
            const player = lobby.players[socket.id];
            const { itemId } = data;

            if (!player) return;

            const result = purchaseItem(player, itemId);
            
            if (result.success) {
                const player = lobby.players[socket.id];
                console.log(`💎 [SHOP] ${player.skin} a acheté "${result.item.name}" pour ${result.item.price}💎 | ${result.gemsLeft}💎 restants`);
                socket.emit('shopPurchaseSuccess', { itemId, item: result.item, gemsLeft: result.gemsLeft });
            } else {
                socket.emit('shopPurchaseFailed', { 
                    reason: result.message,
                    required: result.gemsRequired,
                    current: result.gemsAvailable
                });
            }
        });
    });
}

module.exports = { initializeSocketEvents };
