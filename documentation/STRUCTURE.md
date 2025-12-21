# 🏗️ Structure du Projet

```
Mon jeu .io/
│
├── 📚 docs/                        # Documentation complète
│   ├── README.md                   # Index des docs
│   ├── INDEX.md                    # Navigation guidée
│   ├── SYNTHESE.md                 # Résumé complet
│   ├── ARCHITECTURE_SUMMARY.md     # Diagrammes
│   ├── ARCHITECTURE_NEW.md         # Détails complets
│   ├── README_ARCHITECTURE.md      # Guide d'utilisation
│   ├── SHOPMANAGER.md              # Gestion du shop
│   ├── EXEMPLES_CONFIG.md          # 5 exemples de modes
│   ├── MIGRATION_PLAN.md           # Plan d'intégration
│   ├── README_GAMEPLAY.md          # Contrôles du jeu
│   └── CODE_QUALITY_REPORT.md      # Rapport de qualité
│
├── 🔧 scripts/                     # Utilitaires
│   ├── README.md                   # Guide des scripts
│   └── resetScore.js               # Reset des scores
│
├── ⚙️  config/                     # Configuration centralisée
│   └── gameModes.js                # Config de TOUS les modes
│
├── 🛠️  utils/                      # Utilitaires partagés
│   ├── GameMode.js                 # Classe pour accéder à la config
│   ├── GameSessionManager.js       # Gestion des sessions
│   ├── PlayerActions.js            # Actions du joueur unifiées
│   ├── ShopManager.js              # Gestion du shop
│   ├── map.js                      # Génération de labyrinthes
│   ├── player.js                   # Initialisation joueur
│   ├── shop.js                     # Logique du shop
│   ├── gems.js                     # Gestion des gems
│   ├── collisions.js               # Détection de collisions
│   └── ... (autres utilitaires)
│
├── 🖥️  server/                     # Code serveur
│   ├── index.js                    # Configuration du serveur
│   ├── config.js                   # Config serveur
│   ├── socket-events.js            # Handlers WebSocket (ancien)
│   ├── socket-events-refactored.js # Exemple d'utilisation nouvelle arch
│   ├── unified-game-loop.js        # Boucle de jeu unifiée
│   ├── game-loop.js                # Boucle classique
│   ├── game-loops/
│   │   ├── lobby-loop.js           # Boucle du lobby
│   │   ├── solo-loop.js            # Boucle solo
│   │   └── ... (autres boucles)
│   └── utils/
│       ├── solo-utils.js
│       └── ... (utilitaires serveur)
│
├── 🌐 Public/                      # Code client (front)
│   ├── index.html                  # Page principale
│   ├── styles.css                  # Styles
│   ├── client.js                   # Client principal
│   ├── renderer.js                 # Rendu du jeu
│   ├── game-loop.js                # Boucle client
│   ├── game-state.js               # État du jeu
│   ├── keyboard-input.js           # Gestion clavier
│   ├── mobile-controls.js          # Contrôles mobile
│   ├── socket-events.js            # Handlers WebSocket client
│   ├── mode-selector.js            # Sélection du mode
│   ├── ui-elements.html            # Éléments UI
│   └── ... (autres fichiers front)
│
├── 🧪 tests/                       # Tests (Jest)
│   ├── architecture-refactoring.test.js
│   ├── shop-manager.test.js
│   ├── solo-*.test.js              # Tests mode solo
│   ├── socket-*.test.js            # Tests sockets
│   └── ...
│
├── 📦 Fichiers Racine
│   ├── README.md                   # ← Vous êtes ici! Guide principal
│   ├── server.js                   # Point d'entrée serveur
│   ├── package.json                # Dépendances
│   ├── package-lock.json           # Lock des dépendances
│   └── .gitignore                  # Fichiers ignorés Git
│
└── 🔐 Autres
    ├── .git/                       # Git history
    ├── .github/                    # GitHub config
    └── node_modules/               # Dépendances installées
```

## 📋 Résumé

| Dossier | Responsabilité | Fichiers |
|---------|-----------------|----------|
| **docs/** | 📚 Documentation complète | 10 fichiers .md |
| **scripts/** | 🔧 Utilitaires dev | 1+ scripts |
| **config/** | ⚙️ Configuration centralisée | gameModes.js |
| **utils/** | 🛠️ Logique partagée | 15+ fichiers |
| **server/** | 🖥️ Backend Node.js | 10+ fichiers |
| **Public/** | 🌐 Frontend client | 12+ fichiers |
| **tests/** | 🧪 Tests (Jest) | - |

## 🎯 Points Clés

### Nouvelle Architecture
- **Centralisée** - Une logique = Un endroit
- **Flexible** - Changer les règles = 1 ligne
- **Testée** - Suite de tests Jest pour valider

### Structure Logique
- **docs/** - TOUT ce que vous devez savoir
- **config/** - OÙ changer les règles
- **utils/** - COMMENT fonctionne le jeu
- **server/** + **Public/** - CODE du jeu

### Accès Rapide
| Vous voulez | Regardez |
|-------------|----------|
| Créer un mode | `config/gameModes.js` |
| Modifier le shop | `utils/ShopManager.js` |
| Comprendre l'arch | `docs/INDEX.md` |
| Voir un exemple | `docs/EXEMPLES_CONFIG.md` |

---

**ProTip:** Commencez par [`docs/README.md`](docs/README.md) pour la navigation guidée! 🚀
