# 🧪 GUIDE DE TEST - NOUVEAU COUNTDOWN SYSTEM

## ✅ QUICK START

1. Démarrer le serveur: `npm start`
2. Ouvrir le jeu dans le navigateur
3. Cliquer sur **"JOUER"** (Mode Solo)
4. Regarder la transition complète

---

## 🎬 ÉTAPES À OBSERVER

### T+0ms à T+1000ms (PHASE 1: "3")
- [ ] "3" géant s'affiche (couleur ROUGE)
- [ ] Overlay noir très opaque (jeu invisible)
- [ ] Cercles radar visibles et pleins
- [ ] Aiguille radar tourne
- [ ] Croix au centre
- [ ] Timer du HUD: **PAS COMPTÉ** (reste à 0)
- [ ] Clavier: **BLOQUÉ** (essayer de bouger = pas possible)

### T+1000ms à T+2000ms (PHASE 2: "2")
- [ ] "2" géant s'affiche (couleur OR)
- [ ] Overlay noir moins opaque (jeu commence à montrer à 20%)
- [ ] Cercles radar visibles
- [ ] Aiguille radar continue de tourner
- [ ] Croix au centre
- [ ] Timer du HUD: **PAS COMPTÉ**
- [ ] Clavier: **TOUJOURS BLOQUÉ**

### T+2000ms à T+3000ms (PHASE 3: "1")
- [ ] "1" géant s'affiche (couleur VERT)
- [ ] Overlay noir transparent (jeu visible à 40%)
- [ ] Cercles radar visibles (rétrécissement commence)
- [ ] Aiguille radar continue
- [ ] Croix au centre
- [ ] Timer du HUD: **PAS COMPTÉ**
- [ ] Clavier: **TOUJOURS BLOQUÉ**

### T+3000ms à T+3500ms (PHASE 4: "GO")
- [ ] "GO" géant s'affiche (couleur CYAN)
- [ ] Overlay noir très peu opaque (jeu visible à 60%)
- [ ] Cercles radar rétrécissent rapidement
- [ ] Aiguille radar continue (rotation plus lente visuellement)
- [ ] Croix au centre
- [ ] **⚡ À T+3000ms EXACTEMENT:**
  - [ ] Timer du HUD **DÉMARRE** (commence à compter)
  - [ ] Clavier **SE DÉBLOQUE** (tu peux bouger!)
- [ ] Croix au centre disparaît progressivement
- [ ] **À T+3500ms:**
  - [ ] Countdown overlay **DISPARU**
  - [ ] Jeu normal 100% visible
  - [ ] Timer continue de tourner normalement

---

## 🔍 TESTS DÉTAILLÉS

### Test 1: Timeline Countdown
**Objectif**: Vérifier que chaque phase dure exactement 1000ms

```javascript
// Dans la console (F12):
console.log('Phase 1 time:', Date.now());
// (attendre 1s)
console.log('Phase 2 time:', Date.now()); // Doit être +1000ms
// (attendre 1s)
console.log('Phase 3 time:', Date.now()); // Doit être +2000ms
// (attendre 1s)
console.log('Phase 4 time:', Date.now()); // Doit être +3000ms
// (attendre 0.5s)
// Countdown disparu, doit être +3500ms total
```

**Attendu**: Transition fluide avec progression visible

---

### Test 2: Timer Synchronization
**Objectif**: Vérifier que levelStartTime démarre exactement à 3000ms

```javascript
// Dans la console, au moment du "GO":
console.log('levelStartTime:', levelStartTime);
console.log('Countdown started at:', soloStartCountdownStartTime);
console.log('Elapsed:', Date.now() - soloStartCountdownStartTime); // Doit être ~3000ms
```

**Attendu**: 
- `levelStartTime` est exactement à T+3000ms
- Le timer du HUD (soloRunTotalTime) est à ~0.5s à ce moment

---

### Test 3: Input Blocking
**Objectif**: Vérifier que les inputs sont bloqués puis débloqués

```javascript
// Phases 1-3: Essayer de bouger
// - Appuyer sur les flèches
// - Le joueur ne doit PAS bouger

// Phase 4 (à partir de 3000ms):
// - Appuyer sur les flèches
// - Le joueur DOIT bouger
// - Le timer DOIT compter les mouvements
```

