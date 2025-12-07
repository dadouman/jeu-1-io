# 🎮 Rogue-Like .io - Le Jeu Collaboratif du Labyrinthe

Bienvenue dans **Rogue-Like .io**, un jeu multijoueur temps réel où tu explores des labyrinthes procéduraux, collectionne les pièces et affrontes tes amis dans une aventure sans fin !

## 🌟 Principe du Jeu

Tu explores un labyrinthe infini qui **grandit à chaque niveau**. Chaque pièce ramassée te propulse dans un nouveau monde plus grand et plus complexe. Les autres joueurs aussi sont dans le même labyrinthe - compétition directe !

**C'est simple :** 
- 🎯 Ramasse les pièces 💎
- 📈 Monte de niveau
- 👻 Sois plus rapide que tes potes
- 🏆 Établis le meilleur score

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| **↑ ↓ ← →** | Se déplacer (mouvement diagonal supporté) |
| **ESPACE** | Créer/Déplacer un checkpoint 🚩 |
| **R** | Téléporter au checkpoint |
| **SHIFT** | Dash (propulsion rapide) |
| **1-4** | Acheter des items au shop |
| **P** | Proposer un vote pour redémarrer |
| **O** | Voter OUI au redémarrage |
| **N** | Voter NON au redémarrage |

## ✨ Fonctionnalités

### 🗺️ Labyrinthes Procéduraux
- Chaque niveau génère un nouveau labyrinthe unique
- La taille augmente progressivement (15x15 → 27x27 → ...)
- Pas deux parties identiques !

### 👥 Multijoueur Temps Réel
- Joue avec tes amis **en même temps**
- Vois les autres joueurs et leur skin unique
- Compétition directe pour les pièces
- WebSocket pour une synchronisation instantanée

### 🚩 Système de Checkpoint (Achetable)
- Crée un point de sauvegarde avec **ESPACE**
- Déplace-le à volonté en rappuyant sur **ESPACE**
- Téléporte-toi au checkpoint avec **R**
- **Doit être acheté au shop** pour fonctionner

### 🔥 Dash Achetable
- Propulsion rapide avec **SHIFT**
- Permet de traverser des zones rapidement
- **Doit être acheté au shop** pour fonctionner

### 🪢 Traces de Mouvement (Rope - Achetable)
- Chaque joueur laisse une **trace colorée** quand activée
- 10 couleurs différentes pour distinguer les joueurs
- Visible par tous pour suivre la stratégie
- **Doit être acheté au shop** pour être affiché
- Disparaît au changement de niveau

### 💎 Système de Gems et Shop
- Collectionne des **Gems** en ramassant des pièces
- **Shop automatique** qui s'ouvre après chaque niveau
- **15 secondes** pour faire tes achats
- Items disponibles :
  - **Checkpoint** : Déverrouille la mécanique de checkpoint
  - **Dash** : Déverrouille le dash
  - **Rope** : Active l'affichage des traces
  - **Speed Boost** : Augmente la vitesse de mouvement
- Les features restent actives pour les niveaux suivants

### 🏆 Système de Score
- Ramasse les pièces pour augmenter ton score
- Le **record global** est affiché et sauvegardé
- Vois ton niveau actuel et celui des autres
- Podium après chaque niveau avec les 3 meilleurs

### 🎭 Skins Aléatoires
- 12 emojis différents pour personnaliser ton joueur
- Chaque connexion te donne un skin aléatoire
- Sois 👻, 🤖, 🦄, 🐷 ou même 💩 !

### ⏱️ Timing et Transitions
- **Affichage du temps** du niveau en haut de l'écran
- **Transition spéciale** au niveau 1 montrant les joueurs connectés
- Zoom progressif de la caméra (+2% par niveau)
- Écran de transition après chaque niveau avec podium

### 🗳️ Système de Vote pour Redémarrer
- N'importe quel joueur peut proposer un redémarrage avec **P**
- Autres joueurs votent avec **O** (OUI) ou **N** (NON)
- **60 secondes maximum** pour voter
- Vote validé **immédiatement** dès qu'une majorité est atteinte
- Affichage du vote en bas de l'écran avec compte-à-rebours
- Écran de résultat après le vote (✅ ou ❌)
- En cas de succès : transition de début de partie

### 🎨 Interface Améliorée
- **Brouillard de guerre** circulaire : tu ne vois que ta zone
- Vue centrée sur ton personnage avec **zoom progressif**
- **Score et niveau** en temps réel
- **Affichage du meilleur score** de tous les temps
- **Contrôles affichés** en bas (adjectent aux features achetées)

