# 🏗️ Architecture Complète du Jeu .io - Janvier 2026

## 📊 Vue d'ensemble globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE COMPLÈTE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🌐 COUCHE CONFIGURATION (Config)                │   │
│  │                    └─ config/gameModes.js                          │   │
│  │                       Définit tous les modes du jeu                │   │
│  │                       (classic, infinite, solo, solo20...)         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🛠️ COUCHE UTILITAIRES (Utils)                   │   │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │   │
│  │  │ GameMode.js  │ GameSession  │ PlayerActions│   Collisions │    │   │
│  │  │              │  Manager.js  │   .js        │      .js     │    │   │
│  │  └──────────────┴──────────────┴──────────────┴──────────────┘    │   │
│  │  ├─ Logique métier du jeu                                        │   │
│  │  ├─ Gestion des sessions et joueurs                              │   │
│  │  ├─ Actions joueur unififiées                                    │   │
│  │  └─ Détections de collision                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                🎮 COUCHE SERVEUR (Server)                          │   │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │   │
│  │  │   index.js   │ game-loop.js │ socket-events│  email-      │    │   │
│  │  │  (Express)   │   (Core)     │  refactored  │  service.js  │    │   │
│  │  └──────────────┴──────────────┴──────────────┴──────────────┘    │   │
│  │  ├─ Initialisation Express + Socket.io                            │   │
│  │  ├─ Boucle de jeu unifiée                                         │   │
│  │  ├─ Événements WebSocket                                          │   │
│  │  └─ Intégrations externes (Email, etc.)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │            📡 COUCHE COMMUNICATION (WebSocket)                      │   │
│  │            Socket.io (Communication temps réel)                    │   │
│  │            Protocole : WebSocket avec fallback                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │            🎨 COUCHE CLIENT (Frontend - Vanilla JS)                │   │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │   │
│  │  │  client.js   │ renderer.js  │ game-state.js│ game-loop.js │    │   │
│  │  │  (Réseau)    │  (Graphiques)│  (État)      │  (Boucle)    │    │   │
│  │  └──────────────┴──────────────┴──────────────┴──────────────┘    │   │
│  │  ├─ Gestion des événements réseau                                 │   │
│  │  ├─ Inputs (clavier, gamepad, mobile)                             │   │
│  │  ├─ Rendu Canvas (map, joueurs, UI)                               │   │
│  │  └─ Synchronisation d'état client-serveur                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  💾 COUCHE PERSISTANCE (Database)                  │   │
│  │                     MongoDB via Mongoose                           │   │
│  │                  (Scores, Users, Sessions)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure des dossiers

