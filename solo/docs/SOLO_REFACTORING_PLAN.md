# 🚀 PLAN D'IMPLÉMENTATION DÉTAILLÉ - Mode Solo Refactoring

## 📌 OBJECTIF GLOBAL

Transformer le mode solo d'une architecture **client-serveur fragmentée** à une architecture **serveur-autoritaire** avec un client qui ne fait que du rendu.

---

## 🔧 PHASE 1 : SERVER - FONDATIONS

### 1.1 Créer la classe `SoloSession`

**File**: `server/utils/SoloSession.js` (NOUVEAU)

Responsabilités :
- Stocker tout l'état d'une partie solo
- Gérer les timers (total, par niveau, pause)
- Gérer le shop (ouverture, fermeture, timing)
- Gérer les transitions
- Gérer le countdown
- Calculer et enregistrer les splits
- Envoyer l'état au client

**Structure complète** :
```javascript
class SoloSession {
    // État du joueur
    playerId, socket, player
    
    // Niveaux
    currentLevel, maxLevel, isGameFinished
    
    // Timing
    sessionStartTime, levelStartTime, levelPauseTime, totalPausedTime
    
    // UI
    countdownActive, countdownStartTime
    shopActive, shopStartTime, shopDuration
    inTransition, transitionStartTime, transitionDuration
    
    // Données
    splitTimes[], totalTime, map[], coin
    
    // Méthodes
    getRunTotalTime()
    getCurrentLevelTime()
    recordSplitTime(time)
    finishLevel()
    openShop()
    closeShop()
    startTransition()
    endTransition()
    sendGameState()
    finishGame()
}
```

---

### 1.2 Créer `SoloGameLoop`

**File**: `server/game-loops/solo-game-loop.js` (NOUVEAU)

Responsabilités :
- Vérifier collision coin à chaque tick
- Appeler `session.finishLevel()` quand collision
- Ouvrir le shop si nécessaire
- Vérifier si jeu est fini
- Sauvegarder les données si fini

**Pseudo-code** :
```javascript
class SoloGameLoop {
    process(soloSessions) {
        for (const [playerId, session] of Object.entries(soloSessions)) {
            // 1. Vérifier collision
            if (checkCoinCollision(session.player, session.coin)) {
                session.finishLevel();
                
                // 2. Vérifier si jeu fini
                if (session.isGameFinished) {
                    this.endGame(session);
                } 
                // 3. Vérifier si shop doit ouvrir
                else if (isShopLevel(session.currentLevel)) {
                    session.openShop();
                    session.sendGameState();
                }
                // 4. Sinon, nouveau niveau
                else {
                    session.generateNextLevel();
                    session.sendGameState();
                }
            }
            
            // 5. Envoyer l'état toutes les 100ms
            session.sendGameState();
        }
    }
}
```

---

### 1.3 Refactoriser `socket-events.js` - Partie Solo

**File**: `server/socket-events.js` (MODIFICATION)

#### Événement: `selectGameMode` (solo)

```javascript
if (mode === 'solo') {
    const session = new SoloSession(socket.id, socket);
    session.player = initializePlayerForMode(...);
    session.map = generateMaze(15, 15);
    session.coin = getRandomEmptyPosition(session.map);
    
    // Débloquer une feature aléatoire
    const feature = generateRandomFeatureWeighted();
    session.player.purchasedFeatures[feature] = true;
    
    soloSessions[socket.id] = session;
    
    // Envoyer l'état initial
    session.sendGameState();
    
    console.log(`✅ Session solo créée pour ${socket.id}`);
}
```

#### Événement: `movement` (solo)

```javascript
socket.on('movement', (input) => {
    const session = soloSessions[socket.id];
    if (!session) return;
    
    // 🔴 SERVEUR DÉCIDE si inputs bloqués
    // (countdown, transition, shop ouvert, etc.)
    
    const isInputsBlocked = 
        session.countdownActive ||
        session.inTransition ||
        session.shopActive;
    
    if (isInputsBlocked) return;
    
    // Appliquer le mouvement
    applyMovement(session.player, input, session.map);
});
```

#### Événement: `validateShop` (solo)

```javascript
socket.on('validateShop', () => {
    const session = soloSessions[socket.id];
    if (!session || !session.shopActive) return;
    
    session.closeShop();
    session.generateNextLevel();
    session.sendGameState();
    
    console.log(`✅ Shop fermé pour ${socket.id}`);
});
```

#### Événement: `shopPurchase` (solo)

```javascript
socket.on('shopPurchase', (data) => {
    const session = soloSessions[socket.id];
    if (!session || !session.shopActive) return;
    
    const { itemId } = data;
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
        session.player.purchasedFeatures[itemId] = true;
    }
    
    // ✅ CONFIRMER AU CLIENT
    socket.emit('shopPurchaseSuccess', {
        itemId,
        item,
        gemsLeft: session.player.gems
    });
    
    session.sendGameState();
    
    console.log(`✅ ${session.player.skin} a acheté ${item.name}`);
});
```

