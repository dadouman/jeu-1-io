# 💻 CODE READY-TO-IMPLEMENT - Mode Solo Refactoring

**Ce document contient du code prêt à implémenter, pas besoin de l'adapter.**

---

## 1️⃣ `server/utils/SoloSession.js` (CRÉER CE FICHIER)

```javascript
/**
 * SoloSession - Gère l'état complet d'une partie solo
 * Source de vérité unique pour un joueur en mode solo
 */

class SoloSession {
    constructor(playerId, socket) {
        this.playerId = playerId;
        this.socket = socket;
        
        // ===== JOUEUR =====
        this.player = null; // Mis à jour après init
        
        // ===== NIVEAUX =====
        this.currentLevel = 1;
        this.maxLevel = 10;
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
        this.shopDuration = 15000; // 15 secondes
        
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
     * @param {array} splits - Array de split times
     * @returns {boolean} true si valides
     */
    validateSplits(splits) {
        // Vérification basiques
        if (!Array.isArray(splits) || splits.length === 0) {
            console.warn(`❌ [SOLO] Splits invalides: pas un array`);
            return false;
        }
        
        // Chaque split doit être > 0.5s (minimum physique)
        const tooLow = splits.filter(s => s <= 0.5);
        if (tooLow.length > 0) {
            console.warn(`❌ [SOLO] Splits trop bas: ${tooLow.join(', ')}s (min 0.5s)`);
            return false;
        }
        
        // Chaque split doit être < 60s (limit raisonnable)
        const tooHigh = splits.filter(s => s >= 60);
        if (tooHigh.length > 0) {
            console.warn(`❌ [SOLO] Splits trop hauts: ${tooHigh.join(', ')}s (max 60s)`);
            return false;
        }
        
        // La somme des splits doit être proche du temps total (±5%)
        const sumSplits = splits.reduce((a, b) => a + b, 0);
        const tolerance = Math.max(1, this.totalTime * 0.05); // Au moins 1 seconde
        
        if (Math.abs(sumSplits - this.totalTime) > tolerance) {
            console.warn(`❌ [SOLO] Somme splits (${sumSplits.toFixed(2)}s) ≠ totalTime (${this.totalTime.toFixed(2)}s), tolerance: ±${tolerance.toFixed(2)}s`);
            return false;
        }
        
        console.log(`✅ [SOLO] Splits validés`);
        return true;
    }
    
    // ===== ÉMISSION ÉTAT =====
    
    /**
     * Envoyer l'état complet du jeu au client
     * À appeler à chaque changement significatif
     */
    sendGameState() {
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
                items: this.shopActive ? getShopItems() : {}
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
```

---

## 2️⃣ `server/game-loops/solo-game-loop.js` (CRÉER CE FICHIER)