### Racine du projet
```
/
├── server.js                  ← Point d'entrée (import ./server/index.js)
├── package.json               ← Dépendances et scripts npm
├── jest.config.js             ← Configuration Jest
│
├── server/                    ← SERVEUR NODE.JS + EXPRESS
│   ├── index.js              ← Initialisation Express + Socket.io
│   ├── game-loop.js          ← Boucle de jeu principale
│   ├── socket-events-refactored.js ← Événements WebSocket (ACTIF)
│   ├── unified-game-loop.js  ← Boucle unifiée pour tous modes
│   ├── email-service.js      ← Intégration SendGrid
│   ├── config.js             ← Configuration serveur
│   ├── utils.js              ← Utilitaires serveur
│   ├── bug-routes.js         ← Routes pour bug reporter
│   ├── vote.js               ← Système de vote
│   └── game-loops/           ← Boucles spécialisées (archive)
│
├── utils/                     ← LOGIQUE MÉTIER PARTAGÉE
│   ├── GameMode.js           ← Classe abstraite pour les modes
│   ├── GameSessionManager.js ← Gestion des sessions joueur
│   ├── PlayerActions.js      ← Actions unifiées du joueur
│   ├── collisions.js         ← Détections de collision
│   ├── map.js                ← Génération procédurale de map
│   ├── player.js             ← Classe Player
│   ├── ShopManager.js        ← Gestion des shops
│   ├── dutchAuctionShop.js   ← Mode auction néerlandaise
│   ├── GameMode.js           ← Paramètres par mode de jeu
│   ├── gems.js               ← Logique des gemmes
│   ├── shop.js               ← Système de shop unifié
│   ├── shopTransitionManager.js ← Transitions shop
│   └── BugReport.js          ← Rapports de bug
│
├── public/                    ← FRONTEND (HTML5 + VANILLA JS)
│   ├── index.html            ← Page principale
│   ├── ui-elements.html      ← Éléments UI réutilisables
│   │
│   ├── client.js             ← Gestionnaire réseau (Socket.io)
│   ├── socket-events.js      ← Événements Socket côté client
│   │
│   ├── game-state.js         ← État global du jeu (client)
│   ├── game-loop.js          ← Boucle de jeu côté client
│   │
│   ├── renderer.js           ← Rendu principal Canvas
│   ├── map-renderer.js       ← Rendu de la map
│   ├── players-renderer.js   ← Rendu des joueurs
│   ├── transition-renderer.js ├─ Transitions visuelles
│   ├── results-renderer.js   ├─ Écran de résultat
│   ├── classic-end-screen-renderer.js
│   ├── countdown-renderer.js ├─ Rendus spécialisés
│   ├── countdown-cinema.js   │
│   ├── academy-leader-renderer.js
│   │
│   ├── main-menu.js          ← Menu principal
│   ├── mode-selector.js      ← Sélecteur de mode
│   ├── pause-menu.js         ← Menu pause
│   │
│   ├── keyboard-input.js     ├─ Systèmes d'entrée
│   ├── gamepad-input.js      │
│   ├── mobile-controls.js    │
│   ├── shop-gamepad.js       ├─ Entrée shop
│   │
│   ├── shop-renderer.js      ├─ UI Shop
│   ├── admin-panel.js        ├─ Admin/Debug
│   ├── admin-panel.css       │
│   │
│   ├── bug-reporter.js       ← Rapporteur de bugs
│   ├── timing-formatter.js   ← Formatage des temps
│   ├── styles.css            ← Styles globaux
│   │
│   ├── ARCHITECTURE.md       ← Docs frontend
│   └── STRUCTURE.md          ← Structure frontend
│
├── config/                    ← CONFIGURATION DU JEU
│   └── gameModes.js          ← Tous les modes (classic, solo, etc.)
│
├── tests/                     ← TESTS AUTOMATISÉS (Jest)
│   ├── *.test.js             ← Tests unitaires
│   └── ...
│
├── docs/                      ← DOCUMENTATION COMPLÈTE
│   ├── ARCHITECTURE_COMPLETE.md ← CE FICHIER
│   ├── ARCHITECTURE_NEW.md
│   ├── README_GAMEPLAY.md
│   ├── TESTING_GUIDE.md
│   ├── RENDER_DEPLOYMENT.md
│   └── ...
│
├── scripts/                   ← SCRIPTS UTILITAIRES
│   ├── resetScore.js         ← Réinitialiser scores
│   └── ...
│
└── .env                       ← VARIABLES SENSIBLES (GIT IGNORED)
    ├── MONGODB_URI
    ├── SENDGRID_API_KEY
    ├── NODE_ENV
    └── PORT
```

---

## 🎮 Flux de données principal

### 1️⃣ Initialisation du jeu
```
client.js (charge page)
    ↓
public/index.html (Canvas + UI)
    ↓
game-state.js (initialise state client)
    ↓
client.js (connection Socket.io)
    ↓
server/index.js (accepte connexion)
    ↓
server/socket-events-refactored.js (crée session + joueur)
    ↓
utils/GameSessionManager.js (crée GameSession)
    ↓
config/gameModes.js (charge config du mode choisi)
```

### 2️⃣ Boucle de jeu (60 FPS serveur)
```
server/game-loop.js (tick toutes les 16.67ms)
    ↓
Pour chaque joueur:
    ├─ InputQueue (mouvements en attente)
    ├─ PlayerActions.processMovement() (applique mouvement)
    ├─ collisions.js (détecte collisions pièces)
    ├─ PlayerActions.checkCoinCollision() (traite collision)
    ├─ GameMode.getGemsForLevel() (gère progression)
    └─ Émet "playerUpdate" au client via Socket.io
```

### 3️⃣ Client render loop (60 FPS client)
```
requestAnimationFrame (côté client)
    ↓
game-loop.js (côté client)
    ↓
renderer.js (efface canvas + redraw)
    ├─ map-renderer.js (dessine map)
    ├─ players-renderer.js (dessine joueurs)
    └─ UI (affiche score, temps, etc.)
    ↓
Affichage visuel
```

### 4️⃣ Achats et transitions
```
client.js (joueur clique sur item)
    ↓
Socket.emit('buy', { itemId, playerId })
    ↓
server/socket-events.js (reçoit buy)
    ↓
PlayerActions.buyItem() (valide + applique achat)
    ↓
ShopManager.processTransaction() (met à jour inventaire)
    ↓
Socket.emit('buySuccess' ou 'buyFailed')
    ↓
client.js (met à jour state + UI)
```

---

## 🔧 Modules clés

### `config/gameModes.js`
**Responsabilité** : Centraliser tous les paramètres des modes de jeu