#### Événement: `saveSoloResults` (déplacer)

```javascript
// ❌ NE PLUS ÉMETTRE DEPUIS CLIENT
// À la place, le serveur sauvegarde automatiquement quand:
// session.isGameFinished === true
```

---

### 1.4 Intégrer `SoloGameLoop` au serveur principal

**File**: `server/index.js` (MODIFICATION)

```javascript
const SoloGameLoop = require('./game-loops/solo-game-loop');

const soloGameLoop = new SoloGameLoop(soloSessions, io);

// Boucle de jeu principale
setInterval(() => {
    soloGameLoop.process(soloSessions);
}, 16); // ~60 FPS
```

---

## 🎨 PHASE 2 : CLIENT - SIMPLIFICATION

### 2.1 Créer `solo-game-state.js`

**File**: `Public/solo-game-state.js` (NOUVEAU)

```javascript
// État du jeu solo - LECTURE SEULE, reçu du serveur

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
    // Mettre à jour l'état
    soloGameState = { ...soloGameState, ...newState };
    
    // Calculer les timings d'affichage côté client si nécessaire
    if (soloGameState.countdown.startTime) {
        soloGameState.countdown.elapsed = Date.now() - soloGameState.countdown.startTime;
    }
    if (soloGameState.shop.startTime) {
        soloGameState.shop.elapsed = Date.now() - soloGameState.shop.startTime;
    }
    if (soloGameState.transition.startTime) {
        soloGameState.transition.elapsed = Date.now() - soloGameState.transition.startTime;
    }
});
```

### 2.2 Refactoriser `socket-events.js` (client)

**File**: `Public/socket-events.js` (MODIFICATION)

```javascript
// ❌ SUPPRIMER TOUTE LA LOGIQUE DE CALCUL DE TIMING

// ✅ GARDER:

socket.on('gameModSelected', (data) => {
    if (data.mode === 'solo') {
        currentGameMode = 'solo';
    }
});

// Charger les meilleurs splits pour affichage du delta
socket.on('soloBestSplits', (data) => {
    soloBestSplits = data.splits;
});

socket.on('soloLeaderboard', (data) => {
    // Afficher le leaderboard
});

// ❌ SUPPRIMER:
// - levelUpdate (pas besoin, l'état est dans soloGameState)
// - mapData (pas besoin, l'état est dans soloGameState)
// - shopOpen/shopClosed (pas besoin, l'état est dans soloGameState)
// - requestSoloBestSplits (pas besoin)
// - tout calcul de timing
```

### 2.3 Refactoriser `game-loop.js` (client)

**File**: `Public/game-loop.js` (MODIFICATION)

```javascript
function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    // ✅ AFFICHER L'ÉTAT REÇU DU SERVEUR
    // Plus de recalcul côté client
    
    if (currentGameMode === 'solo') {
        // Utiliser soloGameState pour le rendu
        renderSolo(ctx, canvas, soloGameState);
    } else {
        // ... rendu autres modes
    }
}
```

### 2.4 Refactoriser renderers solo

**File**: `Public/solo-hud-renderer.js` (MODIFICATION)

```javascript
function renderSoloHUD(ctx, canvas, soloGameState) {
    // ✅ AFFICHER JUSTE L'ÉTAT REÇU
    
    // Temps total
    const timeFormatted = formatTime(soloGameState.runTotalTime);
    ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 220);
    
    // Delta du level actuel
    renderSoloDeltaLine(ctx, canvas, soloGameState);
    
    // Niveau
    ctx.fillText(
        `Niveau ${soloGameState.currentLevel} / ${soloGameState.maxLevel}`,
        canvas.width / 2,
        canvas.height / 2 + 295
    );
}

function renderSoloDeltaLine(ctx, canvas, soloGameState) {
    const level = soloGameState.currentLevel;
    const currentLevelTime = soloGameState.currentLevelTime;
    const splitTimes = soloGameState.splitTimes;
    const isFinished = soloGameState.isGameFinished;
    
    // Afficher le delta comme avant, mais avec les données du serveur
    // Pas de recalcul
}
```

**File**: `Public/countdown-cinema.js` (MODIFICATION)

```javascript
// ✅ AFFICHER LE COUNTDOWN REÇU DU SERVEUR

function renderCountdown(ctx, canvas, soloGameState) {
    if (!soloGameState.countdown.active) return;
    
    const elapsed = soloGameState.countdown.elapsed;
    const remaining = soloGameState.countdown.duration - elapsed;
    
    const countdownNumber = Math.max(0, Math.ceil(remaining / 1000));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(countdownNumber, canvas.width / 2, canvas.height / 2);
}
```

