/**
 * timing-formatter.js
 * Utility functions for time formatting and delta calculations
 */

/**
 * Formate un temps en millisecondes au format MM:SS.mmm
 * @param {number} timeInSeconds - Temps en secondes
 * @returns {string} Temps formaté (MM:SS.mmm)
 */
function formatTime(timeInSeconds) {
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.round((timeInSeconds - totalSeconds) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Calcule et formate le delta entre deux temps
 * @param {number} currentTime - Temps actuel
 * @param {number} bestTime - Meilleur temps de référence
 * @returns {string} Delta formaté (+/-MM:SS.mmm)
 */
function formatDelta(currentTime, bestTime) {
    const levelDelta = currentTime - bestTime;
    const deltaSeconds = Math.floor(Math.abs(levelDelta));
    const deltaMinutes = Math.floor(deltaSeconds / 60);
    const deltaSecs = deltaSeconds % 60;
    const deltaMilliseconds = Math.round((Math.abs(levelDelta) - deltaSeconds) * 1000);
    
    return `${levelDelta >= 0 ? '+' : '-'}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
}

/**
 * Retourne la couleur du delta (rouge si plus lent, vert si plus rapide)
 * @param {number} deltaTime - Temps delta
 * @returns {string} Couleur hex
 */
function getDeltaColor(deltaTime) {
    return deltaTime >= 0 ? '#FF6B6B' : '#00FF00';
}

/**
 * Trouve le meilleur temps pour un niveau donné
 * @param {number} level - Numéro du niveau
 * @param {object} preferences - Préférences d'affichage {showPersonal, personalBestSplits, bestSplits}
 * @returns {number|null} Meilleur temps ou null
 */
function getBestLevelTime(level, preferences) {
    // Sécurité: vérifier preferences
    if (!preferences || typeof preferences !== 'object') {
        return null;
    }
    
    if (preferences.showPersonal && preferences.personalBestSplits && typeof preferences.personalBestSplits === 'object' && preferences.personalBestSplits[level]) {
        return preferences.personalBestSplits[level];
    }
    
    if (preferences.bestSplits && typeof preferences.bestSplits === 'object' && preferences.bestSplits[level]) {
        return preferences.bestSplits[level];
    }
    
    return null;
}
