// MIGRATION_PLAN.md - Plan de migration graduelle vers la nouvelle architecture

## 📋 Plan de migration (SANS casser le code existant)

La migration se fait **progressivement**, en parallèle avec le code existant.

---

## Phase 1: Configuration centralisée (✅ FAIT)

**Fichiers créés:**
- `config/gameModes.js` - Toute la config des modes
- `utils/GameMode.js` - Classe pour accéder à la config
- `ARCHITECTURE_NEW.md` - Explique l'architecture
- `EXEMPLES_CONFIG.md` - Exemples pratiques

**État:**
- Les anciens tests passent toujours ✅
- 26 nouveaux tests pour la nouvelle architecture ✅
- Tous les tests passent ✅

**Prochaine action:** Utiliser GameMode pour les constants

---

## Phase 2: Remplacer les constantes hardcodées

### Étape 2.1: Solo mode

**Fichiers à modifier:**
- `server/game-loops/solo-loop.js`
- `server/socket-events.js`
- Tests solo

**Actuellement:**
```javascript
const maxLevel = 10;  // Hardcodé
const isShopLevel = (level) => [5, 10].includes(level);  // Hardcodé
const shopDuration = 15000;  // Hardcodé
```

**À faire:**
```javascript
const gameMode = new GameMode('solo');

// À la place de maxLevel = 10
if (gameMode.isGameFinished(currentLevel)) { ... }

// À la place de isShopLevel check
if (gameMode.isShopLevel(completedLevel)) { ... }

// À la place de shopDuration
const duration = gameMode.getShopDuration();
```

**Bénéfice:** 
- Une ligne change dans la config = tout change
- Tests deviennent plus simples
- Pas plus de duplication entre socket-events et game-loops

---

## Phase 3: Utiliser GameSessionManager

### Étape 3.1: Solo sessions

**Fichier:** `server/socket-events.js`

**Remplacer:**
```javascript
const soloSessions = {
    [playerId]: {
        currentLevel: 1,
        map: maze,
        coin: pos,
        player: player,
        startTime: Date.now(),
        levelStartTime: Date.now(),
        splitTimes: []
    }
};
```

**Par:**
```javascript
const sessionManager = new GameSessionManager();
const session = sessionManager.createSession(sessionId, 'solo');
sessionManager.addPlayerToSession(playerId, sessionId, startPos, 0);
```

**Bénéfice:**
- API cohérente pour tous les modes
- Pas besoin de gérer manuellement les états
- Méthodes comme `nextLevel()`, `openShop()` intégrées

### Étape 3.2: Classic/Infinite sessions

Même approche pour les lobbies multijoueurs.

---

## Phase 4: Utiliser PlayerActions

### Étape 4.1: Mouvement

**Remplacer le code dupliqué de mouvement dans socket-events.js:**
```javascript
// Avant: Code dupliqué
if (mode === 'solo') {
    // Code solo
} else {
    // Code classic/infinite
}

// Après: Une seule ligne
PlayerActions.processMovement(player, map, input, modeId);
```

**Bénéfice:**
- Zéro duplication
- Même logique pour tous les modes
- Plus facile à déboguer

### Étape 4.2: Dash, Checkpoint, Shop

Même pattern pour toutes les actions.

---

## Phase 5: Utiliser UnifiedGameLoop

**À la place de:**
- `server/game-loops/lobby-loop.js`
- `server/game-loops/solo-loop.js`

**Utiliser:**
- `server/unified-game-loop.js`

**Impact:**
- Une seule boucle pour tous les modes
- Collision pièce gérée de la même manière
- Shop gérée de la même manière
- Fin de jeu gérée de la même manière

---

## 📊 État d'avancement

```
┌─────────────────────────────────────────────────────────┐
│                    PHASE 1: CONFIG                       │
│ ✅ config/gameModes.js                                   │
│ ✅ utils/GameMode.js                                     │
│ ✅ 26 tests qui passent                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 2: REMPLACER                     │
│ 🔄 Constants hardcodées → GameMode                       │
│ ⏳ Solo-loop.js                                          │
│ ⏳ Socket-events.js                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 3: SESSIONS                      │
│ ⏳ GameSessionManager                                    │
│ ⏳ Remplacer soloSessions                                │
│ ⏳ Remplacer lobbies                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 4: ACTIONS                       │
│ ⏳ PlayerActions.processMovement()                       │
│ ⏳ PlayerActions.processDash()                           │
│ ⏳ PlayerActions.buyItem()                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 5: BOUCLE                        │
│ ⏳ UnifiedGameLoop                                       │
│ ⏳ Supprimer lobby-loop.js                               │
│ ⏳ Supprimer solo-loop.js                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Ordre recommandé d'implémentation

### Option A: Rapide (2 heures)
1. Utiliser GameMode pour remplacer constants
2. Tester
3. Commit

### Option B: Complet (4-6 heures)
1. Utiliser GameMode
2. Utiliser GameSessionManager
3. Utiliser PlayerActions
4. Utiliser UnifiedGameLoop
5. Adapter UI si besoin
6. Tester complètement
7. Commits intermédiaires

### Option C: Super safe (1 jour)
- Faire Option B
- Écrire beaucoup de tests
- Refactoriser les tests anciens
- Profiler la performance
- Nettoyer le code legacy

---

## ✅ Checklist pour chaque phase

### Phase 2 Checklist
- [ ] Créer une branche `refactor/phase-2`
- [ ] Remplacer les constantes solo par GameMode
- [ ] Tester que solo fonctionne toujours
- [ ] Remplacer les constantes classic/infinite
- [ ] Tester que classic/infinite fonctionnent toujours
- [ ] Tous les tests passent
- [ ] PR Review
- [ ] Merge et commit

### Phase 3 Checklist
- [ ] Remplacer soloSessions par GameSessionManager
- [ ] Tester solo
- [ ] Remplacer lobbies
- [ ] Tester classic/infinite
- [ ] Tous les tests passent
- [ ] Commit

... et ainsi de suite pour chaque phase

---

## 🚨 Points importants

### Ne pas casser le code existant
- Les nouvelles classes coexistent avec l'ancien code
- On peut migrer progressivement
- Si une migration casse un truc, on peut revenir en arrière

### Tests d'abord
- Écrire les tests AVANT de migrer
- Les tests validtent que l'ancien code fonctionne
- Les tests valident que le nouveau code fonctionne
- Les tests valident que c'est compatible

### Commits atomiques
- Chaque commit = une modification logique
- Si ça casse, on peut revert facilement
- Historique git lisible

### Documentation
- Écrire de la doc à chaque phase
- Expliquer pourquoi on fait les changements
- Expliquer comment l'utiliser

---

## 💾 Sauvegarde de l'état actuel

Si tu veux rollback n'importe quand:
```bash
git log --oneline | head -20  # Voir les commits récents
git checkout <ancien-commit>  # Revenir à un ancien état
git checkout main             # Revenir à la branche principale
```

---

## 🎉 Résultat final

Une fois tous les phases complétées:

**Avant:** 
- Changer 10→20 niveaux = 1 heure de chercher/remplacer
- Ajouter un mode = 1 jour de copier/coller + debugging
- 2 game loops différentes (lobby + solo)
- 3 systèmes de mouvement différents
- Risque élevé de bugs

**Après:**
- Changer 10→20 niveaux = 30 secondes (1 ligne)
- Ajouter un mode = 15 minutes (30 lignes config)
- 1 seule game loop unifiée
- 1 seul système de mouvement (PlayerActions)
- Risque très bas de bugs (centralisé)

**Bénéfice:** Plus de temps pour créer des features cool, moins de temps pour déboguer!
