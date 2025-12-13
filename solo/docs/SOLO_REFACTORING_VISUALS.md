# 🎨 VISUALISATION DES CHANGEMENTS - Mode Solo Refactoring

## 📊 Diagramme 1: Flux de Communication Actuel (❌ PROBLÉMATIQUE)

```
CLIENT                              SERVEUR
=================                   =================

socket.on('init')
socket.on('mapData') ←─────────────── emit('mapData')
   │ map = data
   │
socket.on('levelUpdate') ←───────── emit('levelUpdate')
   │ isInTransition = true
   │ transitionStartTime = Date.now()
   │ levelUpTime = (Date.now() - levelStartTime) / 1000
   │ levelStartTime = Date.now()
   │
   │ [RECALCULE LE TEMPS LOCALEMENT]
   │

socket.on('shopOpen') ←────────────── emit('shopOpen')
   │ isShopOpen = true
   │ levelStartTime = null  [PAUSE TIMER]
   │

socket.on('shopClosed') ←───────────── emit('shopClosed')
   │ isShopOpen = false
   │ levelStartTime = Date.now()  [REPART FROM 0]
   │

[Dans game-loop.js]
soloRunTotalTime = (Date.now() - soloSessionStartTime) / 1000
soloCurrentLevelTime = (Date.now() - levelStartTime) / 1000

[❌ MULTIPLE SOURCES DE VÉRITÉ]
[❌ CLIENT RECALCULE TOUT]
[❌ SERVEUR NE SAIT PAS L'ÉTAT RÉEL]
```

---

## 📊 Diagramme 2: Flux de Communication Cible (✅ PROPRE)

```
CLIENT                              SERVEUR
=================                   =================

selectGameMode('solo')
    │────────────────────────────────→ createSoloSession()
    │                                  │ soloSession = new SoloSession()
    │                                  │ soloSession.sendGameState()
    │
socket.on('soloGameState') ←────────── emit('soloGameState', {
   │ soloGameState = newState             currentLevel: 1,
   │                                      runTotalTime: 0,
   │                                      currentLevelTime: 0,
   │                                      countdown: { active: true, ... },
   │                                      ...
   │                                  })
   │
[RENDER game-loop]
renderSolo(ctx, soloGameState)
   │ Affiche juste soloGameState
   │

emit('movement', input)
    │────────────────────────────────→ movement event
    │                                  │ if (session.countdownActive) return
    │                                  │ applyMovement()
    │                                  │ session.sendGameState()
    │
socket.on('soloGameState') ←────────── emit('soloGameState', {
   │ soloGameState.player.x++             player: { x: updated, ... },
   │                                      ...
   │                                  })
   │

[Détecte collision coin]
                                     ← SoloGameLoop (tick 60fps)
                                       │ checkCoinCollision()
                                       │ session.finishLevel()
                                       │ session.recordSplitTime()
                                       │ session.currentLevel++
                                       │ if shop: session.openShop()
                                       │ session.sendGameState()
    │
socket.on('soloGameState') ←────────── emit('soloGameState', {
   │ soloGameState.currentLevel: 2        currentLevel: 2,
   │ soloGameState.shop.active: true      shop: { active: true, items: {...} },
   │ soloGameState.transition.active: ... transition: { active: true, ... },
   │                                      ...
   │                                  })
   │
[RENDER avec les nouvelles données]
   │

[✅ UNE SEULE SOURCE DE VÉRITÉ = SERVEUR]
[✅ CLIENT AFFICHE JUSTE]
[✅ SYNCHRONISATION GARANTIE]
```

---

## 📦 Diagramme 3: Structure des Données Avant vs Après

### ❌ AVANT (50+ variables éclatées)

```javascript
// game-state.js
let soloTotalTime = 0;
let soloSplitTimes = [];
let isSoloGameFinished = false;
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

// ... ET AUSSI:
let inputsBlocked = false;
let isInTransition = false;
let transitionStartTime = null;
let levelStartTime = null;
let level = 1;
let lastLevel = 0;
let isShopOpen = false;
let shopTimerStart = null;
// ... etc

[❌ QUI APPARTIENT À SOLO? C'EST CONFUS]
[❌ COMMENT LES GARDER EN SYNC?]
[❌ FACILE D'OUBLIER UNE VARIABLE]
```

### ✅ APRÈS (1 objet cohérent)

