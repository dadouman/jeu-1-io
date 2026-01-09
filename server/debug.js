// server/debug.js - Gestion centralisée du DEBUG mode
// Utilise process.env.DEBUG ou NODE_ENV pour contrôler les logs

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

/**
 * Log une message seulement en mode DEBUG
 * @param {...args} args - Arguments à logger
 */
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(...args);
    }
};

/**
 * Log une erreur seulement en mode DEBUG
 * @param {...args} args - Arguments à logger
 */
const debugError = (...args) => {
    if (DEBUG) {
        console.error(...args);
    }
};

module.exports = {
    DEBUG,
    debugLog,
    debugError
};
