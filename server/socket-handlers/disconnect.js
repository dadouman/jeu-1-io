// server/socket-handlers/disconnect.js
// Gestion de la déconnexion des joueurs

function handleDisconnect(socket, io, lobbies, soloSessions, playerModes) {
    socket.on('disconnect', () => { 
        const playerId = socket.id;
        const mode = playerModes[playerId];

        console.log(`👋 Joueur ${playerId} déconnecté (Mode: ${mode || 'N/A'})`);

        if (!mode) return;

        // Cas du SOLO
        if (mode === 'solo') {
            if (soloSessions[playerId]) {
                console.log(`   📊 Suppression de la session SOLO`);
                delete soloSessions[playerId];
            }
        } else {
            // Cas du MULTIPLAYER
            const lobby = lobbies[mode];
            if (lobby && lobby.players[playerId]) {
                const player = lobby.players[playerId];
                console.log(`   ${player.skin} quitte ${mode}`);
                
                delete lobby.players[playerId];
                console.log(`   Joueurs restants: ${Object.keys(lobby.players).length}`);

                // Notifier les autres joueurs
                io.to(mode).emit('playersCountUpdate', {
                    count: Object.keys(lobby.players).length
                });
                
                io.to(mode).emit('playerDisconnected', { playerId: playerId });
            }
        }

        // Nettoyer le mapping du mode
        delete playerModes[playerId];
    });
}

module.exports = {
    handleDisconnect
};
