# 📂 Structure des Fichiers Frontend

## 🎯 Organisation du Dossier `Public/`

Le dossier `Public/` contient tous les fichiers du client (HTML, CSS, JavaScript).

### 📋 Fichiers HTML & CSS

| Fichier | Description |
|---------|------------|
| **index.html** | Fichier HTML principal minimaliste qui charge tous les resources |
| **styles.css** | Feuille de styles centralisée pour l'ensemble du jeu |
| **ui-elements.html** | Éléments UI réutilisables (mode selector, contrôles mobiles) |

### 🎮 Modules JavaScript (Ordre de Chargement)

**Important:** L'ordre de chargement est critique pour que les dépendances soient correctes.

#### 1. **mode-selector.js** (126 lignes)
- Gère la sélection des modes de jeu avant le démarrage
- Calcule les dimensions du labyrinthe selon le mode
- Calcule le zoom adaptatif pour chaque mode
- Expose: `selectMode()`, `calculateMazeSize()`, `calculateZoomForMode()`, `isGameFinished()`, `getShopItemsForMode()`
- **Charge avant:** game-state.js

#### 2. **game-state.js** (56 lignes)
- Centralisé toutes les variables d'état du jeu
- Gère: carte, joueurs, niveau, checkpoints, trails, magasin, votes, transitions
- **Dépendances:** Aucune
- **Utilisé par:** Tous les autres modules

#### 3. **renderer.js** (401 lignes)
- Moteur de rendu Canvas avec transformations de zoom
- Affiche: carte, joueurs, trails, UI (vies, level timer, vote, shop, podium)
- Gère les transformations de caméra centrée sur le joueur
- **Dépendances:** game-state.js
- **Utilisé par:** game-loop.js

#### 4. **socket-events.js** (125 lignes)
- Gère tous les événements Socket.io du serveur
- Événements: mapData, levelUpdate, highScore, shopOpen/Purchase, votes, gameRestart, gameModSelected
- Met à jour game-state en fonction des événements
- **Dépendances:** game-state.js, Socket.io
- **Utilisé par:** Client en général

#### 5. **keyboard-input.js** (74 lignes)
- Gère l'entrée clavier et la boucle de mouvement à 60 FPS
- Touches: Flèches (mouvement), Espace (checkpoint), R (téléport), Shift (dash), P/O/N (votes)
- Boutiques: 1-4 (achats)
- Émet des événements Socket pour les actions
- **Dépendances:** game-state.js, Socket.io
- **Utilisé par:** game-loop.js

#### 6. **game-loop.js** (79 lignes)
- Boucle principale de rendu (60 FPS via requestAnimationFrame)
- Gère le zoom dynamique selon le mode
- Effectue les appels de rendu
- **Dépendances:** game-state.js, renderer.js, mode-selector.js (optionnel)
- **Utilisé par:** client.js

#### 7. **client.js** (20 lignes)
- Point d'entrée minimal du client
- Configure le canvas
- Gère les événements de redimensionnement
- Lance la boucle de jeu et l'entrée clavier
- **Dépendances:** game-loop.js, keyboard-input.js
- **Utilisé par:** index.html (dernier script)

#### 8. **mobile-controls.js** (127 lignes)
- Gère les contrôles tactiles pour mobile
- Détecte les appareils mobiles
- Configure les boutons D-Pad et d'action
- Émet les mêmes événements que le clavier
- **Dépendances:** game-state.js, Socket.io
- **Utilisé par:** index.html (dernier script)

### 📊 Diagramme de Dépendances

```
index.html
├── styles.css
├── Socket.io
└── Scripts (dans l'ordre):
    1. mode-selector.js (indépendant)
    2. game-state.js (dépendances: aucune)
    3. renderer.js (dépendances: game-state)
    4. socket-events.js (dépendances: game-state, Socket.io)
    5. keyboard-input.js (dépendances: game-state, Socket.io)
    6. game-loop.js (dépendances: game-state, renderer, mode-selector*)
    7. client.js (dépendances: game-loop, keyboard-input)
    8. mobile-controls.js (dépendances: game-state, Socket.io)

* mode-selector optionnel avec fallback
```

### 🎯 Avantages de cette Structure

✅ **Séparation des Préoccupations**
- HTML, CSS et JavaScript séparés
- Chaque module a une responsabilité unique

✅ **Maintenabilité**
- Facile de trouver et modifier une fonctionnalité spécifique
- Styles centralisés pour éviter les doublons

✅ **Performance**
- Styles et JavaScript minifiables/compressibles
- Caching efficace des assets statiques

✅ **Évolutivité**
- Ajouter de nouveaux modes ou fonctionnalités sans toucher aux modules existants
- UI-elements.html peut être remplacé ou étendu

### 🔧 Modification et Extension

**Pour ajouter une nouvelle fonctionnalité:**

1. **Nouvelle UI?** → Ajouter au CSS dans `styles.css` et éléments dans `ui-elements.html`
2. **Nouveau module?** → Créer `module-name.js` et charger dans `index.html`
3. **Événement Socket?** → Ajouter dans `socket-events.js`
4. **Nouvelle entrée utilisateur?** → Ajouter dans `keyboard-input.js` ou `mobile-controls.js`

### 📝 Notes Importantes

- **Ordre de chargement CRITIQUE:** Respecter l'ordre dans index.html
- **game-state.js toujours disponible:** Tous les modules l'utilisent
- **Socket.io requis:** Charger avant les modules qui l'utilisent
- **Tests:** Tous les tests passent (125 tests, 15 suites)
