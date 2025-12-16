// utils/player.js - Gestion des joueurs

const { initializeGems } = require('./gems');

const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃", "💩", "🤣"];
const playerColors = [
    "#FF6B6B", // Rouge
    "#4ECDC4", // Cyan
    "#FFE66D", // Jaune
    "#95E1D3", // Menthe
    "#F38181", // Rose
    "#AA96DA", // Violet
    "#FCBAD3", // Rose pâle
    "#A8D8EA", // Bleu ciel
    "#FFB4A2", // Corail
    "#E0AFA0"  // Beige
];

/**
 * Retourne une skin aléatoire
 * @returns {string} - Une skin emoji aléatoire
 */
function getRandomSkin() {
    return skins[Math.floor(Math.random() * skins.length)];
}

/**
 * Retourne la couleur d'un joueur basée sur son index
 * @param {number} playerIndex - L'index du joueur (ordre de connexion)
 * @returns {string} - La couleur hexadécimale
 */
function getPlayerColor(playerIndex) {
    return playerColors[playerIndex % playerColors.length];
}

/**
 * Initialise un nouveau joueur
 * @param {object} startPos - Position de départ { x, y }
 * @param {number} playerIndex - Index du joueur (pour la couleur)
 * @returns {object} - L'objet joueur initialisé
 */
function initializePlayer(startPos, playerIndex) {
    const player = {
        x: startPos.x,
        y: startPos.y,
        score: 0,
        skin: getRandomSkin(),
        checkpoint: null,
        trail: [],
        color: getPlayerColor(playerIndex),
        lastDirection: 'right',
        // Système de shop - TOUS les pouvoirs sont DÉSACTIVÉS au départ
        gems: 0,
        purchasedFeatures: {
            dash: false,
            checkpoint: false,
            compass: false,
            rope: false,
            speedBoost: 0
        }
    };
    
    initializeGems(player);
    return player;
}

/**
 * Initialise un joueur avec les features selon le mode de jeu
 * @param {object} startPos - Position de départ { x, y }
 * @param {number} playerIndex - Index du joueur (pour la couleur)
 * @param {string} gameMode - Le mode de jeu ('classic' ou 'infinite')
 * @returns {object} - L'objet joueur initialisé avec features du mode
 */
function initializePlayerForMode(startPos, playerIndex, gameMode = 'classic') {
    const player = initializePlayer(startPos, playerIndex);
    
    // En mode infini, débloquer tous les pouvoirs sauf speedBoost
    if (gameMode === 'infinite') {
        player.purchasedFeatures.dash = true;
        player.purchasedFeatures.checkpoint = true;
        player.purchasedFeatures.rope = true;
        player.purchasedFeatures.speedBoost = 0; // À acheter avec des gems
    }
    
    return player;
}

/**
 * Réinitialise les données d'un joueur au changement de niveau
 * (position et traces uniquement, garder les gems et features)
 * @param {object} player - L'objet joueur à réinitialiser
 * @param {object} newPos - Nouvelle position { x, y }
 * @returns {object} - Le joueur réinitialisé
 */
function resetPlayerForNewLevel(player, newPos) {
    player.x = newPos.x;
    player.y = newPos.y;
    player.checkpoint = null;
    player.trail = [];
    // Les gems et purchasedFeatures restent intacts !
    return player;
}

/**
 * Retourne les informations publiques d'un joueur (pour l'état du jeu)
 * @param {object} player - L'objet joueur
 * @returns {object} - Les infos publiques
 */
function getPlayerPublicInfo(player) {
    return {
        x: player.x,
        y: player.y,
        score: player.score,
        skin: player.skin,
        color: player.color,
        trail: player.trail,
        checkpoint: player.checkpoint,
        gems: player.gems,
        purchasedFeatures: player.purchasedFeatures
    };
}

/**
 * Ajoute des points au score d'un joueur
 * @param {object} player - L'objet joueur
 * @param {number} points - Points à ajouter
 * @returns {number} - Le nouveau score
 */
function addScore(player, points = 1) {
    player.score += points;
    return player.score;
}

module.exports = {
    skins,
    playerColors,
    getRandomSkin,
    getPlayerColor,
    initializePlayer,
    initializePlayerForMode,
    resetPlayerForNewLevel,
    getPlayerPublicInfo,
    addScore
};