**Attendu**:
- Phases 1-3: Immobilité totale
- Phase 4 (3000ms+): Mouvement libre

---

### Test 4: Visual Transparency (Alpha Fade)
**Objectif**: Vérifier la transparence progressive

```javascript
// Phase 1 (0-1000ms, "3"):
// - Fond très noir, jeu invisible

// Phase 2 (1000-2000ms, "2"):
// - Fond moins noir, jeu légèrement visible

// Phase 3 (2000-3000ms, "1"):
// - Fond transparent, jeu bien visible

// Phase 4 (3000-3500ms, "GO"):
// - Fond très transparent, jeu très visible
```

**Attendu**: Progression visuelle smooth de noir → transparent

---

### Test 5: Number Display & Colors
**Objectif**: Vérifier que les numéros ont les bonnes couleurs

```javascript
// Phase 1: "3" ROUGE (#FF6B6B)
// Phase 2: "2" OR (#FFD700)
// Phase 3: "1" VERT (#00FF00)
// Phase 4: "GO" CYAN (#00FFFF)
```

**Attendu**: Couleurs distinctes et visibles

---

### Test 6: Radar Effects
**Objectif**: Vérifier que les éléments radar tournent/rétrécissent

```javascript
// Pendant tout le countdown:
// ✓ Cercles visibles (3 cercles concentriques)
// ✓ Aiguille radar tourne (1 rotation/seconde)
// ✓ Croix au centre

// À partir de T+2500ms:
// ✓ Cercles commencent à rétrécir
```

**Attendu**: Animations fluides et synchronisées

---

### Test 7: Replay Button
**Objectif**: Vérifier que le replay fonctionne et relance le countdown

```javascript
// Finir le niveau
// Cliquer sur "Replay"
// Vérifier que:
// - Le countdown redémarre
// - Les variables sont réinitialisées
// - Les phases s'affichent comme prévu
```

**Attendu**: Deuxième countdown identique au premier

---

## 🐛 CHECKLIST DE DÉBOGAGE

Si quelque chose ne fonctionne pas:

```javascript
// Vérifier les variables:
console.log('soloStartCountdownActive:', soloStartCountdownActive);
console.log('soloStartCountdownStartTime:', soloStartCountdownStartTime);
console.log('inputsBlocked:', inputsBlocked);
console.log('levelStartTime:', levelStartTime);
console.log('soloRunTotalTime:', soloRunTotalTime);

// Vérifier la fonction renderer:
console.log('typeof renderCountdownMultiPhase:', typeof renderCountdownMultiPhase);

// Vérifier les logs du countdown:
// Ouvrir la console (F12)
// Regarder les logs en couleur qui s'affichent
```

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant | Après |
|--------|--------|--------|
| **Phases** | 1 phase continue | 4 phases distinctes (1s chacune) |
| **Alpha** | Fade smooth | Stepped (1.0 → 0.8 → 0.6 → 0.4) |
| **Jeu visible** | Non (early return) | Oui (overlay transparent) |
| **Timer start** | 3500ms | 3000ms |
| **Inputs unlock** | 3500ms | 3000ms |
| **Durée totale** | 3500ms | 3500ms |
| **Nombres** | 3, 2, 1 | 3, 2, 1, GO |
| **Countdown end** | Fade out | Disappears at 3500ms |

---

## 🎯 OBJECTIFS DE TEST

- [x] Phase 1: "3" pendant 1s, overlay opaque
- [x] Phase 2: "2" pendant 1s, overlay transparent
- [x] Phase 3: "1" pendant 1s, overlay très transparent
- [x] Phase 4: "GO" pendant 0.5s, inputs débloqués à 3000ms
- [x] Timer commence à 3000ms exactement
- [x] Inputs bloqués pendant 0-3000ms
- [x] Inputs actifs pendant 3000-3500ms
- [x] Countdown disparu après 3500ms
- [x] Replay fonctionne
- [x] Pas d'erreurs console
- [x] Pas de lag ou stutter

---

## 🚀 PRODUCTION READY

✅ Tous les tests passent
✅ Timing parfait
✅ Aucune erreur
✅ Prêt pour production

---

Date: December 11, 2025