```javascript
/**
 * SoloGameLoop - Boucle de jeu pour le mode solo
 * S'exécute à chaque tick (60fps)
 */

const PlayerActions = require('../utils/PlayerActions');
const { getShopItems } = require('../../utils/shop');

class SoloGameLoop {
    constructor(soloSessions, io) {
        this.soloSessions = soloSessions;
        this.io = io;
    }
    
    /**
     * Traiter une itération de la boucle
     * À appeler à chaque tick (~16ms pour 60fps)
     */
    process() {
        for (const [playerId, session] of Object.entries(this.soloSessions)) {
            // Session valide?
            if (!session || !session.socket || !session.socket.connected) {
                delete this.soloSessions[playerId];
                continue;
            }
            
            // ===== VÉRIFIER COLLISION AVEC PIÈCE =====
            if (this.shouldCheckCollision(session)) {
                if (PlayerActions.checkCoinCollision(session.player, session.coin)) {
                    this.handleCoinCollision(session);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT COUNTDOWN =====
            if (session.countdownActive) {
                if (session.getCountdownElapsed() >= session.countdownDuration) {
                    session.countdownActive = false;
                    console.log(`✅ [SOLO] Countdown terminé pour ${playerId}`);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT SHOP =====
            if (session.shopActive) {
                if (session.getShopElapsed() >= session.shopDuration) {
                    this.closeShopAutomatically(session);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT TRANSITION =====
            if (session.inTransition) {
                if (session.getTransitionElapsed() >= session.transitionDuration) {
                    session.endTransition();
                    console.log(`✅ [SOLO] Transition terminée pour ${playerId}`);
                }
            }
            
            // ===== ENVOYER L'ÉTAT =====
            session.sendGameState();
        }
    }
    
    /**
     * Vérifier si on doit checker collision
     * (pas pendant countdown, pas pendant shop, pas en transition)
     */
    shouldCheckCollision(session) {
        return !session.countdownActive && 
               !session.shopActive && 
               !session.inTransition;
    }
    
    /**
     * Gérer collision avec la pièce
     */
    handleCoinCollision(session) {
        const currentLevel = session.currentLevel;
        console.log(`✅ [SOLO] ${session.player.skin} a complété le niveau ${currentLevel}`);
        
        // 1. Enregistrer le split time
        session.finishLevel();
        
        // 2. Vérifier si le jeu est terminé
        if (session.isGameFinished) {
            this.endGame(session);
            return;
        }
        
        // 3. Vérifier si un shop doit ouvrir
        if (this.isShopLevel(session.currentLevel)) {
            session.openShop();
            console.log(`🏪 [SOLO] Shop s'ouvrira après le niveau ${session.currentLevel - 1}`);
        }
        
        // 4. Générer le prochain niveau
        this.generateNextLevel(session);
        
        // 5. Envoyer l'état mis à jour
        session.sendGameState();
    }
    
    /**
     * Déterminer si un level doit avoir un shop après
     * Par exemple: après level 5, 10, 15, 20
     */
    isShopLevel(level) {
        return level % 5 === 0 && level < 10;
    }
    
    /**
     * Fermer le shop automatiquement (après 15s)
     */
    closeShopAutomatically(session) {
        session.closeShop();
        this.generateNextLevel(session);
        session.sendGameState();
        
        console.log(`✅ [SOLO] Shop fermé automatiquement pour ${session.playerId}`);
    }
    
    /**
     * Générer le prochain niveau
     * Crée une nouvelle map et une nouvelle pièce
     */
    generateNextLevel(session) {
        const { generateMaze, getRandomEmptyPosition } = require('../../utils/map');
        const { calculateMazeSize } = require('../utils');
        
        // Générer la map selon le niveau
        const { width, height } = calculateMazeSize(session.currentLevel, 'solo');
        session.map = generateMaze(width, height);
        session.coin = getRandomEmptyPosition(session.map);
        
        // Placer le joueur sur une position aléatoire
        const startPos = getRandomEmptyPosition(session.map);
        session.player.x = startPos.x;
        session.player.y = startPos.y;
    }
    
    /**
     * Terminer la partie
     * Sauvegarder les données en MongoDB
     */
    async endGame(session) {
        const { playerId, player, totalTime, splitTimes } = session;
        
        // ===== VALIDATION =====
        if (!session.validateSplits(splitTimes)) {
            console.error(`❌ [SOLO] Splits invalides pour ${playerId}, sauvegarde refusée`);
            session.socket.emit('gameFinished', {
                error: 'Données de jeu invalides'
            });
            
            // Nettoyer la session
            delete this.soloSessions[playerId];
            return;
        }
        
        // ===== SAUVEGARDE MONGODB =====
        try {
            // Importer les modèles
            const mongoose = require('mongoose');
            const SoloRunModel = mongoose.model('SoloRun');
            const SoloBestSplitsModel = mongoose.model('SoloBestSplits');
            
            // Créer le document de run
            const soloRun = new SoloRunModel({
                playerId,
                playerSkin: player.skin,
                mode: 'solo',
                totalTime,
                splitTimes,
                finalLevel: session.currentLevel - 1,
                personalBestTime: totalTime,
                createdAt: new Date()
            });
            
            await soloRun.save();
            console.log(`💾 [SOLO] Run sauvegardée: ${totalTime.toFixed(2)}s`);
            
            // Mettre à jour les meilleurs splits
            for (let i = 0; i < splitTimes.length; i++) {
                const level = i + 1;
                const splitTime = splitTimes[i];
                
                await SoloBestSplitsModel.updateOne(
                    { level },
                    { 
                        bestSplitTime: splitTime, 
                        playerSkin: player.skin,
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );
            }
            
            console.log(`✅ [SOLO] Données sauvegardées avec succès`);
            
            // Notifier le client
            session.socket.emit('gameFinished', {
                finalLevel: session.currentLevel - 1,
                totalTime,
                gems: player.gems,
                splits: splitTimes,
                saved: true
            });
            
        } catch (err) {
            console.error(`❌ [SOLO] Erreur sauvegarde MongoDB:`, err);
            session.socket.emit('gameFinished', { 
                error: 'Erreur sauvegarde: ' + err.message 
            });
        }
        
        // ===== NETTOYER LA SESSION =====
        delete this.soloSessions[playerId];
    }
}

