# 🔧 Scripts Utilitaires

Scripts d'aide pour le développement et la maintenance du jeu.

## 📜 Scripts Disponibles

### `resetScore.js`
Réinitialise les scores et données de jeu (développement)

```bash
node scripts/resetScore.js
```

**Utilité:** Nettoyer l'état du jeu pendant le développement

### `resetBestSplits.js`
Réinitialise les meilleurs splits mondiaux

```bash
node scripts/resetBestSplits.js
```

**Utilité:** Nettoyer les données de meilleurs splits corrompues ou peu fiables (ex: splits < 0.5s)

### `cleanSoloData.js`
Nettoie complètement les données Solo (runs et/ou splits)

```bash
# Supprimer les runs solo uniquement
node scripts/cleanSoloData.js --runs

# Supprimer les meilleurs splits uniquement
node scripts/cleanSoloData.js --splits

# Supprimer tout (runs + splits)
node scripts/cleanSoloData.js --all
```

**Utilité:** Réinitialiser les données Solo pour un démarrage propre

---

## ⚠️ ATTENTION

- Ces scripts **suppriment définitivement** les données de MongoDB
- Assurez-vous que `MONGODB_URI` est correctement configuré dans `.env`
- Les données supprimées ne peuvent pas être récupérées!

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
