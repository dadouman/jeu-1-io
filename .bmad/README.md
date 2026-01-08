# 🎯 BMAD v6 Integration - Mon Jeu .io

**Intégration de la méthodologie BMAD (Build More, Architect Dreams) v6 pour optimiser le développement du jeu .io.**

---

## 📁 Structure `.bmad/`

```
.bmad/
├── QUICK-START.md                      # START HERE! 👈 Lire en premier
├── BMAD-INTEGRATION-PLAN.md            # Plan détaillé complet (timeline, phases)
├── config/
│   └── game-config.yaml                # Configuration BMAD complète du jeu
├── agents/
│   └── game-architect.yaml             # Agent spécialisé pour architecture jeu
├── workflows/
│   └── WORKFLOW-GUIDE.md               # Guide complet des workflows BMAD
└── outputs/                            # Résultats des workflows (créé auto)
    ├── audit-report.md                 # Après *document-project
    ├── architecture-diagrams.md        # Après *create-architecture
    ├── tech-spec-updated.md            # Après *create-tech-spec
    ├── test-plan.md                    # Après *run-test-design
    └── code-review-report.md           # Après *run-code-review
```

---

## 🚀 DÉMARRAGE RAPIDE (5 MINUTES)

### 1️⃣ Lire QUICK-START
```bash
# Ouvre ce fichier et lis les 3 commandes essentielles
cat .bmad/QUICK-START.md
```

