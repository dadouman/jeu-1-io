// server/debug.js - Gestion centralisée du DEBUG mode
// Utilise process.env.DEBUG ou NODE_ENV pour contrôler les logs

// Lazy load DEBUG pour éviter les erreurs d'accès à process trop tôt
let DEBUG = null;

function getDebugStatus() {
    if (DEBUG !== null) return DEBUG;
    try {
        DEBUG = typeof process !== 'undefined' && (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development');
    } catch (e) {
        DEBUG = false;
    }
    return DEBUG;
}

/**
 * Log une message seulement en mode DEBUG
 * @param {...args} args - Arguments à logger
 */
const debugLog = (...args) => {
    if (getDebugStatus()) {
        console.log(...args);
    }
};

/**
 * Log une erreur seulement en mode DEBUG
 * @param {...args} args - Arguments à logger
 */
const debugError = (...args) => {
    if (getDebugStatus()) {
        console.error(...args);
    }
};

module.exports = {
    DEBUG,
    debugLog,
    debugError
};
