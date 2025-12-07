// utils/ShopManager.js - Gestion centralisée du shop pour tous les modes

/**
 * ShopManager - Gère l'état du shop pour une session
 * 
 * Responsabilités:
 * - Décider si le shop doit s'ouvrir après un niveau
 * - Bloquer les collisions tant que le shop est actif
 * - Réinitialiser l'état du shop automatiquement
 * - Fonctionner pour TOUS les modes (solo, classic, infinite, etc)
 */
class ShopManager {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.isShopCurrentlyActive = false;
        this.shopStartLevel = null;
        this.shopEndTime = null;
    }

    /**
     * Ouvre le shop après la complétion d'un niveau
     * @param {number} completedLevel - Le niveau qui vient d'être complété
     * @param {number} currentTime - Date.now()
     * @returns {boolean} - True si le shop a été ouvert
     * 
     * Exemple:
     *   Mode solo: shop après niveau 5 → shopManager.openShop(5, Date.now()) → true
     *   Mode solo: pas de shop après niveau 3 → shopManager.openShop(3, Date.now()) → false
     *   Mode classic: shop après niveau 5 → shopManager.openShop(5, Date.now()) → true
     */
    openShop(completedLevel, currentTime = Date.now()) {
        // Vérifier si ce niveau ouvre un shop selon la config du mode
        if (!this.gameMode.isShopLevel(completedLevel)) {
            return false;
        }

        // Ouvrir le shop
        this.isShopCurrentlyActive = true;
        this.shopStartLevel = completedLevel;
        this.shopEndTime = currentTime + this.gameMode.getShopDuration();

        return true;
    }

    /**
     * Vérifie si les collisions doivent être bloquées en ce moment
     * @returns {boolean} - True si le shop est actif et bloque les collisions
     * 
     * À utiliser dans la boucle de jeu:
     *   if (!shopManager.shouldBlockCollisions()) {
     *       // Traiter la collision avec la gem
     *   }
     */
    shouldBlockCollisions() {
        if (!this.isShopCurrentlyActive) {
            return false;
        }

        // Vérifier si le shop est toujours actif (pas dépassé la durée)
        if (Date.now() >= this.shopEndTime) {
            this.closeShop();
            return false;
        }

        return true;
    }

    /**
     * Ferme le shop (appelé automatiquement ou manuellement)
     */
    closeShop() {
        this.isShopCurrentlyActive = false;
        this.shopStartLevel = null;
        this.shopEndTime = null;
    }

    /**
     * Récupère le temps restant du shop (en ms)
     * @returns {number} - Millisecondes restantes, ou 0 si fermé
     */
    getShopTimeRemaining() {
        if (!this.isShopCurrentlyActive) {
            return 0;
        }

        const remaining = this.shopEndTime - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Récupère l'état complet du shop (utile pour débugging)
     * @returns {object}
     */
    getState() {
        return {
            isActive: this.isShopCurrentlyActive,
            shopStartLevel: this.shopStartLevel,
            timeRemaining: this.getShopTimeRemaining(),
            modeId: this.gameMode.modeId
        };
    }

    /**
     * Réinitialise complètement le shop (utile quand on change de mode ou session)
     */
    reset() {
        this.isShopCurrentlyActive = false;
        this.shopStartLevel = null;
        this.shopEndTime = null;
    }
}

module.exports = { ShopManager };
