# 🚀 BMAD v6 QUICK START - Mon Jeu .io

**Commencé le** : Jan 8, 2026  
**Status** : ✅ Ready to launch  
**Next** : Ouvrir Claude/Cursor et lancer `*document-project`

---

## ⚡ LES 3 COMMANDES ESSENTIELLES

### Commande 1️⃣ : AUDIT (Aujourd'hui !)
```
*document-project
```
✅ Durée : 30-45 min  
📊 Output : Rapport audit complet  
🎯 Objectif : Comprendre l'architecture actuelle

👉 **À faire en PREMIER**

---

### Commande 2️⃣ : ARCHITECTURE (Demain)
```
*create-architecture
```
✅ Durée : 2-3 heures  
📐 Output : Diagrammes C4/UML  
🎯 Objectif : Plan refactoring détaillé

👉 **À faire APRÈS document-project**

---

### Commande 3️⃣ : TESTING (J+2)
```
*run-test-design
```
✅ Durée : 1-1.5 heures  
📊 Output : Plan couverture tests  
🎯 Objectif : Identifier gaps pour 85% coverage

👉 **À faire APRÈS create-architecture**

---

## 🎮 CONTEXTE POUR BMAD

Quand BMAD te pose des questions, voici comment répondre :

### 1. Type de projet ?
```
Real-time multiplayer rogue-like .io game
- Node.js backend with Socket.io WebSocket (forced, no fallback)
- Procedural level generation (seed-based, deterministic)
- HTML5 Canvas + Vanilla JS frontend
- MongoDB for leaderboard and progression
- Jest testing framework (45+ tests)
```

### 2. Principaux fichiers clés ?
```
Backend:
- server.js (entry point)
- server/ (all server logic)
- utils/map.js (procedural generation - CRITICAL)
- utils/collisions.js (pixel-perfect collision detection)

Frontend:
- public/client.js (Socket.io + input handling)
- public/game-state.js (client state management)
- public/game-loop.js (60 FPS game loop)
- public/renderer.js (Canvas rendering)

Tests:
- tests/ (45 test files)
- jest.config.js (configuration)
```

### 3. Principaux défis ?
```
1. Scaling: Need to support more players
2. Reliability: Socket.io sync issues sometimes
3. Performance: Canvas rendering can stutter
4. Testing: Coverage gaps in procedural generation
5. Maintainability: Code getting complex, needs refactoring
```

### 4. Success metrics ?
```
- Test coverage: 70% → 85%+
- Frame rate: Stable 60 FPS (no jank)
- Socket.io latency: < 50ms
- Map generation: < 100ms
- Zero critical bugs
```

---

## 📝 COMMENT LANCER LES WORKFLOWS

### Option A : Via Claude (Recommandé)
1. Ouvrir https://claude.ai
2. Créer un nouveau chat
3. Importer votre projet (drag & drop ou via attachments)
4. Copier/coller une commande BMAD (e.g., `*document-project`)
5. Attendre le résultat (30-180 min selon workflow)
6. Sauvegarder output dans `.bmad/outputs/`

### Option B : Via Claude Project (Si configuré)
1. Créer Claude Project pour Mon Jeu .io
2. Ajouter tous les fichiers du projet
3. Ajouter ce document (`.bmad/BMAD-INTEGRATION-PLAN.md`)
4. Copier/coller commandes dans le chat
5. Laisser Claude analyser dans le contexte du projet

### Option C : Via Cursor (Si tu l'utilises)
1. Ouvrir ton projet dans Cursor
2. Lancer une nouvelle conversation Claude
3. Même process que Option A
4. Accès direct aux fichiers du projet

---

## 🎯 CHECKLIST FIRST WEEK

### Day 1 (Today)
- [ ] NPM install BMAD v6 ✅ (déjà fait)
- [ ] Créer `.bmad/` structure ✅ (déjà fait)
- [ ] Lire ce Quick Start
- [ ] Préparer contexte du projet (have files ready)
- [ ] **Lancer `*document-project`** ← C'EST TOUT !

### Day 2
- [ ] Analyser audit report
- [ ] Identifier top 3 improvements
- [ ] **Lancer `*create-architecture`**

### Day 3
- [ ] Review architecture diagrams
- [ ] Plan refactoring tasks
- [ ] **Lancer `*run-test-design`**

### Day 4-5
- [ ] Review test plan
- [ ] **Lancer `*setup-test-framework`**
- [ ] **Lancer `*run-code-review`** (optionnel mais recommandé)

### End of Week
- [ ] Commit `.bmad/` config to git
- [ ] Create GitHub milestones from BMAD findings
- [ ] Start refactoring tasks (optional: with BMAD guidance)

---

