# 🔒 Guide de Sécurité - Variables d'Environnement

## ⚠️ Problème: Les Credentials dans le Code

### Dangers
```
❌ NE PAS FAIRE:
// Dans le code
const EMAIL_PASSWORD = "votre_app_password_ici";  // DANGER!

❌ NE PAS FAIRE:
// Dans .env commité
EMAIL_PASSWORD=votre_app_password_ici  // Dans Git = PUBLIC!

✅ À FAIRE:
// .env local (jamais commité)
EMAIL_PASSWORD=votre_app_password_ici  // Seulement sur votre machine
```

### Pourquoi c'est dangereux

1. **Historique Git permanent** - Une fois commité, c'est pour toujours
2. **Visible sur GitHub** - Accessible publiquement
3. **Clonage révèle les secrets** - Chaque clone récupère les credentials
4. **CI/CD expose les secrets** - Les logs des workflows peuvent contenir des mots de passe

## ✅ Solution: `.env` + `.gitignore`

### 1. Fichier `.env` Local

**Ce fichier:**
- ✅ Contient vos credentials
- ✅ Reste sur votre machine
- ✅ Est ignoré par Git
- ✅ N'est jamais commité

**Créer:** `c:\Users\Jocelyn\Desktop\Mon jeu .io\.env`
```bash
EMAIL_USER=admin@example.com
SENDGRID_API_KEY=SG.votre_api_key_ici
```

### 2. Fichier `.gitignore`

**Ce fichier dit à Git d'ignorer:**
```
.env
.env.local
.env.*.local
```

**Vérifier:**
```bash
git status
# .env ne devrait PAS apparaître!
```

### 3. Fichier `.env.example` (À commiter)

**Ce fichier:**
- ✅ Montre la structure des variables
- ✅ Contient des valeurs DUMMY
- ✅ Est commité sur GitHub
- ✅ Sert de template

**Exemple:**
```bash
# .env.example
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=votre_app_password_ici
EMAIL_HOST=smtp.gmail.com
```

## 🔐 Workflow de Sécurité

### Pour Développeur Local

```bash
# 1. Cloner le repo
git clone https://github.com/dadouman/jeu-1-io.git
cd jeu-1-io

# 2. Créer .env à partir du template
cp .env.example .env

# 3. Éditer .env avec VOS credentials
nano .env  # Ajouter EMAIL_PASSWORD=votre_app_password_ici

# 4. Git ignore automatiquement .env
# Vérifier:
git status  # .env n'apparaît pas

# 5. Développer normalement
npm start
```

### Pour Production (Render, Heroku, etc.)

Au lieu de `.env`, utiliser les variables d'environnement du service:

#### Render
```
Dashboard → Settings → Environment
EMAIL_USER=admin@example.com
SENDGRID_API_KEY=SG.votre_api_key_ici
```

#### Heroku
```bash
heroku config:set SENDGRID_API_KEY="SG.votre_api_key_ici"
```

#### Docker
```bash
docker run -e EMAIL_PASSWORD="votre_app_password_ici" ...
```

## 📋 Checklist de Sécurité

- [ ] `.env` créé localement (jamais commité)
- [ ] `.env.example` avec values DUMMY (commité)
- [ ] `.gitignore` contient `.env`
- [ ] `git status` ne montre pas `.env`
- [ ] Credentials jamais dans le code source
- [ ] `.env` ajouté à `.gitignore` **avant** le commit
- [ ] Secrets en variables d'environnement (production)

## 🚨 Si vous avez déjà commité un secret

### Urgence: Nettoyer l'Historique

```bash
# 1. Changer le mot de passe Gmail immédiatement!
# (Générer une nouvelle App Password)

# 2. Nettoyer l'historique Git
git filter-branch --tree-filter 'rm -f .env' HEAD

# 3. Forcer le push
git push origin main --force

# 4. Notifier les collaborateurs de rebaser
```

⚠️ **C'est invasif** - Mieux vaut prévenir!

## 💡 Bonnes Pratiques

### ✅ DO

```bash
# ✅ Ignorer .env
echo ".env" >> .gitignore

# ✅ Commiter .env.example
git add .env.example
git commit -m "docs: ajouter .env.example template"

# ✅ Utiliser dotenv dans le code
require('dotenv').config();
const email = process.env.EMAIL_USER;

# ✅ Documenter les variables requises
# .env.example avec explications
```

### ❌ DON'T

```bash
# ❌ Commiter le .env réel
git add .env  # NE PAS FAIRE!

# ❌ Hardcoder les secrets
const PASSWORD = "votre_app_password_ici";  // NE PAS FAIRE!

# ❌ Logger les secrets
console.log(process.env.EMAIL_PASSWORD);  // NE PAS FAIRE!

# ❌ Mettre dans les commentaires
// EMAIL_PASSWORD=votre_app_password_ici  // NE PAS FAIRE!
```

## 🔍 Vérifier que Tout est OK

```bash
# 1. Vérifier que .env est ignoré
git status
# Output: "On branch main. nothing to commit"
# .env ne doit PAS apparaître!

# 2. Vérifier que .env.example existe
ls -la .env.example
# Output: .env.example -> COMMITÉ

# 3. Vérifier le .gitignore
grep ".env" .gitignore
# Output: .env (présent)

# 4. Vérifier que le serveur lit .env
npm start
# Output: "✅ Service d'email initialisé"
```

## 📚 Ressources

- [GitHub: About secret scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Node.js dotenv](https://www.npmjs.com/package/dotenv)
- [12factor.net: Config](https://12factor.net/config)

## 🎯 Résumé

```
Local Machine:
  ✅ .env (jamais commité) ← Vos credentials
  ✅ .env.example (commité) ← Template

GitHub:
  ✅ .env.example visible publiquement
  ❌ .env JAMAIS présent

.gitignore:
  .env ← Dit à Git d'ignorer

Production:
  Variables d'environnement du service
  (Render, Heroku, Docker, etc.)
```

---

**Votre `.env` local est protégé!** 🔒✅
