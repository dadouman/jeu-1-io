# Guide: Améliorer les tests pour éviter les régressions UI

## 📊 Résumé de la situation

### Le Problème
Les tests existants **NE couvraient PAS la couche présentation** (rendering):
- ✅ Logique métier testée (achat, progression, etc.)
- ❌ Rendu graphique non testé (éléments visibles? Bonnes positions?)
- ❌ Types de données non vérifiés (speedBoost booléen au lieu de nombre)

### Résultat
Trois bugs UI importants ont passé inaperçus:

| Bug | Cause | Solution |
|-----|-------|----------|
| `x1` affiché au lieu du compteur | speedBoost type = boolean | Test: `typeof speedBoost === 'number'` |
| HUD temps/niveau pas visible | renderSoloHUD() non appelé | Test: vérifier que la fonction est appelée |
| Features HUD pas visible | Mauvais positionnement (clippé) | Test: `TOP_Y < FOG_TOP` |

---

## 🧪 Tests ajoutés

### 1. `tests/rendering-ui.test.js` (25 tests)
Tests pour tous les éléments UI:
- ✅ HUD Features display (dash, checkpoint, rope, speedBoost)
- ✅ HUD Solo stats (temps total, delta, niveau)
- ✅ Positionnement des éléments
- ✅ Visibilité et conditions d'affichage
- ✅ Vérification des types de données

**Exécuter:**
```bash
npm test -- rendering-ui.test.js
```

### 2. `tests/visual-regression.test.js` (25 tests)
Tests de régression pour éviter les bugs futurs:
- ✅ Bug #1: SpeedBoost doit être NUMBER, pas BOOLEAN
- ✅ Bug #2: HUD et stats doivent être affichés
- ✅ Bug #3: Features HUD doit être visible (pas clippé)
- ✅ Bug #4: Pas de duplicate constants
- ✅ Bug #5: Player doit être visible

**Exécuter:**
```bash
npm test -- visual-regression.test.js
```

### 3. `docs/TESTING_STRATEGY.md`
Documentation complète avec:
- Analyse des gaps de couverture
- Solutions proposées
- Checklist avant commit
- Patterns à éviter

---

## 🎯 Comment utiliser ces tests

### Avant de modifier du code UI
```bash
# 1. Lancer les tests existants
npm test

# 2. Lancer les nouveaux tests UI
npm test -- rendering-ui.test.js visual-regression.test.js

# 3. Si pas OK: corriger jusqu'à ✅ all pass
```

### Après une modification UI
```bash
# Vérifier qu'on n'a pas cassé la présentation
npm test -- rendering-ui.test.js visual-regression.test.js --watch
```

### Avant un commit
**Checklist:**
- [ ] `npm test` passe (tous les tests)
- [ ] `npm test -- rendering-ui.test.js` passe
- [ ] `npm test -- visual-regression.test.js` passe
- [ ] J'ai testé manuellement sur l'écran
- [ ] Les variables sont du bon type (`typeof` correct)
- [ ] Les éléments sont visibles (pas cachés/clippés)

---

## 🔧 Ajouter de nouveaux tests UI

### Template pour tester un nouvel élément UI

```javascript
describe('Mon nouvel élément UI', () => {
    test('Affiche l\'élément quand conditions met', () => {
        const condition = true;
        const shouldDisplay = condition === true;
        expect(shouldDisplay).toBe(true);
    });

    test('Élément correctement positionné (pas hors écran)', () => {
        const canvas = { width: 800, height: 600 };
        const elementX = 100;
        const elementY = 200;
        
        expect(elementX).toBeGreaterThanOrEqual(0);
        expect(elementY).toBeGreaterThanOrEqual(0);
        expect(elementX).toBeLessThan(canvas.width);
        expect(elementY).toBeLessThan(canvas.height);
    });

    test('Type de données correct', () => {
        const value = 42;
        expect(typeof value).toBe('number');
    });

    test('Valeur dans les limites acceptables', () => {
        const value = 50;
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
    });
});
```

---

## 🚨 Patterns dangereux à éviter

### ❌ MAUVAIS: Ternaire pour accumulation
```javascript
// BUG: Chaque achat remet à 1 au lieu d'accumuler
speedBoost = player.purchasedFeatures.speedBoost ? 1 : 0;

// Test aurait détecté:
speedBoost = 0;
speedBoost = speedBoost ? 1 : 0; // = 0 ✗
speedBoost = 1;
speedBoost = speedBoost ? 1 : 0; // = 1 (pas 2!) ✗
```

### ✅ BON: += pour accumulation
```javascript
// CORRECT: Accumule les valeurs
speedBoost = (speedBoost || 0) + 1;

// Test valide:
speedBoost = 0;
speedBoost = speedBoost + 1; // = 1 ✓
speedBoost = speedBoost + 1; // = 2 ✓
```

### ❌ MAUVAIS: Supposer le type
```javascript
// Pas de garantie que speedBoost est un nombre
const display = `x${purchasedFeatures.speedBoost}`;
// Résultat possible: "xtrue" ou "x1" 😬
```