## 🗂️ STRUCTURE .bmad/ CRÉÉE

```
.bmad/
├── config/
│   └── game-config.yaml          # Configuration BMAD complète
├── agents/
│   └── game-architect.yaml       # Agent spécialisé pour ton jeu
├── workflows/
│   └── WORKFLOW-GUIDE.md         # Guide complet des workflows
├── outputs/                       # Dossier pour sauvegarder résultats
│   └── (sera rempli après each workflow)
└── BMAD-INTEGRATION-PLAN.md      # Ce plan (dans .bmad/configs/ actuellement)
```

---

## 💾 GIT INTEGRATION

Après avoir lancé chaque workflow, committe les résultats :

```bash
# Après *document-project
git add .bmad/
git commit -m "workflow: document-project - initial audit"
git push

# Après *create-architecture
git add .bmad/outputs/
git commit -m "workflow: create-architecture - architecture diagrams and refactoring plan"
git push

# Après chaque implementation
git add .
git commit -m "feature: [feature-name] - implementation with BMAD guidance"
git push
```

---

## 🚨 IMPORTANT THINGS TO REMEMBER

### ✅ DO
- [ ] Provide full project context to BMAD (all files)
- [ ] Answer BMAD questions completely and accurately
- [ ] Save outputs to `.bmad/outputs/` for reference
- [ ] Follow BMAD recommendations closely
- [ ] Run tests after each workflow (`npm test`)
- [ ] Commit results to git regularly

### ❌ DON'T
- [ ] Don't skip the audit phase (it's crucial)
- [ ] Don't implement without a BMAD story (`*create-story`)
- [ ] Don't merge without `*run-code-review`
- [ ] Don't push to production without full test suite passing
- [ ] Don't hardcode secrets (always use .env)
- [ ] Don't skip documentation (BMAD will help, use it!)

---

## 📊 YOUR GAME AT A GLANCE

| Aspect | Current | Target |
|--------|---------|--------|
| **Test Coverage** | ~70% | 85%+ |
| **Modules** | scattered | modular |
| **Documentation** | outdated | up-to-date |
| **Architecture** | complex | clean |
| **Code Quality** | needs review | excellent |
| **Performance** | good | optimized |
| **Reliability** | decent | rock-solid |

BMAD will help you reach all targets! 🚀

---

## 🎮 YOUR GAME FEATURES

**Already working** ✅
- Procedural map generation
- Real-time multiplayer (Socket.io)
- Collision detection
- Shop system
- Leaderboard
- Solo mode
- Academy Leader

**To improve** 📈
- Test coverage (45 tests → 85%+)
- Architecture modularity
- Performance optimization
- Code quality/maintainability
- Documentation

**BMAD helps with ALL of this** ⭐

---

## 🆘 NEED HELP?

1. **Workflow unclear** → Re-read `.bmad/workflows/WORKFLOW-GUIDE.md`
2. **Stuck on implementation** → Use `*conduct-research` or `*run-brainstorming-session`
3. **Bug in code** → Use `*run-code-review` or `*run-quick-flow`
4. **Design question** → Use `*create-architecture` or `*conduct-research`
5. **Testing issue** → Use `*run-test-design` or `*setup-test-framework`

**BMAD Discord** : https://discord.gg/gk8jAdXWmj (if really stuck)

---

## 🎯 YOUR IMMEDIATE NEXT STEP

👉 **Copy this command and paste it into Claude (https://claude.ai):**

```
*document-project
```

**Then respond to Claude's questions with context from your project.**

That's it! Claude will handle the rest.

---

## 📅 TIMELINE (REALISTIC)

| Phase | Timeline | Effort | Output |
|-------|----------|--------|--------|
| Audit | Today | 45 min | Full analysis |
| Architecture | Tomorrow | 2-3h | Diagrams + plan |
| Testing | Day 3 | 2-3h | Test plan + setup |
| Code Review | Day 4 | 1-2h | Quality audit |
| Refactoring | Day 5-7 | TBD | Improved code |
| Feature 1 | Week 2 | 2-3d | New feature |
| Feature 2+ | Ongoing | TBD | More features |

---

## ✨ YOU'RE READY!

Everything is set up. You have:
- ✅ BMAD v6 installed
- ✅ `.bmad/` structure created
- ✅ Configuration files ready
- ✅ Specialized agent for game dev
- ✅ Complete workflow guide
- ✅ This quick start

**Now just run** `*document-project` **and let BMAD guide you!**

🚀 Let's build something amazing!

---

**Questions?** → Check `.bmad/workflows/WORKFLOW-GUIDE.md`  
**Lost?** → Re-read this quick start  
**Stuck?** → Use BMAD's research workflows  

**Let's go!** 💪