### 2.5 Inputs (keyboard-input.js)

**File**: `Public/keyboard-input.js` (MODIFICATION)

```javascript
// ✅ JUSTE ÉMETTRE LES INPUTS, PAS DE LOGIQUE

document.addEventListener('keydown', (e) => {
    // Déterminer la direction
    const input = { ... };
    
    // Émettre au serveur
    socket.emit('movement', input);
    
    // ✅ NE PAS:
    // - Bloquer les inputs côté client
    // - Calculer les timers
    // - Gérer la transition
});
```

---

## 💾 PHASE 3 : DONNÉES & SAUVEGARDE

### 3.1 Validation des splits au serveur

**File**: `server/utils/SoloSession.js` (MODIFICATION)

```javascript
validateSplits(splits) {
    if (!Array.isArray(splits) || splits.length === 0) {
        return false;
    }
    
    // Chaque split doit être > 0.5s (minimum physiquement possible)
    if (!splits.every(s => s > 0.5)) {
        console.warn(`⚠️ Split trop bas détecté: ${splits.filter(s => s <= 0.5)}`);
        return false;
    }
    
    // Chaque split doit être < 60s (limit raisonnable)
    if (!splits.every(s => s < 60)) {
        console.warn(`⚠️ Split trop haut détecté: ${splits.filter(s => s >= 60)}`);
        return false;
    }
    
    // La somme des splits doit être proche du temps total ± 5%
    const sumSplits = splits.reduce((a, b) => a + b, 0);
    const tolerance = this.totalTime * 0.05;
    
    if (Math.abs(sumSplits - this.totalTime) > tolerance) {
        console.warn(`⚠️ Somme des splits (${sumSplits}s) ≠ temps total (${this.totalTime}s)`);
        return false;
    }
    
    return true;
}
```

### 3.2 Sauvegarde atomique au serveur

**File**: `server/game-loops/solo-game-loop.js` (MODIFICATION)

```javascript
async endGame(session) {
    const { playerId, player, totalTime, splitTimes } = session;
    
    // ✅ VALIDATION AVANT SAUVEGARDE
    if (!session.validateSplits(splitTimes)) {
        console.error(`❌ Splits invalides pour ${playerId}, sauvegarde refusée`);
        session.socket.emit('gameFinished', {
            error: 'Données de jeu invalides'
        });
        return;
    }
    
    // ✅ SAUVEGARDE ATOMIQUE
    try {
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
        
        // ✅ METTRE À JOUR LES MEILLEURS SPLITS
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
        
        console.log(`✅ [SOLO] Données sauvegardées - ${totalTime.toFixed(2)}s`);
        
        // Notifier le client que c'est sauvegardé
        session.socket.emit('gameFinished', {
            finalLevel: session.currentLevel - 1,
            totalTime,
            gems: player.gems,
            splits: splitTimes,
            saved: true
        });
        
    } catch (err) {
        console.error(`❌ Erreur sauvegarde solo:`, err);
        session.socket.emit('gameFinished', { error: err.message });
    }
    
    // Nettoyer la session
    delete soloSessions[playerId];
}
```

---

## ✅ PHASE 4 : TESTS

### 4.1 Tests unitaires `SoloSession`

**File**: `tests/SoloSession.test.js` (NOUVEAU)

```javascript
describe('SoloSession', () => {
    let session;
    
    beforeEach(() => {
        const mockSocket = { emit: jest.fn() };
        session = new SoloSession('player1', mockSocket);
        session.player = createMockPlayer();
    });
    
    test('should calculate run total time', () => {
        jest.useFakeTimers();
        jest.advanceTimersByTime(5000);
        
        const time = session.getRunTotalTime();
        expect(time).toBeCloseTo(5, 1);
        
        jest.useRealTimers();
    });
    
    test('should record split times', () => {
        session.recordSplitTime(10.5);
        session.recordSplitTime(12.3);
        
        expect(session.splitTimes).toEqual([10.5, 12.3]);
    });
    
    test('should open shop and pause level timer', () => {
        session.openShop();
        expect(session.shopActive).toBe(true);
        expect(session.levelPauseTime).not.toBeNull();
    });
    
    test('should close shop and resume level timer', () => {
        session.openShop();
        jest.advanceTimersByTime(5000);
        session.closeShop();
        
        expect(session.shopActive).toBe(false);
        expect(session.totalPausedTime).toBeGreaterThan(4000);
    });
    
    test('should finish level at level 10', () => {
        session.currentLevel = 9;
        session.finishLevel();
        
        expect(session.currentLevel).toBe(10);
        expect(session.isGameFinished).toBe(false);
        
        session.finishLevel();
        
        expect(session.currentLevel).toBe(11); // Dépassé le max
        expect(session.isGameFinished).toBe(true);
    });
    
    test('should validate splits correctly', () => {
        // Splits valides
        expect(session.validateSplits([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]))
            .toBe(true);
        
        // Split trop bas
        expect(session.validateSplits([0.3, 5, 5, 5, 5, 5, 5, 5, 5, 5]))
            .toBe(false);
        
        // Split trop haut
        expect(session.validateSplits([100, 5, 5, 5, 5, 5, 5, 5, 5, 5]))
            .toBe(false);
    });
    
    test('should send game state to socket', () => {
        session.socket.emit = jest.fn();
        session.sendGameState();
        
        expect(session.socket.emit).toHaveBeenCalledWith(
            'soloGameState',
            expect.objectContaining({
                currentLevel: 1,
                maxLevel: 10,
                countdown: expect.any(Object),
                shop: expect.any(Object),
                transition: expect.any(Object)
            })
        );
    });
});
```

