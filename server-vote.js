// server-vote.js - Système de vote pour redémarrer

function startRestartVote(initiatorId, mode, io, lobbies) {
    const lobby = lobbies[mode];
    if (!lobby) return { success: false, message: "Lobby invalide" };
    
    if (lobby.restartVote.isActive) {
        return { success: false, message: "Un vote est déjà en cours" };
    }
    
    lobby.restartVote.isActive = true;
    lobby.restartVote.votes = {};
    lobby.restartVote.startTime = Date.now();
    
    const playerCount = Object.keys(lobby.players).length;
    console.log(`\n🗳️ ════════════════════════════════════\n   VOTE POUR REDÉMARRER LANCÉ (${mode})\n   ${playerCount} joueur(s) connecté(s)\n   Tapez O pour OUI, N ou rien pour NON\n════════════════════════════════════\n`);
    
    // Émettre à tous les joueurs de la lobby
    Object.keys(lobby.players).forEach(playerId => {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('restartVoteStarted', {
                initiator: lobby.players[initiatorId]?.skin || "❓",
                playerCount: playerCount,
                timeout: lobby.restartVote.VOTE_TIMEOUT
            });
        }
    });
    
    return { success: true };
}

function submitRestartVote(playerId, voteValue, mode, lobbies) {
    const lobby = lobbies[mode];
    if (!lobby) return { success: false, message: "Lobby invalide" };
    
    if (!lobby.restartVote.isActive) {
        return { success: false, message: "Aucun vote en cours" };
    }
    
    const player = lobby.players[playerId];
    lobby.restartVote.votes[playerId] = voteValue;
    
    console.log(`   ${player.skin} a voté: ${voteValue ? "✅ OUI" : "❌ NON"}`);
    
    return { success: true, voteRegistered: voteValue };
}

function checkRestartVote(mode, lobbies, io) {
    const lobby = lobbies[mode];
    if (!lobby) return false;
    
    if (!lobby.restartVote.isActive) return false;
    
    const now = Date.now();
    const elapsed = now - lobby.restartVote.startTime;
    const totalPlayers = Object.keys(lobby.players).length;
    const yesVotes = Object.values(lobby.restartVote.votes).filter(v => v === true).length;
    const requiredYes = Math.ceil(totalPlayers / 2);
    
    if (yesVotes >= requiredYes) {
        finishRestartVote(mode, lobbies, io);
        return true;
    }
    
    if (elapsed > lobby.restartVote.VOTE_TIMEOUT) {
        finishRestartVote(mode, lobbies, io);
        return false;
    }
    
    return false;
}

function finishRestartVote(mode, lobbies, io) {
    const lobby = lobbies[mode];
    if (!lobby) return false;
    
    if (!lobby.restartVote.isActive) return false;
    
    const totalPlayers = Object.keys(lobby.players).length;
    const yesVotes = Object.values(lobby.restartVote.votes).filter(v => v === true).length;
    const requiredYes = Math.ceil(totalPlayers / 2);
    const shouldRestart = yesVotes >= requiredYes;
    
    const result = {
        shouldRestart,
        yesVotes,
        requiredYes,
        totalPlayers,
        totalVotesReceived: Object.keys(lobby.restartVote.votes).length
    };
    
    console.log(`\n📊 RÉSULTAT DU VOTE (${mode}): ${yesVotes}/${requiredYes} votes pour redémarrer`);
    
    // Réinitialiser le vote
    lobby.restartVote.isActive = false;
    lobby.restartVote.votes = {};
    lobby.restartVote.startTime = null;
    
    // Émettre le résultat à tous les joueurs de la lobby
    Object.keys(lobby.players).forEach(playerId => {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('restartVoteFinished', result);
        }
    });
    
    return shouldRestart;
}

function restartGame(mode, io, lobbies, generateMaze, getRandomEmptyPosition, initializePlayer, playerModes) {
    const lobby = lobbies[mode];
    if (!lobby) return;
    
    console.log(`\n🔄 ════════════════════════════════════\n   REDÉMARRAGE DU JEU (${mode})\n════════════════════════════════════\n`);
    
    // Réinitialiser les variables du jeu
    lobby.currentLevel = 1;
    lobby.map = generateMaze(15, 15);
    lobby.coin = getRandomEmptyPosition(lobby.map);
    
    // Réinitialiser tous les joueurs de la lobby
    const playerIds = Object.keys(lobby.players);
    for (let i = 0; i < playerIds.length; i++) {
        const id = playerIds[i];
        const startPos = getRandomEmptyPosition(lobby.map);
        lobby.players[id] = initializePlayer(startPos, i);
    }
    
    // Notifier tous les clients de la lobby de retourner à la sélection de mode
    Object.keys(lobby.players).forEach(playerId => {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('returnToModeSelection');
        }
    });
}

module.exports = {
    startRestartVote,
    submitRestartVote,
    checkRestartVote,
    finishRestartVote,
    restartGame
};