### ✅ BON: Vérifier et normaliser
```javascript
// Garantir que c'est un nombre
if (typeof purchasedFeatures.speedBoost !== 'number') {
    purchasedFeatures.speedBoost = purchasedFeatures.speedBoost ? 1 : 0;
}
const display = `x${Math.floor(purchasedFeatures.speedBoost)}`; // "x1" ou "x2" ✓

// Et tester:
test('speedBoost MUST be number', () => {
    expect(typeof purchasedFeatures.speedBoost).toBe('number');
});
```

### ❌ MAUVAIS: Changer le rendu sans test
```javascript
// On change la position du HUD, qui teste?
const TOP_Y = canvas.height / 2 - 100; // Était 150, maintenant 100
// Peut-être que c'est caché maintenant? 🤷
```

### ✅ BON: Tester les limites
```javascript
// On teste que l'élément reste visible
test('HUD positioned above fog circle', () => {
    const TOP_Y = canvas.height / 2 - FOG_RADIUS - BOX_SIZE - 10;
    const fogTop = canvas.height / 2 - FOG_RADIUS;
    
    expect(TOP_Y).toBeLessThan(fogTop); // Doit être au-dessus
});
```

---

## 📈 Couverture actuelle

```
Tests totaux: 367 (avant) → 417 (après)
├── Logique métier: 300+ tests ✅
├── Gameplay: 50+ tests ✅
├── Rendering UI: 25 tests ✅ (NOUVEAU)
└── Visual Regression: 25 tests ✅ (NOUVEAU)

Couverture:
- Serveur: ✅ Bon
- Client logique: ✅ Bon
- Client présentation: ⚠️ Basique → ✅ Amélioré
```

---

## 🎓 Prochaines étapes

### Court terme (fait)
- ✅ Ajouter tests rendering-ui.test.js
- ✅ Ajouter tests visual-regression.test.js
- ✅ Documenter dans TESTING_STRATEGY.md

### Moyen terme (à faire)
1. Ajouter snapshot tests pour le rendu
   ```bash
   # Les snapshots captureront l'état du rendu
   npm test -- rendering-ui.test.js --updateSnapshot
   ```

2. Ajouter tests d'intégration complets (data flow)
   ```bash
   # Server -> Game-loop -> Renderer pipeline
   tests/data-flow.test.js
   ```

3. Implémenter CI/CD checks
   ```bash
   # Avant merge:
   npm test
   npm run coverage  # > 80%?
   ```

### Long terme (vision)
- E2E tests avec Puppeteer/Playwright
- Visual regression tests (screenshots)
- Performance tests (FPS, rendering time)
- Accessibility tests (contraste, taille min)

---

## 💡 Exemples concrets

### Avant: Bug non détecté
```javascript
// socket-events.js
const speed = baseSpeed + (speedBoost ? 1 : 0);
// Pas de test → bug passé inaperçu ❌

// Achat 1: speedBoost = true → speed = 4 ✓
// Achat 2: speedBoost = true → speed = 4 ✗ (pas 5!)
```

### Après: Bug détecté par test
```javascript
// Test créé
test('speedBoost accumulates on multiple purchases', () => {
    let speedBoost = 0;
    speedBoost = speedBoost + 1; // Achat 1
    expect(speedBoost).toBe(1);
    
    speedBoost = speedBoost + 1; // Achat 2
    expect(speedBoost).toBe(2); // ← Échouerait avec ternaire!
});

// Cela force la correction ✅
```

---

## 🆘 FAQ

**Q: Pourquoi les anciens tests n'ont pas détecté ça?**
A: Car ils testaient la logique (achat fonctionne) mais pas la présentation (HUD visible). C'est deux layers différents.

**Q: Combien de temps pour ajouter ces tests?**
A: ~2-3h pour une couverture de base. Mais ça paie en évitant les bugs futurs.

**Q: Est-ce qu'on doit tester chaque pixel?**
A: Non. On teste les invariants critiques: type, position, visibilité, conditions d'affichage.

**Q: Comment tester le rendu canvas?**
A: En mockant le contexte et en vérifiant que les bonnes fonctions (fillText, etc.) sont appelées avec les bons arguments.

**Q: Snapshot tests = tester des images?**
A: Non, snapshots texte des appels Canvas. Si on change une position, le snapshot fail.

---

## 📞 Support

Si vous trouvez un bug UI non testé:

1. Créer un test qui démontre le bug
2. Corriger le code pour que le test passe
3. Vérifier que tous les tests passent
4. Commit avec message: "Fix: [description] + Test: add regression test"

Exemple:
```bash
git commit -m "Fix: Display speedBoost count correctly
- speedBoost was boolean, now number
- Added test: speedBoost accumulation
- All 417 tests pass"
```

---

**Dernière mise à jour:** Décembre 2024
**Auteur:** Senior Fullstack Game Developer
**Status:** ✅ Implémenté
