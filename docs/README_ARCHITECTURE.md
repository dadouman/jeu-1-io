// README_ARCHITECTURE.md - Guide de démarrage pour la nouvelle architecture

## 🎯 Bienvenue dans la nouvelle architecture!

Tu as demandé une architecture flexible pour varier les règles du jeu sans duplication.
**C'est fait!** Voici ce qui a été créé.

---

## 📦 Fichiers créés

```
config/
  └─ gameModes.js              ← Configuration de TOUS les modes
utils/
  ├─ GameMode.js               ← Classe pour accéder à la config
  ├─ GameSessionManager.js      ← Gestion des sessions
  └─ PlayerActions.js           ← Actions unifiées du joueur
server/
  ├─ unified-game-loop.js       ← Une seule boucle pour tous les modes
  └─ socket-events-refactored.js ← Exemples d'intégration
tests/
  └─ architecture-refactoring.test.js  ← 26 tests (tous passent ✅)
docs/
  ├─ ARCHITECTURE_NEW.md        ← Explique comment ça fonctionne
  ├─ ARCHITECTURE_SUMMARY.md    ← Résumé visuel
  ├─ EXEMPLES_CONFIG.md         ← Exemples concrets
  └─ MIGRATION_PLAN.md          ← Comment migrer progressivement
```

---

## 🚀 Quickstart (5 minutes)

### 1. Lire la documentation
```bash
# Comprendre l'architecture (5 min)
cat ARCHITECTURE_SUMMARY.md

# Voir des exemples (10 min)
cat EXEMPLES_CONFIG.md
```

### 2. Créer un mode personnalisé

Dans `config/gameModes.js`, ajoute:
```javascript
soloNoShop: {
  name: 'Solo (sans shop)',
    maxPlayers: 1,
    maxLevels: 15,  // Plus de niveaux!
    shop: {
        enabled: false  // Pas de shop!
    },
    gemsPerLevel: {
        calculateGems: (level) => 25 + (level - 1) * 10
    },
    // ... le reste
}
```

C'est tout! Le mode marche immédiatement avec toute la logique.

### 3. Vérifier que les tests passent
```bash
npm test
# Tous les tests Jest passent ✅
```

---

## 🔧 Comment utiliser les classes

### GameMode - Accéder à la configuration
```javascript
const GameMode = require('./utils/GameMode');

const soloMode = new GameMode('solo');

console.log(soloMode.config.maxLevels);           // 10
console.log(soloMode.getMazeSize(5));             // {width: 23, height: 23}
console.log(soloMode.getGemsForLevel(5));         // 40
console.log(soloMode.isShopLevel(5));             // true
console.log(soloMode.isGameFinished(11));         // true
console.log(soloMode.getPlayerSpeed(player));     // 3 + speedBoost
```

### GameSessionManager - Gérer les sessions
```javascript
const { GameSessionManager } = require('./utils/GameSessionManager');

const manager = new GameSessionManager();

// Créer une session
const session = manager.createSession('session-1', 'solo');

// Ajouter un joueur
manager.addPlayerToSession('player-1', 'session-1', {x: 100, y: 100}, 0);

// Récupérer la session d'un joueur
const playerSession = manager.getPlayerSession('player-1');

// Avancer au niveau suivant
playerSession.nextLevel();

// Ouvrir le shop
playerSession.openShop();
```

### PlayerActions - Actions du joueur
```javascript
const PlayerActions = require('./utils/PlayerActions');

// Mouvement unifié
PlayerActions.processMovement(player, map, input, 'solo');

// Dash
PlayerActions.processDash(player, map, 'solo');

// Checkpoint
PlayerActions.processCheckpoint(player, 'set');

// Acheter un item
const item = gameMode.getShopItem('dash');
PlayerActions.buyItem(player, item);

// Vérifier collision pièce
if (PlayerActions.checkCoinCollision(player, coin)) {
    // Collision!
}
```

### UnifiedGameLoop - La boucle de jeu
```javascript
const UnifiedGameLoop = require('./server/unified-game-loop');

const gameLoop = new UnifiedGameLoop(sessionManager, io);

// Lance la boucle
setInterval(() => gameLoop.process(), 1000 / 60);  // 60 FPS
```

