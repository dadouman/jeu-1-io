// server/socket-events.js - Event Manager (Refactorisé en modules feature-based)
// Gère l'initialisation des connexions et dispatche les événements vers les handlers spécialisés

const { debugLog } = require('./debug');
const { generateMaze, generateMazeAdvanced, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayer } = require('../utils/player');

// Importer les modules socket handlers (feature-based)
const { handleModeSelection } = require('./socket-handlers/mode-selection');
const { handleMovement } = require('./socket-handlers/movement');
const { handleCheckpoint } = require('./socket-handlers/checkpoint');
const { handleShopEvents } = require('./socket-handlers/shop');
const { handleVotingEvents } = require('./socket-handlers/voting');
const { handleSoloEvents } = require('./socket-handlers/solo');
const { handleDisconnect } = require('./socket-handlers/disconnect');
const { handleLobbiesEvents } = require('./socket-handlers/lobbies');

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

        // Lobbies Handler (getActiveLobies, joinExistingLobby)
        handleLobbiesEvents(socket, io, lobbies, soloSessions, playerModes, { getIsRebooting });

        // Disconnect Handler
        handleDisconnect(socket, io, lobbies, soloSessions, playerModes);

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
