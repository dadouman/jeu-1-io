/**
 * SoloSession - Gère l'état complet d'une partie solo
 * Source de vérité unique pour un joueur en mode solo
 */

class SoloSession {
    /**
     * @param {string} playerId - ID du joueur
     * @param {Socket} socket - Socket.io socket
     * @param {Object} config - Configuration du mode solo (optionnel)
     */
    constructor(playerId, socket, config = {}) {
        this.playerId = playerId;
        this.socket = socket;
        
        // ===== JOUEUR =====
        this.player = null; // Mis à jour après init
        
        // ===== NIVEAUX =====
        this.currentLevel = 1;
        this.maxLevel = config.maxLevels || 10;
        this.isGameFinished = false;
        
        // ===== TIMING PRINCIPAL =====
        this.sessionStartTime = Date.now();
        this.levelStartTime = Date.now();
        
        // ===== TIMING PAUSES (shop + autres) =====
        this.levelPauseTime = null; // Non-null si level est en pause
        this.totalPausedTime = 0; // Temps cumulé de pause
        
        // ===== COUNTDOWN =====
        this.countdownActive = true;
        this.countdownStartTime = Date.now();
        this.countdownDuration = 3000; // 3 secondes
        
        // ===== SHOP =====
        this.shopActive = false;
        this.shopStartTime = null;
        this.shopDuration = config.shop?.duration || 15000; // 15 secondes
        
        // ===== CONFIGURATION DU SHOP =====
        // À quels niveaux doit s'ouvrir le shop
        // Vient de config/gameModes.js (peut être modifié per session)
        this.shopLevels = config.shop?.levels || [5, 10];
        
        // ===== TRANSITION =====
        this.inTransition = false;
        this.transitionStartTime = null;
        this.transitionDuration = 3000; // 3 secondes
        
        // ===== DONNÉES =====
        this.splitTimes = []; // Temps par level
        this.totalTime = 0; // Temps total final
        
        // ===== MAP & COIN =====
        this.map = [];
        this.coin = null;
    }
    
    // ===== GETTERS DE TIMING =====
    
    /**
     * Temps total de la run (parcouru)
     * @returns {number} Temps en secondes
     */
    getRunTotalTime() {
        return (Date.now() - this.sessionStartTime - this.totalPausedTime) / 1000;
    }
    
    /**
     * Temps du niveau actuel
     * Retourne 0 si le level est en pause (shop ouvert)
     * @returns {number} Temps en secondes
     */
    getCurrentLevelTime() {
        // Si level est en pause, retourner 0
        if (this.levelPauseTime) return 0;
        
        // Sinon, calculer depuis le début du level
        return (Date.now() - this.levelStartTime - this.totalPausedTime) / 1000;
    }
    
    /**
     * Temps depuis le début du countdown
     * @returns {number} Temps en ms
     */
    getCountdownElapsed() {
        if (!this.countdownActive) return 0;
        return Date.now() - this.countdownStartTime;
    }
    
    /**
     * Temps depuis ouverture du shop
     * @returns {number} Temps en ms
     */
    getShopElapsed() {
        if (!this.shopActive) return 0;
        return Date.now() - this.shopStartTime;
    }
    
    /**
     * Temps depuis début de transition
     * @returns {number} Temps en ms
     */
    getTransitionElapsed() {
        if (!this.inTransition) return 0;
        return Date.now() - this.transitionStartTime;
    }
    
    // ===== ACTIONS DE JEU =====
    
    /**
     * Enregistrer le temps d'un split
     * @param {number} time - Temps du split en secondes
     */
    recordSplitTime(time) {
        this.splitTimes.push(time);
        console.log(`📊 [SOLO] Split level ${this.splitTimes.length}: ${time.toFixed(2)}s`);
    }
    
    /**
     * Terminer un level et avancer
     * Enregistre le temps du level actuel
     */
    finishLevel() {
        const levelTime = this.getCurrentLevelTime();
        this.recordSplitTime(levelTime);
        
        // Avancer au prochain niveau
        this.currentLevel++;
        
        // Vérifier si jeu terminé
        if (this.currentLevel > this.maxLevel) {
            this.isGameFinished = true;
            this.totalTime = this.getRunTotalTime();
            console.log(`🎉 [SOLO] Jeu terminé! Temps total: ${this.totalTime.toFixed(2)}s`);
        }
        
        // Réinitialiser le timer du nouveau level
        this.levelStartTime = Date.now();
        this.levelPauseTime = null;
        
        // Quitter transition si on y était
        this.inTransition = false;
        this.transitionStartTime = null;
    }
    
    /**
     * Ouvrir le shop
     */
    openShop() {
        if (this.shopActive) return; // Déjà ouvert
        
        this.shopActive = true;
        this.shopStartTime = Date.now();
        this.levelPauseTime = Date.now(); // Pause le timer du level
        
        console.log(`🏪 [SOLO] Shop ouvert après niveau ${this.currentLevel - 1}`);
    }
    
