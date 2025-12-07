// EXEMPLES_CONFIG.md - Guide d'utilisation pratique de la nouvelle architecture

## 🎮 Exemples Pratiques

### Exemple 1: Changer solo de 10 à 20 niveaux

**Avant (l'ancienne manière - trop de changements):**
```javascript
// Dans solo-loop.js: const maxLevel = 10; → const maxLevel = 20;
// Dans socket-events.js: const maxLevel = 10; → const maxLevel = 20;
// Dans tests: partout où 10 était le max
// Dans renderer.js: affichage du niveau "10 → 20"
// = Risque de oublier un endroit
```

**Après (la nouvelle manière - UNE LIGNE):**
```javascript
// Dans config/gameModes.js
solo: {
    name: 'Solo',
    maxLevels: 20,  // ← Changé de 10 à 20, c'est tout!
    ...
}
```

Le code entier utilise `gameMode.config.maxLevels` ou `gameMode.isGameFinished(level)`, donc ça marche partout.

---

### Exemple 2: Créer un mode "Solo Hardcore" avec des règles différentes

**Nouveau mode: Solo Hardcore**
- 15 niveaux (au lieu de 10)
- Pas de shop (plus difficile)
- Plus de gems par niveau
- Les objets coûtent plus cher

**Dans `config/gameModes.js`, ajoute:**

```javascript
soloHardcore: {
    name: 'Solo Hardcore',
    description: 'Mode solo difficile - 15 niveaux, pas de shop',
    maxPlayers: 1,
    maxLevels: 15,  // ← Plus de niveaux
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
        enabled: false,  // ← PAS DE SHOP!
        levels: [],
        duration: 15000,
    },

    shopItems: [],  // Pas utilisé puisque shop désactivé

    gemsPerLevel: {
        calculateGems: (level) => {
            return 25 + (level - 1) * 10;  // ← Plus de gems
        }
    },

    startingFeatures: {
        dash: true,
        checkpoint: true,
        rope: true,
        speedBoost: 0
    },

    movement: {
        baseSpeed: 3,
        speedBoostIncrement: 1,
        wallCollisionDistance: 30
    },

    transitionDuration: 0,
    
    voting: { enabled: false },

    speedrun: {
        enabled: true,
        trackSplitTimes: true,
        trackPersonalBest: true,
        trackWorldRecord: true,
        leaderboard: true
    }
}
```

Et voilà! Le mode marche immédiatement avec toute la logique (collision, mouvement, gems, etc.)

---

### Exemple 3: Mode "Shop Paradise" - tout est gratuit

```javascript
shopParadise: {
    name: 'Shop Paradise',
    description: 'Mode infini avec shop gratuit à chaque niveau',
    maxPlayers: 4,
    maxLevels: Infinity,
    
    levelConfig: { ... },

    shop: {
        enabled: true,
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],  // Shop à CHAQUE niveau!
        duration: 10000,  // Plus court
    },

    shopItems: [
        {
            id: 'dash',
            name: 'Dash',
            price: 0,  // ← GRATUIT!
            description: 'Accélération rapide',
            type: 'feature'
        },
        {
            id: 'checkpoint',
            name: 'Checkpoint',
            price: 0,  // ← GRATUIT!
            description: 'Sauvegarde ta position',
            type: 'feature'
        },
        // ... tous gratuits
    ],

    gemsPerLevel: {
        calculateGems: (level) => {
            return 0;  // Pas besoin de gems si tout est gratuit
        }
    },

    startingFeatures: {
        dash: false,
        checkpoint: false,
        rope: false,
        speedBoost: 0
    },
    // ... le reste normal
}
```

---

### Exemple 4: Mode "Classique Ultra Difficile" - objets très chers

```javascript
classicUltra: {
    name: 'Classic Ultra',
    description: 'Mode classique où tout est extrêmement cher',
    maxPlayers: 8,
    maxLevels: Infinity,
    
    levelConfig: { ... },

    shop: {
        enabled: true,
        levels: [5, 10, 15, 20, 25, 30, 35, 40],
        duration: 15000,
    },

    shopItems: [
        {
            id: 'dash',
            name: 'Dash',
            price: 200,  // ← 10x plus cher!
            description: 'Accélération rapide',
            type: 'feature'
        },
        {
            id: 'checkpoint',
            name: 'Checkpoint',
            price: 300,  // ← 10x plus cher!
            description: 'Sauvegarde ta position',
            type: 'feature'
        },
        {
            id: 'rope',
            name: 'Rope',
            price: 250,
            description: 'Trace une corde derrière toi',
            type: 'feature'
        },
        {
            id: 'speedBoost',
            name: 'Vitesse +1',
            price: 150,  // ← Plus cher
            description: 'Augmente ta vitesse',
            type: 'speedBoost',
            stackable: true
        },
        // Nouveau: Invincibilité (coûteux!)
        {
            id: 'invincibility',
            name: 'Invincibilité 5s',
            price: 500,  // ← Très cher
            description: 'Ignore les murs pendant 5 secondes',
            type: 'feature'
        }
    ],

    gemsPerLevel: {
        calculateGems: (level) => {
            // Gems RARES - faut vraiment les chercher
            return Math.max(5, 5 + (level - 1) * 2);
        }
    },

    startingFeatures: {
        dash: false,
        checkpoint: false,
        rope: false,
        speedBoost: 0,
        invincibility: false
    },

    movement: {
        baseSpeed: 3,  // Mouvement normal
        speedBoostIncrement: 1,
        wallCollisionDistance: 30
    },

    transitionDuration: 5000,
    
    voting: {
        enabled: true,
        voteDuration: 10000
    }
}
```

---

### Exemple 5: Mode "Multiplayer Race" - compétition avec règles strictes

```javascript
multiplayerRace: {
    name: 'Multiplayer Race',
    description: 'Mode compétitif - premiers au niveau 10 gagne!',
    maxPlayers: 16,  // ← Beaucoup de joueurs!
    maxLevels: 10,   // ← Court, intense
    
    levelConfig: {
        calculateSize: (level) => {
            // Mazes PLUS PETITS pour que ce soit plus rapide
            const sizes = [13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
            return {
                width: sizes[Math.min(level - 1, sizes.length - 1)],
                height: sizes[Math.min(level - 1, sizes.length - 1)]
            };
        }
    },

    shop: {
        enabled: true,
        levels: [5],  // ← Shop UNIQUE au niveau 5
        duration: 8000,  // ← TRÈS COURT
    },

    shopItems: [
        // Peu d'items pour les choix stratégiques
        {
            id: 'dash',
            name: 'Dash',
            price: 50,
            description: 'Accélération rapide',
            type: 'feature'
        },
        {
            id: 'speedBoost',
            name: 'Vitesse +1',
            price: 40,
            description: 'Augmente ta vitesse',
            type: 'speedBoost',
            stackable: true
        }
    ],

    gemsPerLevel: {
        calculateGems: (level) => {
            // BEAUCOUP de gems pour la stratégie
            return 100 + (level - 1) * 50;
        }
    },

    startingFeatures: {
        dash: false,
        checkpoint: false,
        rope: false,
        speedBoost: 0
    },

    movement: {
        baseSpeed: 4,  // ← PLUS RAPIDE!
        speedBoostIncrement: 2,  // ← BOOST PUISSANT!
        wallCollisionDistance: 30
    },

    transitionDuration: 2000,  // ← Transition très rapide
    
    voting: {
        enabled: false  // Pas de vote, on joue!
    }
}
```

---

## 🔧 Comment utiliser ces modes

### Dans socket-events.js:

```javascript
socket.on('selectMode', (mode) => {
    // Le système fonctionne EXACTEMENT PAREIL pour TOUS les modes!
    const sessionManager = io.sessionManager;
    const session = sessionManager.createSession(sessionId, mode);
    
    // Boom! Tout marche:
    // - Collision pièces avec le bon nombre de niveaux
    // - Shop qui ouvre au bon moment avec les bons items
    // - Gems avec la bonne formule
    // - Mazes de la bonne taille
    // - etc
});
```

### Dans le code client (pas de changements!):

```javascript
// Ça affiche TOUJOURS le niveau et progress correctement
const maxLevel = state.maxLevels;
const progress = (state.currentLevel / maxLevel) * 100;
```

---

## 📊 Tableau comparatif

| Aspect | Avant | Après |
|--------|-------|-------|
| Changer 10→20 niveaux | Chercher partout | 1 ligne à changer |
| Ajouter un mode | Copier/coller 500+ lignes | Ajouter 30 lignes config |
| Ajouter un item | Plusieurs fichiers | 1 objet dans config |
| Changer le prix d'un item | Chercher et remplacer | 1 nombre |
| Changer quand le shop ouvre | Faut bien connaitre le code | Un array dans config |
| Risque de bugs | TRÈS haut (duplication) | Très bas (centralisé) |
| Temps d'implémentation | 2-3 heures par mode | 15 minutes par mode |

---

## 💡 Astuces

### Formules dynamiques pour les gems

```javascript
// Croissance lente
gemsPerLevel: {
    calculateGems: (level) => 10 + level
}

// Croissance exponentielle
gemsPerLevel: {
    calculateGems: (level) => Math.pow(level, 1.5)
}

// Paliers
gemsPerLevel: {
    calculateGems: (level) => {
        if (level <= 5) return 20;
        if (level <= 10) return 40;
        if (level <= 15) return 60;
        return 100;
    }
}
```

### Formules pour la taille du maze

```javascript
// Croissance lente
levelConfig: {
    calculateSize: (level) => ({
        width: 15 + level,
        height: 15 + level
    })
}

// Paliers
levelConfig: {
    calculateSize: (level) => {
        if (level <= 5) return { width: 15, height: 15 };
        if (level <= 10) return { width: 21, height: 21 };
        return { width: 31, height: 31 };
    }
}
```

### Items conditionnels par niveau

```javascript
shopItems: [
    {
        id: 'dash',
        name: 'Dash',
        price: 20,
        type: 'feature',
        availableFromLevel: 1  // Dès le niveau 1
    },
    {
        id: 'teleport',
        name: 'Téléportation',
        price: 100,
        type: 'feature',
        availableFromLevel: 10  // Seulement à partir du niveau 10
    }
]
```

---

## 🚀 Prochaines étapes

1. Intégrer complètement dans socket-events.js
2. Remplacer les anciennes game loops (lobby-loop.js, solo-loop.js)
3. Adapter l'UI pour afficher les infos correctement
4. Créer des modes community (partage de config)