### 2️⃣ Lancer audit BMAD
Copie/colle dans Claude (https://claude.ai) :
```
*document-project
```

### 3️⃣ Attendre le résultat
- ⏱️ 30-45 minutes
- 📊 Output = Audit complet architecture
- 💾 Sauvegarde dans `.bmad/outputs/audit-report.md`

### 4️⃣ Prochaine étape
Lancer `*create-architecture` (voir QUICK-START.md)

---

## 📚 FICHIERS CLÉS

### Pour COMPRENDRE le plan
- **[QUICK-START.md](./QUICK-START.md)** ← START HERE!
  - Les 3 commandes essentielles
  - Comment répondre aux questions BMAD
  - Checklist first week

### Pour DÉTAIL complet
- **[BMAD-INTEGRATION-PLAN.md](./BMAD-INTEGRATION-PLAN.md)**
  - Timeline complète (semaine par semaine)
  - Métriques de succès
  - Features à implémenter après

### Pour WORKFLOWS
- **[workflows/WORKFLOW-GUIDE.md](./workflows/WORKFLOW-GUIDE.md)**
  - Détail chaque workflow BMAD
  - Input/output pour chaque commande
  - Templates pour features

### Pour CONFIGURATION
- **[config/game-config.yaml](./config/game-config.yaml)**
  - Stack technique détaillée
  - Features du jeu
  - Modules à optimiser
  - Tests actuels

### Agent spécialisé
- **[agents/game-architect.yaml](./agents/game-architect.yaml)**
  - Expertise pour votre jeu
  - Zones de focus critiques
  - Recommandations architecture

---

## ✅ WORKFLOW SEQUENCE (OPTIMALE)

### **Semaine 1 : ANALYSE**
```
1. *document-project        (30-45 min) ← Fait AUJOURD'HUI
2. *create-architecture     (2-3h)      ← Demain
3. *create-tech-spec        (1h)        ← Optionnel mais utile
```

### **Semaine 2 : TESTING**
```
4. *run-test-design         (1-1.5h)
5. *setup-test-framework    (1.5-2h)
6. *run-code-review         (1-2h)
```

### **Semaine 3+ : IMPLEMENTATION**
```
7. *create-product-brief    (30-60 min per feature)
8. *create-story            (30-45 min per story)
9. *implement-story         (variable)
10. *run-code-review        (30-60 min per story)
```

---

## 🎮 CONTEXTE DU JEU (Pour BMAD)

**Type** : Rogue-like multiplayer temps-réel  
**Backend** : Node.js + Express + Socket.io (WebSocket forced)  
**Frontend** : HTML5 Canvas + Vanilla JS  
**DB** : MongoDB (leaderboard, progression)  
**Testing** : Jest (45+ tests existants)  
**Deployment** : Render.com (CI/CD GitHub Actions)

**Modules clés** :
- `utils/map.js` - Procédural generation (CRITICAL)
- `utils/collisions.js` - Collision detection pixel-perfect
- `public/client.js` - Socket.io + input handling
- `public/game-state.js` - Client state management
- `public/game-loop.js` - 60 FPS game loop
- `server/` - Backend logic

**Défis actuels** :
- Test coverage : 70% → objectif 85%+
- Architecture : needs refactoring
- Performance : Canvas rendering optimization needed
- Reliability : Socket.io sync issues sometimes

---

## 🛠️ CONFIGURATION BMAD

### Pour lancer BMAD
1. Utilise Claude (https://claude.ai) ou Cursor
2. Fournis ton projet en contexte (drag & drop files)
3. Copie/colle une commande BMAD (e.g., `*document-project`)
4. Claude analysera ton projet et guidera

### Configuration automatique
- `.bmadrc.yaml` - Config globale (language, tools, rules)
- `config/game-config.yaml` - Config spécifique au jeu
- `agents/game-architect.yaml` - Agent custom pour architecture jeu

Ces fichiers aident BMAD à :
- Comprendre ton stack tech
- Fournir des recommandations ciblées
- Parler French + technical
- Focus sur jeu real-time + Socket.io

---

## 📊 MÉTRIQUES DE SUCCÈS

Après intégration BMAD complète:

| Métrique | Avant | Après | Target |
|----------|-------|-------|--------|
| **Test Coverage** | ~70% | TBD | 85%+ |
| **Code Quality** | Good | TBD | Excellent |
| **Architecture** | Complex | TBD | Clean & modular |
| **Performance** | Good | TBD | Optimized |
| **Documentation** | Outdated | TBD | Up-to-date |
| **Reliability** | Decent | TBD | Rock-solid |

BMAD t'aide à atteindre tous les targets! 🚀

---

## 🔄 GIT WORKFLOW

Après chaque workflow BMAD:

```bash
# Sauvegarder résultats
git add .bmad/

# Commit avec contexte
git commit -m "workflow: [nom] - [description courte]"

# Exemples:
git commit -m "workflow: document-project - initial audit complete"
git commit -m "workflow: create-architecture - refactoring plan and diagrams"
git commit -m "workflow: run-test-design - coverage plan for 85% target"

# Push
git push
```

---

## 📞 AIDE & RESSOURCES

### Si workflow semble stuck
→ Consult [workflows/WORKFLOW-GUIDE.md](./workflows/WORKFLOW-GUIDE.md)

### Si tu as une question spécifique
→ Use `*conduct-research` workflow dans Claude

### Si tu es bloqué sur un bug
→ Use `*run-quick-flow` ou `*run-code-review`

### Pour support BMAD
- **Discord** : https://discord.gg/gk8jAdXWmj
- **Docs** : https://docs.bmad-method.org/
- **YouTube** : https://www.youtube.com/@BMadCode

---

## 💡 PRO TIPS

✨ **Maximiser BMAD**:
1. Fournir contexte complet au démarrage (tous les fichiers)
2. Répondre complètement aux questions
3. Sauvegarder outputs BMAD dans `.bmad/outputs/`
4. Itérer rapidement (tests doivent passer)
5. Committer résultats régulièrement

🎮 **Spécifique Jeu Dev**:
1. Focus sur déterminisme (seeds pour maps)
2. Real-time constraints (latency, FPS)
3. Test logique time-sensitive (Socket.io, leaderboard)
4. Profile Canvas rendering
5. Validate player inputs (anti-cheat)

---

## 📋 CHECKLIST INSTALLATION

- [x] BMAD v6 installé (`npm install bmad-method@alpha`)
- [x] Structure `.bmad/` créée
- [x] Configuration BMAD setup
- [x] Agent personnalisé créé
- [x] Workflows documentés
- [x] Plan d'action détaillé
- [ ] Lancer `*document-project` ← **TON PROCHAIN STEP**

---

## 🎯 NEXT STEP

👉 **Ouvre Claude/Cursor et copie cette commande**:
```
*document-project
```

C'est tout! BMAD guidera le reste. 

Feedback/Questions? Check `.bmad/QUICK-START.md` ou `.bmad/workflows/WORKFLOW-GUIDE.md`

---

**Status** : ✅ Ready to launch  
**Installation Date** : Jan 8, 2026  
**Next Workflow** : `*document-project`  
**Estimated Time** : 30-45 minutes  

**Let's build something amazing!** 🚀
