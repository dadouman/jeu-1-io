# 🎮 Rogue-Like .io - Architecture & Documentation

## 📖 Documentation

Toute la documentation est dans le dossier **`docs/`** :

### 🚀 Pour Commencer
- **[INDEX.md](docs/INDEX.md)** - Point de départ, navigation complète
- **[README.md](docs/README.md)** - Description du jeu et des contrôles
- **[README_ARCHITECTURE.md](docs/README_ARCHITECTURE.md)** - Guide d'utilisation rapide

### 📚 Documentation Principale
- **[SYNTHESE.md](docs/SYNTHESE.md)** - Résumé complet du projet
- **[ARCHITECTURE_SUMMARY.md](docs/ARCHITECTURE_SUMMARY.md)** - Diagrammes et comparaisons
- **[ARCHITECTURE_NEW.md](docs/ARCHITECTURE_NEW.md)** - Explication détaillée

### 🛠️ Guides Pratiques
- **[SHOPMANAGER.md](docs/SHOPMANAGER.md)** - Gérer le shop de façon centralisée
- **[EXEMPLES_CONFIG.md](docs/EXEMPLES_CONFIG.md)** - 5 exemples concrets de nouveaux modes
- **[MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)** - Plan d'intégration progressive

### 📋 Autres
- **[CODE_QUALITY_REPORT.md](docs/CODE_QUALITY_REPORT.md)** - Rapport de qualité

## 🗂️ Structure du Projet

```
Mon jeu .io/
├── docs/                    📚 Documentation complète
├── scripts/                 🔧 Scripts utilitaires
├── config/                  ⚙️ Configuration des modes
├── utils/                   🛠️ Utilitaires partagés
├── server/                  🖥️ Code serveur
├── Public/                  🌐 Code client
├── tests/                   🧪 Tests (349 tests)
├── server.js               🚀 Point d'entrée serveur
└── package.json            📦 Dépendances
```

## 🎯 Concepts Clés

### Nouvelle Architecture (Flexible)

**Avant:** Code dupliqué pour chaque mode (buggy, inflexible)

**Après:** Configuration centralisée + classes partagées

#### Classes Principales
- **`GameMode`** - Lit la configuration et fournit des méthodes
- **`GameSessionManager`** - Gère les sessions pour tous les modes
- **`PlayerActions`** - Actions partagées pour tous les modes
- **`ShopManager`** - Gestion du shop de façon centralisée
- **`UnifiedGameLoop`** - Boucle de jeu unique pour tous les modes

#### Configuration
- **`config/gameModes.js`** - Définit tous les modes (classic, infinite, solo, etc)
- Changer un niveau? 1 ligne. Ajouter un mode? 30 lignes.

### Modes Disponibles

| Mode | Joueurs | Niveaux | Shop | Description |
|------|---------|---------|------|-------------|
| **classic** | 1-8 | ∞ | Niveaux [5,10,15,20,25,30] | Multijoueur classique |
| **infinite** | 1-4 | ∞ | Niveaux [3,6,9,12,15] | Mode infini plus agressif |
| **solo** | 1 | 10 | Niveaux [5,10] | Speedrun solo personnel |
| **solo20** | 1 | 20 | Niveaux [5,10,15,20] | Solo avec 20 niveaux |
| **soloHardcore** | 1 | 15 | Désactivé | Solo hardcore, pas de shop |

Voir **[EXEMPLES_CONFIG.md](docs/EXEMPLES_CONFIG.md)** pour créer vos propres modes!

## ✅ Tests

Tous les tests passent:

```bash
npm test
# 349 tests passent ✅
```

### Coberture
- Rendering (gems, joueurs, UI)
- Collision (murs, pièces, checkpoints)
- Movement (déplacement, dash, rope)
- Shop (achat, progression, timing)
- Modes (solo, classic, infinite)
- Scoring et timing
- Architecture et refactorisation

## 🚀 Démarrer Localement

```bash
# Installer les dépendances
npm install

# Lancer le serveur
npm start
# ou: node server.js

# Ouvrir dans le navigateur
# http://localhost:3000
```

## 🔧 Scripts Utilitaires

Voir le dossier **`scripts/`** :

- **`resetScore.js`** - Réinitialiser les scores (développement)

## 📝 Commits Récents

Dernière refactorisation majeure:
- ✅ Architecture centralisée implémentée
- ✅ ShopManager créé pour gérer le shop
- ✅ 16 nouveaux tests pour ShopManager
- ✅ 349/349 tests passant
- ✅ Documentation complète créée

## 🎓 Pour Les Développeurs

### Ajouter un Nouveau Mode

1. Aller dans `config/gameModes.js`
2. Ajouter une nouvelle clé avec configuration
3. C'est tout! Le mode est disponible

```javascript
// config/gameModes.js
soloMassacre: {
    name: 'Solo Massacre',
    maxPlayers: 1,
    maxLevels: 30,
    shop: { enabled: true, levels: [5,10,15,20,25,30] },
    shopItems: [...],
    // ... autres paramètres
}
```

### Modifier le Comportement du Shop

1. Aller dans `utils/ShopManager.js`
2. C'est l'unique endroit où le shop est géré
3. Tous les modes utiliseront automatiquement la modification

```javascript
// Exemple: Réduire la durée du shop
getShopDuration() {
    return this.config.shop.duration / 2;  // Moitié moins long
}
```

### Modifier les Règles de Progression

1. Aller dans `config/gameModes.js`
2. Modifier la config du mode
3. Les classes le liront automatiquement

```javascript
// Exemple: Solo avec 50 niveaux
solo: {
    ...
    maxLevels: 50,  // 50 niveaux au lieu de 10
    shop: { levels: [5,10,15,20,25,30,35,40,45,50] }
}
```

## 🤝 Contribution

Le code est organisé pour être facile à modifier:

- **Pas de duplication** - Une logique = Un endroit
- **Configuration centralisée** - Changer les règles = 1 ligne
- **Tests automatisés** - 349 tests valident tout
- **Documentation claire** - Voir `docs/` pour tous les détails

## 📞 Support

Pour les questions sur l'architecture:
- Voir **[INDEX.md](docs/INDEX.md)** pour la navigation
- Voir **[SHOPMANAGER.md](docs/SHOPMANAGER.md)** pour le shop
- Voir **[EXEMPLES_CONFIG.md](docs/EXEMPLES_CONFIG.md)** pour créer des modes

---

**Dernière mise à jour:** Décembre 2025

**Statut:** ✅ Stable - 349/349 tests passant

**Architecture:** 🏗️ Centralisée et Flexible
