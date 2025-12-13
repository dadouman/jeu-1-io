# 🎯 ANALYSE COMPLÈTE DU MODE SOLO - Problèmes & Plan de Refactoring

## 📋 RÉSUMÉ EXÉCUTIF

Le mode solo a une architecture **désorganisée** avec :
- 🔴 Logique mixte côté client/serveur
- 🔴 Gestion du temps/état incohérente
- 🔴 Responsabilités mal séparées
- 🔴 Code répétitif et fragile

**Objectif** : Refactoriser pour avoir une **source de vérité unique au serveur**.

---

## 🔴 PROBLÈMES IDENTIFIÉS

### 1️⃣ ARCHITECTURE - Responsabilités mal séparées

#### ❌ Client gère de la logique critique
```javascript
// Public/socket-events.js
socket.on('levelUpdate', (newLevel) => {
    // ❌ Client recalcule les transitions, les timers, etc.
    isInTransition = true;
    transitionStartTime = Date.now();
    levelUpTime = levelStartTime ? (Date.now() - levelStartTime) / 1000 : 0;
    // ❌ Client gère soloLastGemTime, soloLastGemLevel
});
```

#### ❌ Serveur envoie des données fragmentées
```javascript
// server/socket-events.js
socket.emit('mapData', session.map);     // Nouveau niveau
socket.emit('levelUpdate', session.currentLevel);  // Info du niveau
socket.emit('shopOpen', { ... });        // Shop
// ❌ État incohérent, pas de "gameState" unique
```

#### ✅ À faire
- **Serveur = source de vérité unique** pour tout l'état du jeu
- **Client = rendu + inputs uniquement**
- Envoyer l'état complet du jeu à chaque changement significatif

---

### 2️⃣ TIMING & COUNTDOWN - Gestion confuse

#### ❌ Countdown en double
```javascript
// game-state.js
let soloStartCountdownActive = false;
let soloStartCountdownStartTime = null;
let cinematicCountdownActive = false;  // ❌ QUOI ? Deux countdowns ?

// Public/countdown-cinema.js
let cinematicCountdownActive = false;
let cinematicCountdownStartTime = null;
```

#### ❌ Timer du niveau pause/reprend mal
```javascript
// socket-events.js (CLIENT)
socket.on('shopOpen', (data) => {
    levelStartTime = null;  // ❌ Pause le timer
});

socket.on('shopClosed', (data) => {
    levelStartTime = Date.now();  // ❌ Repart du 0
    // ❌ Le temps du shop est PERDU
});
```

#### ❌ Transitions mal synchronisées
```javascript
// Côté client, la transition dure 3 secondes
const TRANSITION_DURATION = 3000;
// ❌ Le serveur ne sait pas qu'il y a une transition
// ❌ Les inputs arrivent pendant que le client affiche une transition
```

#### ✅ À faire
- **UNE SEULE source de vérité pour le countdown** (au serveur)
- **Serveur gère TOUT le timing** : countdown, niveaux, shop, transitions
- **Client affiche juste** le countdown/transition reçu du serveur
- Timer du niveau : **continuer côté serveur** même pendant le shop

---

### 3️⃣ GESTION DU SHOP - State fragile

#### ❌ Shop créé côté serveur mais gérée côté client
```javascript
// server/socket-events.js
socket.on('movement', (input) => {
    if (mode === 'solo') {
        if (session.countdownActive !== false) {
            return;  // ❌ Bloque les inputs pendant countdown
        }
    }
});

// ❌ Le serveur ne sait PAS que le shop est ouvert
// ❌ Il continue à calculer les mouvements
// ❌ Le client décide seul si le shop est actif
```

#### ❌ Accès au shop dérégulé
```javascript
// Public/socket-events.js
socket.on('shopOpen', (data) => {
    isShopOpen = true;
    shopTimerStart = Date.now();
    levelStartTime = null;  // ❌ Pause timer
    // ❌ 15 secondes = dur-codé côté client
});

socket.on('shopClosed', (data) => {
    isShopOpen = false;
    levelStartTime = Date.now();  // ❌ Repart from 0
});
```

#### ✅ À faire
- **Serveur gère la durée et fin du shop** (pas le client)
- **Serveur pause les timers** quand shop ouvert
- **Serveur envoie l'état complet du shop** (items, durée, fin prévue)
- **Client affiche juste** le shop sans gérer le timer

