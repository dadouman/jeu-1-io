# 🎮 Rogue-Like .io - Le Jeu Collaboratif du Labyrinthe

Bienvenue dans **Rogue-Like .io**, un jeu multijoueur temps réel où tu explores des labyrinthes procéduraux, collectionne les pièces et affrontes tes amis dans une aventure sans fin !

## 🌟 Principe du Jeu

Tu explores un labyrinthe infini qui **grandit à chaque niveau**. Chaque pièce ramassée te propulse dans un nouveau monde plus grand et plus complexe. Mais attention : les autres joueurs aussi sont dans le même labyrinthe, tu peux voir où ils se déplacent et te mesurer à eux ! 

**C'est simple :** 
- 🎯 Ramasse les pièces 💎
- 📈 Monte de niveau
- 👻 Sois plus rapide que tes potes
- 🏆 Établis le meilleur score

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| **↑ ↓ ← →** | Se déplacer |
| **ESPACE** | Créer/Déplacer un checkpoint 🚩 |
| **R** | Téléporter au checkpoint |

## ✨ Fonctionnalités

### 🗺️ Labyrinthes Procéduraux
- Chaque niveau génère un nouveau labyrinthe unique
- La taille augmente à chaque niveau (commence à 15x15, grandit de 2 cases par niveau)
- Pas deux parties identiques !

### 👥 Multijoueur Temps Réel
- Joue avec tes amis **en même temps**
- Vois les autres joueurs et leur skin unique
- Compétition directe pour les pièces
- System de **WebSocket** pour une synchronisation instantanée

### 🚩 Système de Checkpoint
- Crée un point de sauvegarde avec **ESPACE**
- Déplace-le à volonté en rappuyant sur **ESPACE**
- Téléporte-toi au checkpoint avec **R** pour prendre des raccourcis
- Le checkpoint réinitialise à chaque niveau

### 🎨 Traces de Mouvement
- Chaque joueur laisse une **trace colorée** de son parcours
- 10 couleurs différentes pour distinguer les joueurs
- Visible par tous pour suivre la stratégie des autres
- Disparaît au changement de niveau

### 🏆 Système de Score
- Ramasse les pièces pour augmenter ton score
- Le **record global** est affiché et sauvegardé
- Vois ton niveau actuel et celui des autres

### 🎭 Skins Aléatoires
- 12 emojis différents pour personnaliser ton joueur
- Chaque connexion te donne un skin aléatoire
- Sois 👻, 🤖, 🦄, 🐷 ou même 💩 !

### 🎪 Interface Épurée
- **Brouillard de guerre** circulaire : tu ne vois que ta zone de jeu
- Vue centrée sur ton personnage
- Score et niveau en temps réel
- Affichage du meilleur score de tous les temps

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

### Déploiement sur Render
Le jeu est configuré pour se déployer automatiquement sur Render.com via GitHub Actions.

## 🏗️ Architecture

```
├── server.js              # Logique serveur (Socket.io, Mouvement)
├── public/
│   ├── index.html         # Page d'accueil
│   ├── client.js          # Gestion des inputs et communication
│   └── renderer.js        # Affichage du jeu (Canvas)
├── utils/
│   ├── map.js             # Génération de labyrinthes
│   └── collisions.js      # Détection des collisions
└── tests/                 # Tests Jest
```

## 🛠️ Stack Technique

- **Backend** : Node.js + Express + Socket.io
- **Database** : MongoDB (pour le high score)
- **Frontend** : HTML5 Canvas + Vanilla JavaScript
- **Tests** : Jest
- **Déploiement** : Render.com + GitHub Actions

## 📊 Gameplay Stats

- **Vitesse de mouvement** : 5px par frame
- **Historique de trace** : 200 dernières positions
- **Taille initiale** : 15x15 cases
- **Croissance** : +2 cases par niveau
- **Transparence des traces** : 50%
- **Rayon du brouillard** : 180px

## 🎯 Stratégies

- **Speed Runner** : Raconte aux murs et trouve le chemin le plus court
- **Checkpoint Master** : Utilise les checkpoints pour te créer des raccourcis
- **Tracker** : Suis les traces des autres joueurs pour anticiper leurs mouvements
- **Scout** : Explore à la recherche de la pièce avant les autres

## 🐛 Bugs Connus

Aucun pour l'instant ! 🎉

## 📝 Changelog

### v1.3
- ✨ Ajout du système de traces colorées

### v1.2
- 🚩 Système de checkpoint avec téléportation

### v1.1
- 👥 Multijoueur temps réel
- 🗺️ Labyrinthes procéduraux
- 🏆 Système de score

### v1.0
- 🎮 Prototype initial

## 🤝 Contribuer

Tu as une idée cool ? Forks et PR bienvenues !

## 📄 Licence

MIT - Libre d'utilisation !

---

**Prêt à explorer ? Appelle tes potes et c'est parti ! 🚀**

> Made with 💜 pour les fans de roguelikes et de jeux multijoueur
