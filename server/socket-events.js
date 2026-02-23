// server/socket-events.js - Event Manager (Refactorisé en modules feature-based)
// Gère l'initialisation des connexions et dispatche les événements vers les handlers spécialisés

const { debugLog } = require('./debug');
const { generateMaze, generateMazeAdvanced, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayer, initializePlayerForMode } = require('../utils/player');
const { emitToLobby } = require('./utils');

// Importer les modules socket handlers (feature-based)
const { handleModeSelection } = require('./socket-handlers/mode-selection');
const { handleMovement } = require('./socket-handlers/movement');
const { handleCheckpoint } = require('./socket-handlers/checkpoint');
const { handleShopEvents } = require('./socket-handlers/shop');
const { handleVotingEvents } = require('./socket-handlers/voting');
const { handleSoloEvents } = require('./socket-handlers/solo');
const { handleDisconnect } = require('./socket-handlers/disconnect');

const { 
    startRestartVote, 
    submitRestartVote, 
    checkRestartVote, 
    restartGame 
} = require('./vote');

/**
 * Initialise tous les événements Socket.io
 * Distribue les événements vers les modules spécialisés par feature
 */
function initializeSocketEvents(io, lobbies, soloSessions, playerModes, { 
    SoloRunModel,
    SoloBestSplitsModel,
    mongoURI,
    setIsRebooting,
    getIsRebooting
}, {
    startRestartVoteFunc,
    submitRestartVoteFunc,
    checkRestartVoteFunc,
    restartGameFunc
}, {
    generateMazeFunc = generateMaze,
    generateMazeAdvancedFunc = generateMazeAdvanced,
    getRandomEmptyPositionFunc = getRandomEmptyPosition,
    initializePlayerFunc = initializePlayer
} = {}) {
    
    io.on('connection', (socket) => {
        debugLog('Joueur connecté : ' + socket.id);

        // ⚠️ BLOQUER LA CONNEXION SI REDÉMARRAGE EN COURS
        if (getIsRebooting && getIsRebooting()) {
            debugLog(`⏳ Joueur ${socket.id} refusé à la connexion: les lobbies sont en redémarrage`);
            socket.emit('error', { message: 'Les lobbies se redémarrent actuellement. Veuillez patienter...' });
            socket.disconnect();
            return;
        }
        
        socket.emit('init', socket.id);
        socket.emit('modeSelectionRequired', { message: 'Veuillez sélectionner un mode' });

        // --- DISPATCHER LES ÉVÉNEMENTS AUX MODULES SPÉCIALISÉS ---
        
        // Mode Selection Handler (selectGameMode, checkCustomModeConnections)
        handleModeSelection(socket, io, lobbies, soloSessions, playerModes, getIsRebooting);

        // Movement Handler (movement)
        handleMovement(socket, lobbies, soloSessions, playerModes);

        // Checkpoint Handler (checkpoint)
        handleCheckpoint(socket, lobbies, soloSessions, playerModes);

        // Shop Handler (playerReadyToContinueShop, shopClosedByTimeout, dutchAuctionPurchase, validateShop, shopPurchase)
        handleShopEvents(socket, io, lobbies, soloSessions, playerModes, { mongoURI });

        // Voting Handler (proposeRestart, voteRestart, proposeReturnToMode, voteReturnToMode)
        handleVotingEvents(socket, io, lobbies, soloSessions, playerModes, {
            startRestartVoteFunc: startRestartVoteFunc,
            submitRestartVoteFunc: submitRestartVoteFunc,
            checkRestartVoteFunc: checkRestartVoteFunc,
            restartGameFunc: restartGameFunc,
            generateMazeFunc: generateMazeFunc,
            generateMazeAdvancedFunc: generateMazeAdvancedFunc,
            getRandomEmptyPositionFunc: getRandomEmptyPositionFunc,
            initializePlayerFunc: initializePlayerFunc
        });

        // Solo Handler (saveSoloResults, requestSoloBestSplits, getSoloLeaderboard)
        handleSoloEvents(socket, io, soloSessions, playerModes, { 
            SoloRunModel, SoloBestSplitsModel, mongoURI 
        });

        // Disconnect Handler
        handleDisconnect(socket, io, lobbies, soloSessions, playerModes);

        // --- LOBBIES BROWSER EVENTS ---
        // Événement: Obtenir la liste des lobbies en cours
        socket.on('getActiveLobies', () => {
            debugLog(`📊 Demande reçue: getActiveLobies de ${socket.id}`);
            
            const activeLobies = [];
            const modesData = [
                { key: 'classic', displayName: '🎮 Mode Classic' },
                { key: 'classicPrim', displayName: '🌳 Mode Prim' },
                { key: 'infinite', displayName: '∞ Mode Infini' }
            ];

            modesData.forEach(({ key, displayName }) => {
                const lobby = lobbies[key];
                if (lobby && lobby.players) {
                    const playerCount = Object.keys(lobby.players).length;
                    
                    // Seulement afficher si au moins 1 joueur
                    if (playerCount > 0) {
                        const uptime = Math.floor((Date.now() - (lobby.levelStartTime || Date.now())) / 1000);
                        activeLobies.push({
                            mode: key,
                            modeDisplay: displayName,
                            players: playerCount,
                            level: lobby.currentLevel || 1,
                            uptime: uptime > 0 ? uptime : 0
                        });
                        debugLog(`   ✅ ${displayName}: ${playerCount} joueur(s), niveau ${lobby.currentLevel}`);
                    }
                }
            });

            // Envoyer la réponse au client
            socket.emit('activeLobiesUpdate', { lobbies: activeLobies });
            debugLog(`   📤 Envoi de ${activeLobies.length} lobby(ies) au client`);
        });

        // Événement: Rejoindre un lobby existant
        socket.on('joinExistingLobby', (data) => {
            debugLog(`📊 Demande reçue: joinExistingLobby pour le mode ${data.mode} par ${socket.id}`);
            
            const mode = data.mode; // 'classic', 'classicPrim', ou 'infinite'
            const lobby = lobbies[mode];

            if (!lobby || !lobby.players) {
                debugLog(`   ❌ Lobby ${mode} non trouvé ou invalide`);
                socket.emit('error', { message: `Le lobby ${mode} n'existe pas` });
                return;
            }

            try {
                // Ajouter le joueur au lobby comme dans handleMultiplayerModeSelection
                playerModes[socket.id] = mode;
                
                const modeDisplayNames = {
                    'classic': 'COULOIRS (10 Niveaux)',
                    'classicPrim': 'ORGANIQUE (10 Niveaux)',
                    'infinite': 'INFINI'
                };
                debugLog(`   🎮 Ajout du joueur à ${modeDisplayNames[mode] || mode}`);
                
                // Créer et ajouter le joueur au lobby
                const playerIndex = Object.keys(lobby.players).length;
                const startPos = getRandomEmptyPosition(lobby.map);
                lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, mode);
                
                // Envoyer les données du jeu au joueur
                socket.emit('mapData', lobby.map);
                socket.emit('levelUpdate', lobby.currentLevel);
                socket.emit('highScoreUpdate', lobby.currentRecord);
                socket.emit('gameModSelected', { mode: mode, endType: 'multi' });
                socket.emit('coinUpdate', lobby.coin);
                
                // Notifier les autres joueurs du lobby
                emitToLobby(mode, 'playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                }, io, lobbies);

                // Confirmation au client
                socket.emit('joinedLobby', { success: true, mode: mode });
                debugLog(`   ✅ Joueur ${socket.id} a rejoint ${mode} (${Object.keys(lobby.players).length} joueur(s))`);
            } catch (err) {
                debugLog(`   ❌ Erreur lors de la jointure du lobby: ${err.message}`);
                socket.emit('error', { message: 'Erreur lors de la connexion au lobby' });
            }
        });;

        // --- ADMIN COMMANDS ---
        socket.on('forceStopLobbies', () => {
            debugLog('⚠️ Commande reçue: Forcer l\'arrêt des lobbys');

            // Marquer comme en redémarrage
            setIsRebooting(true);

            // Notifier TOUS les clients que les lobbies se redémarrent
            io.emit('lobbiesRebooting', { rebooting: true });
            debugLog('📢 Notification: Lobbies en redémarrage');

            Object.keys(lobbies).forEach((mode) => {
                const lobby = lobbies[mode];
                if (lobby) {
                    debugLog(`🛑 Fermeture du lobby: ${mode}`);

                    Object.keys(lobby.players).forEach((playerId) => {
                        const playerSocket = io.sockets.sockets.get(playerId);
                        if (playerSocket) {
                            // ✅ NE PAS DÉCONNECTER, juste envoyer un écran d'attente
                            playerSocket.emit('lobbyKicked', { 
                                message: 'Redémarrage des serveurs en cours...',
                                waitingForRestart: true 
                            });
                            debugLog(`   👋 Joueur ${playerId} kické pour redémarrage`);
                        }
                    });

                    delete lobbies[mode];
                }
            });

            debugLog('✅ Tous les lobbys ont été fermés.');

            setTimeout(() => {
                debugLog('♻️ Relance des lobbys...');
                initializeLobbies();
                debugLog('✅ Lobbys relancés et prêts à l\'emploi.');
                
                // Marquer comme prêt
                setIsRebooting(false);
                
                // ✅ LIBÉRER TOUS LES JOUEURS - Envoyer à TOUS les clients connectés
                io.emit('lobbiesReady', { 
                    message: 'Les serveurs sont prêts!',
                    ready: true 
                });
                debugLog('   ✅ TOUS les joueurs libérés');
                
                // Notifier que les lobbies sont prêts
                io.emit('lobbiesRebooting', { rebooting: false });
                debugLog('📢 Notification: Lobbies prêts!');
            }, 8000);
        });

        function initializeLobbies() {
            // Réinitialiser classic
            lobbies.classic = { 
                players: {}, 
                currentLevel: 1,
                levelStartTime: Date.now(),
                map: generateMazeFunc(15, 15),
                coin: getRandomEmptyPositionFunc(generateMazeFunc(15, 15)),
                currentRecord: { score: 0, skin: "❓" },
                restartVote: {
                    isActive: false,
                    votes: {},
                    startTime: null,
                    VOTE_TIMEOUT: 60000
                }
            };
            
            // Réinitialiser classicPrim (MANQUAIT AVANT!)
            lobbies.classicPrim = {
                players: {},
                currentLevel: 1,
                levelStartTime: Date.now(),
                map: generateMazeAdvancedFunc(15, 15, { algorithm: 'prim', density: 0.5 }),
                coin: getRandomEmptyPositionFunc(generateMazeAdvancedFunc(15, 15, { algorithm: 'prim', density: 0.5 })),
                currentRecord: { score: 0, skin: "❓" },
                mazeGeneration: {
                    algorithm: 'prim',
                    density: 0.5
                },
                restartVote: {
                    isActive: false,
                    votes: {},
                    startTime: null,
                    VOTE_TIMEOUT: 60000
                }
            };
            
            // Réinitialiser infinite
            lobbies.infinite = { 
                players: {},
                currentLevel: 1,
                levelStartTime: Date.now(),
                map: generateMazeFunc(15, 15),
                coin: getRandomEmptyPositionFunc(generateMazeFunc(15, 15)),
                currentRecord: { score: 0, skin: "❓" },
                restartVote: {
                    isActive: false,
                    votes: {},
                    startTime: null,
                    VOTE_TIMEOUT: 60000
                }
            };
            
            // Réinitialiser custom
            lobbies.custom = { 
                players: {},
                currentLevel: 1,
                levelStartTime: Date.now(),
                map: generateMazeFunc(10, 10),
                coin: getRandomEmptyPositionFunc(generateMazeFunc(10, 10)),
                currentRecord: { score: 0, skin: "❓" },
                customConfig: null,
                restartVote: {
                    isActive: false,
                    votes: {},
                    startTime: null,
                    VOTE_TIMEOUT: 60000
                }
            };
            
            debugLog('🔄 Lobbys réinitialisés:', Object.keys(lobbies));
        }
    });
}

module.exports = {
    initializeSocketEvents
};