```javascript
// Public/solo-game-state.js
let soloGameState = {
    // Joueur
    player: { x, y, skin, gems, purchasedFeatures, ... },
    
    // Niveaux
    currentLevel: 1,
    maxLevel: 10,
    isGameFinished: false,
    
    // Timing
    runTotalTime: 0,        // Envoyé par serveur
    currentLevelTime: 0,    // Envoyé par serveur
    splitTimes: [],         // Envoyé par serveur
    
    // UI
    countdown: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0  // Calculé pour le rendu
    },
    
    shop: {
        active: false,
        duration: 15000,
        startTime: null,
        items: { speedBoost, dash, ... },
        elapsed: 0
    },
    
    transition: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0
    },
    
    // Map
    map: [],
    coin: { x, y }
};

[✅ TOUT DANS UN SEUL OBJET]
[✅ CLAIR QUI EST SOLO VS COMMUN]
[✅ FACILE À DÉBOGUER]
[✅ FACILE À TESTER]
```

---

## ⏱️ Diagramme 4: Gestion du Timing (Avant vs Après)

### ❌ AVANT (Timer qui pause/reprend mal)

```
Session commence                        t=0
│
├─ Countdown 3s                         t=0→3
│  levelStartTime = null
│
├─ Niveau 1                             t=3→10
│  levelStartTime = Date.now() + 3000
│  Timer: 10 - 3 = 7s
│
├─ Shop s'ouvre                         t=10
│  levelStartTime = null [PAUSE]
│  shopTimerStart = Date.now()
│
├─ Client attend 15s                    t=10→25
│  [Mais le serveur n'en sait rien!]
│
├─ Client ferme le shop                 t=25
│  levelStartTime = Date.now() [REPART FROM 0]
│  [❌ LE TEMPS DU SHOP EST PERDU!]
│  [❌ TIMER RÉINITIALISÉ]
│
├─ Niveau 2                             t=25→??
│  Timer calculé: Date.now() - levelStartTime
│  [Mélange avec le temps du shop]
│

[❌ SERVEUR ET CLIENT EN DÉSYNC]
[❌ LE TEMPS TOTAL EST CORROMPU]
[❌ IMPOSSIBLE DE FAIRE CONFIANCE AUX SPLITS]
```

### ✅ APRÈS (Serveur gère tout)

```
Session commence                        t=0
│ sessionStartTime = Date.now()
│ levelStartTime = Date.now()
│
├─ Countdown 3s                         t=0→3
│  [Client reçoit countdown.active=true]
│  [Serveur envoie l'état à chaque tick]
│
├─ Niveau 1                             t=3→10
│  levelStartTime = Date.now()
│  countdown.active = false
│  runTotalTime = (now - sessionStartTime) / 1000
│  currentLevelTime = (now - levelStartTime) / 1000
│
├─ Shop s'ouvre                         t=10
│  shopActive = true
│  shopStartTime = Date.now()
│  levelPauseTime = Date.now()
│  [Serveur PAUSE le timer du level]
│
├─ Serveur attend 15s                   t=10→25
│  [Serveur GÈRE LA DURÉE]
│  totalPausedTime += (now - shopStartTime)
│
├─ Shop se ferme (auto)                 t=25
│  shopActive = false
│  levelStartTime = Date.now()
│  [Timer du level CONTINUE depuis pause]
│  [✅ TEMPS DU SHOP COMPTABILISÉ]
│
├─ Niveau 2                             t=25→??
│  levelStartTime a été réinitialisé
│  runTotalTime continue de croître
│  currentLevelTime = new level timer
│  [✅ TOUT COHÉRENT]
│

[✅ SERVEUR EST L'AUTORITÉ]
[✅ CLIENT AFFICHE JUSTE]
[✅ TIMING FIABLE]
[✅ SPLITS VALIDES]
```

---

## 🏪 Diagramme 5: Gestion du Shop

### ❌ AVANT (Flou)

```
Côté CLIENT                            Côté SERVEUR
══════════════════                     ══════════════

socket.on('shopOpen')                  ← emit('shopOpen')
  isShopOpen = true
  shopTimerStart = Date.now()
  levelStartTime = null
  
  [Client gère le countdown 15s]
  [Server continue de tourner...]
  [Désync possible]
  
socket.on('shopClosed')                ← emit('shopClosed')
  isShopOpen = false
  levelStartTime = Date.now()
  
emit('shopPurchase', {itemId})         → Serveur valide...?
                                          [Pas de check robuste]
                                          
socket.on('shopPurchaseSuccess')       ← emit('shopPurchaseSuccess')
  purchasedFeatures[itemId] = true
  playerGems -= item.price
  
[❌ AUCUNE ATOMICITÉ]
[❌ POSSIBLE DE ACHETER 2X]
[❌ CLIENT GÈRE LA DURÉE]
```

