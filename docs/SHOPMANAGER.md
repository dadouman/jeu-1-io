# ShopManager - Documentation

## 🎯 Objectif

`ShopManager` centralise **toute la logique du shop** pour tous les modes de jeu. Cela signifie:
- ✅ Plus besoin de gérer `session.currentShopLevel` manuellement
- ✅ Plus de bugs de shop bloqué aux mauvais niveaux
- ✅ Un seul endroit pour modifier le comportement du shop
- ✅ Fonctionne pour tous les modes (solo, classic, infinite, custom, etc)

## 🚀 Utilisation

### Création

```javascript
const GameMode = require('./utils/GameMode');
const { ShopManager } = require('./utils/ShopManager');

// Créer une instance pour une session
const gameMode = new GameMode('solo');
const shopManager = new ShopManager(gameMode);
```

### Logique simple

```javascript
// Quand le joueur complète un niveau
const completedLevel = 5;

// Vérifier si le shop s'ouvre AUTOMATIQUEMENT
if (shopManager.openShop(completedLevel)) {
    console.log('🏪 Shop ouvert!');
    socket.emit('shopOpen', { items: gameMode.getShopItems() });
} else {
    console.log('Pas de shop, continuer au prochain niveau');
}

// Quand le joueur se déplace pendant le shop
const isCollisionBlocked = shopManager.shouldBlockCollisions();
if (dist < 30 && !isCollisionBlocked) {
    // Traiter la collision
}
```

## 📊 Comparaison Avant/Après

### ❌ AVANT (code complexe)

```javascript
// Ancien code dans solo-loop.js
let isShopActive = session.currentShopLevel ? 
    session.currentLevel === session.currentShopLevel : false;

if (session.currentShopLevel && session.currentLevel > session.currentShopLevel) {
    session.currentShopLevel = null;  // BUG: facile à oublier
}

if (dist < 30 && !isShopActive) {
    // ...
}

if (isShopAfterThisLevel) {
    session.currentShopLevel = session.currentLevel;  // Gérer manuellement
    session.levelStartTime = Date.now() + SHOP_DURATION;
}
```

**Problèmes:**
- Logique de shop dispersée
- Facile d'oublier de réinitialiser `currentShopLevel`
- Difficile à debugger
- Code dupliqué dans chaque mode

### ✅ APRÈS (code simple et clair)

```javascript
// Nouveau code avec ShopManager
const shopManager = new ShopManager(gameMode);

// Dans la boucle principale
const isCollisionBlocked = shopManager.shouldBlockCollisions();

if (dist < 30 && !isCollisionBlocked) {
    // Collision acceptée
}

// Après avoir complété un niveau
if (shopManager.openShop(completedLevel)) {
    socket.emit('shopOpen', { items: gameMode.getShopItems() });
}
```

**Avantages:**
- Logique centralisée
- Plus de bug manqué
- Facile à déboguer (méthode `getState()`)
- Fonctionne partout

## 🔧 API Complète

### `new ShopManager(gameMode)`
Créer une instance avec un `GameMode`

```javascript
const shopManager = new ShopManager(new GameMode('solo'));
```

---

### `openShop(completedLevel, currentTime?)`
Ouvre le shop si ce niveau ouvre un shop dans la config du mode

**Retour:** `boolean` - true si le shop a été ouvert

```javascript
if (shopManager.openShop(5)) {
    console.log('Shop ouvert');  // Mode solo a shop au niveau 5
}

if (shopManager.openShop(3)) {
    console.log('Ceci ne s\'affichera pas');  // Mode solo n'a pas shop au niveau 3
}
```

---

### `shouldBlockCollisions()`
Vérifie si les collisions doivent être bloquées en ce moment

**Retour:** `boolean` - true si le shop est actif et bloque les collisions

```javascript
// Utiliser dans la boucle de jeu
if (!shopManager.shouldBlockCollisions()) {
    // Accepter la collision avec la gem
} else {
    // Bloquer la collision
}
```

**Note:** Ferme automatiquement le shop si la durée est écoulée

---

### `closeShop()`
Ferme manuellement le shop

```javascript
shopManager.closeShop();
```

---

### `getShopTimeRemaining()`
Récupère le temps restant du shop en millisecondes

**Retour:** `number` - ms restantes, ou 0 si fermé

```javascript
const remaining = shopManager.getShopTimeRemaining();
console.log(`Shop ferme dans ${remaining}ms`);
```

---

### `getState()`
Récupère l'état complet du shop (utile pour déboguer)

**Retour:** `object`
```javascript
{
    isActive: boolean,
    shopStartLevel: number|null,
    timeRemaining: number,
    modeId: string
}
```

**Exemple:**
```javascript
console.log(shopManager.getState());
// {
//   isActive: true,
//   shopStartLevel: 5,
//   timeRemaining: 12000,
//   modeId: 'solo'
// }
```

---

### `reset()`
Réinitialise complètement le shop

```javascript
shopManager.reset();
```

## 🧪 Exemples de Cas d'Usage

### Cas 1: Mode Solo Niveau 1-10 avec shops aux niveaux 5 et 10

```javascript
const gameMode = new GameMode('solo');
const shopManager = new ShopManager(gameMode);

// Niveau 1-4: pas de shop
for (let level = 1; level <= 4; level++) {
    const hasShop = shopManager.openShop(level);
    console.log(`Niveau ${level}: shop? ${hasShop}`);  // false
}

// Niveau 5: shop
const hasShop5 = shopManager.openShop(5);
console.log(`Niveau 5: shop? ${hasShop5}`);  // true

// Vérifier que les collisions sont bloquées
console.log(shopManager.shouldBlockCollisions());  // true

// Attendre la fin du shop (15000ms)
setTimeout(() => {
    console.log(shopManager.shouldBlockCollisions());  // false (auto-fermé)
}, 15100);
```

### Cas 2: Changer le mode (classic à infinite)

```javascript
const shopManager = new ShopManager(new GameMode('classic'));

// Classic: shop aux niveaux [5, 10, 15, 20, 25, 30]
console.log(shopManager.openShop(15));  // true

// Changer de mode
shopManager.reset();
shopManager = new ShopManager(new GameMode('infinite'));

// Infinite: shop aux niveaux [3, 6, 9, 12, 15]
console.log(shopManager.openShop(15));  // true

// Mais pas au niveau 20
console.log(shopManager.openShop(20));  // false
```

### Cas 3: Déboguer un problème de shop

```javascript
// Quelque chose ne va pas avec le shop?
console.log(shopManager.getState());

// Output utile:
// {
//   isActive: true,
//   shopStartLevel: 5,
//   timeRemaining: 12345,
//   modeId: 'solo'
// }

// Essayer de forcer la fermeture
shopManager.closeShop();
```

## 📁 Fichiers Importants

| Fichier | Responsabilité |
|---------|-----------------|
| `utils/ShopManager.js` | ✅ Logique du shop centralisée |
| `utils/GameMode.js` | Configuration du mode (niveaux de shop) |
| `config/gameModes.js` | Définition des niveaux de shop par mode |
| `server/game-loops/solo-loop.js` | ✅ Utilise ShopManager |

## 🎯 Résumé

**ShopManager = Une classe, une responsabilité**

- ✅ **Créer** avec `new ShopManager(gameMode)`
- ✅ **Ouvrir** avec `shopManager.openShop(completedLevel)`
- ✅ **Bloquer** avec `!shopManager.shouldBlockCollisions()`
- ✅ **Déboguer** avec `shopManager.getState()`

**C'est tout ce que vous devez savoir!**
