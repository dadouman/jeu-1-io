// server/unified-game-loop.js - Game loop unifiée pour tous les modes

const { calculateGemsForLevel, addGems } = require('../utils/gems');
const PlayerActions = require('../utils/PlayerActions');
const { getGameModeConfig } = require('../config/gameModes');

/**
 * Boucle de jeu unique pour tous les modes
 * Gère: collision avec pièces, progression, shop, fin de jeu
 */
class UnifiedGameLoop {
    constructor(sessionManager, io) {
        this.sessionManager = sessionManager;
        this.io = io;
    }

    /**
     * Traite une itération de la boucle de jeu
     */
    process() {
        // Pour chaque session active
        for (const sessionId in this.sessionManager.sessions) {
            const session = this.sessionManager.sessions[sessionId];
            
            // Pour chaque joueur dans la session
            for (const playerId in session.players) {
                const player = session.players[playerId];
                const socket = this.io.sockets.sockets.get(playerId);
                
                if (!socket || !socket.connected) {
                    continue;
                }

                // ===== VÉRIFIER COLLISION AVEC PIÈCE =====
                if (PlayerActions.checkCoinCollision(player, session.coin) && !session.isShopActive()) {
                    this.handleCoinCollision(session, playerId, socket);
                }

                // ===== ENVOYER ÉTAT DU JEU =====
                socket.emit('state', {
                    players: { [playerId]: player },
                    coin: session.coin,
                    playerGems: player.gems,
                    level: session.currentLevel
                });
            }
        }
    }

    /**
     * Gère la collision avec une pièce (progression dans le jeu)
     */
    handleCoinCollision(session, playerId, socket) {
        const player = session.players[playerId];
        const completedLevel = session.currentLevel;
        const gameMode = session.gameMode;

        // 1. Enregistrer le temps du split
        const splitTime = (Date.now() - session.levelStartTime) / 1000;
        session.recordSplitTime(splitTime);

        // 2. Donner les gems au joueur
        const gemsEarned = gameMode.getGemsForLevel(completedLevel);
        addGems(player, gemsEarned);

        console.log(`✅ [${gameMode.modeId}] Joueur ${playerId} a terminé niveau ${completedLevel} en ${splitTime.toFixed(1)}s | +${gemsEarned}💎`);

        // 3. Avancer au prochain niveau
        session.nextLevel();

        // 4. Vérifier si le jeu est terminé
        if (session.isGameFinished) {
            this.handleGameFinished(session, playerId, socket);
            return;
        }

        // 5. Vérifier si un shop s'ouvre après ce niveau
        if (gameMode.isShopLevel(completedLevel)) {
            session.openShop();
            socket.emit('shopOpen', { 
                items: gameMode.getShopItems(),
                level: completedLevel 
            });
            console.log(`🏪 [${gameMode.modeId}] Shop ouvert pour joueur ${playerId} après niveau ${completedLevel}`);
        } else {
            // Pas de shop, envoyer les données du nouveau niveau
            socket.emit('mapData', session.map);
            socket.emit('levelUpdate', session.currentLevel);
        }
    }

    /**
     * Gère la fin du jeu
     */
    handleGameFinished(session, playerId, socket) {
        const gameMode = session.gameMode;
        const player = session.players[playerId];

        console.log(`🎉 [${gameMode.modeId}] Joueur ${playerId} a terminé le jeu!`);
        console.log(`   Temps total: ${session.totalTime.toFixed(1)}s`);
        console.log(`   Gems finaux: ${player.gems}`);

        // Envoyer les données de fin
        socket.emit('gameFinished', {
            finalLevel: session.currentLevel - 1,
            totalTime: session.totalTime,
            gems: player.gems,
            splits: session.splitTimes,
            mode: gameMode.modeId
        });

        // En mode solo, sauvegarder le score
        if (gameMode.isSpeedrunMode()) {
            this.saveSoloRunData(session, player);
        }

        // Supprimer la session après completion
        this.sessionManager.deleteSession(session.sessionId);
    }

    /**
     * Sauvegarde les données d'un run solo en base de données
     */
    saveSoloRunData(session, player) {
        // TODO: Intégrer la sauvegarde MongoDB
        console.log(`💾 [SOLO] Sauvegarde en BDD: ${session.totalTime}s, ${player.gems} gems`);
    }
}

module.exports = UnifiedGameLoop;
