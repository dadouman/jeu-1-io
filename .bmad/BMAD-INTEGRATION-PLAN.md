# 📋 PLAN D'INTÉGRATION BMAD v6 - Mon Jeu .io
## Rogue-Like Procédural Temps-Réel

---

## 🎯 OBJECTIF GLOBAL

Transformer votre jeu .io en référence d'excellence architecturale avec :
- ✅ **85%+ test coverage** (actuellement ~70%)
- ✅ **Architecture refactorisée** (modularité optimale)
- ✅ **Features scaling-ready** (niveaux procéduraux avancés)
- ✅ **CI/CD/Testing robustifiée** (BMAD-guided)

---

## 📅 TIMELINE RECOMMANDÉE

### **SEMAINE 1 : AUDIT & ARCHITECTURE** (6-8 heures)

#### Jour 1 : Discovery & Documentation
**Workflow BMAD** : `*document-project` (BMad Builder)
- ⏱️ 30-45 minutes
- **Sortie** : Rapport audit complet (architecture, dépendances, issues)
- **Actions** :
  1. Importer votre projet dans Claude/Cursor
  2. Lancer `*document-project` workflow
  3. Répondre aux questions d'analyse
  4. Générer documentation de base

#### Jour 2-3 : Architecture Design
**Workflow BMAD** : `*create-architecture` (Architect Agent + Game Architect)
- ⏱️ 2-3 heures
- **Sortie** : Diagrammes C4, UML, refactoring plan
- **Modules à analyser** :
  ```
  📦 ARCHITECTURE ACTUELLE À AMÉLIORER
  ├── utils/
  │   ├── map.js (procédural generation) → REFACTOR
  │   ├── collisions.js (pixel-perfect) → REVIEW
  │   └── game-logic.js (?)
  ├── server/
  │   ├── index.js (entry point)
  │   ├── game-logic.js (server-side logic)
  │   └── ??? (à explorer)
  ├── public/
  │   ├── client.js (Socket.io + inputs) → OPTIMIZE
  │   ├── game-state.js (state mgmt) → REFACTOR
  │   ├── game-loop.js (render loop) → PROFILE
  │   ├── renderer.js (Canvas rendering) → OPTIMIZE
  │   └── autres...
  └── tests/ (45 tests existants) → IMPROVE COVERAGE
  ```

#### Jour 4 : Tech Spec Update
**Workflow BMAD** : `*create-tech-spec` (Tech Writer)
- ⏱️ 1 heure
- **Sortie** : Documentation technique à jour
- **Contenu** :
  - API Socket.io (client ↔ server)
  - Schema MongoDB (players, leaderboard, items)
  - Game loop architecture
  - Procedural generation algorithm
  - Collision system design

---

### **SEMAINE 2 : TESTING & CODE QUALITY** (4-6 heures)

#### Jour 5-6 : Test Design & Coverage Plan
**Workflow BMAD** : `*run-test-design` (Test Architect)
- ⏱️ 1.5 heures
- **Sortie** : Test plan détaillé pour 85% coverage
- **Focus areas** :
  ```
  ✅ TESTS EXISTANTS (45)
  ├── Unit tests (collisions, map logic)
  ├── Integration tests (Socket.io flow)
  ├── E2E tests (shop, leaderboard, solo mode)
  └── Visual regression tests
  
  ❌ GAPS IDENTIFIÉS (à couvrir)
  ├── Procedural generation edge cases
  ├── Socket.io reconnection scenarios
  ├── Shop transaction atomicity
  ├── Leaderboard consistency checks
  ├── Player input validation
  ├── Game state desyncs
  └── Canvas rendering edge cases
  ```

#### Jour 7-8 : Test Framework Setup
**Workflow BMAD** : `*setup-test-framework` (Test Architect)
- ⏱️ 1.5 heures
- **Actions** :
  1. Audit Jest config existant (jest.config.js)
  2. Setup fixture-based tests (pour Socket.io)
  3. Ajouter Playwright (pour E2E si applicable)
  4. Configuration coverage thresholds
  5. Setup CI/CD test hooks (GitHub Actions)

#### Jour 9 : Code Quality Review
**Workflow BMAD** : `*run-code-review` (Senior Developer)
- ⏱️ 1-2 heures
- **Audit** :
  - Code complexity (target max 10 cyclomatic)
  - Naming conventions
  - Error handling (try/catch, null checks)
  - Security (secrets in env, input validation)
  - Performance bottlenecks

---

### **SEMAINE 3+ : IMPLÉMENTATION ITÉRATIVE** (Ongoing)

#### Features à Planifier & Implémenter

**Template pour chaque feature** :

```yaml
FEATURE: [Nom]
1️⃣ Create Product Brief (*create-product-brief)
   - Contexte business
   - User stories
   - Acceptance criteria
   - Success metrics

2️⃣ Create Story (*create-story)
   - Détails techniques
   - Edge cases
   - Testing strategy
   - Acceptance tests

3️⃣ Implement Story (*implement-story)
   - Développement guidé par BMAD
   - Code review continu
   - Test-driven approach

4️⃣ Run Code Review (*run-code-review)
   - Quality gates
   - Performance checks
   - Merge readiness
```