### ✅ APRÈS (Propre)

```
Côté CLIENT                            Côté SERVEUR
══════════════════                     ══════════════

session.openShop() s'appelle
  shopActive = true
  shopStartTime = Date.now()
  shopDuration = 15000
  levelPauseTime = Date.now()

session.sendGameState()                → socket.emit('soloGameState', {
                                              shop: {
                                                  active: true,
                                                  duration: 15000,
                                                  startTime: now,
                                                  items: {...}
                                              }
                                          })

socket.on('soloGameState')
  soloGameState.shop.active = true
  soloGameState.shop.duration = 15000
  soloGameState.shop.startTime = serverTime
  
  [Afficher countdown: 15 - elapsed]
  
emit('shopPurchase', {itemId})         → socket.on('shopPurchase')
                                          if (!shopActive) return
                                          if (gems < price) return
                                          if (already bought) return
                                          [✅ VALIDATION STRICTE]
                                          
                                          player.gems -= price
                                          player.purchasedFeatures[id] = true
                                          
                                          session.sendGameState()

socket.on('soloGameState')             ← emit('soloGameState', {
  soloGameState.player.gems -= price      player: { gems: updated, ... }
  soloGameState.player.purchasedFeatures  ...
                                       })

[Attendre fermeture shop (serveur décide)]

À t=15s:
                                        session.closeShop()
                                          shopActive = false
                                          levelPauseTime = null
                                          totalPausedTime += durée
                                          levelStartTime = Date.now()
                                          session.sendGameState()

socket.on('soloGameState')             ← emit('soloGameState', {
  soloGameState.shop.active = false       shop: { active: false }
  soloGameState.transition.active = true  transition: { active: true }
  soloGameState.currentLevel = 2
  
  [Afficher transition 3s]
  [Client attend]
  
soloGameState.transition.active = false
[Afficher nouveau niveau]

[✅ ATOMICITÉ GARANTIE]
[✅ IMPOSSIBLE DE TRICHER]
[✅ TIMING GÉRÉ PAR SERVEUR]
```

---

## 🧪 Diagramme 6: Tests - Avant vs Après

### ❌ AVANT (Difficile à tester)

```
Test: "Acheter un item"

1. Lancer le serveur
2. Connecter un client
3. Sélectionner solo
4. Attendre countdown (3s) ⏱️
5. Aller jusqu'à un shop (> 5 niveaux) ⏱️
6. Émettre shopPurchase
7. Vérifier que gems ont changé
8. Vérifier dans les logs

[❌ TEST LENT (plusieurs secondes)]
[❌ DÉPEND DE PLUSIEURS COMPOSANTS]
[❌ FRAGILE (timing)]
[❌ DIFFICILE D'ISOLER UN BUG]
```

### ✅ APRÈS (Facile à tester)

```
Test unitaire: "SoloSession.recordSplitTime()"

session.recordSplitTime(10.5);
expect(session.splitTimes).toEqual([10.5]);
✅ INSTANT

Test unitaire: "SoloSession.closeShop()"

jest.useFakeTimers();
session.openShop();
jest.advanceTimersByTime(5000);
session.closeShop();
expect(session.totalPausedTime).toBeGreaterThan(4900);
✅ INSTANT

Test unitaire: "SoloSession.validateSplits()"

const valid = session.validateSplits([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
expect(valid).toBe(true);

const invalid = session.validateSplits([0.2, 5, 5, ...]);
expect(invalid).toBe(false);
✅ INSTANT

Test d'intégration: "Client → Serveur → Client"

clientSocket.emit('shopPurchase', {itemId: 'dash'});
expect(serverSession.player.gems).toBeLessThan(initialGems);
expect(serverSession.player.purchasedFeatures['dash']).toBe(true);
✅ RAPIDE (pas de timing dur)

[✅ TESTS UNITAIRES RAPIDES]
[✅ TESTS ISOLÉS]
[✅ FACILES À ÉCRIRE]
[✅ FACILES À DÉBOGUER]
```

---

## 📈 Diagramme 7: Charge Serveur - Avant vs Après

### ❌ AVANT

