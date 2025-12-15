# 📝 CHANGELOG - Mon Jeu .IO

> **Note**: Pour l'historique complet détaillé avec tous les commits, utilisez `git log`

---

## 🎮 Fonctionnalités Principales

### 🏁 Fin de Partie & Lobby
- **End of level - Auto lobby reset and player exclusion** (Dec 2025)
  - Quand le dernier niveau est complété, tous les joueurs sont exclus du lobby
  - Le lobby se réinitialise automatiquement
  - Les joueurs voient l'écran de victoire pendant 5 secondes puis retournent au sélecteur

### 🎯 Mode Classique & Custom
- **Classic mode end screen with podium and best player badge** 
  - Affichage du classement top 3 avec podium
  - Badge du meilleur joueur visible en temps réel
  - Record du lobby affiché
  
- **Apply classic end screen features to custom mode**
  - Podium et classement pour le mode custom
  - Badge du meilleur joueur
  - Expérience de fin de jeu complète

- **Admin panel for custom game mode configuration**
  - Interface pour créer des modes personnalisés
  - Configuration de niveaux, prix, et fréquence du shop

- **Add shop frequency and price multiplier to custom mode**
  - Configuration flexible du système d'achat

### 🛒 Système de Shop
- **Implement shop continue voting system**
  - Tous les joueurs doivent cliquer "continuer" pour reprendre la partie
  - Vote synchronisé sur tous les clients

- **Improve shop UI with locked state indicators**
  - Indicateurs visuels d'items verrouillés
  - Prévention des doubles achats
  - Meilleur affichage des prix

- **15-second shop timer with visual countdown**
  - Fermeture automatique du shop après 15 secondes
  - Barre de progression visuelle

### ⏱️ Transitions & Timeline
- **Improve level transitions**
  - Blocage des inputs pendant les transitions
  - Affichage correct du niveau
  - Timeline visuelle avec shops et ligne d'arrivée

- **Add progressive zoom, level transitions, and loading bar**
  - Zoom progressif lors des transitions
  - Barre de chargement

- **Add level timer display and special level 1 startup transition**
  - Affichage du timer pour chaque niveau
  - Transition spéciale au démarrage

### ⏰ Countdown System (Academy Leader)
- **Replace countdown with classic cinema style**
  - Système de countdown de style cinéma classique
  - Cercles qui rétrécissent pour révéler les numéros

- **Add 3-2-1 countdown for solo mode with proper timer synchronization**
  - Countdown synchronisé côté serveur
  - Intégration complète avec le mode solo

- **Block player movement during countdown**
  - Les mouvements sont bloqués pendant le countdown
  - Affichage du countdown uniquement à l'écran

### 🏃 Mode Solo (20 niveaux)
- **Complete solo mode implementation**
  - Part 1: UI et structure de base
  - Part 2: Mouvement et génération de niveaux
  - Part 3: Tracking temps et écran de résultats
  - Part 4: Système de leaderboard

- **Système de splits times pour les courses contre la montre**
  - Tracking des temps de chaque niveau
  - Comparaison avec le record personnel
  - Comparaison avec le record mondial

- **Solo mode - Delta time display with record comparison**
  - Affichage du delta avec le record personnel
  - Affichage du delta avec le record mondial

- **Solo mode enhancements**
  - Meilleur écran de résultats
  - Intégration SendGrid pour emails

### 💎 Système de Gems & Shop
- **Shop system integration in solo mode**
  - 16 tests complets du système de shop
  - Intégration complète avec le mode solo
  - Items avec prix configurables

- **Affichage du meilleur temps personnel en fin de partie**
  - Sauvegarde des gems par niveau
  - Affichage du record pendant le jeu

- **Affichage HUD complet en mode solo**
  - Temps total affiché
  - Delta split affiché après chaque gem
  - Niveau actuel

### 🎮 Mécaniques de Jeu
- **Dash mechanic with Shift+Sprint**
  - Shift+Dash pour faire un sprint dans la direction actuelle
  - Arrêt à la collision