### 4.2 Tests d'intégration

**File**: `tests/solo-integration.test.js` (NOUVEAU)

```javascript
describe('Solo Mode Integration', () => {
    let io, clientSocket, server;
    
    beforeAll((done) => {
        // Lancer le serveur et établir la connexion
        done();
    });
    
    afterAll(() => {
        // Nettoyer
    });
    
    test('should create solo session on mode selection', (done) => {
        clientSocket.emit('selectGameMode', { mode: 'solo' });
        
        clientSocket.on('soloGameState', (state) => {
            expect(state.currentLevel).toBe(1);
            expect(state.maxLevel).toBe(10);
            expect(state.countdown.active).toBe(true);
            done();
        });
    });
    
    test('should prevent movement during countdown', (done) => {
        clientSocket.emit('selectGameMode', { mode: 'solo' });
        
        // Essayer de bouger pendant countdown
        clientSocket.emit('movement', { left: true });
        
        // Attendre et vérifier que la position n'a pas changé
        setTimeout(() => {
            clientSocket.on('soloGameState', (state) => {
                // Player n'a pas bougé
                expect(state.player.x).toBe(INITIAL_X);
                done();
            });
        }, 100);
    });
    
    test('should allow movement after countdown', (done) => {
        clientSocket.emit('selectGameMode', { mode: 'solo' });
        
        // Attendre 3.5 secondes (countdown + buffer)
        setTimeout(() => {
            clientSocket.emit('movement', { right: true });
            
            clientSocket.on('soloGameState', (state) => {
                expect(state.player.x).toBeGreaterThan(INITIAL_X);
                done();
            });
        }, 3500);
    });
    
    test('should finish game at level 10', (done) => {
        clientSocket.emit('selectGameMode', { mode: 'solo' });
        
        // Simuler 10 collisions de coin
        for (let i = 0; i < 10; i++) {
            simulateCoinCollision();
        }
        
        clientSocket.on('soloGameState', (state) => {
            if (state.isGameFinished) {
                expect(state.currentLevel).toBe(11); // Dépassé le max
                expect(state.splitTimes.length).toBe(10);
                done();
            }
        });
    });
    
    test('should save results to MongoDB', (done) => {
        // ... complèter une partie ...
        
        // Vérifier que la sauvegarde est dans MongoDB
        SoloRunModel.findOne({ playerId: clientSocket.id }).then(doc => {
            expect(doc).not.toBeNull();
            expect(doc.totalTime).toBeGreaterThan(0);
            expect(doc.splitTimes.length).toBe(10);
            done();
        });
    });
});
```

---

## 🔄 ORDRE D'EXÉCUTION

1. ✅ Créer `SoloSession` (serveur)
2. ✅ Créer `SoloGameLoop` (serveur)
3. ✅ Refactoriser `socket-events.js` (serveur)
4. ✅ Intégrer au serveur principal
5. ✅ Créer `solo-game-state.js` (client)
6. ✅ Refactoriser `socket-events.js` (client)
7. ✅ Refactoriser renderers & game-loop (client)
8. ✅ Ajouter validation & sauvegarde (serveur)
9. ✅ Écrire tests
10. ✅ Tester manuellement

---

## 🎯 DÉFINITION DE "TERMINÉ"

- [ ] Tous les fichiers créés/modifiés
- [ ] Tous les tests passent (`npm test`)
- [ ] Serveur démarre sans erreur (`npm start`)
- [ ] Testable manuellement :
  - [ ] Démarrage du countdown
  - [ ] Mouvement bloqué pendant countdown
  - [ ] Progression des niveaux
  - [ ] Shop s'ouvre et se ferme
  - [ ] Achat d'items au shop
  - [ ] Fin de jeu à niveau 10
  - [ ] Sauvegarde MongoDB
  - [ ] Affichage du delta (personnel vs mondial)
- [ ] Pas de console warnings/errors

