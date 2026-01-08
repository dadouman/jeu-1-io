# 📚 INDEX BMAD - Navigation Centrale

Bienvenue dans l'intégration BMAD v6 pour **Mon Jeu .io**! 🎮

Ce fichier est ton point d'entrée pour naviguer toute la documentation BMAD.

---

## ⚡ START HERE (Lis ces 3 fichiers en ordre)

### 1️⃣ **[`.bmad/README.md`](.bmad/README.md)** (5 min)
   - Overview de l'intégration
   - Structure `.bmad/`
   - Quick overview

### 2️⃣ **[`.bmad/QUICK-START.md`](.bmad/QUICK-START.md)** (10 min) ← **LIS ENSUITE!**
   - Les 3 commandes essentielles
   - Comment répondre aux questions BMAD
   - Checklist first week
   - **👉 Prochaine étape immédiate**

### 3️⃣ **[`.bmad/BMAD-INTEGRATION-PLAN.md`](.bmad/BMAD-INTEGRATION-PLAN.md)** (15 min)
   - Plan complet (timeline + phases)
   - Métriques de succès
   - Features à implémenter

---

## 📖 DOCUMENTATION COMPLÈTE

### Par Type de Document

#### 📋 Plans & Stratégie
- [BMAD-INTEGRATION-PLAN.md](.bmad/BMAD-INTEGRATION-PLAN.md)
  - Timeline complète (4 semaines)
  - Phases (Audit → Architecture → Testing → Implementation)
  - Métriques de succès
  - Priorité des features

#### 🔧 Configuration
- [.bmadrc.yaml](.bmadrc.yaml)
  - Config globale BMAD
  - Règles & gates de qualité
  - Intégrations (git, github, etc.)

- [.bmad/config/game-config.yaml](.bmad/config/game-config.yaml)
  - Config spécifique au jeu
  - Stack technique détaillée
  - Modules à optimiser
  - Features du jeu

#### 🤖 Agents
- [.bmad/agents/game-architect.yaml](.bmad/agents/game-architect.yaml)
  - Agent spécialisé pour architecture jeu
  - Expertise real-time + Socket.io
  - Zones de focus critiques

#### 📚 Workflows
- [.bmad/workflows/WORKFLOW-GUIDE.md](.bmad/workflows/WORKFLOW-GUIDE.md)
  - Guide détaillé tous les workflows
  - Input/output pour chaque commande
  - Templates pour features
  - Troubleshooting

---

## 🎯 NAVIGATION PAR OBJECTIF

### Je veux COMMENCER
→ Lis [`.bmad/QUICK-START.md`](.bmad/QUICK-START.md)  
→ Lance `*document-project` dans Claude/Cursor

### Je veux comprendre le PLAN COMPLET
→ Lis [`.bmad/BMAD-INTEGRATION-PLAN.md`](.bmad/BMAD-INTEGRATION-PLAN.md)  
→ Check timeline semaine par semaine

### Je veux lancer un WORKFLOW SPÉCIFIQUE
→ Consult [`.bmad/workflows/WORKFLOW-GUIDE.md`](.bmad/workflows/WORKFLOW-GUIDE.md)  
→ Cherche le workflow par nom (e.g., `*document-project`)

### Je suis BLOQUÉ sur quelque chose
→ Lis la section "Troubleshooting" du workflow  
→ Ou use `*conduct-research` dans Claude

### Je veux implémenter une FEATURE
→ Check [`.bmad/BMAD-INTEGRATION-PLAN.md`](.bmad/BMAD-INTEGRATION-PLAN.md) Phase 5  
→ Follow le template Story → Implementation → Review

### Je veux COMPRENDRE LA CONFIG BMAD
→ Lis [`.bmadrc.yaml`](.bmadrc.yaml) + explications inline  
→ Lis [`.bmad/config/game-config.yaml`](.bmad/config/game-config.yaml)

---

## 🚀 WORKFLOW SEQUENCE (Copie/Colle Rapide)

### Cette semaine (Audit + Architecture)
```
1. *document-project      # Audit complet (30-45 min)
2. *create-architecture   # Diagrammes C4/UML (2-3h)
3. *create-tech-spec      # Tech doc update (1h, optionnel)
```

### Prochaine semaine (Testing)
```
4. *run-test-design       # Test plan (1-1.5h)
5. *setup-test-framework  # Jest setup (1.5-2h)
6. *run-code-review       # Quality audit (1-2h)
```

### Semaines 3+ (Implementation)
```
7. *create-product-brief  # PRD feature (30-60 min)
8. *create-story          # User story (30-45 min)
9. *implement-story       # Coding (variable)
10. *run-code-review      # QA before merge (30-60 min)
```

Voir [WORKFLOW-GUIDE.md](.bmad/workflows/WORKFLOW-GUIDE.md) pour détails complets.

---

## 📊 STATUS CURRENT

