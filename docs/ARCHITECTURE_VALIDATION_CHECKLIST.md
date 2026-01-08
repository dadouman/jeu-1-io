# ✅ Checklist Architecture - Validation

## 🎯 Objectif
Vérifier que le projet respecte les principes d'architecture définis et maintient une bonne qualité de code.

**Utilisation**: Avant chaque commit, avant déploiement, et lors de revues de code.

---

## 📋 Checklist Modularity (Structure des dossiers)

- [ ] **`server.js`** est un point d'entrée minimal
  - Contient uniquement: `require('./server/index');`
  - ❌ Ne contient PAS: logique de jeu, sockets, routes Express

- [ ] **`server/index.js`** initialise Express
  - ✅ `app.use(express.static('public'))`
  - ✅ `app.get('/', (req, res) => res.sendFile(...))`
  - ✅ `io = require('socket.io')(server)`
  - ✅ Appelle `require('./socket-events-refactored')`
  - ❌ Ne contient PAS: boucle de jeu, logique joueur

- [ ] **`server/socket-events-refactored.js`** gère les événements
  - ✅ Reçoit événements Socket
  - ✅ Valide les inputs
  - ✅ Délègue à `utils/` pour logique
  - ❌ Ne contient PAS: boucle de jeu, calculs physiques

- [ ] **`server/game-loop.js`** est la boucle de jeu
  - ✅ Tick à 60 FPS (setInterval 16.67ms)
  - ✅ Appelle `PlayerActions.processMovement()`
  - ✅ Appelle `collisions.js` pour détections
  - ✅ Émet "playerUpdate" via Socket.io
  - ❌ Ne contient PAS: validation d'inputs, logique shop

- [ ] **`utils/`** contient la logique métier
  - ✅ `GameMode.js` - Abstraction config
  - ✅ `GameSessionManager.js` - Gestion sessions
  - ✅ `PlayerActions.js` - Actions joueur unifiées
  - ✅ `collisions.js` - Détections géométriques
  - ✅ `map.js` - Génération labyrinthe
  - ✅ `ShopManager.js` - Logique shop
  - ❌ Ne contient PAS: code réseau, rendu Canvas

- [ ] **`public/`** contient uniquement frontend
  - ✅ `index.html` - Page HTML
  - ✅ `client.js` - Gestionnaire Socket
  - ✅ `game-state.js` - État du jeu
  - ✅ `renderer.js` - Rendu principal
  - ✅ Input handlers (keyboard, gamepad, mobile)
  - ❌ Ne contient PAS: logique serveur, MongoDB

- [ ] **`config/gameModes.js`** centralise les paramétrages
  - ✅ Un objet par mode (classic, solo, infinite, etc.)
  - ✅ Chaque mode a: levels, maxPlayers, shopLevels, etc.
  - ✅ Pas de code logique, que de données
  - ❌ Ne contient PAS: calculs ou conditionnels complexes

---

## 🔐 Checklist Sécurité

- [ ] **Variables sensibles en `.env` uniquement**
  ```javascript
  // ✅ CORRECT
  const mongoUri = process.env.MONGODB_URI;
  
  // ❌ INCORRECT
  const mongoUri = "mongodb://user:pass@...";
  ```

- [ ] **`.env` est dans `.gitignore`**
  - Vérif: `git status` ne doit pas afficher `.env`

- [ ] **Pas de secrets en dur dans le code**
  - ❌ API keys
  - ❌ Passwords
  - ❌ Database URLs
  - ❌ Tokens JWT

- [ ] **Validation des inputs serveur**
  ```javascript
  // ✅ CORRECT
  if (!playerId || typeof playerId !== 'string') return;
  
  // ❌ INCORRECT
  const player = players[playerId]; // Pas de check
  ```

- [ ] **Try-catch sur opérations risquées**
  ```javascript
  // ✅ CORRECT
  try {
    const data = JSON.parse(socket.data);
  } catch (e) {
    console.error('Parse failed', e);
    return;
  }
  
  // ❌ INCORRECT
  const data = JSON.parse(socket.data); // Pas de protection
  ```

- [ ] **Vérifications null/undefined**
  ```javascript
  // ✅ CORRECT
  if (!player || !player.position) return;
  
  // ❌ INCORRECT
  player.position.x = 100; // Peut crash si undefined
  ```

---

## 🧪 Checklist Tests

- [ ] **Logique critique a des tests**
  - ✅ Collisions (pointInRect, rectsIntersect)
  - ✅ Mouvements (processMovement avec différents inputs)
  - ✅ Shop (canAfford, buyItem, updatePrice)
  - ✅ GameMode (getGemsForLevel, isShopLevel)
  - ✅ Session management (create, add player, advance level)

- [ ] **Tests s'exécutent sans erreur**
  ```bash
  npm test -- --forceExit
  # ✅ Tous les tests passent (PASS ou SKIP acceptés)
  # ❌ Aucun test en FAIL
  ```