```
Boucle serveur 60fps:
├─ Vérifier collision pour chaque joueur
├─ Mettre à jour l'état (mal structuré)
├─ Envoyer mapData si changement  ← Gros fichier
├─ Envoyer levelUpdate si changement
├─ Envoyer shopOpen si changement
├─ Envoyer shopClosed si changement
└─ [❌ MULTIPLES PETITS MESSAGES]

Client reçoit:
├─ mapData (tout le labyrinthe)
├─ levelUpdate (juste le numéro)
├─ shopOpen (juste les items)
├─ shopClosed (rien)
└─ [❌ INCOHÉRENT, DOIT RECONSTRUIRE L'ÉTAT]
```

### ✅ APRÈS

```
Boucle serveur 60fps:
├─ Vérifier collision pour chaque joueur
├─ Mettre à jour l'état cohérent
├─ socket.emit('soloGameState', completeState)  ← 1 message structuré
└─ [✅ UN SEUL MESSAGE STRUCTURÉ]

Client reçoit:
├─ soloGameState: {
│  ├─ player: {...}
│  ├─ currentLevel: 5
│  ├─ runTotalTime: 45.3
│  ├─ currentLevelTime: 8.2
│  ├─ map: [...]
│  ├─ coin: {x, y}
│  ├─ shop: {active, duration, items}
│  ├─ countdown: {active, duration, elapsed}
│  └─ transition: {active, duration, elapsed}
│  }
└─ [✅ TOUT DANS UN MESSAGE, COHÉRENT]
```

---

## 🔐 Diagramme 8: Sécurité - Anti-Triche

### ❌ AVANT (Vulnérable)

```
Client peut:
├─ Modifier soloRunTotalTime localement
│  → Envoyer 100s en 10 secondes
├─ Modifier split times
│  → Envoyer 0.1s par level
├─ Modifier gems
│  → Acheter des items gratuits
├─ Bloquer inputs.blocked = false pendant countdown
│  → Bouger pendant le countdown
└─ [❌ PAS DE VÉRIFICATION SERVEUR]

Serveur reçoit saveSoloResults et...
├─ Fait confiance aux données ❌
├─ Validation minime (< 0.5s)
└─ Enregistre en BDD ❌

Résultat:
└─ Les speedrunners peuvent tricher facilement
```

### ✅ APRÈS (Robuste)

```
Client n'a AUCUN contrôle sur:
├─ Les timings (tous calculés serveur)
├─ Les gems (tous calculés serveur)
├─ Les splits (tous enregistrés serveur)
├─ Le bloquage des inputs (décidé serveur)
└─ [✅ SOURCE DE VÉRITÉ UNIQUE]

Serveur valide TOUT avant sauvegarde:
├─ splitTime > 0.5s ? ✅
├─ splitTime < 60s ? ✅
├─ Somme splits ≈ totalTime ? ✅
├─ Tous les items achetés valides ? ✅
├─ Enough gems ? ✅
└─ [✅ VALIDATION COMPLÈTE]

Résultat:
└─ Impossible de tricher
    ├─ Timings vérifiés serveur
    ├─ Données vérifiées serveur
    ├─ Sauvegarde atomique
    └─ Leaderboard fiable ✅
```

---

## 📚 Résumé Visuel

```
            AVANT (❌)                    APRÈS (✅)
═════════════════════════════════════════════════════════

Archi       Chaotique                    Organisée
            50+ variables                1 objet cohérent

Timing      Client recalcule             Serveur envoie
            Désync possible              Synchronisé

Shop        Client gère                  Serveur gère
            Flou                         Clair

Validation  Minimale                     Complète
            Trust client                 Verify all

Tests       Lents (timing)               Rapides (mock)
            Fragiles                     Robustes

Sécurité    Vulnérable                   Robuste
            Client peut tricher          Impossible de tricher

Code        Difficile à lire             Facile à lire
            Maintenance hard             Maintenance easy

Perf        Client lourd                 Client allégé
            Beaucoup de recalcul         Juste du rendu

Scalabilité Pas prêt                     Prêt pour multi
            Logique fragmentée           Source unique
```

---

## 🎯 L'Essentiel

**Transformation clé** : De **"Client qui gère tout"** à **"Serveur qui gère tout"**

- ✅ Ancien paradigme : `Client calcule → Serveur accepte`
- ✅ Nouveau paradigme : `Serveur gère → Client affiche`

C'est simple, mais transforme tout:
- Sécurité ✅
- Timing ✅
- Tests ✅
- Maintenance ✅
- Scalabilité ✅

