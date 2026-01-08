// server/validation/middleware.js
// Middleware pour appliquer validation et rate limiting aux socket events

const { validateSocketData } = require('./validator');
const { globalRateLimiter } = require('./rate-limiter');

/**
 * Middleware Socket.io pour valider et rate-limiter les événements
 * Utilisation dans les handlers:
 *   socket.on('eventName', (data, callback) => {
 *       const result = withValidation(socket.id, 'eventName', data);
 *       if (!result.valid) {
 *           socket.emit('validationError', { message: result.errors[0] });
 *           return;
 *       }
 *       // Logique métier...
 *   });
 * 
 * @param {string} playerId - ID du socket
 * @param {string} eventName - Nom de l'événement
 * @param {*} data - Données reçues
 * @returns {{valid: boolean, errors: string[]}} Résultat de validation
 */
function withValidation(playerId, eventName, data = {}) {
    // Vérifier le rate limit d'abord (plus rapide)
    const rateLimitResult = globalRateLimiter.checkLimit(playerId, eventName);
    if (!rateLimitResult.allowed) {
        return {
            valid: false,
            errors: [rateLimitResult.reason],
            type: 'RATE_LIMIT_EXCEEDED',
            resetIn: rateLimitResult.resetIn
        };
    }

    // Valider les données
    const validationResult = validateSocketData(data, eventName);
    if (!validationResult.valid) {
        return {
            valid: false,
            errors: validationResult.errors,
            type: 'VALIDATION_ERROR'
        };
    }

    return { valid: true };
}

/**
 * Réinitialise le rate limiter d'un joueur
 */
function resetPlayerLimits(playerId) {
    globalRateLimiter.resetPlayer(playerId);
}

module.exports = {
    withValidation,
    resetPlayerLimits
};