    /**
     * Fermer le shop
     * Redémarre le timer du level
     */
    closeShop() {
        if (!this.shopActive) return; // Pas ouvert
        
        // Calculer le temps du shop
        const shopDuration = Date.now() - this.shopStartTime;
        this.totalPausedTime += shopDuration;
        
        this.shopActive = false;
        this.shopStartTime = null;
        this.levelPauseTime = null;
        
        // Redémarrer le timer du level
        this.levelStartTime = Date.now();
        
        console.log(`✅ [SOLO] Shop fermé (durée: ${(shopDuration / 1000).toFixed(1)}s)`);
    }
    
    /**
     * Vérifier si le shop doit s'ouvrir après ce niveau
     * Basé sur la configuration shopLevels
     * @param {number} completedLevel - Le niveau qui vient d'être complété
     * @returns {boolean} True si le shop doit s'ouvrir
     */
    shouldOpenShop(completedLevel) {
        return this.shopLevels.includes(completedLevel);
    }
    
    /**
     * Démarrer une transition (après levelUp ou restart)
     */
    startTransition() {
        this.inTransition = true;
        this.transitionStartTime = Date.now();
    }
    
    /**
     * Terminer une transition
     */
    endTransition() {
        this.inTransition = false;
        this.transitionStartTime = null;
    }
    
    // ===== VALIDATION =====
    
    /**
     * Valider les splits avant sauvegarde MongoDB
     * Vérifie que les splits sont cohérents et valides
     * @param {array} splits - Array de split times
     * @returns {boolean} true si valides
     */
    validateSplits(splits) {
        // Vérification basiques
        if (!Array.isArray(splits) || splits.length === 0) {
            console.warn(`❌ [SOLO] Validation échouée: pas un array`);
            return false;
        }
        
        // Vérifier le nombre de splits (doit être 10 pour solo)
        if (splits.length !== this.maxLevel) {
            console.warn(`❌ [SOLO] Validation échouée: ${splits.length} splits reçus (attendu ${this.maxLevel})`);
            return false;
        }
        
        // Vérifier que chaque split est un nombre valide
        for (let i = 0; i < splits.length; i++) {
            if (typeof splits[i] !== 'number' || isNaN(splits[i]) || !isFinite(splits[i])) {
                console.warn(`❌ [SOLO] Validation échouée: split ${i + 1} n'est pas un nombre valide`);
                return false;
            }
        }
        
        // Chaque split doit être > 0.5s (minimum physique)
        const tooLow = splits.filter(s => s <= 0.5);
        if (tooLow.length > 0) {
            console.warn(`❌ [SOLO] Validation échouée: ${tooLow.length} split(s) < 0.5s (${tooLow.join(', ').substring(0, 50)}...)`);
            return false;
        }
        
        // Chaque split doit être < 120s (limit raisonnable)
        const tooHigh = splits.filter(s => s >= 120);
        if (tooHigh.length > 0) {
            console.warn(`❌ [SOLO] Validation échouée: ${tooHigh.length} split(s) >= 120s`);
            return false;
        }
        
        // Chaque split doit être < 3x la moyenne (détection anomalies)
        const avgSplit = splits.reduce((a, b) => a + b, 0) / splits.length;
        const anomalies = splits.filter(s => s > avgSplit * 3);
        if (anomalies.length > 2) {
            console.warn(`❌ [SOLO] Validation échouée: ${anomalies.length} anomalies détectées (3x moyenne)`);
            return false;
        }
        
        // La somme des splits doit être proche du temps total (±5%)
        const sumSplits = splits.reduce((a, b) => a + b, 0);
        const tolerance = Math.max(2, this.totalTime * 0.05); // Au moins 2 secondes
        const diff = Math.abs(sumSplits - this.totalTime);
        
        if (diff > tolerance) {
            console.warn(`❌ [SOLO] Validation échouée: somme splits (${sumSplits.toFixed(2)}s) ≠ totalTime (${this.totalTime.toFixed(2)}s), diff: ${diff.toFixed(2)}s, tolerance: ${tolerance.toFixed(2)}s`);
            return false;
        }
        
        console.log(`✅ [SOLO] Validation complète: ${splits.length} splits, temps total: ${this.totalTime.toFixed(2)}s`);
        return true;
    }
    
    // ===== ÉMISSION ÉTAT =====
    
    /**
     * Envoyer l'état complet du jeu au client
     * À appeler à chaque changement significatif
     */
    sendGameState(shopItems = {}) {
        const gameState = {
            // Joueur
            player: this.player,
            
            // Niveaux
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            isGameFinished: this.isGameFinished,
            
            // Timings
            runTotalTime: this.getRunTotalTime(),
            currentLevelTime: this.getCurrentLevelTime(),
            splitTimes: this.splitTimes,
            
            // UI - Countdown
            countdown: {
                active: this.countdownActive,
                duration: this.countdownDuration,
                startTime: this.countdownStartTime,
                elapsed: this.getCountdownElapsed()
            },
            
            // UI - Shop
            shop: {
                active: this.shopActive,
                duration: this.shopDuration,
                startTime: this.shopStartTime,
                elapsed: this.getShopElapsed(),
                items: this.shopActive ? shopItems : {}
            },
            
            // UI - Transition
            transition: {
                active: this.inTransition,
                duration: this.transitionDuration,
                startTime: this.transitionStartTime,
                elapsed: this.getTransitionElapsed()
            },
            
            // Map
            map: this.map,
            coin: this.coin
        };
        
        this.socket.emit('soloGameState', gameState);
    }
}

module.exports = SoloSession;