---

### 4️⃣ STATE DES SPLITS & TIMING - Incohérent

#### ❌ Splits calculés côté client
```javascript
// Public/solo-hud-renderer.js
function renderSoloDeltaLine(ctx, canvas, level, currentLevelTime, ...) {
    const currentLevelSplitTime = soloSplitTimes[level - 1];
    // ❌ Où vient soloSplitTimes ? Côté client !
    // ❌ Client recalcule le temps du niveau
}
```

#### ❌ currentLevelTime calculé côté client
```javascript
// Public/game-loop.js
if (currentGameMode === 'solo' && soloSessionStartTime) {
    soloRunTotalTime = (Date.now() - soloSessionStartTime) / 1000;
    if (level > 1) {
        soloCurrentLevelTime = (Date.now() - levelStartTime) / 1000;
    }
    // ❌ Tous les calculs de temps viennent du client
    // ❌ Aucune source fiable
}
```

#### ❌ Split time sauvegardé sans validation serveur
```javascript
// server/socket-events.js
socket.on('saveSoloResults', async (data) => {
    const { totalTime, splitTimes, ... } = data;
    // ❌ On fait confiance au client pour les splits ?!
    
    // Validation basique seulement
    if (splitTime < 0.5) {
        console.warn(`Split suspect...`);
    }
});
```

#### ✅ À faire
- **Serveur calcule ET enregistre les split times** à chaque level
- **Client affiche juste** les split times reçus du serveur
- **Validation serveur** des splits avant sauvegarde MongoDB
- **Pas de recalcul côté client** du temps

---

### 5️⃣ ÉTAT GLOBAL - Fragmentation

#### ❌ État éclaté partout
```javascript
// game-state.js - 50+ variables globales pour solo
let soloTotalTime = 0;
let soloSplitTimes = [];
let isSoloGameFinished = false;
let soloFinishedTime = null;
let soloSessionStartTime = null;
let soloCurrentLevelTime = 0;
let soloPersonalBestTime = null;
let soloPersonalBestSplits = {};
let soloLeaderboardBest = null;
let soloBestSplits = {};
let soloShowPersonalDelta = true;
let soloInactiveTime = 0;
let soloShopStartTime = null;
let soloTransitionStartTime = null;
let soloLastGemTime = null;
let soloLastGemLevel = null;

// ❌ Et encore :
let inputsBlocked = false;
let isInTransition = false;
let transitionStartTime = null;
// ❌ Qui appartient à solo ? Qui est commun ?
```

#### ❌ Serveur aussi fragmente
```javascript
// server/socket-events.js
soloSessions[socket.id] = {
    currentLevel: 1,
    map: generateMaze(15, 15),
    coin: getRandomEmptyPosition(...),
    player: player,
    startTime: Date.now(),
    levelStartTime: Date.now(),
    splitTimes: [],
    totalTime: 0,
    currentShopLevel: null,
    countdownActive: true,
    countdownStartTime: Date.now()
};
// ❌ Pas d'objet SoloSession cohérent
// ❌ Juste un dictionnaire mal structuré
```

#### ✅ À faire
- **Créer une classe `SoloSession`** au serveur
- **Créer un objet `soloGameState`** au client (lectura-only, reçu du serveur)
- **Chaque propriété claire** : qui gère quoi

---

### 6️⃣ TRANSITIONS & INPUTS - Bloqage incohérent

#### ❌ Inputs bloqués par countdown (client)
```javascript
// Public/socket-events.js - dans startCountdown()
inputsBlocked = true;

// Puis dans public/keyboard-input.js
if (inputsBlocked) return;

// ❌ Serveur n'en sait rien, accept les mouvements
```

#### ❌ Inputs bloqués par transition (client)
```javascript
// game-loop.js
if (isInTransition) {
    // Ne pas traiter les inputs
}
// ❌ Serveur continue à accepter les mouvements
```

#### ❌ Le serveur aussi essaye de bloquer
```javascript
// server/socket-events.js
if (session.countdownActive !== false) {
    return;  // Bloquer mouvement
}
```

#### ✅ À faire
- **Serveur seul décide** si inputs bloqués
- **Serveur envoie l'état** : `{inputsBlocked: true, reason: 'countdown'}`
- **Client affiche** l'UI et bloque l'affichage des inputs
- **Client ignore les inputs** en arrière-plan

