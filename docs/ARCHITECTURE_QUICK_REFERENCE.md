# ⚡ Architecture - Guide Rapide de Référence

## 🚀 TL;DR en 60 secondes

Ton jeu .io a une architecture **modulaire en 6 couches** :

```
Client (HTML5 Canvas)
    ↓↑
WebSocket (Socket.io)
    ↓↑
Serveur Express + Boucle de jeu
    ↓↑
Logique métier (GameMode, PlayerActions, collisions, etc.)
    ↓↑
Config centralisée (gameModes.js)
    ↓↑
MongoDB (scores, session)
```

**Point clé**: Jamais de code en dur dans le code. Config → `gameModes.js`. Secrets → `.env`.

---

## 📍 Où ajouter du code ?

| Je veux... | Je vais dans... | Exemple |
|-----------|-----------------|---------|
| **Nouvelle mécanique joueur** | `utils/PlayerActions.js` | `.processDash()`, `.checkCoin()` |
| **Nouvelles valeurs de mode** | `config/gameModes.js` | Speed, gems, shop items |
| **Collision géométrique** | `utils/collisions.js` | Maths pures (AABB, cercle) |
| **Gestion session** | `utils/GameSessionManager.js` | Create, add player, advance |
| **Traiter event Socket** | `server/socket-events-refactored.js` | `socket.on('input', ...)` |
| **Boucle de jeu serveur** | `server/game-loop.js` | Tick 60 FPS |
| **Rendu Canvas** | `public/renderer.js` | Dessiner joueurs, map |
| **Input utilisateur** | `public/keyboard-input.js` ou gamepad/mobile | Clavier, manette |
| **État client** | `public/game-state.js` | Position, score, level |
| **Connexion réseau** | `public/client.js` | Socket listeners |
| **Shop** | `utils/ShopManager.js` | Logique achat |
| **Génération map** | `utils/map.js` | Labyrinthe procédural |

---

## 🔥 Architecture en action - Exemple complet

### Scénario : Ajouter un nouvel item de shop "Speed Boost"

#### 1️⃣ Définir l'item (configuration)
```javascript
// config/gameModes.js
classic: {
  shopItems: {
    'speed-boost': {
      name: 'Speed Boost',
      price: 150,
      icon: '⚡',
      effect: 'speed', // Clé de l'effet
      value: 20        // +20 vitesse
    }
  }
}
```

#### 2️⃣ Implémenter l'effet (logique métier)
```javascript
// utils/PlayerActions.js
static buyItem(player, itemId, gameMode, shopManager) {
  const item = gameMode.getShopItems()[itemId];
  
  if (!item) return { success: false, error: 'Item not found' };
  if (player.score < item.price) return { success: false, error: 'Not enough coins' };
  
  player.score -= item.price;
  
  // Appliquer l'effet selon le type
  if (item.effect === 'speed') {
    player.baseSpeed += item.value; // +20 vitesse
  }
  
  player.inventory.push(itemId);
  return { success: true, player };
}
```

#### 3️⃣ Transmettre au client (réseau)
```javascript
// server/socket-events-refactored.js
socket.on('buy', ({ itemId, playerId, sessionId }) => {
  const { session, player } = getSessionPlayer(sessionId, playerId);
  
  const result = PlayerActions.buyItem(
    player,
    itemId,
    session.gameMode,
    session.shopManager
  );
  
  if (result.success) {
    socket.emit('buySuccess', { itemId, newSpeed: player.baseSpeed });
  } else {
    socket.emit('buyFailed', { reason: result.error });
  }
});
```

#### 4️⃣ Afficher au joueur (frontend)
```javascript
// public/client.js
socket.on('buySuccess', ({ itemId, newSpeed }) => {
  // Mets à jour état local
  gameState.score -= item.price;
  gameState.player.baseSpeed = newSpeed;
  gameState.inventory.push(itemId);
  
  // Rendu se met à jour automatiquement
  renderer.render(gameState);
  
  showNotification('Speed Boost acquired! +20 speed');
});
```

**Résultat**: Nouvel item complètement intégré avec ~30 lignes de code!

---

## 🎮 Cycle d'une partie (détail)

