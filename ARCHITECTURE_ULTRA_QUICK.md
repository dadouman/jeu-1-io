# ⚡ ARCHITECTURE - ULTRA QUICK START (2 MIN)

## 🎯 TL;DR - Tu as 2 minutes?

### 1. Où mettre du code?
👉 **Vois le tableau** dans `docs/ARCHITECTURE_QUICK_REFERENCE.md`

### 2. Avant de commiter
👉 **Utilise la checklist** dans `docs/ARCHITECTURE_VALIDATION_CHECKLIST.md`

### 3. Besoin d'aide?
👉 **Ouvre** `docs/ARCHITECTURE_START_HERE.md`

---

## 🚀 3 commandes clés

```bash
# Développer
npm start

# Tester (avant chaque commit)
npm test -- --forceExit

# Déployer (après commit)
git push origin main
# (Render auto-déploie en 2-3 min)
```

---

## 📍 3 fichiers essentiels

1. **ARCHITECTURE_START_HERE.md** ← Par ici d'abord
2. **ARCHITECTURE_QUICK_REFERENCE.md** ← Quotidien
3. **ARCHITECTURE_VALIDATION_CHECKLIST.md** ← Avant commit

---

## ✨ Les 3 règles

1. **Secrets → `.env`** (pas en dur!)
2. **Config → `gameModes.js`** (pas hardcodé!)
3. **Tests avant commit** (obligatoire!)

---

## 🎮 Architecture en 30 secondes

```
Client (Canvas)
    ↕ WebSocket
Server (Express)
    ↕ Logique (utils/)
Config (gameModes.js)
    ↕ Database (MongoDB)
```

**Modular. Testable. Déployable.**

---

## 🔥 Je veux ajouter du code MAINTENANT

```
1. Ouvre: docs/ARCHITECTURE_QUICK_REFERENCE.md
2. Cherche: Tableau "Où ajouter du code?"
3. Lis: Exemple "Speed Boost item"
4. Code: Suis le pattern
5. Test: npm test -- --forceExit
6. Commit: Utilise la checklist
```

---

## ✅ Avant chaque commit

```bash
npm test -- --forceExit    # ✅ Passer?
npm start                  # ✅ Démarre?
VALIDATION_CHECKLIST.md    # ✅ Cocher?
git commit                 # ✅ Commiter
```

---

## 🌟 Pro tips

- Bookmark `ARCHITECTURE_QUICK_REFERENCE.md`
- Utilise la checklist avant CHAQUE commit
- Si perdu: consulte `ARCHITECTURE_START_HERE.md`
- Si tu besoin d'aider: `ARCHITECTURE_INDEX.md`

---

**Créé**: Janvier 8, 2026  
**Durée lecture**: 2 minutes  
**Status**: ✅ Prêt!

👉 **Ouvre maintenant**: `docs/ARCHITECTURE_START_HERE.md`

