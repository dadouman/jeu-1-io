// server/validation/rate-limiter.js
// Rate limiter par joueur pour les actions critiques

class RateLimiter {
    constructor() {
        this.limiters = {}; // { playerId: { eventName: { count, lastReset } } }
        
        // Configuration des limites par événement (req par intervalle de temps)
        this.limits = {
            'movement': { maxReq: 60, windowMs: 1000 },           // Max 60 mouvements/sec
            'checkpoint': { maxReq: 10, windowMs: 1000 },         // Max 10 checkpoints/sec
            'shopPurchase': { maxReq: 5, windowMs: 1000 },        // Max 5 achats/sec
            'dutchAuctionPurchase': { maxReq: 3, windowMs: 1000 }, // Max 3 enchères/sec
            'voteRestart': { maxReq: 2, windowMs: 1000 },         // Max 2 votes/sec
            'voteReturnToMode': { maxReq: 2, windowMs: 1000 },    // Max 2 votes/sec
            'selectGameMode': { maxReq: 1, windowMs: 3000 },      // Max 1 changement/3sec
            'proposeRestart': { maxReq: 1, windowMs: 5000 },      // Max 1 proposition/5sec
            'proposeReturnToMode': { maxReq: 1, windowMs: 5000 }  // Max 1 proposition/5sec
        };
    }

    /**
     * Vérifie si une action est autorisée selon le rate limit
     * @param {string} playerId - ID du joueur
     * @param {string} eventName - Nom de l'événement
     * @returns {{allowed: boolean, reason?: string, resetIn?: number}} Résultat
     */
    checkLimit(playerId, eventName) {
        const limit = this.limits[eventName];
        
        if (!limit) {
            // Si pas de limite configurée, autoriser
            return { allowed: true };
        }

        // Initialiser le limiter pour ce joueur s'il n'existe pas
        if (!this.limiters[playerId]) {
            this.limiters[playerId] = {};
        }

        const playerLimiters = this.limiters[playerId];
        const now = Date.now();

        // Initialiser ou réinitialiser la fenêtre de temps
        if (!playerLimiters[eventName]) {
            playerLimiters[eventName] = {
                count: 0,
                lastReset: now
            };
        }

        const tracker = playerLimiters[eventName];

        // Si la fenêtre de temps est expirée, réinitialiser
        if (now - tracker.lastReset > limit.windowMs) {
            tracker.count = 0;
            tracker.lastReset = now;
        }

        // Vérifier si on a dépassé la limite
        if (tracker.count >= limit.maxReq) {
            const resetIn = Math.ceil(limit.windowMs - (now - tracker.lastReset));
            return {
                allowed: false,
                reason: `Rate limit exceeded for ${eventName} (${limit.maxReq}/${limit.windowMs}ms)`,
                resetIn
            };
        }

        // Incrémenter le compteur
        tracker.count++;
        return { allowed: true };
    }

    /**
     * Nettoie les données obsolètes des joueurs non connectés
     */
    cleanup() {
        const now = Date.now();
        const maxIdleTime = 60000; // 1 minute

        for (const playerId in this.limiters) {
            let shouldDelete = true;

            for (const eventName in this.limiters[playerId]) {
                const tracker = this.limiters[playerId][eventName];
                if (now - tracker.lastReset < maxIdleTime) {
                    shouldDelete = false;
                    break;
                }
            }

            if (shouldDelete) {
                delete this.limiters[playerId];
            }
        }
    }

    /**
     * Réinitialise le limiter d'un joueur à la déconnexion
     */
    resetPlayer(playerId) {
        delete this.limiters[playerId];
    }
}

// Instance singleton
const globalRateLimiter = new RateLimiter();

// Nettoyer toutes les minutes
setInterval(() => {
    globalRateLimiter.cleanup();
}, 60000);

module.exports = {
    RateLimiter,
    globalRateLimiter
};
