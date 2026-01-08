// server/socket-handlers/voting.js
// Gestion des votes de redémarrage et retour au menu

const { emitToLobby } = require('../utils');
const { withValidation } = require('../validation/middleware');

function handleVotingEvents(socket, io, lobbies, soloSessions, playerModes, {
    startRestartVoteFunc,
    submitRestartVoteFunc,
    checkRestartVoteFunc,
    restartGameFunc,
    generateMazeFunc,
    generateMazeAdvancedFunc,
    getRandomEmptyPositionFunc,
    initializePlayerFunc
}) {
    // Proposer un redémarrage
    socket.on('proposeRestart', () => {
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'proposeRestart', {});
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

        const mode = playerModes[socket.id];
        
        // Solo players can't vote
        if (mode === 'solo') {
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        startRestartVoteFunc(socket.id, mode, io, lobbies);
        
        console.log(`🗳️ [VOTE] Redémarrage proposé pour ${mode}`);
        emitToLobby(mode, 'restartVoteStarted', { message: 'Vote de redémarrage lancé!' }, io, lobbies);
    });

    // Voter pour redémarrage
    socket.on('voteRestart', (data) => {
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'voteRestart', data);
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

        const mode = playerModes[socket.id];
        
        // Solo players can't vote
        if (mode === 'solo') {
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        submitRestartVoteFunc(socket.id, data.vote, mode, lobbies);

        const lobby_state = lobbies[mode];
        if (lobby_state?.restartVote?.votes) {
            const voteStatus = {
                totalVotes: Object.keys(lobby_state.restartVote.votes).length,
                playersCount: Object.keys(lobby.players).length,
                votes: lobby_state.restartVote.votes
            };

            emitToLobby(mode, 'voteRestartUpdate', voteStatus, io, lobbies);
        }

        // Vérifier si redémarrage consensuel
        if (checkRestartVoteFunc(mode, lobbies, io)) {
            console.log(`🔄 Redémarrage du ${mode}`);
            restartGameFunc(mode, io, lobbies, generateMazeFunc, getRandomEmptyPositionFunc, initializePlayerFunc, playerModes, generateMazeAdvancedFunc);
            emitToLobby(mode, 'gameRestarted', { level: 1 }, io, lobbies);
        }
    });

    // Proposer retour au menu
    socket.on('proposeReturnToMode', () => {
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'proposeReturnToMode', {});
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

        const mode = playerModes[socket.id];
        
        // Solo: allowed (single player)
        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (session) {
                socket.emit('returnToModeSelection', { message: 'Retour au menu des modes' });
            }
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        // Multiplayer: initialize vote for return to mode
        if (!lobby.returnToModeVote) {
            lobby.returnToModeVote = {
                isActive: true,
                votes: {},
                startTime: Date.now(),
                VOTE_TIMEOUT: 10000
            };
        }

        console.log(`🗳️ [RETURN VOTE] Retour proposé pour ${mode}`);
        emitToLobby(mode, 'returnToModeVoteStarted', { message: 'Vote pour retour aux modes' }, io, lobbies);
    });

    // Voter pour retour au menu
    socket.on('voteReturnToMode', (data) => {
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'voteReturnToMode', data);
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

        const mode = playerModes[socket.id];

        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (session) {
                delete soloSessions[socket.id];
                socket.emit('modeSelectionRequired', { message: 'Veuillez sélectionner un mode' });
            }
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby || !lobby.returnToModeVote) return;

        lobby.returnToModeVote.votes[socket.id] = data.vote;

        const totalVotes = Object.keys(lobby.returnToModeVote.votes).length;
        const playersCount = Object.keys(lobby.players).length;
        
        const voteStatus = {
            totalVotes: totalVotes,
            playersCount: playersCount,
            votes: lobby.returnToModeVote.votes
        };

        emitToLobby(mode, 'voteReturnToModeUpdate', voteStatus, io, lobbies);

        // Si tous les joueurs votent pour "oui", retour immédiat
        const allVotedYes = totalVotes === playersCount && 
                            Object.values(lobby.returnToModeVote.votes).every(v => v === true);

        if (allVotedYes) {
            console.log(`🔄 Retour au sélecteur de modes depuis ${mode}`);
            
            // Supprimer le joueur de la lobby et de playerModes pour qu'ils puissent rejoindre une nouvelle partie
            Object.keys(lobby.players).forEach(playerId => {
                delete playerModes[playerId];
            });
            
            // Réinitialiser la lobby
            lobby.players = {};
            lobby.currentLevel = 1;
            delete lobby.returnToModeVote;
            
            // Réinitialiser la pièce (coin) si elle existe
            if (lobby.coin) {
                const { getRandomEmptyPosition } = require('../../utils/map');
                lobby.coin = getRandomEmptyPosition(lobby.map);
            }
            
            emitToLobby(mode, 'returnToModeSelection', { message: 'Retour au sélecteur de modes' }, io, lobbies);
        }
    });
}

module.exports = {
    handleVotingEvents
};
