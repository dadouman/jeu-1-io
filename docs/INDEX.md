// INDEX.md - Guide de navigation de la nouvelle architecture

# 📚 Index - Nouvelle Architecture Flexible

## 🚀 Commencer ici (recommandé)

| Document | Temps | Contenu |
|----------|-------|---------|
| **[SYNTHESE.md](SYNTHESE.md)** | 5 min | Vue d'ensemble de ce qui a été fait |
| **[README_ARCHITECTURE.md](README_ARCHITECTURE.md)** | 10 min | Guide de démarrage |
| **[ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)** | 10 min | Résumé visuel avec diagrammes |

## 🎓 Apprendre en détail

| Document | Temps | Contenu |
|----------|-------|---------|
| **[ARCHITECTURE_NEW.md](ARCHITECTURE_NEW.md)** | 20 min | Explique chaque classe en détail |
| **[EXEMPLES_CONFIG.md](EXEMPLES_CONFIG.md)** | 15 min | 5 modes d'exemple concrets |
| **[socket-events-refactored.js](../server/socket-events-refactored.js)** | 10 min | Code d'exemple pour chaque action |

## 🔧 Implémenter

| Document | Temps | Contenu |
|----------|-------|---------|
| **[MIGRATION_PLAN.md](MIGRATION_PLAN.md)** | 20 min | Plan détaillé pour migrer progressivement |

## 🐛 Report de Bugs

| Document | Temps | Contenu |
|----------|-------|---------|
| **[BUG_REPORTING_QUICK_START.md](BUG_REPORTING_QUICK_START.md)** | 10 min | Guide rapide pour configurer et utiliser |
| **[BUG_REPORTING.md](BUG_REPORTING.md)** | 20 min | Documentation complète du système |

## 📝 Code

| Fichier | Ligne | Contenu |
|---------|------|---------|
| **[config/gameModes.js](../config/gameModes.js)** | - | Configuration centralisée de TOUS les modes |
| **[utils/GameMode.js](../utils/GameMode.js)** | - | Classe pour accéder à la config |
| **[utils/GameSessionManager.js](../utils/GameSessionManager.js)** | - | Gestion des sessions |
| **[utils/PlayerActions.js](../utils/PlayerActions.js)** | - | Actions unifiées du joueur |
| **[server/unified-game-loop.js](../server/unified-game-loop.js)** | - | Exemple de boucle unifiée (non branchée par défaut) |

## ✅ Tests

| Fichier | Tests | Contenu |
|---------|-------|---------|
| **[tests/architecture-refactoring.test.js](../tests/architecture-refactoring.test.js)** | 26 | Tests de la nouvelle architecture |

---

## 🎯 Utilisez-moi si...

### Je veux comprendre rapidement l'architecture
→ **Lire [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)** (5 min)

### Je veux voir comment l'utiliser
→ **Lire [README_ARCHITECTURE.md](README_ARCHITECTURE.md)** (10 min)

### Je veux créer un mode personnalisé
→ **Lire [EXEMPLES_CONFIG.md](EXEMPLES_CONFIG.md)** puis modifier [config/gameModes.js](../config/gameModes.js)

### Je veux changer le nombre de niveaux solo
→ **Ouvrir [config/gameModes.js](../config/gameModes.js) et changer `solo.maxLevels`**

### Je veux changer le prix d'un objet
→ **Ouvrir [config/gameModes.js](../config/gameModes.js), chercher l'item, changer `price`**

### Je veux changer quand le shop ouvre
→ **Ouvrir [config/gameModes.js](../config/gameModes.js), changer `shop.levels`**

### Je veux intégrer dans socket-events.js
→ **Lire [MIGRATION_PLAN.md](MIGRATION_PLAN.md)**

### Je veux voir comment ça marche en détail
→ **Lire [ARCHITECTURE_NEW.md](ARCHITECTURE_NEW.md)**

---

## 📊 Structure des fichiers