**Features Priority** :

| Priorité | Feature | Effort | BMAD Workflow |
|----------|---------|--------|---------------|
| 1 | Advanced Procedural Generation | 2-3j | `*create-architecture` → `*implement-story` |
| 2 | Shop System Optimization | 1-2j | `*create-story` → `*implement-story` |
| 3 | Leaderboard Consistency | 1-2j | `*create-tech-spec` → `*implement-story` |
| 4 | Academy Leader Enhancement | 1j | `*create-story` → `*implement-story` |
| 5 | Mobile Controls Refinement | 1j | `*create-story` → `*implement-story` |

---

## 🔧 COMMANDES BMAD CLÉS À UTILISER

### Pour Audit & Planning
```bash
# Audit complet du projet
*document-project

# Créer architecture diagrams
*create-architecture

# Générer tech spec
*create-tech-spec

# Planifier tests
*run-test-design
```

### Pour Implementation
```bash
# Créer PRD pour nouvelle feature
*create-product-brief

# Créer user story détaillée
*create-story

# Développement guidé
*implement-story

# Code review avant merge
*run-code-review

# Setup tests si besoin
*setup-test-framework
```

### Pour Debugging (si issues)
```bash
# Brainstorming sur problème
*run-brainstorming-session

# Analysis approfondie
*conduct-research

# Quick fix pour bug simple
*run-quick-flow
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### Code Quality
- [ ] Test Coverage : 70% → **85%+**
- [ ] Cyclomatic Complexity : max 10
- [ ] Cognitive Complexity : max 15
- [ ] Code Review Issues : 0 blockers

### Performance
- [ ] Socket.io latency : < 50ms
- [ ] Game loop FPS : 60 (stable)
- [ ] Map generation : < 100ms
- [ ] Canvas render : 60 FPS (no jank)

### Reliability
- [ ] Test pass rate : **100%**
- [ ] Deployment success : 99.5%+
- [ ] Zero critical bugs in main
- [ ] Leaderboard consistency : eventually consistent

### Architecture
- [ ] Modularité improved
- [ ] Server logic centralized
- [ ] Client state management clean
- [ ] Error handling comprehensive
- [ ] Environment variables secured

---

## 🚀 QUICK START

### Étape 1: Installation (Déjà fait ✅)
```bash
npm install bmad-method@alpha --save-dev
```

### Étape 2: Lancer BMAD v6
```bash
# Dans Claude/Cursor (IDE avec support Claude)
# Charger un des agents BMAD ou utiliser workflows
```

### Étape 3: Choisir ton Premier Workflow
**RECOMMANDÉ** : `*document-project`
- Durée : 30-45 min
- Résultat : Audit complet architecture
- Suivant : `*create-architecture`

### Étape 4: Itérer
- BMAD te guidera à travers chaque phase
- Tests passent ? → Continue
- Tests fail ? → Debug avec BMAD (*run-code-review)
- Merge ? → Done !

---

## 🎮 ARCHITECTURE DE JEU À RETENIR

### Principes Clés pour BMAD
1. **Déterminisme** : Map seed-based (rejouer le même niveau)
2. **Real-time** : Socket.io WebSocket (forcé, pas de fallback)
3. **Consistency** : Leaderboard eventually consistent
4. **Atomicity** : Shop transactions safe
5. **Performance** : Game loop = 60 FPS, collisions = pixel-perfect

### Secrets à Protéger (env vars)
- `MONGODB_URI` - Database connection
- `SENDGRID_API_KEY` - Email notifications
- `JWT_SECRET` - If auth implemented
- Render.com deploy keys

---

## 📝 NEXT STEPS

1. **Demain** : Lancer `*document-project` workflow
2. **J+1-2** : Analyser résultats + lancer `*create-architecture`
3. **J+3** : Review diagrammes + lancer `*run-test-design`
4. **J+4-5** : Setup tests + code review
5. **J+6+** : Implémenter features (1 par 1 avec BMAD)

---

## 💡 PRO TIPS

✨ **BMAD Masters** :
- Lire les workflows avant de les lancer (comprendre le contexte)
- Préparer tes inputs (architecture docs, game design notes)
- Sauvegarder les outputs BMAD dans `.bmad/outputs/`
- Utiliser document sharding si fichiers > 100K
- Combiner agents (e.g., Architect + Game Architect pour design)

🎯 **Game Dev Specifics** :
- Focus sur determinism (seeds pour maps)
- Real-time constraints (latency, FPS)
- Test time-sensitive code (Socket.io, leaderboard)
- Profile Canvas rendering
- Validate player inputs (anti-cheat)

---

## 📞 Support BMAD

- **Discord** : https://discord.gg/gk8jAdXWmj
- **Docs** : http://docs.bmad-method.org/
- **YouTube** : https://www.youtube.com/@BMadCode
- **GitHub Issues** : https://github.com/bmad-code-org/BMAD-METHOD/issues

---

**Status** : ✅ Ready to start
**Created** : Jan 8, 2026
**Updated** : [Dynamic]