**Structure**:
```javascript
{
  classic: {
    name: 'Classic',
    maxPlayers: 8,
    levels: 5,
    shopLevels: [2, 4],
    gemsPerLevel: { 1: 3, 2: 4, ... },
    shopItems: { item1: { price: 100, name: 'Speed' }, ... },
    playerSpeed: 150,
    // ... autres config
  },
  solo: { ... },
  solo20: { ... },
  infinite: { ... }
}
```

### `utils/GameMode.js`
**Responsabilité** : Abstraction pour accéder aux config du mode

**Méthodes principales**:
```javascript
class GameMode {
  constructor(modeKey, config) { ... }
  
  // Accesseurs
  getMazeSize(level) { ... }
  getGemsForLevel(level) { ... }
  getShopItems() { ... }
  isShopLevel(level) { ... }
  isGameFinished(level) { ... }
  
  // Actions
  getPlayerSpeed(player) { ... }
  canDash() { ... }
  getCoinValue() { ... }
}
```

### `utils/GameSessionManager.js`
**Responsabilité** : Créer et gérer les sessions de jeu

**Principes**:
- 1 session = 1 mode + ses joueurs
- Autobus d'événements interne pour les transitions
- Récupération facile via sessionId

**Méthodes principales**:
```javascript
class GameSessionManager {
  createSession(sessionId, modeKey) { ... }
  addPlayerToSession(playerId, sessionId, position, slot) { ... }
  removePlayerFromSession(playerId, sessionId) { ... }
  getSession(sessionId) { ... }
  advanceLevel(sessionId) { ... }
  shopOpen(sessionId) { ... }
}
```

### `utils/PlayerActions.js`
**Responsabilité** : Uniformiser les actions du joueur pour tous les modes

**Méthodes principales**:
```javascript
class PlayerActions {
  static processMovement(player, direction, deltaTime) { ... }
  static processDash(player) { ... }
  static checkCoinCollision(player, gems, gameMode) { ... }
  static processCheckpoint(player, checkpoint) { ... }
  static buyItem(player, itemId, gameMode, shopManager) { ... }
}
```

### `utils/collisions.js`
**Responsabilité** : Toutes les détections de collision

**Fonctions principales**:
```javascript
exports.pointInRect(point, rect) { ... }
exports.rectsIntersect(rect1, rect2) { ... }
exports.circleCollision(circle1, circle2) { ... }
exports.checkPlayerGemCollision(player, gems) { ... }
exports.checkPlayerWallCollision(player, walls) { ... }
```

### `server/game-loop.js`
**Responsabilité** : Boucle de jeu côté serveur (la source de vérité)

**Responsabilités**:
- Tick 60 FPS (16.67ms par frame)
- Traite les inputs en queue
- Applique physique et collisions
- Gère progression de niveau
- Ouvre shops au bon moment
- Émet state aux clients

### `server/socket-events-refactored.js`
**Responsabilité** : Tous les événements WebSocket serveur

**Événements gérés**:
```
connection
  → joinGame (crée session + joueur)
  → input (enqueue mouvement)
  → buy (achat item)
  → dash (utilise dash)
  → checkpoint (pose checkpoint)
  → disconnect (cleanup)
  → ready (prêt à jouer)
```

### `public/client.js`
**Responsabilité** : Gestionnaire réseau côté client

**Responsabilités**:
- Connexion Socket.io
- Émettre inputs
- Recevoir state serveur
- Mettre à jour game-state.js
- Synchroniser avec renderer.js

### `public/renderer.js`
**Responsabilité** : Rendu principal Canvas

**Responsabilités**:
- Boucle requestAnimationFrame
- Appelle les sous-renderers (map, joueurs, UI)
- Gère caméra et zoom
- Affichage FPS/debug

---

## 🔐 Sécurité et bonnes pratiques

### ✅ À FAIRE
1. **Variables d'environnement** - Toujours via `.env` (jamais en dur)
   ```javascript
   const mongoUri = process.env.MONGODB_URI;
   const sendgridKey = process.env.SENDGRID_API_KEY;
   ```

2. **Try-catch sur logique critique**
   ```javascript
   try {
     const collision = checkPlayerGemCollision(player, gems);
     // traiter collision
   } catch (error) {
     console.error('Collision check failed:', error);
     // fallback safely
   }
   ```

3. **Validation des inputs**
   ```javascript
   if (!playerId || !sessionId) {
     console.warn('Invalid join request');
     return;
   }
   ```

4. **Vérifications null/undefined**
   ```javascript
   if (!player || !player.position) {
     return;
   }
   ```

### ❌ À NE PAS FAIRE
1. Mettre des secrets en dur dans le code
2. Ignorer les erreurs réseau
3. Truquer la physique côté client (source de vérité = serveur)
4. Créer des fichiers sans structure modulaire