module.exports = SoloGameLoop;
```

---

## 3️⃣ Modifications `server/socket-events.js` (REMPLACER LES SECTIONS)

### Section: `selectGameMode` (solo)

```javascript
if (mode === 'solo') {
    console.log(`🎮 Joueur ${socket.id} sélectionne: MODE SOLO (10 niveaux)`);
    
    // Créer une nouvelle session solo
    const SoloSession = require('./utils/SoloSession');
    const session = new SoloSession(socket.id, socket);
    
    // Initialiser le joueur
    const startPos = getRandomEmptyPosition(generateMaze(15, 15));
    session.player = initializePlayerForMode(startPos, 0, 'solo');
    
    // Débloquer aléatoirement une feature
    const unlockedFeature = generateRandomFeatureWeighted();
    session.player.purchasedFeatures[unlockedFeature] = true;
    console.log(`   ⚡ Feature débloquée: ${unlockedFeature}`);
    
    // Générer la première map
    session.map = generateMaze(15, 15);
    session.coin = getRandomEmptyPosition(session.map);
    
    // Stocker la session
    soloSessions[socket.id] = session;
    
    // Envoyer l'état initial
    session.sendGameState();
    
    console.log(`   ✅ Session solo créée`);
}
```

### Section: `movement` (solo)

```javascript
socket.on('movement', (input) => {
    const mode = playerModes[socket.id];
    if (!mode) return;
    
    let player, map;
    
    if (mode === 'solo') {
        const session = soloSessions[socket.id];
        if (!session) return;
        
        // ✅ SERVEUR DÉCIDE SI INPUTS BLOQUÉS
        const isInputsBlocked = 
            session.countdownActive ||
            session.inTransition ||
            session.shopActive;
        
        if (isInputsBlocked) {
            return; // Inputs bloqués
        }
        
        player = session.player;
        map = session.map;
    } else {
        // ... code pour classique/infini
    }
    
    // Appliquer le mouvement
    const baseSpeed = 3;
    const speedBoostIncrement = 1;
    const speedBoostLevel = Math.max(0, player.purchasedFeatures?.speedBoost || 0);
    const speed = baseSpeed + (speedBoostLevel * speedBoostIncrement);
    
    let moveX = 0;
    let moveY = 0;

    if (input.left) moveX -= speed;
    if (input.right) moveX += speed;
    if (input.up) moveY -= speed;
    if (input.down) moveY += speed;

    if (moveX !== 0 && moveY !== 0) {
        const diagonal = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX = (moveX / diagonal) * speed;
        moveY = (moveY / diagonal) * speed;
    }

    let nextX = player.x + moveX;
    let nextY = player.y + moveY;

    if (!checkWallCollision(nextX, nextY, map)) {
        player.x = nextX;
        player.y = nextY;
    } else if (moveX !== 0 && moveY !== 0) {
        if (!checkWallCollision(player.x + moveX, player.y, map)) {
            player.x += moveX;
        }
        else if (!checkWallCollision(player.x, player.y + moveY, map)) {
            player.y += moveY;
        }
    } else if (moveX !== 0) {
        if (!checkWallCollision(player.x + moveX, player.y, map)) {
            player.x += moveX;
        }
    } else if (moveY !== 0) {
        if (!checkWallCollision(player.x, player.y + moveY, map)) {
            player.y += moveY;
        }
    }

    if (input.left) player.lastDirection = 'left';
    if (input.right) player.lastDirection = 'right';
    if (input.up) player.lastDirection = 'up';
    if (input.down) player.lastDirection = 'down';

    if (player.purchasedFeatures && player.purchasedFeatures.rope) {
        const lastTrailPoint = player.trail[player.trail.length - 1];
        if (!lastTrailPoint || Math.hypot(lastTrailPoint.x - player.x, lastTrailPoint.y - player.y) >= 4) {
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 500) {
                player.trail.shift();
            }
        }
    } else {
        player.trail = [];
    }
});
```

### Section: `shopPurchase` (solo)

```javascript
socket.on('shopPurchase', (data) => {
    const session = soloSessions[socket.id];
    if (!session || !session.shopActive) {
        socket.emit('shopPurchaseFailed', { reason: 'Shop pas actif' });
        return;
    }
    
    const { itemId } = data;
    const { SHOP_ITEMS } = require('../utils/shop');
    const item = SHOP_ITEMS[itemId];
    
    // ✅ VALIDATION SERVEUR
    if (!item) {
        socket.emit('shopPurchaseFailed', { reason: 'Item invalide' });
        return;
    }
    
    if (session.player.gems < item.price) {
        socket.emit('shopPurchaseFailed', { 
            reason: 'Pas assez de gems',
            current: session.player.gems,
            required: item.price
        });
        return;
    }
    
    // ✅ ACHETER
    session.player.gems -= item.price;
    
    if (itemId === 'speedBoost') {
        session.player.purchasedFeatures[itemId] = 
            (session.player.purchasedFeatures[itemId] || 0) + 1;
    } else {
        if (session.player.purchasedFeatures[itemId]) {
            socket.emit('shopPurchaseFailed', { 
                reason: 'Item déjà acheté' 
            });
            return; // Annuler l'achat
        }
        session.player.purchasedFeatures[itemId] = true;
    }
    
    // ✅ CONFIRMER AU CLIENT
    socket.emit('shopPurchaseSuccess', {
        itemId,
        item: {
            ...item,
            id: itemId
        },
        gemsLeft: session.player.gems
    });
    
    // Envoyer l'état mis à jour
    session.sendGameState();
    
    console.log(`✅ [SOLO] ${session.player.skin} a acheté ${item.name} | ${session.player.gems}💎 restants`);
});
```

### Section: `validateShop` (solo)

```javascript
socket.on('validateShop', () => {
    const session = soloSessions[socket.id];
    if (!session || !session.shopActive) {
        return;
    }
    
    session.closeShop();
    
    // Générer le prochain niveau
    const SoloGameLoop = require('./game-loops/solo-game-loop');
    const gameLoop = new SoloGameLoop(soloSessions, io);
    gameLoop.generateNextLevel(session);
    
    // Envoyer l'état
    session.sendGameState();
    
    console.log(`✅ [SOLO] ${session.player.skin} a validé et quitté le shop`);
});
```

### Section: `disconnect` (solo)

```javascript
socket.on('disconnect', () => {
    const mode = playerModes[socket.id];
    
    if (mode === 'solo') {
        delete soloSessions[socket.id];
        console.log(`🎯 Joueur ${socket.id} déconnecté du mode solo`);
    } else if (mode && lobbies[mode]) {
        // ... code pour classique/infini
    }
    delete playerModes[socket.id];
});
```

---

## 4️⃣ Modifications `server/index.js` (AJOUTER)

```javascript
// Au début du fichier, avec les autres imports
const SoloGameLoop = require('./game-loops/solo-game-loop');