| Item | Status | Notes |
|------|--------|-------|
| BMAD v6 Installation | ✅ Done | `npm install bmad-method@alpha` |
| Structure `.bmad/` | ✅ Done | All config files created |
| Configuration BMAD | ✅ Done | `.bmadrc.yaml` + config files |
| Agent Custom | ✅ Done | Game Architect spécialisé |
| Documentation | ✅ Done | Plans, guides, workflows |
| Git Commit | ✅ Done | Pushed to main |
| **First Workflow** | ⏳ TODO | **Launch `*document-project` now!** |

---

## 📞 HELP & RESOURCES

### Questions sur un Workflow?
→ See [.bmad/workflows/WORKFLOW-GUIDE.md](.bmad/workflows/WORKFLOW-GUIDE.md)

### Questions sur le Plan?
→ See [.bmad/BMAD-INTEGRATION-PLAN.md](.bmad/BMAD-INTEGRATION-PLAN.md)

### Stuck ou Confused?
→ Lis [.bmad/QUICK-START.md](.bmad/QUICK-START.md) à nouveau  
→ Ou launch `*conduct-research` dans Claude

### BMAD Official Resources
- **Discord** : https://discord.gg/gk8jAdXWmj
- **Docs** : https://docs.bmad-method.org/
- **YouTube** : https://www.youtube.com/@BMadCode
- **GitHub** : https://github.com/bmad-code-org/BMAD-METHOD

---

## 🎮 QUICK REFERENCE: YOUR GAME

**Type** : Rogue-like multiplayer temps-réel  
**Stack** : Node.js + Express + Socket.io + MongoDB + Canvas  
**Testing** : Jest (45+ tests)  
**Deployment** : Render.com  

**Key Modules** :
- `utils/map.js` - Procedural generation
- `utils/collisions.js` - Pixel-perfect collision
- `public/client.js` - Socket.io + inputs
- `public/game-loop.js` - 60 FPS game loop

**Goals with BMAD** :
- Test coverage: 70% → 85%+
- Architecture: refactor & modularize
- Performance: optimize Canvas + Socket.io
- Reliability: rock-solid networking

---

## 📋 FILES CHECKLIST

All files created:
- [x] `.bmad/README.md` - Overview
- [x] `.bmad/QUICK-START.md` - Quick guide
- [x] `.bmad/BMAD-INTEGRATION-PLAN.md` - Full plan
- [x] `.bmad/config/game-config.yaml` - Game config
- [x] `.bmad/agents/game-architect.yaml` - Custom agent
- [x] `.bmad/workflows/WORKFLOW-GUIDE.md` - Workflow guide
- [x] `.bmadrc.yaml` - Global config
- [x] `package.json` updated - npm scripts for BMAD
- [x] This file (INDEX.md)

---

## 🎯 YOUR NEXT STEPS (TODAY!)

1. ✅ Read [`.bmad/QUICK-START.md`](.bmad/QUICK-START.md) (5-10 min)
2. ✅ Gather your project context
3. ✅ Open Claude (https://claude.ai)
4. ✅ Copy/paste this command:
   ```
   *document-project
   ```
5. ✅ Wait 30-45 minutes for results
6. ✅ Save output to `.bmad/outputs/audit-report.md`
7. ✅ Review findings
8. ✅ Plan next week with team

---

## 💡 PRO TIPS

✨ **Maximize BMAD**:
- Provide full project context upfront
- Answer questions completely
- Save outputs for reference
- Iterate quickly
- Commit results to git

🎮 **Game Dev Focus**:
- Determinism (seeds for maps)
- Real-time constraints (FPS, latency)
- Test time-sensitive code
- Profile Canvas rendering
- Validate player inputs

---

## 📝 VERSION INFO

| Item | Value |
|------|-------|
| BMAD Version | v6.0 (alpha) |
| Setup Date | Jan 8, 2026 |
| Game Version | 1.0.0 |
| Node.js Target | >= 20.0.0 |
| Status | ✅ Ready to go |

---

## 🚀 YOU'RE READY!

Everything is set up. Documentation is complete.

**Now just open Claude and run `*document-project`!**

Questions? Read the appropriate doc above.  
Stuck? Use BMAD workflows to get unstuck.  
Ready? Let's build something amazing! 💪

---

**Navigation Quick Links** :
- [README.md](.bmad/README.md)
- [QUICK-START.md](.bmad/QUICK-START.md) ← Start here!
- [BMAD-INTEGRATION-PLAN.md](.bmad/BMAD-INTEGRATION-PLAN.md)
- [WORKFLOW-GUIDE.md](.bmad/workflows/WORKFLOW-GUIDE.md)
- [game-config.yaml](.bmad/config/game-config.yaml)
- [game-architect.yaml](.bmad/agents/game-architect.yaml)
- [.bmadrc.yaml](.bmadrc.yaml)

**Last Updated** : Jan 8, 2026  
**Status** : ✅ Complete - Ready for first workflow
