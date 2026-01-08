# 🏗️ Architecture - Index & Navigation

## 📚 Vue d'ensemble de la documentation d'architecture

Bienvenue dans la documentation complète de l'architecture du jeu .io! Ce fichier te guide vers les bons documents selon tes besoins.

---

## 🎯 Je dois...

### 💡 **Comprendre rapidement la structure**
👉 **Lire en priorité**: [ARCHITECTURE_QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md)
- ⏱️ 5 min de lecture
- 📊 Tableau "Où ajouter du code?"
- 🔥 Exemple complet: ajouter un item de shop
- 💡 Astuces pro et debug

### 🛠️ **Approfondir l'architecture**
👉 **Lire ensuite**: [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md)
- ⏱️ 20-30 min de lecture complète
- 📁 Structure complète des dossiers
- 🔄 Flux de données détaillés
- 🎮 Explicitation de chaque module clé
- 🚀 Checklist déploiement

### 📊 **Voir les diagrammes et flux**
👉 **Consulter**: [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- ⏱️ 10 min (regarder les diagrammes)
- 🎨 Diagrammes texte ASCII
- 🔗 WebSocket communication
- 🎮 Cycle de vie d'une partie
- 📍 Arbre des dépendances

### ✅ **Valider l'architecture avant commit**
👉 **Utiliser**: [ARCHITECTURE_VALIDATION_CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md)
- ⏱️ 5-10 min de vérification
- ✨ 10 sections de checklist
- 🔐 Sécurité, tests, code quality
- 📝 Avant chaque git push
- 🚀 Checklist pré-déploiement

### 🆘 **Débuger un problème spécifique**
👉 **Voir aussi**:
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Tests cassés?
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Déploiement cassé?
- [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md#-modules-clés) - Module spécifique?

---

## 📑 Hiérarchie des documents

```
📌 TU ES ICI
    ↓
┌─────────────────────────────────────────────────────────────┐
│ ARCHITECTURE_INDEX.md (Ce document)                         │
│ Point de départ - Navigation et orientation                 │
└─────────────────────────────────────────────────────────────┘
    ↓
    ├─→ [ARCHITECTURE_QUICK_REFERENCE.md] (⚡ Par ici d'abord!)
    │   └─ TL;DR, tableau "où mettre du code", exemple
    │
    ├─→ [ARCHITECTURE_COMPLETE.md] (📚 Complet et détaillé)
    │   ├─ Vue d'ensemble globale
    │   ├─ Structure complète des dossiers (6 sections)
    │   ├─ Flux de données (4 sections: init, boucle, client, achats)
    │   ├─ Modules clés (explications + code)
    │   ├─ Sécurité et bonnes pratiques
    │   ├─ Modes supportés
    │   ├─ Stack technique
    │   ├─ Tests (framework, localisation, types)
    │   ├─ Metrics de performance
    │   ├─ Workflow dev (branches, commits)
    │   └─ Quick reference "Où mettre quoi?"
    │
    ├─→ [ARCHITECTURE_DIAGRAMS.md] (📊 Visuel)
    │   ├─ Diagramme communication WebSocket
    │   ├─ Cycle de vie d'une partie
    │   ├─ Flux de mouvement (détail bas niveau)
    │   ├─ Arbre des dépendances
    │   ├─ États globaux (server + client)
    │   ├─ Cycle d'une action (achat)
    │   ├─ Organisation des tests
    │   ├─ Routing Express
    │   └─ Flux de déploiement
    │
    ├─→ [ARCHITECTURE_VALIDATION_CHECKLIST.md] (✅ Avant commit)
    │   ├─ Modularity (structure dossiers)
    │   ├─ Sécurité (secrets, inputs)
    │   ├─ Tests (critiques, isolation)
    │   ├─ Code Quality (nommage, responsabilité)
    │   ├─ Socket.io (architecture temps réel)
    │   ├─ Gameplay Logic (modes, progression)
    │   ├─ Performance (60 FPS, memory)
    │   ├─ Déploiement (.env, routes, tests)
    │   ├─ Git & Commits (messages clairs)
    │   ├─ Features (testabilité, documentation)
    │   └─ Checklist finale pré-push
    │
    └─→ Autres documents connexes:
        ├─ [TESTING_GUIDE.md](TESTING_GUIDE.md) - Jest, tests unitaires
        ├─ [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - CI/CD, déploiement
        ├─ [README_GAMEPLAY.md](README_GAMEPLAY.md) - Règles du jeu
        ├─ [TESTING_QUICK_START.md](TESTING_QUICK_START.md) - Tests rapide
        └─ [docs/CODE_QUALITY_REPORT.md](CODE_QUALITY_REPORT.md) - Qualité
```

---

## 🎓 Parcours d'apprentissage recommandé

### Pour un nouveau développeur (nouveau sur le projet)
1. **Jour 1** → [ARCHITECTURE_QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md) (30 min)
   - Comprendre la structure générale
   - Voir où mettre du code

2. **Jour 2** → [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) (1h)
   - Visualiser le flux de données
   - Comprendre la communication

3. **Jour 3** → [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) (2h)
   - Approfondir chaque module
   - Lire les explications détaillées

4. **Jour 4+** → Code et pratique
   - Faire une petite feature (nouvel item, etc.)
   - Utiliser [ARCHITECTURE_VALIDATION_CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md)
   - Faire le premier commit

### Pour un développeur expérimenté (revenant)
1. **Rapide** → [ARCHITECTURE_QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md) (5 min)
   - Rappel rapide des conventions

2. **Au besoin** → [ARCHITECTURE_VALIDATION_CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md)
   - Avant de commit

3. **Rarement** → [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md)
   - Pour architecturer une grosse feature

---

## 🚀 Workflows courants

### ▶️ Je veux ajouter une fonctionnalité

```
1. Lire QUICK_REFERENCE.md (5 min)
   └─ Voir le tableau "Où ajouter du code?"
   
2. Suivre l'exemple "Speed Boost item" (10 min)
   └─ Structure 4 étapes: config → logique → réseau → frontend
   
3. Implémenter (variable)
   
4. Tester localement
   npm test -- --forceExit
   npm start
   
5. Vérifier la checklist VALIDATION_CHECKLIST.md (5 min)
   
6. Commit et push!
```

### ▶️ Mon test échoue

```
1. Lire [TESTING_GUIDE.md](TESTING_GUIDE.md)
   
2. Localiser le test qui échoue
   └─ Dans tests/*.test.js
   
3. Lire le message d'erreur attendu vs reçu
   
4. Identifier la logique cassée
   └─ Dans utils/ ou server/
   
5. Fixer le code
   
6. Relancer npm test
```

### ▶️ Mon serveur crash

```
1. Lire le message d'erreur complet
   
2. Si "Cannot GET /" → Route GET / manquante
   └─ Voir server/index.js
   
3. Si "Module not found" → Dépendance manquante
   └─ npm install
   
4. Si "Cannot read property X of undefined"
   └─ Vérif null/undefined (sécurité)
   └─ Voir VALIDATION_CHECKLIST "Sécurité"
   
5. Consulter ARCHITECTURE_COMPLETE.md section du module
```

### ▶️ Je déploie sur Render

```
1. Tests passent?
   npm test -- --forceExit  → ✅ PASS
   
2. Serveur démarre?
   npm start → ✅ Écoute sur PORT
   
3. Variables .env en place?
   → Vérifier RENDER_DEPLOYMENT.md
   
4. Git clean et récent?
   git push origin main
   
5. Render auto-déploie
   → Attendre 2-3 min
   
6. Vérifier logs Render
   → Pas de FAIL?
```

---

## 📍 Fichiers clés du projet

### Backend (Server)
- [server.js](../../server.js) - Point d'entrée
- [server/index.js](../../server/index.js) - Express init
- [server/game-loop.js](../../server/game-loop.js) - Boucle 60FPS
- [server/socket-events-refactored.js](../../server/socket-events-refactored.js) - WebSocket events

### Configuration
- [config/gameModes.js](../../config/gameModes.js) - Tous les modes de jeu
- [.env](.../.env) - Secrets (MongoDB, SendGrid, etc.)

### Logique métier
- [utils/GameMode.js](../../utils/GameMode.js) - Abstraction configuration
- [utils/GameSessionManager.js](../../utils/GameSessionManager.js) - Gestion sessions
- [utils/PlayerActions.js](../../utils/PlayerActions.js) - Actions joueur unifiées
- [utils/collisions.js](../../utils/collisions.js) - Détection collision
- [utils/map.js](../../utils/map.js) - Génération labyrinthe
- [utils/ShopManager.js](../../utils/ShopManager.js) - Logique shop

### Frontend (Client)
- [public/index.html](../../public/index.html) - Page HTML
- [public/client.js](../../public/client.js) - Gestionnaire Socket
- [public/game-state.js](../../public/game-state.js) - État global client
- [public/game-loop.js](../../public/game-loop.js) - Boucle client
- [public/renderer.js](../../public/renderer.js) - Rendu principal

### Tests
- [jest.config.js](../../jest.config.js) - Config Jest
- [tests/](../../tests/) - Dossier tests

---

## 🎯 Questions fréquentes

### Q: Où dois-je ajouter ma nouvelle mécanique?
**A**: Voir le tableau dans [ARCHITECTURE_QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md#-o-ajouter-du-code-)

### Q: Je dois changer la vitesse du joueur, où?
**A**: 
1. Config → `config/gameModes.js` (playerSpeed: 150)
2. Logique → `utils/PlayerActions.js` (processMovement)
3. Tester avec `npm test`

### Q: Comment ajouter un nouveau mode de jeu?
**A**:
1. Ajouter objet dans `config/gameModes.js`
2. Donner config identique (levels, shopItems, etc.)
3. Sélecteur mode appelle déjà `GameMode.js` génériquement
4. **Fin!** Pas de modification du code serveur

### Q: Mon collision détection ne marche pas?
**A**: 
1. Vérif maths dans `utils/collisions.js`
2. Tester avec `npm test tests/collisions.test.js`
3. Ajouter console.log pour déboguer
4. Vérif que `server/game-loop.js` appelle checkPlayerGemCollision()

### Q: Est-ce que je peux modifier les règles du jeu sans redémarrer?
**A**: 
- ✅ Configs dans `gameModes.js` → redémarrage nécessaire
- ❌ Code serveur → redémarrage obligatoire
- ✅ Frontend (UI) → rafraîchir la page du client

### Q: Comment déboguer côté serveur?
**A**:
1. Ajouter `console.log()` temporaire
2. Redémarrer serveur (`npm start`)
3. Lire la sortie terminal
4. Supprimer log après debug
5. ⚠️ Pas de logs en production (impact perf)

---

## 📊 Vue rapide des responsabilités

```
┌─────────────────┬────────────────────────────────────────────┐
│ Fichier/Module  │ Responsabilité                             │
├─────────────────┼────────────────────────────────────────────┤
│ config/         │ Configuration - zéro logique, que du data   │
│ utils/          │ Logique métier - testable, réutilisable    │
│ server/         │ Serveur Express + Socket + Boucle 60FPS    │
│ public/         │ Frontend Canvas + Input + Réseau client    │
│ tests/          │ Tests Jest pour logique critique           │
└─────────────────┴────────────────────────────────────────────┘
```

---

## 🔗 Liens rapides

| Besoin | Lien |
|--------|------|
| **Comprendre rapidement** | [QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md) |
| **Architecture complète** | [COMPLETE.md](ARCHITECTURE_COMPLETE.md) |
| **Diagrammes visuels** | [DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) |
| **Validation avant commit** | [CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md) |
| **Tests et Jest** | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| **Déployer sur Render** | [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) |
| **Règles du jeu** | [README_GAMEPLAY.md](README_GAMEPLAY.md) |

---

## ✨ Recommandations principales

1. **Ne jamais** mettre de secrets en dur → Toujours `.env`
2. **Jamais** de logique en dur dans un mode → Toujours `gameModes.js`
3. **Toujours** valider inputs serveur → Sécurité
4. **Toujours** tester avant de commit → `npm test`
5. **Toujours** documenter si complexe → Commentaire + exemple
6. **Jamais** ignorer un test qui échoue → Fixer immédiatement

---

## 👋 Besoin d'aide?

- 🏗️ Architecture cassée? → Consulte [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md)
- 🧪 Tests cassés? → Lire [TESTING_GUIDE.md](TESTING_GUIDE.md)
- 🚀 Déploiement? → Voir [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- 💡 Où mettre du code? → [QUICK_REFERENCE.md](ARCHITECTURE_QUICK_REFERENCE.md#-où-ajouter-du-code-)
- ✅ Avant de commit? → [VALIDATION_CHECKLIST.md](ARCHITECTURE_VALIDATION_CHECKLIST.md)

---

**Créé**: Janvier 2026  
**Dernière mise à jour**: Aujourd'hui  
**Statut**: 🟢 Architecture stable et documentée  
**Version**: 1.0

