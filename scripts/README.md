# 🔧 Scripts Utilitaires

Scripts d'aide pour le développement et la maintenance du jeu.

## 📜 Scripts Disponibles

### `resetScore.js`
Réinitialise les scores et données de jeu (développement)

```bash
node scripts/resetScore.js
```

**Utilité:** Nettoyer l'état du jeu pendant le développement

---

## 📝 Ajouter un Nouveau Script

1. Créer un fichier `scripts/nom-script.js`
2. Exporter comme module Node.js standard
3. Documenter ci-dessus

```javascript
// scripts/mon-script.js
console.log('Mon script utilitaire');
module.exports = { /* ... */ };
```

```bash
node scripts/mon-script.js
```

---

**Note:** Les scripts ne sont PAS inclus automatiquement dans le build. 
Ils sont pour le développement et l'administration uniquement.
