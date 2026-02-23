# 🎮 Guide : Ajouter un nouveau mode de jeu

## ✅ Système Entièrement Dynamique (Commit c14db3e)

Le système est **100% maintainable** – ajouter un nouveau mode ne nécessite qu'une simple modification dans **un seul fichier**.

---

## 🔧 Étape 1 : Ajouter le mode à la configuration centralisée

Éditer `public/game-state.js` (lignes 8-38) et ajouter votre mode :

```javascript
window.GAME_MODE_CONFIG = {
    classic: { /* ... */ },
    classicPrim: { /* ... */ },
    solo: { /* ... */ },
    infinite: { /* ... */ },
    
    // ➕ VOTRE NOUVEAU MODE
    myNewMode: {
        name: 'Mon Nouveau Mode',
        maxLevels: 15,
        shopLevels: [5, 10, 15],    // Les niveaux où les boutiques apparaissent
        hasShop: true               // true si le mode a des boutiques
    }
};
```

---

## 📊 Structure des propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `name` | string | Nom affiché dans le sélecteur de mode |
| `maxLevels` | number | Nombre total de niveaux dans ce mode |
| `shopLevels` | number[] | Niveaux où les boutiques (+🛍️) apparaissent |
| `hasShop` | boolean | true = boutique disponible, false = aucune boutique |

### Exemples :

```javascript
// Mode sans boutique (comme Infini)
infinite: {
    name: 'Infini',
    maxLevels: 100,
    shopLevels: [],    // Array vide = pas de boutique
    hasShop: false
}

// Mode avec boutiques
customSprint: {
    name: 'Sprint Custom',
    maxLevels: 7,
    shopLevels: [3, 5, 7],  // Boutiques aux niveaux 3, 5 et 7
    hasShop: true
}
```

---

## 🔄 Chaîne de récupération des niveaux de boutique

La fonction `getShopLevelsForMode()` dans `transition-renderer.js` utilise cette **hiérarchie de priorité** :

1. **Custom mode** → Vérifie `customModeConfig.shop.levels`
2. **GAME_MODE_CONFIG** → Récupère `window.GAME_MODE_CONFIG[mode].shopLevels` ✅
3. **Server config** → Fallback sur `window.gameModeShopConfig[mode]`
4. **Valeurs par défaut** → Object statique final

---

## 🎯 Cas pratiques

### Cas 1️⃣ : Ajouter un mode "Survival" simplement

```javascript
survival: {
    name: 'Survival',
    maxLevels: 20,
    shopLevels: [5, 10, 15, 20],
    hasShop: true
}
```

**Résultat automatique :**
- ✅ Timeline affiche boutiques aux niveaux 5, 10, 15, 20
- ✅ Cartes de sélection de mode affichent "🛍️ Boutique disponible"
- ✅ Pas de modifs elsewhere − tout fonctionne !

### Cas 2️⃣ : Ajouter un mode Arcade (sans boutique)

```javascript
arcade: {
    name: 'Arcade',
    maxLevels: 12,
    shopLevels: [],
    hasShop: false
}
```

**Résultat automatique :**
- ✅ Timeline affiche zéro boutique
- ✅ Cartes de sélection affichent "❌ Pas de boutique"
- ✅ Le système s'adapte !

---

## 🧪 Vérification après ajout

1. **Tests Jest** (741 tests) :
   ```bash
   npm test -- --forceExit
   ```

2. **Lancer le serveur** :
   ```bash
   npm start
   ```

3. **Ouvrir le navigateur** :
   - Accéder à `http://localhost:3000`
   - Le nouveau mode doit apparaître dans le sélecteur
   - La timeline et l'HUD doivent afficher correctement les boutiques

---

## 🔍 Fichiers qui utilisent GAME_MODE_CONFIG

```
public/
├── game-state.js              ← ✅ CONFIGURATION CENTRALISÉE
├── transition-renderer.js     ← Récupère shopLevels
├── mode-selector.js           ← Affiche les modes
└── solo-hud-renderer.js       ← Affiche les boutiques en HUD
```

---

## ⚡ Résumé

**Avant (commit 7dc70cf)** : Ajouter un mode = modifier `transition-renderer.js`, `mode-selector.js`, etc.

**Maintenant (commit c14db3e)** : Ajouter un mode = **1 ligne de code** dans `game-state.js` ✨

Le système détecte automatiquement la configuration et l'affiche correctement partout.

---

## 🚀 CI/CD Render.com

Les changements en `game-state.js` déclenchent automatiquement le déploiement via GitHub Actions.

```bash
git add public/game-state.js
git commit -m "Feat: Ajout du mode Survival"
git push  # Render.com redéploie automatiquement
```