- [ ] **Pas de console.error() ou warnings ignorés**
  - Vérif: `npm test` ne produit pas de warnings

- [ ] **Tests couvrent cas limites**
  - Collision à la frontière (x=0, y=0, max values)
  - Joueur sans argent → achat doit échouer
  - Niveau invalide → doit retourner config par défaut

- [ ] **Tests sont isolés**
  - ❌ Pas de dépendances entre tests
  - ❌ Pas de fichiers globaux modifiés
  - ✅ Chaque test peut s'exécuter seul

---

## 🎨 Checklist Code Quality

- [ ] **Nommage cohérent partout**
  - ✅ Fichiers: `kebab-case.js`
  - ✅ Variables: `camelCase`
  - ✅ Constantes: `SCREAMING_SNAKE_CASE`
  - ✅ Classes: `PascalCase`

  ```javascript
  // ✅ CORRECT
  const playerSpeed = 150;
  const MAX_PLAYERS = 8;
  class GameMode { ... }
  
  // ❌ INCORRECT
  const PlayerSpeed = 150; // Classe quand variable
  const maxPlayers = 8; // Constante en camelCase
  ```

- [ ] **Pas de code mort ou commenté**
  - ❌ Pas de `// OLD CODE HERE` resté par erreur
  - ❌ Pas de fonction jamais appelée
  - Excl: Commentaires explicatifs intentionnels

- [ ] **Imports/Exports propres**
  ```javascript
  // ✅ CORRECT
  const { GameMode } = require('../utils/GameMode');
  module.exports = { MyClass, myFunction };
  
  // ❌ INCORRECT
  const GameMode = require('../utils/GameMode').GameMode;
  module.exports = MyClass; // Export peu clair
  ```

- [ ] **Pas de require() dans les boucles**
  ```javascript
  // ❌ INCORRECT
  for (let i = 0; i < 1000; i++) {
    const utils = require('./utils'); // Charge 1000x
  }
  
  // ✅ CORRECT
  const utils = require('./utils'); // Une fois au top
  for (let i = 0; i < 1000; i++) { ... }
  ```

- [ ] **Fonctions ont une responsabilité unique**
  ```javascript
  // ❌ INCORRECT - Fait trop de choses
  function gameLogic() {
    // Bouge joueur
    // Détecte collisions
    // Ouvre shop
    // Sauvegarde score
  }
  
  // ✅ CORRECT - Une seule responsabilité
  function movePlayer(player, direction, dt) { ... }
  ```

- [ ] **Pas de magic numbers**
  ```javascript
  // ❌ INCORRECT
  player.x += 150; // D'où vient 150?
  
  // ✅ CORRECT
  const PLAYER_SPEED = 150;
  player.x += PLAYER_SPEED;
  ```

---

## 📡 Checklist Architecture Temps Réel (Socket.io)

- [ ] **Événements clairs et bien nommés**
  ```javascript
  // ✅ CORRECT
  socket.emit('playerUpdate', { position, score });
  socket.emit('shopOpened', { items });
  
  // ❌ INCORRECT
  socket.emit('update', { ... }); // Trop vague
  socket.emit('x', { ... }); // Pas clair
  ```

- [ ] **Payloads limités et compressés**
  ```javascript
  // ✅ CORRECT - Minimal
  { x: 100, y: 150, score: 2500 }
  
  // ❌ INCORRECT - Trop d'infos
  { x: 100, y: 150, score: 2500, history: [...], unused: {...} }
  ```

- [ ] **Source de vérité = Serveur**
  - ✅ Serveur calcule position, collisions, score
  - ✅ Client affiche uniquement ce que serveur envoie
  - ❌ Client ne triche pas (pas de calcul local de collision)

- [ ] **Pas de boucle infinie Socket**
  ```javascript
  // ❌ INCORRECT - Cause boucle
  socket.on('update', (data) => {
    socket.emit('update', data); // Renvoie = boucle
  });
  
  // ✅ CORRECT - Direction unique
  socket.on('input', (data) => {
    // Traite input
    // Émet 'playerUpdate' ≠ input
  });
  ```

- [ ] **Cleanup connexion/déconnexion**
  ```javascript
  // ✅ CORRECT
  socket.on('disconnect', () => {
    removePlayerFromSession(playerId);
    sessions[sessionId].players.delete(playerId);
  });
  
  // ❌ INCORRECT - Pas de cleanup
  // Session rest dans memory forever
  ```

---

## 🎮 Checklist Gameplay Logic

- [ ] **Tous les modes partagent même boucle de jeu**
  - ❌ Pas de `if (mode === 'classic') { ... }` en dur
  - ✅ `GameMode.js` fournit les paramètres, boucle identique

- [ ] **Shop peut être désactivé sans casser le jeu**
  ```javascript
  // ✅ CORRECT
  if (gameMode.isShopLevel(level)) {
    openShop();
  }
  // Sinon continue automatiquement
  
  // ❌ INCORRECT
  // Shop hardcodé dans la boucle
  ```