---

## 📊 Modes de jeu supportés

| Mode | Joueurs | Niveaux | Shop | Description |
|------|---------|---------|------|-------------|
| **classic** | 8 | 5 | Oui (niv 2,4) | Mode compétitif classique |
| **infinite** | 8 | ∞ | Oui (tous les 2) | Mode sans fin |
| **solo** | 1 | 5 | Oui | Mode solo complet |
| **solo20** | 1 | 20 | Oui | Challenge solo long |
| **academy-leader** | Multi | 5 | Oui | Mode leader/élève |

Tous utilisent la même logique via `GameMode.js` et `GameSessionManager.js`.

---

## 🚀 Déploiement

### Stack
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML5 Canvas + Vanilla JS
- **Tests**: Jest (`npm test`)
- **Deployment**: Render.com (CI/CD auto via GitHub)

### Checklist pré-déploiement
- [ ] Tests passent (`npm test`)
- [ ] Variables `.env` configurées
- [ ] Route GET `/` expose `index.html`
- [ ] Socket.io correctement initialisé
- [ ] MongoDB connection string OK
- [ ] SendGrid API key OK
- [ ] Pas de console.error en prod

---

## 📝 Conventions de code

### Nommage
- **Fichiers**: `kebab-case.js`
- **Variables**: `camelCase`
- **Constantes**: `SCREAMING_SNAKE_CASE`
- **Classes**: `PascalCase`

### Structure de fichier
```javascript
// 1. Imports
const express = require('express');
const { GameMode } = require('../utils/GameMode');

// 2. Constantes
const TICK_RATE = 60;

// 3. Fonctions/Classes
class MyClass { ... }
function myFunction() { ... }

// 4. Exports
module.exports = { MyClass, myFunction };
```

### Gestion d'erreurs
```javascript
try {
  // Logique critique
  const result = riskyOperation();
} catch (error) {
  console.error('[ModuleName] Error type:', error.message);
  // Fallback ou rethrow
  throw error;
}
```

---

## 🧪 Tests

**Framework**: Jest  
**Command**: `npm test -- --forceExit`  
**Localisation**: `/tests/**/*.test.js`

**Types de tests**:
- ✅ Collision detection
- ✅ Player movement
- ✅ Shop logic
- ✅ GameMode config
- ✅ Session management

**À tester obligatoirement**:
- Toute logique mathématique (collisions, mouvements)
- Transitions d'état (niveau, shop, fin)
- Gestion d'erreurs côté serveur

---

## 📈 Métriques de performance

### Serveur
- **Tick rate**: 60 FPS (16.67ms par frame)
- **Broadcast**: Toutes les 16.67ms aux clients
- **Mémoire**: ~50MB par 100 joueurs simultanés (estimé)

### Client
- **Render FPS**: 60 FPS (requestAnimationFrame)
- **Latence réseau**: ~50-200ms (WebSocket)

---

## 🔄 Workflow de développement

1. **Feature**: Créer branche `feature/nom`
2. **Code**: Implémenter dans les modules appropriés
3. **Test**: Ajouter tests + `npm test`
4. **Review**: Vérifier architecture (pas de code en dur!)
5. **Commit**: `git commit -m "Type: description"`
6. **Push**: `git push origin feature/nom`
7. **Deploy**: Render.com CI/CD auto

---

## ⚡ Quick Reference - Où mettre quoi ?

| Quoi | Où |
|------|-----|
| Nouvelle mécanique de jeu | `utils/PlayerActions.js` ou créer `utils/NewMechanic.js` |
| Nouveau mode de jeu | Ajouter dans `config/gameModes.js` |
| Logique serveur | `server/socket-events-refactored.js` ou module dans `server/` |
| Logique client réseau | `public/client.js` ou `public/socket-events.js` |
| Rendu visuel | Créer `public/new-renderer.js` et appeler depuis `public/renderer.js` |
| Input utilisateur | `public/keyboard-input.js`, `gamepad-input.js`, ou `mobile-controls.js` |
| Détection géométrique | `utils/collisions.js` |
| Configuration | `config/gameModes.js` |
| Tests | `tests/moduleName.test.js` |
| Secrets (API keys, DB) | `.env` + `process.env.VAR_NAME` |

---

## 🎓 Ressources

- `/docs/README_GAMEPLAY.md` - Règles du jeu
- `/docs/TESTING_GUIDE.md` - Guide des tests
- `/docs/RENDER_DEPLOYMENT.md` - Déploiement Render
- `/public/ARCHITECTURE.md` - Architecture frontend
- `/server/` - Code serveur commenté

---

**Dernière mise à jour** : Janvier 2026  
**Statut** : ✅ Architecture stable et modulaire