```
1. Joueur charge le jeu
   ↓ public/client.js établit connexion Socket
   
2. Crée session
   ↓ server/socket-events-refactored.js reçoit 'join-game'
   ↓ GameSessionManager crée GameSession avec config depuis gameModes.js
   
3. Boucle de jeu démarre (60 FPS, server/game-loop.js)
   ├─ Reçoit inputs depuis la queue
   ├─ Appelle PlayerActions.processMovement()
   ├─ Détecte collisions (collisions.js)
   ├─ Broadcast position aux joueurs via Socket.io
   ↓ Client reçoit, met à jour game-state.js
   ↓ renderer.js redessine (60 FPS clientside)
   
4. Joueur atteint checkpoint
   ↓ server/game-loop.js détecte fin de niveau
   ↓ GameSessionManager.advanceLevel() change de niveau
   
5. Niveau nouveau = niveau shop?
   ├─ OUI → Pause boucle, affiche shop côté client
   │        Joueur achète items via socket.on('buy')
   │        Items appliqués via PlayerActions.buyItem()
   ├─ NON → Continue nouvelle boucle
   
6. Dernier niveau terminé?
   ├─ OUI → Fin de partie, sauvegarde score MongoDB
   ├─ NON → Retour à étape 3
```

---

## 📊 Performance : Ce qui compte

### Serveur (Node.js)
- **Tick rate**: 16.67ms (60 FPS)
- **Broadcast**: À chaque tick aux clients actifs
- **Memoria par joueur**: ~10KB state
- **CPU**: Faible avec ~100 joueurs simultanés

### Client (Browser)
- **Render**: requestAnimationFrame (60 FPS)
- **Latence réseau**: +50-200ms (acceptable)
- **GPU**: Canvas 2D (ancien browser OK)
- **RAM**: ~30MB sans problème

### À éviter ⚠️
```javascript
// ❌ NE PAS FAIRE - Alloue 60x par seconde
setInterval(() => {
  let newArray = [];
  let newObject = {};
}, 16.67);

// ✅ FAIRE - Réutilise
const buffer = [];
const obj = {};
setInterval(() => {
  buffer.length = 0;
  // réutilise buffer + obj
}, 16.67);
```

---

## 🧪 Tests - Check-list

Avant de commit:
```bash
npm test -- --forceExit
```

Si ❌ FAIL:
1. Lire le message d'erreur
2. Aller dans le test qui fail
3. Identifier ce qui est cassé
4. Fixer le code
5. Relancer `npm test`

Types de tests critiques:
- ✅ Collision detection (math pures)
- ✅ Player movement (physique)
- ✅ Shop logic (transactions)
- ✅ GameMode config (abstraction)
- ✅ Session management (state)

---

## 🔐 Sécurité - Rules absolues

### ✅ À faire
```javascript
// 1. Variables sensibles
const dbUrl = process.env.MONGODB_URI;
const apiKey = process.env.SENDGRID_API_KEY;

// 2. Validation input
socket.on('buy', ({ itemId, playerId }) => {
  if (!itemId || !playerId) return; // STOP
  // ...
});

// 3. Try-catch critique
try {
  const result = riskyOperation();
} catch (e) {
  console.error('Error:', e.message);
  // fallback ou return
}

// 4. Null check
if (!player || !player.position) return;
```

### ❌ À NE JAMAIS FAIRE
```javascript
// ❌ Secret en dur
const password = "abc123";

// ❌ Pas de validation
player.x = input.x; // Client contrôle!

// ❌ Pas de try-catch
JSON.parse(data); // Peut crash

// ❌ Pas de null check
player.position.x = 100; // BOOM si undefined
```

---

## 🚀 Déployer (Render.com)

1. **Local ok?**
   ```bash
   npm test -- --forceExit  # ✅ PASS
   npm start                 # ✅ Démarre sans erreur
   ```

2. **Git clean?**
   ```bash
   git status  # ✅ Pas de .env, node_modules
   git add .
   git commit -m "feat: Nouvel item speed boost"
   git push origin main
   ```

3. **Render auto-déploie**
   - Webhook GitHub → Render.com
   - `npm install` + `npm test` + `npm start`
   - 2-3 minutes et c'est live!

