// server/socket-events.js - Gestion des événements Socket.io

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { checkWallCollision } = require('../utils/collisions');
const { initializePlayerForMode } = require('../utils/player');
const { generateRandomFeatureWeighted } = require('./utils/solo-utils');
const { purchaseItem } = require('../utils/shop');
const { emitToLobby } = require('./utils');
const SoloSession = require('./utils/SoloSession');
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

// --- STRUCTURE POUR TRACKER LES JOUEURS PRÊTS AU SHOP ---
const shopPlayersReady = {}; // { 'mode': Set(playerIds) }

// --- FONCTION D'INITIALISATION DES ÉVÉNEMENTS ---
function initializeSocketEvents(io, lobbies, soloSessions, playerModes, { 
    SoloRunModel,
    SoloBestSplitsModel,
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
            let mode = data.mode; // 'classic', 'infinite', 'solo', ou 'custom'
            
            playerModes[socket.id] = mode;
            
            if (mode === 'solo') {
                console.log(`🎮 Joueur ${socket.id} sélectionne le mode: SOLO (10 niveaux)`);
                
                // Récupérer la configuration du mode solo
                const gameModes = require('../config/gameModes');
                const soloConfig = gameModes.getGameModeConfig('solo');
                
                // Créer une nouvelle session solo avec la configuration
                const session = new SoloSession(socket.id, socket, soloConfig);
                
                // Initialiser le joueur
                const startPos = getRandomEmptyPosition(generateMaze(15, 15));
                session.player = initializePlayerForMode(startPos, 0, 'solo');
                
                // Débloquer aléatoirement une feature au départ
                const unlockedFeature = generateRandomFeatureWeighted();
                session.player.purchasedFeatures[unlockedFeature] = true;
                console.log(`   ⚡ Feature débloquée gratuitement: ${unlockedFeature}`);
                
                // Générer la première map
                session.map = generateMaze(15, 15);
                session.coin = getRandomEmptyPosition(session.map);
                
                // Stocker la session
                soloSessions[socket.id] = session;
                
                // Envoyer l'état initial au client
                session.sendGameState();
                
                console.log(`   ✅ Session SOLO créée pour joueur ${socket.id}`);
                console.log(`   🏪 Shop aux niveaux: ${session.shopLevels.join(', ')}`);
            } else if (mode === 'custom') {
                // Mode personnalisé: créer un lobby comme classic, mais avec la config fournie
                if (!data.customConfig) {
                    socket.emit('error', { message: 'Configuration personnalisée manquante' });
                    return;
                }
                
                console.log(`🎮 Joueur ${socket.id} sélectionne le mode: PERSONNALISÉ (${data.customConfig.maxLevels} niveaux)`);
                
                // Créer un pseudo-lobby pour le mode personnalisé
                // On utilise 'custom' comme clé, et on traite le mode comme classic
                if (!lobbies['custom']) {
                    const firstLevelSize = data.customConfig.levelConfig.sizes[0];
                    lobbies['custom'] = {
                        currentLevel: 1,
                        currentRecord: { score: 0, skin: '❓' },
                        players: {},
                        map: generateMaze(firstLevelSize, firstLevelSize),
                        coin: null,
                        customConfig: data.customConfig
                    };
                    // Initialiser le coin pour le premier niveau
                    lobbies['custom'].coin = getRandomEmptyPosition(lobbies['custom'].map);
                }
                
                const lobby = lobbies['custom'];
                lobby.customConfig = data.customConfig;
                
                const playerIndex = Object.keys(lobby.players).length;
                const startPos = getRandomEmptyPosition(lobby.map);
                lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, 'custom');
                
                socket.emit('mapData', lobby.map);
                socket.emit('levelUpdate', lobby.currentLevel);
                socket.emit('highScoreUpdate', lobby.currentRecord);
                socket.emit('gameModSelected', { mode: 'custom' });
                socket.emit('coinUpdate', lobby.coin);
                
                emitToLobby('custom', 'playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                }, io, lobbies);
                
                console.log(`   ${lobby.players[socket.id].skin} rejoint custom (${Object.keys(lobby.players).length} joueur(s))`);
            } else {
                if (!lobbies[mode]) {
                    socket.emit('error', { message: 'Mode invalide' });
                    return;
                }
                
                const lobby = lobbies[mode];
                console.log(`🎮 Joueur ${socket.id} sélectionne le mode: ${mode === 'classic' ? '10 NIVEAUX' : 'INFINI'}`);
                
                const playerIndex = Object.keys(lobby.players).length;
                const startPos = getRandomEmptyPosition(lobby.map);
                lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, mode);
                
                socket.emit('mapData', lobby.map);
                socket.emit('levelUpdate', lobby.currentLevel);
                socket.emit('highScoreUpdate', lobby.currentRecord);
                socket.emit('gameModSelected', { mode: mode });
                socket.emit('coinUpdate', lobby.coin);
                
                emitToLobby(mode, 'playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                }, io, lobbies);
                
                console.log(`   ${lobby.players[socket.id].skin} rejoint ${mode} (${Object.keys(lobby.players).length} joueur(s))`);
            }
        });

        // --- VÉRIFIER LE NOMBRE DE JOUEURS CONNECTÉS AU MODE CUSTOM ---
        socket.on('checkCustomModeConnections', (data, callback) => {
            const lobby = lobbies['custom'];
            const playersCount = lobby ? Object.keys(lobby.players).length : 0;
            
            if (callback) {
                callback(playersCount);
            }
        });

        // --- JOUEUR PRÊT À CONTINUER LE SHOP ---
        socket.on('playerReadyToContinueShop', () => {
            const mode = playerModes[socket.id];
            if (!mode) return;
            
            // Cas du SOLO : fermer le shop immédiatement (1 joueur)
            if (mode === 'solo') {
                const session = soloSessions[socket.id];
                if (!session || !session.shopActive) return;
                
                console.log(`✅ [SOLO SHOP] ${session.player.skin} a fermé le shop`);
                session.shopActive = false;
                session.shopEndTime = null;
                return;
            }
            
            // Cas du CLASSIQUE/CUSTOM : vote de continuation
            // Initialiser le Set des joueurs prêts pour ce mode si nécessaire
            if (!shopPlayersReady[mode]) {
                shopPlayersReady[mode] = new Set();
            }
            
            // Ajouter le joueur à la liste des prêts
            shopPlayersReady[mode].add(socket.id);
            
            const lobby = lobbies[mode];
            if (!lobby) return;
            
            const totalPlayers = Object.keys(lobby.players).length;
            const readyCount = shopPlayersReady[mode].size;
            
            console.log(`✅ [SHOP] ${lobby.players[socket.id].skin} est prêt à continuer | ${readyCount}/${totalPlayers} joueurs prêts`);
            
            // Émettre la mise à jour du compteur à tous les joueurs du lobby
            emitToLobby(mode, 'shopPlayersReadyUpdate', {
                readyCount: readyCount,
                totalPlayers: totalPlayers
            }, io, lobbies);
            
            // Si tous les joueurs sont prêts, fermer le shop
            if (readyCount === totalPlayers) {
                console.log(`🎉 [SHOP] Tous les joueurs sont prêts! Fermeture du shop...`);
                
                // Réinitialiser les joueurs prêts pour ce mode
                shopPlayersReady[mode].clear();
                
                // Émettre l'événement de fermeture du shop à tous les joueurs
                emitToLobby(mode, 'shopClosed', {}, io, lobbies);
                
                // Redémarrer le timer du niveau
                if (lobby) {
                    for (const pid in lobby.players) {
                        // Les joueurs vont recevoir shopClosed côté client
                    }
                }
            }
        });

        // --- FERMETURE AUTOMATIQUE DU SHOP PAR TIMEOUT ---
        socket.on('shopClosedByTimeout', () => {
            const mode = playerModes[socket.id];
            if (!mode || mode === 'solo') return; // Ignorer solo et modes invalides
            
            const lobby = lobbies[mode];
            if (!lobby) return;
            
            // Réinitialiser le compteur de joueurs prêts pour ce mode
            if (shopPlayersReady[mode]) {
                shopPlayersReady[mode].clear();
            }
            
            console.log(`⏱️ [SHOP TIMEOUT] Mode ${mode}: Shop fermé après 15 secondes`);
            
            // Émettre l'événement de fermeture du shop à tous les joueurs
            emitToLobby(mode, 'shopClosedAutomatically', {}, io, lobbies);
        });

        // --- SAUVEGARDER LES RÉSULTATS SOLO ---
        socket.on('saveSoloResults', async (data) => {
            const playerId = socket.id;
            const { totalTime, splitTimes, playerSkin, mode, finalLevel } = data;
            
            console.log(`💾 [SOLO] Sauvegarde du résultat: ${playerSkin} - Temps: ${totalTime.toFixed(2)}s (${finalLevel} niveaux) | Splits: ${splitTimes ? splitTimes.map(t => t.toFixed(1)).join(', ') : 'N/A'}`);
            
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
                        splitTimes: splitTimes || [],
                        finalLevel,
                        personalBestTime
                    });
                    
                    await soloRun.save();
                    console.log(`✅ [SOLO] Résultat sauvegardé - Meilleur temps: ${personalBestTime.toFixed(2)}s`);
                    
                    // Mettre à jour les meilleurs splits pour chaque niveau
                    if (splitTimes && splitTimes.length > 0) {
                        for (let i = 0; i < splitTimes.length; i++) {
                            const level = i + 1;
                            const splitTime = splitTimes[i];
                            
                            // ⚠️ VALIDATION: Rejeter les splits anormalement bas (< 0.5s)
                            // Ces values indiquent une corruption de données ou un bug
                            if (splitTime < 0.5) {
                                console.warn(`⚠️ [SOLO] Split suspect pour le niveau ${level}: ${splitTime.toFixed(3)}s (< 0.5s). Ignoré.`);
                                continue; // Ignorer ce split corrompu
                            }
                            
                            // Chercher le meilleur split pour ce niveau
                            const existingSplit = await SoloBestSplitsModel.findOne({ level });
                            
                            if (!existingSplit || splitTime < existingSplit.bestSplitTime) {
                                await SoloBestSplitsModel.updateOne(
                                    { level },
                                    { bestSplitTime: splitTime, playerSkin, updatedAt: new Date() },
                                    { upsert: true }
                                );
                            }
                        }
                    }
                    
                    // Envoyer le meilleur temps personnel au client
                    socket.emit('personalBestTimeUpdated', { personalBestTime });
                } catch (err) {
                    console.error(`❌ Erreur lors de la sauvegarde du résultat solo:`, err);
                }
            }
        });

        // --- VALIDER ET QUITTER LE SHOP AVANT LA FIN ---
        socket.on('validateShop', () => {
            const playerId = socket.id;
            const mode = playerModes[playerId];
            
            if (mode === 'solo') {
                const session = soloSessions[playerId];
                
                if (!session) {
                    console.log(`❌ Aucune session solo trouvée pour ${playerId}`);
                    return;
                }
                
                // Vérifier si le shop est actuellement actif
                if (!session.shopActive) {
                    console.log(`⚠️ [SOLO] Joueur ${playerId} a essayé de quitter un shop qui n'était pas actif`);
                    return;
                }
                
                // Fermer le shop immédiatement
                session.closeShop();
                
                console.log(`✅ [SOLO] Joueur ${playerId} a validé et quitté le shop après le niveau ${session.currentLevel - 1}`);
                
                // Notifier le client que le shop est fermé
                socket.emit('shopClosed', { level: session.currentLevel - 1 });
            }
        });

        // --- OBTENIR LES MEILLEURS SPLITS PAR NIVEAU (requête côté CLIENT) ---
        socket.on('getSoloBestSplits', requestSoloBestSplits);
        socket.on('requestSoloBestSplits', requestSoloBestSplits);
        
        async function requestSoloBestSplits() {
            console.log(`📊 Demande des meilleurs splits solo`);
            
            if (mongoURI && SoloBestSplitsModel) {
                try {
                    const bestSplits = await SoloBestSplitsModel
                        .find({})
                        .sort({ level: 1 })
                        .exec();
                    
                    const splitsMap = {};
                    bestSplits.forEach(split => {
                        splitsMap[split.level] = split.bestSplitTime;
                    });
                    
                    socket.emit('soloBestSplits', { splits: splitsMap });
                } catch (err) {
                    console.error(`❌ Erreur lors de la récupération des meilleurs splits:`, err);
                    socket.emit('soloBestSplits', { splits: {} });
                }
            } else {
                socket.emit('soloBestSplits', { splits: {} });
            }
        }

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
                
                // ✅ SERVEUR DÉCIDE SI INPUTS BLOQUÉS
                const isInputsBlocked = 
                    session.countdownActive ||
                    session.inTransition ||
                    session.shopActive;
                
                if (isInputsBlocked) {
                    return; // Inputs bloqués, ne pas bouger
                }
                
                player = session.player;
                map = session.map;
            } else {
                const lobby = lobbies[mode];
                if (!lobby) return;
                player = lobby.players[socket.id];
                if (!player) return;
                map = lobby.map;
            }

            // Calculer la vitesse : vitesse de base + (speedBoost * incrément par achat)
            const baseSpeed = 3;
            const speedBoostIncrement = 1;
            const speedBoostLevel = Math.max(0, player.purchasedFeatures?.speedBoost || 0);
            const speed = baseSpeed + (speedBoostLevel * speedBoostIncrement);
            
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
                        performDash(player, socket.id, session.map);
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
            
            const { itemId } = data;
            let player;
            let customShopItems = null;

            // Récupérer le joueur selon le mode
            if (mode === 'solo') {
                const session = soloSessions[socket.id];
                if (!session) return;
                player = session.player;
            } else {
                const lobby = lobbies[mode];
                if (!lobby || !lobby.players[socket.id]) return;
                player = lobby.players[socket.id];
                
                // Pour le mode custom, convertir les shopItems en dictionnaire
                if (mode === 'custom' && lobby.customConfig && lobby.customConfig.shopItems) {
                    customShopItems = {};
                    for (const item of lobby.customConfig.shopItems) {
                        customShopItems[item.id] = item;
                    }
                }
            }

            const result = purchaseItem(player, itemId, customShopItems);
            
            if (result.success) {
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