---

### 7️⃣ ACHAT SHOP & GEMS - Validation manquante

#### ❌ Pas de vérification serveur cohérente
```javascript
// server/socket-events.js - part 1: création
const unlockedFeature = generateRandomFeatureWeighted();
player.purchasedFeatures[unlockedFeature] = true;

// Part 2: achat
socket.on('shopPurchase', (data) => {
    const item = shopItems[data.itemId];
    // ❌ Où sont définies les shopItems du serveur ?
    // ❌ Pas de vérification que l'item existe vraiment
});
```

#### ❌ Pas d'idempotence sur les achats
```javascript
// Si le client envoie 2x le même achat rapidement
// Le serveur acceptera peut-être 2x sans vérification
```

#### ✅ À faire
- **Serveur valide TOUT** avant d'accepter un achat
- **Vérifier gems disponibles**
- **Vérifier item existe et n'est pas déjà acheté**
- **Mettre à jour player.purchasedFeatures AU SERVEUR**
- **Client reçoit la confirmation** (gems restants, items achetés)

---

## ✅ PLAN DE REFACTORING

### Phase 1 : Architecture Serveur (Fondations)

#### 1.1 Créer la classe `SoloSession`
**File**: `server/utils/SoloSession.js`

```javascript
class SoloSession {
    constructor(playerId, socket) {
        this.playerId = playerId;
        this.socket = socket;
        
        // Joueur
        this.player = null;
        
        // État du jeu
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.isGameFinished = false;
        
        // Timing
        this.sessionStartTime = Date.now();
        this.levelStartTime = Date.now();
        this.levelPauseTime = null;
        this.totalPausedTime = 0;
        
        // Shop
        this.shopActive = false;
        this.shopStartTime = null;
        this.shopDuration = 15000;
        
        // Countdown
        this.countdownActive = true;
        this.countdownStartTime = Date.now();
        
        // Transitions
        this.inTransition = false;
        this.transitionStartTime = null;
        this.transitionDuration = 3000;
        
        // Splits & timing
        this.splitTimes = [];
        this.totalTime = 0;
        
        // Map & coin
        this.map = [];
        this.coin = null;
    }
    
    // Getters
    getRunTotalTime() {
        return (Date.now() - this.sessionStartTime - this.totalPausedTime) / 1000;
    }
    
    getCurrentLevelTime() {
        if (this.levelPauseTime) return 0; // Shop ouvert
        return (Date.now() - this.levelStartTime - this.totalPausedTime) / 1000;
    }
    
    // Setters
    recordSplitTime(time) {
        this.splitTimes.push(time);
    }
    
    openShop() {
        this.shopActive = true;
        this.shopStartTime = Date.now();
        this.levelPauseTime = Date.now();
    }
    
    closeShop() {
        if (!this.shopActive) return;
        
        const shopDuration = Date.now() - this.shopStartTime;
        this.totalPausedTime += shopDuration;
        this.levelPauseTime = null;
        this.shopActive = false;
        this.levelStartTime = Date.now();
    }
    
    finishLevel() {
        const splitTime = this.getCurrentLevelTime();
        this.recordSplitTime(splitTime);
        
        this.currentLevel++;
        if (this.currentLevel > this.maxLevel) {
            this.isGameFinished = true;
            this.totalTime = this.getRunTotalTime();
        }
        
        this.levelStartTime = Date.now();
        this.levelPauseTime = null;
    }
    
    startTransition() {
        this.inTransition = true;
        this.transitionStartTime = Date.now();
    }
    
    endTransition() {
        this.inTransition = false;
        this.transitionStartTime = null;
    }
    
    // Envoyer l'état complet au client
    sendGameState() {
        this.socket.emit('soloGameState', {
            // Joueur
            player: this.player,
            
            // État
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            isGameFinished: this.isGameFinished,
            
            // Timings
            runTotalTime: this.getRunTotalTime(),
            currentLevelTime: this.getCurrentLevelTime(),
            splitTimes: this.splitTimes,
            
            // UI
            countdown: {
                active: this.countdownActive,
                duration: 3000,
                startTime: this.countdownStartTime
            },
            
            shop: {
                active: this.shopActive,
                duration: this.shopDuration,
                items: this.shopActive ? getShopItems() : {}
            },
            
            transition: {
                active: this.inTransition,
                duration: this.transitionDuration,
                startTime: this.transitionStartTime
            },
            
            // Map
            map: this.map,
            coin: this.coin
        });
    }
}

module.exports = SoloSession;
```