- **Improve movement system**
  - Diagonales supportées
  - Glissement sur les murs
  - Décélération basée sur la physique
  - Normalisation de la vitesse diagonale

- **Player trail system**
  - Affichage de l'historique de mouvement
  - Couleurs uniques par joueur
  - Visual feedback en temps réel

### 📱 Interface & Contrôles
- **Mobile controls with virtual joystick**
  - Joystick virtuel pour les appareils tactiles
  - Boutons d'action

- **Mouse click support for shop purchases**
  - Achats possibles à la souris
  - Améliorations visuelles

- **Add option to exit shop early with Enter key**
  - Les joueurs peuvent quitter le shop avant la fin
  - Prévient la régression du temps de niveau

### 👥 Système Multijoueur
- **Complete multi-lobby system for game mode isolation**
  - Isolation des modes de jeu
  - Support de lobbies parallèles

- **Return to mode selection screen on game restart**
  - Retour au sélecteur de mode
  - Intégration complète avec vote de restart

- **Complete game mode selection system**
  - Support de modes 40-level et infini
  - Système de sélection flexible

- **Restart vote system with 60-second timeout**
  - Vote immédiat avec validation par majorité
  - Timeout de 60 secondes

- **Add podium ranking with top 3 players**
  - Affichage du classement sur écran de transition
  - Badge du meilleur joueur

### 🔄 Système de Rendering
- **Continuous rendering at 60 FPS**
  - Rendu continu optimal
  - Correction des joueurs bloqués dans les murs
  - Fix de `getRandomEmptyPosition`

- **HUD des features**
  - Affichage en haut du canvas
  - Indicateurs de déverrouillage
  - Repositionnement optimisé

### 🔧 Infrastructure & Outils
- **Migrate from Gmail SMTP to SendGrid API**
  - Livraison d'emails fiable
  - Support des emails de test à l'initialisation

- **Complete bug reporting system**
  - Système complet de signalement de bugs
  - Intégration avec SendGrid

- **Data cleanup scripts**
  - Validation des split times
  - Prévention de la corruption des données
  - Scripts de nettoyage disponibles

- **Add script to reset high score**
  - `npm run reset-score` pour réinitialiser

### 📊 Features Avancées
- **Organize solo mode files in centralized /solo directory**
  - Documentation centralisée
  - Index complet du mode solo

- **Load shop configuration from gameModes.js**
  - Configuration flexible du shop
  - Intégration avec le système de configuration

- **Add meilleurs splits personnels tracking**
  - Sauvegarde des temps personnels
  - Récupération des splits

---

## 📈 Statistiques

- **Total commits**: 298
- **Features implémentées**: 40+
- **Modes de jeu**: 4 (Classic, Infinite, Solo, Custom)
- **Tests**: 622 ✅
- **Langues**: JavaScript, Node.js
- **Base de données**: MongoDB

---

## 🎯 Structure du Projet

```
📦 Mon Jeu .IO
├── 📂 server/          - Code serveur
├── 📂 Public/          - Code client
├── 📂 solo/            - Mode solo isolé
├── 📂 tests/           - Suite de tests
├── 📂 utils/           - Utilitaires partagés
├── 📂 config/          - Configuration
├── 📂 documentation/   - Documentation complète
└── 📂 archived/        - Anciennes versions
```

---

## 🚀 Pour démarrer

```bash
npm install
npm start        # Démarrer le serveur
npm test         # Lancer les tests
npm run reset-score  # Réinitialiser le record
```

---

## 📚 Documentation

Pour la documentation technique détaillée:
- [Mode Solo Index](documentation/SOLO_MODE_INDEX.md)
- [Architecture](docs/ARCHITECTURE_SUMMARY.md)
- [Stratégie de Testing](docs/TESTING_GUIDE.md)

---

## 🔍 Notes

- Historique git complet disponible: `git log`
- Branche de sauvegarde: `backup-full-history`
- Tests en continu: 622/622 passing ✅