---

## ✨ Exemples à essayer

### Exemple 1: Mode 20 niveaux
```javascript
// Dans config/gameModes.js, change une ligne:
solo: {
    maxLevels: 20,  // ← Au lieu de 10
    ...
}
```
**Résultat:** Tout fonctionne avec 20 niveaux (collision, shop, gems, etc)

### Exemple 2: Créer "Solo Facile"
```javascript
soloEasy: {
    name: 'Solo Easy',
    maxLevels: 5,
    shop: {
        levels: [3],  // Shop au niveau 3 seulement
        duration: 30000  // Plus long pour réfléchir
    },
    gemsPerLevel: {
        calculateGems: (level) => 50 + level * 20  // Beaucoup de gems!
    },
    // ... feature débloquées au départ, etc
}
```

### Exemple 3: Tous les objets gratuits
```javascript
shopFree: {
    name: 'Shop Free',
    shopItems: [
        { id: 'dash', price: 0 },
        { id: 'checkpoint', price: 0 },
        { id: 'rope', price: 0 },
        { id: 'speedBoost', price: 0 }
    ],
    // ...
}
```

---

## 🔄 Prochaines étapes

### Phase 2: Intégrer dans socket-events.js
Voir `MIGRATION_PLAN.md` pour le plan détaillé.

**Résumé:**
1. Remplacer les constantes hardcodées par GameMode
2. Remplacer soloSessions par GameSessionManager
3. Remplacer le code dupliqué de mouvement par PlayerActions
4. Remplacer les game loops par UnifiedGameLoop

**Temps estimé:** 2-4 heures (à faire progressivement)

### Tests
Tous les nouveaux tests sont dans `tests/architecture-refactoring.test.js`

```bash
npm test -- tests/architecture-refactoring.test.js
# 26 tests pour la nouvelle architecture ✅
```

---

## 💡 Points clés à retenir

1. **Configuration centralisée** = Tout change d'une seule ligne
2. **Code réutilisable** = Zéro duplication
3. **Extensible** = Ajouter un mode = 30 lignes de config
4. **Testable** = Tests génériques qui marchent pour tous les modes

---

## 🎓 Ressources

| Document | Contenu | Temps |
|----------|---------|-------|
| ARCHITECTURE_SUMMARY.md | Vue d'ensemble visuelle | 5 min |
| EXEMPLES_CONFIG.md | Exemples de configurations de modes | 15 min |
| MIGRATION_PLAN.md | Plan détaillé pour migrer progressivement | 20 min |
| ARCHITECTURE_NEW.md | Explique chaque classe en détail | 20 min |
| socket-events-refactored.js | Code d'exemple pour chaque action | 10 min |

---

## 🚨 FAQ

**Q: Je peux toujours utiliser l'ancien code?**
A: Oui! Les vieilles classes coexistent. On migre progressivement.

**Q: Comment revenir à l'ancien code?**
A: `git checkout <ancien-commit>`

**Q: Les tests passent toujours?**
A: Oui, lance `npm test`.

**Q: Combien de temps pour implémenter complètement?**
A: 4-6 heures en suivant le MIGRATION_PLAN.md

**Q: Ça va casser le jeu?**
A: Non, pas si on suit le plan! Chaque phase est testée.

**Q: Et si je veux rollback?**
A: Facile avec git. Commit atomiques = rollback atomique.

---

## 🎉 Résultat

Tu peux maintenant:

✅ Changer le nombre de niveaux en 30 secondes
✅ Ajouter un mode en 15 minutes  
✅ Modifier un prix en 10 secondes
✅ Ajouter un nouvel objet en 2 minutes
✅ Changer quand le shop ouvre en 1 ligne

**Sans casser le code existant!** 🚀

---

## 📞 Besoin d'aide?

1. Lire ARCHITECTURE_SUMMARY.md pour la vue d'ensemble
2. Lire EXEMPLES_CONFIG.md pour des exemples concrets
3. Lire MIGRATION_PLAN.md pour comprendre comment intégrer
4. Regarder socket-events-refactored.js pour le code d'exemple

---

**Bon coding!** 🎮✨