## 🏗️ Architecture

```
├── server.js              # Serveur principal (Socket.io, logique de jeu)
├── public/
│   ├── index.html         # Page d'accueil
│   ├── client.js          # Point d'entrée principal
│   ├── game-state.js      # Variables d'état du jeu (centralisées)
│   ├── socket-events.js   # Tous les événements Socket.io
│   ├── keyboard-input.js  # Gestion des entrées clavier
│   ├── game-loop.js       # Boucle de rendu principale
│   ├── renderer.js        # Affichage du jeu (Canvas)
│   └── mobile-controls.js # Contrôles tactiles
├── utils/
│   ├── map.js             # Génération de labyrinthes
│   ├── collisions.js      # Détection des collisions
│   ├── gems.js            # Système de gems
│   ├── shop.js            # Logique du shop
│   └── player.js          # Initialisation des joueurs
└── tests/                 # Tests Jest (14 suites, 105+ tests)
```

## 🛠️ Stack Technique

- **Backend** : Node.js + Express + Socket.io
- **Database** : MongoDB (pour les high scores)
- **Frontend** : HTML5 Canvas + Vanilla JavaScript (modulaire)
- **Tests** : Jest
- **Déploiement** : Render.com + GitHub Actions

## 📊 Gameplay Stats

- **Vitesse de mouvement** : 3px par frame (normalisée pour diagonales)
- **Speed Boost** : +1px par frame quand acheté
- **Historique de trace** : 200 dernières positions
- **Taille initiale** : 15x15 cases
- **Croissance** : +2 cases par niveau
- **Transparence des traces** : 50%
- **Rayon du brouillard** : 180px
- **Durée du shop** : 15 secondes
- **Durée du vote** : 60 secondes max
- **Durée de transition** : 3 secondes

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 14+
- npm

### Installation
```bash
git clone https://github.com/dadouman/jeu-1-io.git
cd jeu-1-io
npm install
```

### Lancer le serveur
```bash
npm start
```

Puis ouvre : **http://localhost:3000**

### Lancer les tests
```bash
npm test
```

14 suites de tests avec 105+ cas testés ✅

### Déploiement sur Render
Le jeu est configuré pour se déployer automatiquement sur Render.com via GitHub Actions.

## 🎯 Stratégies

- **Speed Runner** : Raconte aux murs et trouve le chemin le plus court
- **Checkpoint Master** : Utilise les checkpoints achetés pour te créer des raccourcis
- **Tracker** : Suis les traces des autres joueurs pour anticiper leurs mouvements
- **Scout** : Explore à la recherche de la pièce avant les autres
- **Economiste** : Accumule des gems pour maximiser tes achats

## 📝 Changelog Récent

### v2.0 (Dernière mise à jour)
- 🗳️ Système de vote pour redémarrer (P/O/N)
- ⏱️ Affichage du timer du niveau en haut
- 🎪 Transition spéciale pour le niveau 1 avec compteur de joueurs
- 🎨 Affichage du vote en bas avec temps restant et résultats
- ♻️ **Refactorisation complète du client** :
  - Division en modules (game-state, socket-events, keyboard-input, game-loop)
  - Code plus lisible et maintenable
  - Réduction de la complexité
- 💎 Système de gems et shop amélioré
- 🏆 Podium avec médailles au changement de niveau
- ⚡ Mouvement diagonal optimisé
- 🔧 Timing du niveau corrigé (n'inclut pas la transition)

### v1.5
- 🎪 Zoom progressif et transitions visuelles
- 🏪 Shop système avec timers
- 💎 Économie de gems

### v1.3
- ✨ Traces colorées de mouvement

### v1.2
- 🚩 Système de checkpoint avec téléportation

### v1.1
- 👥 Multijoueur temps réel
- 🗺️ Labyrinthes procéduraux

### v1.0
- 🎮 Prototype initial

## 🧪 Tests

Le projet inclut une suite complète de tests Jest :
- ✅ 14 suites de tests
- ✅ 105+ cas testés
- ✅ Coverage complet du système de jeu

### Exécuter les tests
```bash
npm test
```

## 🐛 Bugs Connus

Aucun pour l'instant ! 🎉

## 🤝 Contribuer

Tu as une idée cool ? Forks et PR bienvenues !

## 📄 Licence

MIT - Libre d'utilisation !

---

**Prêt à explorer ? Appelle tes potes et c'est parti ! 🚀**

> Made with 💜 pour les fans de roguelikes et de jeux multijoueur