- [ ] **Progression de niveau est unifiée**
  - ✅ `GameSessionManager.advanceLevel()` gère tout
  - ✅ Pas besoin de code spécial par mode

- [ ] **Collision detection est indépendante du rendu**
  - ✅ `collisions.js` fait les maths pures
  - ✅ N'appelle jamais de fonction de rendu

---

## 📊 Checklist Performance

- [ ] **Serveur tick à 60 FPS (16.67ms)**
  - ✅ `setInterval(() => { ... }, 16.67)`
  - ❌ Pas de boucle qui prend >16.67ms

- [ ] **Client render à 60 FPS (requestAnimationFrame)**
  - ✅ `requestAnimationFrame(render)`
  - ❌ Pas de setTimeout(render, 16.67)

- [ ] **Pas d'allocations mémoire dans la boucle**
  ```javascript
  // ❌ INCORRECT - Alloue new Array chaque frame
  for (let player of players) {
    let newPos = { x: 0, y: 0 };
  }
  
  // ✅ CORRECT - Réutilise objet
  const newPos = { x: 0, y: 0 };
  for (let player of players) {
    newPos.x = ...;
  }
  ```

- [ ] **Pas d'appels réseau dans la boucle de jeu**
  - ❌ Pas de `fetch()` ou `io.emit()` à chaque frame
  - ✅ Les inputs sont en queue, traité une fois par tick

---

## 🚀 Checklist Déploiement

- [ ] **`.env.example` existe et à jour**
  ```
  MONGODB_URI=
  SENDGRID_API_KEY=
  NODE_ENV=production
  PORT=
  ```

- [ ] **`package.json` a tous les scripts**
  ```json
  {
    "scripts": {
      "start": "node server.js",
      "test": "jest --forceExit",
      "reset-score": "node scripts/resetScore.js"
    }
  }
  ```

- [ ] **Route GET `/` sert l'index.html**
  ```javascript
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  ```

- [ ] **MongoDB connection string sécurisée**
  ```javascript
  const mongoUri = process.env.MONGODB_URI;
  mongoose.connect(mongoUri, { ... });
  ```

- [ ] **Tests passent avant déploiement**
  ```bash
  npm test -- --forceExit
  # Sortie: PASS
  ```

- [ ] **Pas de console.error() bloquant**
  - Les erreurs sont loggées mais le serveur continue

---

## 📝 Checklist Git & Commits

- [ ] **Chaque commit a un message clair**
  ```
  ✅ feat: Add shop transition system
  ✅ fix: Collision detection at boundary
  ✅ refactor: Extract PlayerActions utility
  
  ❌ "fix stuff"
  ❌ "updated"
  ❌ "wip"
  ```

- [ ] **Commits sont atomiques (une fonctionnalité par commit)**
  - ❌ Pas de: "Fix shop, add new mode, update UI" en un commit

- [ ] **Code non-testé n'est pas commité**
  - `npm test` passe
  - `npm start` démarre sans erreur
  - Fonctionnalité testée manuellement

---

## ✨ Checklist Features

- [ ] **Toute nouvelle mécanique est testable**
  - ✅ Peut écrire `tests/newFeature.test.js`
  - ❌ Pas d'interdépendances difficiles à tester

- [ ] **Évolution du mode de jeu = edit `gameModes.js`**
  - ❌ Pas de modification du code dans `server/` ou `utils/`

- [ ] **Nouvelle fonctionnalité a documentation**
  - ✅ Commentaire au-dessus de la fonction
  - ✅ Exemple d'utilisation si complexe
  - ❌ Code "self-explanatory" sans contexte

---

## 🎯 Avant chaque push sur main

**Checklist finale** (à copier-coller avant commit):

```bash
# 1. Tests
npm test -- --forceExit
# Résultat: ✅ PASS (tous les tests)

# 2. Serveur démarre
npm start
# Résultat: ✅ Serveur écoute sur PORT

# 3. Vérification git
git status
# Résultat: ✅ Pas de fichiers sensibles (.env, node_modules)

# 4. Pas d'erreurs console
# Lancer le serveur et vérifier terminal
# Résultat: ✅ Pas de [ERROR] rouge

# 5. Commit avec message clair
git add .
git commit -m "Type: Description courte (< 50 char)"
git push origin main

# 6. Vérifier déploiement Render
# https://dashboard.render.com
# Résultat: ✅ Build réussi, serveur en ligne
```

---

## 📞 En cas de doute

- Architecture cassée? → Consulter [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md)
- Code mal organisé? → Voir section "Où mettre quoi?"
- Tests failing? → Vérif [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Performance lente? → Profiler avec dev tools
- Bugs en prod? → Vérifier `.env` variables

---

**Dernière mise à jour**: Janvier 2026  
**Statut**: 🟢 Architecture stable  
**Responsable**: Toi (Senior Fullstack Dev)

