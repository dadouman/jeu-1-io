# 🎮 Mode Solo - Centre d'Organisation

Ce dossier centralise tous les fichiers relatifs au mode solo du jeu.

## 📁 Structure

```
solo/
├── server/              # Backend - Logique serveur du mode solo
│   ├── SoloSession.js   # Classe pour gérer l'état d'une session solo
│   ├── solo-game-loop.js # Boucle de jeu à 60fps côté serveur
│   ├── solo-utils.js    # Utilitaires serveur
│   └── solo-loop.js     # (Legacy) Ancienne boucle de jeu
│
├── client/              # Frontend - Interface et logique client
│   ├── solo-game-state.js     # État du jeu reçu du serveur
│   └── solo-hud-renderer.js   # Interface utilisateur (HUD)
│
├── tests/               # Reference - Liens vers les tests (situés en /tests)
│   │
│   └── Fichiers de test originaux dans: /tests/solo-*.test.js
│       ├── solo-mode.test.js
│       ├── solo-timing.test.js
│       ├── solo-progression.test.js
│       ├── solo-leaderboard.test.js
│       ├── solo-ranking.test.js
│       ├── solo-delta-display.test.js
│       ├── solo-replay.test.js
│       ├── solo-maze.test.js
│       ├── solo-rendering.test.js
│       ├── solo-canvas-state.test.js
│       ├── solo-end-of-run.test.js
│       ├── solo-full-run.test.js
│       └── solo-shop.test.js
│
└── docs/                # Documentation et guides
    ├── SOLO_MODE_ANALYSIS.md              # Analyse détaillée
    ├── SOLO_REFACTORING_PLAN.md           # Plan de refactoring
    ├── SOLO_QUICK_START.md                # Guide de démarrage rapide
    ├── SOLO_EXECUTIVE_SUMMARY.md          # Résumé exécutif
    ├── SOLO_CODE_READY_TO_USE.md          # Code prêt à l'emploi
    ├── ACADEMY_LEADER_IMPLEMENTATION.md   # Implémentation du countdown cinéma
    └── ...autres documents
```

## 🎯 Vue d'ensemble

### Architecture Server-Authoritative
- **SoloSession.js**: Classe unique pour gérer l'état d'une session solo côté serveur
  - Timing (sessionStartTime, levelStartTime, pausedTime)
  - Shop management (state, timeouts)
  - Countdown (active, elapsed)
  - Validation des splits
  - Sauvegarde MongoDB

- **solo-game-loop.js**: Boucle de jeu à 60fps
  - Détection de collisions
  - Progression de niveaux
  - Gestion du shop
  - Finalization du jeu avec retry logic

### Architecture Client
- **solo-game-state.js**: Objet read-only reçu du serveur
  - Synchronisation à 60fps
  - État complet du jeu
  - Pas de calcul client (confiance au serveur)

- **solo-hud-renderer.js**: Interface utilisateur
  - Affichage du timing
  - Affichage des splits
  - Affichage du delta (personnel vs global)
  - Leaderboard

## 🔧 Intégration

Les fichiers originaux ont été conservés à leurs emplacements:
- `server/utils/SoloSession.js`
- `server/game-loops/solo-game-loop.js`
- `Public/solo-game-state.js`
- `Public/solo-hud-renderer.js`
- `tests/solo-*.test.js`

Ce dossier `solo/` est une **organisation logique** pour faciliter la navigation et la maintenance.

## 📊 Statistiques

- **4 fichiers serveur** (core logic)
- **2 fichiers client** (UI & state)
- **13 fichiers de test** (622 tests au total)
- **13 documents** (documentation complète)

## 🚀 Démarrage Rapide

1. **Lancer le serveur solo**:
   ```bash
   npm start
   ```

2. **Lancer les tests solo**:
   ```bash
   npm test -- solo
   ```

3. **Jouer en solo**:
   - Sélectionner "Solo" dans le sélecteur de mode
   - Regarder le countdown cinématique (3.5s)
   - Jouer contre la meilleure tentative personnelle

## 📝 Notes Importantes

- **Architecture**: Server-authoritative (le serveur est la source de vérité)
- **Timing**: Géré côté serveur, pas de désynchronisation client
- **Validation**: 8 niveaux de validation avant MongoDB
- **Erreurs**: Retry logic avec 3 tentatives et exponential backoff
- **Tests**: Suite complète avec 0 regressions

## 📚 Pour en Savoir Plus

Consulter les fichiers de documentation dans `solo/docs/`:
- `SOLO_QUICK_START.md` - Guide rapide
- `SOLO_REFACTORING_PLAN.md` - Plan technique détaillé
- `SOLO_MODE_ANALYSIS.md` - Analyse approfondie

---

**Dernière mise à jour**: 13 décembre 2025