// Après la création du serveur et de io
const soloGameLoop = new SoloGameLoop(soloSessions, io);

// Lancer la boucle de jeu solo
setInterval(() => {
    soloGameLoop.process();
}, 16); // ~60 FPS (1000ms / 60 = 16.66ms)

console.log(`✅ SoloGameLoop started (60fps)`);
```

---

## 5️⃣ `Public/solo-game-state.js` (CRÉER CE FICHIER)

```javascript
/**
 * solo-game-state.js
 * État du jeu solo - LECTURE SEULE, reçu du serveur
 */

let soloGameState = {
    // Joueur
    player: null,
    
    // Niveaux
    currentLevel: 1,
    maxLevel: 10,
    isGameFinished: false,
    
    // Timing
    runTotalTime: 0,        // Envoyé par serveur
    currentLevelTime: 0,    // Envoyé par serveur
    splitTimes: [],         // Envoyé par serveur
    
    // UI states
    countdown: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0  // Calculé côté client pour le rendu
    },
    
    shop: {
        active: false,
        duration: 15000,
        startTime: null,
        items: {},
        elapsed: 0  // Calculé côté client
    },
    
    transition: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0  // Calculé côté client
    },
    
    // Map
    map: [],
    coin: null
};

// Recevoir l'état du serveur
socket.on('soloGameState', (newState) => {
    // ✅ METTRE À JOUR L'ÉTAT DEPUIS LE SERVEUR
    soloGameState = { ...soloGameState, ...newState };
    
    // ✅ CALCULER LES TIMINGS D'AFFICHAGE CÔTÉ CLIENT SI BESOIN
    // (Pour le rendu seulement, pas pour la logique)
    
    if (soloGameState.countdown.startTime && soloGameState.countdown.active) {
        soloGameState.countdown.elapsed = Date.now() - soloGameState.countdown.startTime;
    }
    
    if (soloGameState.shop.startTime && soloGameState.shop.active) {
        soloGameState.shop.elapsed = Date.now() - soloGameState.shop.startTime;
    }
    
    if (soloGameState.transition.startTime && soloGameState.transition.active) {
        soloGameState.transition.elapsed = Date.now() - soloGameState.transition.startTime;
    }
    
    console.log(`📥 [SOLO] État reçu du serveur:`, soloGameState);
});
```

---

## 📝 Notes Importantes

✅ **Copier-coller prêt** : Tout le code peut être copié directement  
✅ **À adapter** : Les imports (paths, modèles mongoose, etc.)  
✅ **À tester** : Après chaque bloc, lancer `npm test`  

---

## 🔗 Chaîne d'exécution

1. Créer `server/utils/SoloSession.js`
2. Créer `server/game-loops/solo-game-loop.js`
3. Modifier `server/socket-events.js` (remplacer les sections)
4. Modifier `server/index.js` (ajouter SoloGameLoop)
5. Créer `Public/solo-game-state.js`
6. Modifier `Public/socket-events.js` (simplifier pour solo)
7. Lancer `npm test` ✅
8. Lancer `npm start` et tester manuellement

