// utils/GameMode.js - Classe abstraite pour tous les modes de jeu

const { getGameModeConfig } = require('../config/gameModes');

/**
 * Classe abstraite GameMode - parente pour tous les modes
 * Contient la logique commune à tous les modes
 */
class GameMode {
    constructor(modeId) {
        this.modeId = modeId;
        this.config = getGameModeConfig(modeId);
        this.validateConfig();
    }

    /**
     * Valide que la configuration est complète
     */
    validateConfig() {
        const required = ['maxPlayers', 'maxLevels', 'levelConfig', 'shop', 'shopItems', 'startingFeatures', 'movement'];
        for (const field of required) {
            if (!this.config[field]) {
                throw new Error(`Configuration invalide pour ${this.modeId}: manque ${field}`);
            }
        }
    }

    /**
     * Récupère la taille du maze pour un niveau
     * @param {number} level
     * @returns {object} {width, height}
     */
    getMazeSize(level) {
        return this.config.levelConfig.calculateSize(level);
    }

    /**
     * Récupère le nombre de gems pour un niveau
     * @param {number} level
     * @returns {number}
     */
    getGemsForLevel(level) {
        return this.config.gemsPerLevel.calculateGems(level);
    }

    /**
     * Vérifie si le shop s'ouvre après ce niveau
     * @param {number} level
     * @returns {boolean}
     */
    isShopLevel(level) {
        if (!this.config.shop.enabled) return false;
        return this.config.shop.levels.includes(level);
    }

    /**
     * Récupère les items du shop
     * @returns {array}
     */
    getShopItems() {
        return this.config.shopItems || [];
    }

    /**
     * Récupère un item du shop par son ID
     * @param {string} itemId
     * @returns {object|null}
     */
    getShopItem(itemId) {
        return this.config.shopItems.find(item => item.id === itemId) || null;
    }

    /**
     * Initialise les features pour un nouveau joueur
     * @param {object} player
     */
    initializePlayerFeatures(player) {
        player.purchasedFeatures = JSON.parse(JSON.stringify(this.config.startingFeatures));
    }

    /**
     * Récupère la vitesse de base du mouvement
     * @param {object} player
     * @returns {number}
     */
    getPlayerSpeed(player) {
        const baseSpeed = this.config.movement.baseSpeed;
        const speedBoostLevel = player.purchasedFeatures?.speedBoost || 0;
        return baseSpeed + (speedBoostLevel * this.config.movement.speedBoostIncrement);
    }

    /**
     * Vérifie si un mode peut avoir un nombre de joueurs donnés
     * @param {number} playerCount
     * @returns {boolean}
     */
    canAccommodatePlayers(playerCount) {
        return playerCount <= this.config.maxPlayers;
    }

    /**
     * Vérifie si le jeu est terminé (tous les niveaux complétés)
     * @param {number} currentLevel
     * @returns {boolean}
     */
    isGameFinished(currentLevel) {
        return currentLevel > this.config.maxLevels;
    }

    /**
     * Récupère la durée du shop
     * @returns {number} en ms
     */
    getShopDuration() {
        return this.config.shop.duration;
    }

    /**
     * Vérifie si le mode a le système de vote
     * @returns {boolean}
     */
    hasVotingSystem() {
        return this.config.voting?.enabled || false;
    }

    /**
     * Récupère la durée de transition
     * @returns {number} en ms
     */
    getTransitionDuration() {
        return this.config.transitionDuration;
    }

    /**
     * Vérifie si le mode est un speedrun (solo)
     * @returns {boolean}
     */
    isSpeedrunMode() {
        return this.config.speedrun?.enabled || false;
    }

    /**
     * Récupère tous les paramètres du mode
     * @returns {object}
     */
    getConfig() {
        return this.config;
    }

    /**
     * Affiche l'information du mode
     * @returns {string}
     */
    toString() {
        return `${this.config.name} (${this.config.description})`;
    }
}

module.exports = GameMode;
