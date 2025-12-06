// utils/gems.js - Gestion de l'économie des gems

const { isShopLevel } = require('./shop');

/**
 * Calcule les gems gagnées pour un niveau
 * @param {number} level - Le niveau actuel (avant progression)
 * @returns {number} - Le nombre de gems à gagner
 */
function calculateGemsForLevel(level) {
    // 1 gem par niveau, c'est tout
    return 1;
}

/**
 * Ajoute des gems à un joueur
 * @param {object} player - L'objet joueur
 * @param {number} amount - Le nombre de gems à ajouter
 * @returns {number} - Les gems totaux après l'ajout
 */
function addGems(player, amount) {
    player.gems = (player.gems || 0) + amount;
    return player.gems;
}

/**
 * Retire des gems à un joueur
 * @param {object} player - L'objet joueur
 * @param {number} amount - Le nombre de gems à retirer
 * @returns {boolean} - True si la transaction a réussi
 */
function removeGems(player, amount) {
    if ((player.gems || 0) < amount) {
        return false;
    }
    player.gems -= amount;
    return true;
}

/**
 * Initialise les gems d'un joueur
 * @param {object} player - L'objet joueur
 * @returns {object} - Le joueur avec gems initialisés
 */
function initializeGems(player) {
    player.gems = 0;
    return player;
}

module.exports = {
    calculateGemsForLevel,
    addGems,
    removeGems,
    initializeGems
};
