# 📖 Guide de Lecture du Git Log

## 📋 Pour voir l'historique complet

```bash
git log --oneline
```

Cela affiche TOUS les commits (298+), y compris les petits fixes et refactorings.

---

## 🎯 Pour voir UNIQUEMENT les vraies features

```bash
git log --oneline --grep="Feature:|feat:|Add:|add:"
```

Cela affiche seulement les commits importants (40+ features).

Exemple:
```
1263165 feat: End of level - Auto lobby reset and player exclusion
1641c82 Feature: Apply classic end screen features to custom mode
f4186f8 Feature: Add classic mode end screen with podium
```

---

## 📝 Pour voir les commits par domaine

### Features de gameplay
```bash
git log --oneline --grep="feat:|Feature:" --grep="movement|dash|trail|collision"
```

### Shop system
```bash
git log --oneline --grep="shop|Shop"
```

### Système de timing / splits
```bash
git log --oneline --grep="time|split|timer|countdown"
```

### Mode Solo
```bash
git log --oneline --grep="[Ss]olo|leaderboard"
```

### UI/Rendering
```bash
git log --oneline --grep="render|UI|screen|display"
```

---

## 👤 Pour voir les commits d'une personne

```bash
git log --oneline --author="nom"
```

---

## 📅 Pour voir les commits d'une date

```bash
git log --oneline --since="2025-12-01" --until="2025-12-15"
```

---

## 🏷️ Pour voir les commits taggés

```bash
git tag -l
```

---

## 📊 Pour voir les stats

```bash
# Nombre de commits par personne
git shortlog -sn

# Nombre de fichiers changés
git log --oneline --name-status | head -50

# Statistiques détaillées
git log --stat | head -100
```

---

## 🔍 Recherche avancée

### Rechercher un commit qui a modifié une fonction
```bash
git log -p -S "nomDeLaFonction"
```

### Rechercher dans le message d'un commit
```bash
git log --grep="pattern"
```

### Voir les commits entre deux branches
```bash
git log main..develop
```

---

## 📄 Pour voir les fichiers les plus modifiés

```bash
git log --oneline --name-only | head -100 | sort | uniq -c | sort -rn
```

---

## 🎯 Stratégie de Lecture Recommandée

### Si tu veux comprendre rapidement le projet:
1. Lire [CHANGELOG.md](CHANGELOG.md) - Résumé des features principales
2. Lire [FEATURES.md](FEATURES.md) - Détail de chaque feature
3. Consulter le git log au besoin

### Si tu cherches un commit spécifique:
```bash
git log --oneline --grep="[Description de ce que tu cherches]"
```

### Si tu veux retracer une feature:
```bash
git log --oneline --follow -- chemin/vers/le/fichier
```

---

## 📌 Commits Importants à Connaître

Les plus grandes features (avec plus d'impact):

1. **Mode Solo complet** (8 commits majeurs)
   - Part 1: UI et structure
   - Part 2: Mouvement et génération
   - Part 3: Timing et résultats
   - Part 4: Leaderboard

2. **Système de Shop**
   - Shop system integration
   - Vote system
   - 15-second timer

3. **Countdown Academy Leader**
   - Cinema style
   - 3-2-1 countdown
   - Synchronisation serveur

4. **Classic Mode End Screen**
   - Podium top 3
   - Ranking
   - Best player badge

5. **Multilobby System**
   - Complete multi-lobby system
   - Mode isolation
   - Synchronisation

6. **Mouvement & Collision**
   - Dash mechanic
   - Trail system
   - Wall sliding

---

## 🔧 Commandes Utiles

```bash
# Voir un commit spécifique
git show HASH

# Voir les différences avec le commit précédent
git show HASH --name-status

# Voir tout ce qui a changé dans une feature
git log HASH..HEAD --oneline

# Voir l'historique d'un fichier
git log --follow -- chemin/fichier

# Voir qui a modifié une ligne
git blame chemin/fichier
```

---

## 📌 Notes

- **backup-full-history**: Branche de sauvegarde de l'historique complet
- **298 commits total**: Tous préservés pour traçabilité
- **Historique intact**: Rien n'a été supprimé, seulement documenté

Pour plus de détails techniques, voir la documentation dans `/documentation`.

