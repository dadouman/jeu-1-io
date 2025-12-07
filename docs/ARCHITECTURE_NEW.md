// ARCHITECTURE.md - Nouvelle architecture flexible

## 🎯 Vue d'ensemble

La nouvelle architecture permet de varier les règles du jeu facilement sans duplicater le code:

```
┌─────────────────────────────────────────────────────────────┐
│                   config/gameModes.js                        │
│  Défini tous les modes (classic, infinite, solo, solo20...) │
│  - Nombre de niveaux                                         │
│  - Nombre de joueurs max                                     │
│  - Quand les shops ouvrent                                   │
│  - Prix de chaque objet                                      │
│  - Objets achetables                                         │
│  - Gems par niveau                                           │
│  - Features débloquées au départ                             │
│  - Paramètres de mouvement                                   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   utils/GameMode.js                          │
│  Classe abstraite qui lit la config et expose les méthodes:  │
│  - getMazeSize(level)                                        │
│  - getGemsForLevel(level)                                    │
│  - isShopLevel(level)                                        │
│  - getShopItems()                                            │
│  - getPlayerSpeed(player)                                    │
│  - isGameFinished(level)                                     │
│  - ... et autres                                             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│            utils/GameSessionManager.js                       │
│  Gère les sessions de manière uniforme:                      │
│  - GameSession: une session = un mode + ses joueurs         │
│  - GameSessionManager: gestionnaire global                   │
│  - Crée/récupère/supprime des sessions                       │
│  - Traite l'avancement au prochain niveau                    │
│  - Ouvre les shops                                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                utils/PlayerActions.js                        │
│  Utilitaires pour les actions du joueur:                     │
│  - processMovement() - Mouvement uniforme                    │
│  - processDash() - Dash uniforme                             │
│  - processCheckpoint() - Checkpoint unifié                   │
│  - checkCoinCollision() - Collision pièce                    │
│  - buyItem() - Achat d'item unifié                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│            server/unified-game-loop.js                       │
│  Une seule boucle de jeu pour tous les modes:                │
│  - Vérifie collisions pièce                                  │
│  - Gère progression (niveaux)                                │
│  - Ouvre le shop au moment configuré                         │
│  - Gère fin de jeu                                           │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Exemples d'utilisation

### Créer une session
```javascript
const { GameSessionManager } = require('./utils/GameSessionManager');

const manager = new GameSessionManager();
const session = manager.createSession('session-123', 'solo');  // ou 'classic', 'infinite'
const player = manager.addPlayerToSession('player-1', 'session-123', {x: 100, y: 100}, 0);
```

### Traiter le mouvement
```javascript
const PlayerActions = require('./utils/PlayerActions');

PlayerActions.processMovement(player, map, input, 'solo');
// Ça fonctionne pour TOUS les modes, zéro duplication
```

### Acheter un item
```javascript
const session = manager.getPlayerSession('player-1');
const item = session.gameMode.getShopItem('dash');
const result = PlayerActions.buyItem(player, item);
```

## 🔧 Changer les règles du jeu

### Augmenter le nombre de niveaux en solo

**Avant:** Faut changer `const maxLevel = 10` dans solo-loop.js, socket-events.js, tests, etc.

**Après:** Dans `config/gameModes.js`, change une ligne:
```javascript
solo: {
    name: 'Solo',
    maxLevels: 20,  // ← 10 devient 20, c'est tout!
    ...
}
```

### Créer un mode solo30 (30 niveaux)

Ajoute dans `config/gameModes.js`:
```javascript
solo30: {
    name: 'Solo 30',
    description: 'Mode solo - 30 niveaux speedrun',
    maxPlayers: 1,
    maxLevels: 30,  // ← 30 niveaux
    levelConfig: {
        calculateSize: (level) => {
            const sizes = [15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
            return {
                width: sizes[Math.min(level - 1, sizes.length - 1)],
                height: sizes[Math.min(level - 1, sizes.length - 1)]
            };
        }
    },
    shop: {
        enabled: true,
        levels: [5, 10, 15, 20, 25, 30],  // ← Shops à ces niveaux
        duration: 15000,
    },
    // ... le reste copie from solo
}
```

Et c'est **tout** ! Pas besoin de modifier le code de collision, mouvement, shop, etc.

### Ajouter un objet au shop

Dans `config/gameModes.js`, dans la section `shopItems`:
```javascript
shopItems: [
    // ...
    {
        id: 'invincible',
        name: 'Invincibilité',
        price: 100,
        description: 'Ignore les murs pendant 5 secondes',
        type: 'feature'
    }
]
```

### Changer le prix d'un objet

Cherche dans `config/gameModes.js`:
```javascript
{
    id: 'dash',
    name: 'Dash',
    price: 20,  // ← Change cette valeur
    ...
}
```

### Changer quand le shop ouvre

Dans la config du mode:
```javascript
shop: {
    enabled: true,
    levels: [5, 10, 15, 20],  // ← Ouvre après ces niveaux
    duration: 15000,
}
```

### Changer le nombre de gems par niveau

```javascript
gemsPerLevel: {
    calculateGems: (level) => {
        return 20 + (level - 1) * 10;  // ← Formule custom
    }
}
```

## 🚀 Avantages

| Avant | Après |
|-------|-------|
| Code dupliqué partout | Zéro duplication |
| Changer 10→20 niveaux = chercher partout | Changer 1 ligne dans la config |
| Ajouter un mode = copier/coller 500 lignes | Ajouter un mode = 20 lignes dans config |
| Tester tous les modes = tests séparés | Tester avec la même logique |
| Impossible de varier les règles | Flexible à 100% |

## 📋 À faire

1. ✅ Créer `config/gameModes.js`
2. ✅ Créer `utils/GameMode.js`
3. ✅ Créer `utils/GameSessionManager.js`
4. ✅ Créer `utils/PlayerActions.js`
5. ✅ Créer `server/unified-game-loop.js`
6. 🔄 Intégrer dans `server/socket-events.js` (progressivement)
7. 🔄 Adapter les tests
8. 🔄 Remplacer les anciennes game loops

## 🛠️ Comment intégrer

### Étape 1: Mettre à jour server.js
```javascript
const { GameSessionManager } = require('./utils/GameSessionManager');
const UnifiedGameLoop = require('./server/unified-game-loop');

const sessionManager = new GameSessionManager();
const gameLoop = new UnifiedGameLoop(sessionManager, io);

setInterval(() => gameLoop.process(), 1000 / 60);  // 60 FPS
```

### Étape 2: Mettre à jour socket-events.js progressivement

Voir `socket-events-refactored.js` pour les exemples de chaque action (movement, dash, shop, etc.)

### Étape 3: Adapter les tests

Les tests peuvent maintenant juste tester les classes GameMode, GameSessionManager, PlayerActions
sans dupliquer la logique pour chaque mode.