4. **Vérifier**
   - Dashboard Render.com
   - Logs en temps réel
   - Si FAIL → Regarder logs, fixer local, repush

---

## 📝 Conventions

### Nommage
```javascript
// Fichiers
my-socket-event.js          // kebab-case ✅
MyClass.js                  // PascalCase ✅

// Variables
const playerSpeed = 150;    // camelCase ✅
const MAX_PLAYERS = 8;      // SCREAMING_SNAKE_CASE ✅

// Fonctions
function calculateDistance() { } // camelCase ✅
class GameMode { }              // PascalCase ✅
```

### Imports/Exports
```javascript
// Import
const { GameMode } = require('../utils/GameMode');
const { someFunction } = require('../utils/file');

// Export
module.exports = { MyClass, myFunction };
```

### Structure de fichier
```javascript
// 1. Imports
const express = require('express');

// 2. Constantes
const TICK_RATE = 60;

// 3. Logique
class MyClass { ... }
function myFunc() { ... }

// 4. Export
module.exports = { MyClass, myFunc };
```

---

## 🎯 Debug rapide

### Serveur crash au démarrage?
```bash
npm start
# Lire l'erreur:
# - Module not found? → npm install manquant
# - Cannot GET /? → Route GET / manquante dans server/index.js
# - EADDRINUSE? → Port déjà utilisé
```

### Joueur ne bouge pas?
1. Check client.js envoie 'input' au serveur
2. Check server/game-loop.js traite input
3. Check PlayerActions.processMovement() applique mouvement
4. Check renderer.js affiche nouvelle position

### Shop cassé?
1. Check config/gameModes.js a shopLevels défini
2. Check utils/ShopManager.js logique achat
3. Check server/socket-events-refactored.js reçoit 'buy' event

### Collision cassée?
1. Check collisions.js logique géométrie
2. Ajouter console.log dans checkPlayerGemCollision()
3. Tester avec `npm test tests/collisions.test.js`

---

## 🔗 Fichiers importants

| Fichier | Rôle |
|---------|------|
| [server.js](../../server.js) | Point d'entrée |
| [server/index.js](../../server/index.js) | Express init |
| [server/game-loop.js](../../server/game-loop.js) | Boucle 60FPS |
| [config/gameModes.js](../../config/gameModes.js) | Config modes |
| [utils/GameMode.js](../../utils/GameMode.js) | Abstraction config |
| [utils/PlayerActions.js](../../utils/PlayerActions.js) | Actions unifiées |
| [utils/collisions.js](../../utils/collisions.js) | Maths collisions |
| [utils/GameSessionManager.js](../../utils/GameSessionManager.js) | Gestion session |
| [public/client.js](../../public/client.js) | Réseau client |
| [public/game-state.js](../../public/game-state.js) | État client |
| [public/renderer.js](../../public/renderer.js) | Rendu principal |
| [package.json](../../package.json) | Scripts et dépendances |

---

## 💡 Astuces Pro

### 1. Ajouter log temporaire
```javascript
// server/game-loop.js
console.log('[GameLoop] Player position:', player.x, player.y);

// Pour voir dans terminal serveur, pas en prod
```

### 2. Tester une fonction isolée
```bash
# Créer test-local.js
const { collisions } = require('./utils/collisions');
console.log(collisions.pointInRect({ x: 10, y: 10 }, {...}));

# Lancer
node test-local.js
```

### 3. Déboguer Socket.io
```javascript
// client.js
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### 4. Vérifier mémoire serveur
```bash
node --inspect server.js
# Chrome DevTools → chrome://inspect
```

---

## 📞 Support

- 🐛 Bug? → Voir [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) section correspondante
- ❓ Structure? → Voir [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- ✅ Vérif? → Voir [ARCHITECTURE_VALIDATION_CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md)
- 🧪 Tests? → Voir [TESTING_GUIDE.md](TESTING_GUIDE.md)
- 🚀 Deploy? → Voir [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

**Créé**: Janvier 2026  
**Mis à jour**: Aujourd'hui  
**Statut**: ⚡ Prêt à développer