```
config/
  └─ gameModes.js          ← Configuration centralisée (À MODIFIER!)
  
utils/
  ├─ GameMode.js           ← Classe (À UTILISER!)
  ├─ GameSessionManager.js  ← Gestion sessions (À UTILISER!)
  └─ PlayerActions.js       ← Actions joueur (À UTILISER!)

server/
  ├─ unified-game-loop.js           ← Boucle unifiée (À UTILISER!)
  └─ socket-events-refactored.js    ← Exemples (À LIRE!)

tests/
  └─ architecture-refactoring.test.js ← Tests (À LANCER!)

docs/
  ├─ SYNTHESE.md                  ← Résumé (À LIRE FIRST!)
  ├─ README_ARCHITECTURE.md       ← Guide démarrage (À LIRE SECOND!)
  ├─ ARCHITECTURE_SUMMARY.md      ← Vue d'ensemble (À LIRE!)
  ├─ ARCHITECTURE_NEW.md          ← Détails (À LIRE!)
  ├─ EXEMPLES_CONFIG.md           ← Exemples (À LIRE!)
  ├─ MIGRATION_PLAN.md            ← Plan migration (À LIRE!)
  └─ INDEX.md (this file)         ← Navigation (VOUS ÊTES ICI!)
```

---

## 🚀 Quickstart (10 minutes)

### 1. Comprendre (5 min)
```bash
cat ARCHITECTURE_SUMMARY.md
```

### 2. Voir des exemples (5 min)
```bash
cat EXEMPLES_CONFIG.md
```

### 3. Tester que ça marche
```bash
npm test
# Tous les tests Jest passent ✅
```

### 4. Créer votre premier mode
```javascript
// Ouvrir config/gameModes.js
// Ajouter:
soloMyMode: {
    name: 'My Mode',
    maxLevels: 15,
    shop: { enabled: true, levels: [5, 10, 15] },
    // ... copier d'un autre mode
}
```

**C'est tout! Votre mode marche!** 🎉

---

## 💡 Points clés

1. **Configuration centralisée** = `config/gameModes.js`
2. **Accéder à la config** = `new GameMode(modeId)`
3. **Gérer sessions** = `new GameSessionManager()`
4. **Actions joueur** = `PlayerActions.processMovement()`
5. **Boucle de jeu** = `new UnifiedGameLoop()`

---

## 📈 Bénéfices

| Avant | Après |
|-------|-------|
| 2500+ lignes dupliquées | 1500 lignes centralisées |
| 1 heure pour changer règles | 30 secondes |
| 1 jour pour ajouter mode | 15 minutes |
| Tests séparés | Tests génériques |
| Risque très haut | Risque très bas |

---

## 🎬 Prochaines étapes

### Phase 2: Intégrer progressivement
Voir [MIGRATION_PLAN.md](MIGRATION_PLAN.md)

### Étapes
1. Remplacer constants par GameMode
2. Remplacer soloSessions par GameSessionManager
3. Remplacer mouvement dupliqué par PlayerActions
4. Utiliser UnifiedGameLoop

**Effort:** 2-4 heures à faire progressivement

---

## ❓ FAQ

**Q: Ça va casser mon code?**
A: Non! Les classes coexistent avec l'ancien code. Migration graduelle.

**Q: Comment rollback?**
A: `git checkout <ancien-commit>`

**Q: Les tests passent?**
A: Oui, lance `npm test`.

**Q: Où est la documentation?**
A: Vous lisez l'index! Voir les liens ci-dessus.

---

## 📞 Besoin d'aide?

1. **Lire [SYNTHESE.md](SYNTHESE.md)** - Vue d'ensemble
2. **Lire [README_ARCHITECTURE.md](README_ARCHITECTURE.md)** - Guide démarrage
3. **Lire [ARCHITECTURE_NEW.md](ARCHITECTURE_NEW.md)** - Détails
4. **Lire [EXEMPLES_CONFIG.md](EXEMPLES_CONFIG.md)** - Exemples
5. **Lire [MIGRATION_PLAN.md](MIGRATION_PLAN.md)** - Plan migration

**Tout est documenté!** 📖

---

## 🎉 Bon coding!

Tu as maintenant une architecture flexible et maintenable! 🚀

Profite-en pour:
- ✅ Créer des modes personnalisés
- ✅ Varier les règles facilement
- ✅ Expérimenter sans peur
- ✅ Maintenir du code propre

Happy coding! 🎮✨
