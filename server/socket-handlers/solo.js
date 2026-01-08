// server/socket-handlers/solo.js
// Gestion des événements spécifiques au mode solo (sauvegarde, leaderboard, best splits)

async function handleSoloEvents(socket, io, soloSessions, playerModes, { 
    SoloRunModel,
    SoloBestSplitsModel,
    mongoURI 
}) {
    // Sauvegarder les résultats du solo
    socket.on('saveSoloResults', async (data) => {
        const mode = playerModes[socket.id];
        if (mode !== 'solo') return;

        const session = soloSessions[socket.id];
        if (!session) return;

        try {
            // Créer un document de run solo
            const soloRun = new SoloRunModel({
                playerDisplayName: data.playerDisplayName || 'Anonyme',
                playerSkin: session.player.skin,
                level: session.level,
                score: session.player.score,
                totalTime: Date.now() - session.startTime,
                purchasedFeatures: session.player.purchasedFeatures,
                gems: session.player.gems,
                timestamp: new Date()
            });

            await soloRun.save();
            console.log(`💾 [SOLO] Run sauvegardé: ${data.playerDisplayName} - Score ${session.player.score}`);

            socket.emit('soloResultsSaved', {
                level: session.level,
                score: session.player.score
            });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des résultats solo:', error);
            socket.emit('error', { message: 'Erreur lors de la sauvegarde' });
        }

        // Supprimer la session solo
        delete soloSessions[socket.id];
    });

    // Obtenir les meilleurs splits
    async function requestSoloBestSplits() {
        try {
            // Ajouter timeout de 5 secondes pour éviter les hangs
            const bestSplits = await Promise.race([
                SoloBestSplitsModel.findOne({}).sort({ levelSplitTime: 1 }).exec(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('DB timeout')), 5000)
                )
            ]);
            socket.emit('soloBestSplits', bestSplits || {});
        } catch (error) {
            console.warn('⚠️ Impossible de récupérer les meilleurs splits (DB may not be ready):', error.message);
            // Retourner objet vide plutôt que de planter
            socket.emit('soloBestSplits', {});
        }
    }

    socket.on('getSoloBestSplits', requestSoloBestSplits);
    socket.on('requestSoloBestSplits', requestSoloBestSplits);

    // Obtenir le leaderboard solo
    socket.on('getSoloLeaderboard', async () => {
        try {
            // Ajouter timeout de 5 secondes pour éviter les hangs
            const leaderboard = await Promise.race([
                SoloRunModel
                    .find({})
                    .sort({ score: -1 })
                    .limit(100)
                    .exec(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('DB timeout')), 5000)
                )
            ]);

            const formattedLeaderboard = leaderboard.map((entry, index) => ({
                rank: index + 1,
                playerDisplayName: entry.playerDisplayName,
                playerSkin: entry.playerSkin,
                level: entry.level,
                score: entry.score,
                totalTime: entry.totalTime,
                timestamp: entry.timestamp
            }));

            socket.emit('soloLeaderboardData', formattedLeaderboard);
        } catch (error) {
            console.warn('⚠️ Impossible de récupérer le leaderboard (DB may not be ready):', error.message);
            socket.emit('soloLeaderboardData', []);
        }
    });
}

module.exports = {
    handleSoloEvents
};