#### 1.2 Créer `SoloGameLoop`
**File**: `server/game-loops/solo-game-loop.js`

- Gère les collisions avec la pièce
- Avance les niveaux
- Ouvre les shops
- Sauvegarde les splits
- Envoie l'état régulièrement

#### 1.3 Refactoriser `socket-events.js` (Solo)
- Séparer la logique solo dans `server/solo-socket-events.js`
- Utiliser `SoloSession` pour toute la logique
- Valider TOUT côté serveur

---

### Phase 2 : Architecture Client (Simplification)

#### 2.1 Créer `soloGameState` (read-only)
**File**: `Public/solo-game-state.js`

```javascript
let soloGameState = {
    player: null,
    currentLevel: 1,
    maxLevel: 10,
    isGameFinished: false,
    
    runTotalTime: 0,
    currentLevelTime: 0,
    splitTimes: [],
    
    countdown: {
        active: false,
        duration: 0,
        startTime: null
    },
    
    shop: {
        active: false,
        duration: 0,
        items: {}
    },
    
    transition: {
        active: false,
        duration: 0,
        startTime: null
    },
    
    map: [],
    coin: null
};

// Recevoir l'état du serveur
socket.on('soloGameState', (state) => {
    soloGameState = { ...soloGameState, ...state };
});
```

#### 2.2 Simplifier le rendu
- `solo-hud-renderer.js` : afficher l'état reçu du serveur
- `countdown-cinema.js` : afficher countdown reçu du serveur (ou jouer une animation)
- `transition-renderer.js` : afficher transition reçue du serveur

#### 2.3 Simplifier les inputs
- `keyboard-input.js` : émettre les inputs au serveur
- Pas de logique côté client
- Serveur décide si inputs bloqués

---

### Phase 3 : Données & Sauvegarde

#### 3.1 Validation serveur des splits
Avant sauvegarde MongoDB :
```javascript
validateSplits(splits) {
    // Chaque split doit être > 0.5s
    // Aucun split > 60s
    // Somme = totalTime ± 5%
    return splits.every(s => s > 0.5 && s < 60);
}
```

#### 3.2 Sauvegarde atomique
- Enregistrer `totalTime` + `splitTimes` ensemble
- Pas de sauvegarde partielle

---

### Phase 4 : Tests

#### 4.1 Tests unitaires `SoloSession`
```javascript
describe('SoloSession', () => {
    test('calculate total time correctly', () => { ... });
    test('pause and resume level time', () => { ... });
    test('open and close shop', () => { ... });
    test('finish game at level 10', () => { ... });
});
```

#### 4.2 Tests d'intégration
- Client → Serveur → Client
- Acheter un item
- Finir un niveau
- Finir la partie

---

## 📊 TABLEAU COMPARATIF

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| **Source de vérité** | Client + Serveur (conflit) | Serveur uniquement |
| **Timing** | Client recalcule | Serveur envoie |
| **Shop** | Client gère | Serveur gère, client affiche |
| **Countdown** | Double (cinématique + solo) | Un seul au serveur |
| **Transitions** | Client dur-code 3s | Serveur envoie la durée |
| **Splits** | Client calcule | Serveur enregistre |
| **Inputs bloqués** | Client décide | Serveur décide |
| **State** | 50+ variables globales | 1 objet `soloGameState` |
| **Validation achat** | Minimale | Complète serveur |
| **Sauvegarde** | Client envoie, serveur fait confiance | Serveur valide & sauvegarde |

---

## 🎯 BÉNÉFICES

✅ **Robustesse** : Pas de triche possible  
✅ **Maintenabilité** : Code localisé (serveur pour logique)  
✅ **Performance** : Client allégé  
✅ **Débogage** : Source unique de vérité  
✅ **Scalabilité** : Prêt pour multiplayer temps réel  

---

## 📅 TIMELINE ESTIMÉE

- **Phase 1** : 2h (classe SoloSession + game loop)
- **Phase 2** : 1h (simplifier client)
- **Phase 3** : 30min (validation & sauvegarde)
- **Phase 4** : 1h (tests + validation manuelle)

**Total** : ~4.5h de travail

