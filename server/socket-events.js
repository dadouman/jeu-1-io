// server/socket-events.js - Event Manager (Refactorisé en modules feature-based)
// Gère l'initialisation des connexions et dispatche les événements vers les handlers spécialisés

const { generateMaze } = require('../utils/map');

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

        // --- DISPATCHER LES ÉVÉNEMENTS AUX MODULES SPÉCIALISÉS ---
        
        // Mode Selection Handler (selectGameMode, checkCustomModeConnections)
        handleModeSelection(socket, playerModes, lobbies, soloSessions, io, { 
            SoloRunModel, SoloBestSplitsModel, mongoURI 
        });

        // Movement Handler (movement)
        handleMovement(socket, playerModes, lobbies, soloSessions);

        // Checkpoint Handler (checkpoint)
        handleCheckpoint(socket, playerModes, lobbies, soloSessions);

        // Shop Handler (playerReadyToContinueShop, shopClosedByTimeout, dutchAuctionPurchase, validateShop, shopPurchase)
        handleShopEvents(socket, playerModes, lobbies, soloSessions, io, { mongoURI });

        // Voting Handler (proposeRestart, voteRestart, proposeReturnToMode, voteReturnToMode)
        handleVotingEvents(socket, playerModes, lobbies, soloSessions, io, {
            startRestartVote,
            submitRestartVote,
            checkRestartVote,
            restartGame,
            generateMaze
        });

        // Solo Handler (saveSoloResults, requestSoloBestSplits, getSoloLeaderboard)
        handleSoloEvents(socket, io, soloSessions, playerModes, { 
            SoloRunModel, SoloBestSplitsModel, mongoURI 
        });

        // Disconnect Handler
        handleDisconnect(socket, playerModes, lobbies, soloSessions);

        // --- ADMIN COMMANDS ---
        socket.on('forceStopLobbies', () => {
            console.log('⚠️ Commande reçue: Forcer l\'arrêt des lobbys');

            Object.keys(lobbies).forEach((mode) => {
                const lobby = lobbies[mode];
                if (lobby) {
                    console.log(`🛑 Fermeture du lobby: ${mode}`);

                    Object.keys(lobby.players).forEach((playerId) => {
                        const playerSocket = io.sockets.sockets.get(playerId);
                        if (playerSocket) {
                            playerSocket.emit('kicked', { message: 'Lobby fermé par l\'administrateur.' });
                            playerSocket.disconnect();
                        }
                    });

                    delete lobbies[mode];
                }
            });

            console.log('✅ Tous les lobbys ont été fermés.');

            setTimeout(() => {
                console.log('♻️ Relance des lobbys...');
                initializeLobbies();
                console.log('✅ Lobbys relancés et prêts à l\'emploi.');
            }, 5000);
        });

        function initializeLobbies() {
            lobbies.classic = { players: {}, map: generateMaze(15, 15) };
            lobbies.infinite = { players: {}, map: generateMaze(20, 20) };
            lobbies.custom = { players: {}, map: generateMaze(10, 10) };
            console.log('🔄 Lobbys initialisés:', Object.keys(lobbies));
        }
    });
}

module.exports = {
    initializeSocketEvents
};
