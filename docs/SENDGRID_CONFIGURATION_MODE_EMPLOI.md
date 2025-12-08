# 🚀 Guide Complet: Configuration SendGrid - Mode d'Emploi

## ✨ Vue d'ensemble

SendGrid est un service d'email professionnel qui remplace Gmail SMTP (qui ne fonctionne pas sur Render).

**Objectif:** Que les emails de bug reports soient envoyés correctement.

---

## 📋 Table des matières

1. [Configuration Locale (Votre PC)](#1-configuration-locale)
2. [Configuration Render (Serveur)](#2-configuration-render)
3. [Vérifier que ça fonctionne](#3-vérification)
4. [Dépannage](#4-dépannage)

---

## 1️⃣ Configuration Locale

### Étape 1: Créer le fichier `.env`

À la **racine du projet** (même dossier que `package.json`), créez ou modifiez `.env`:

```bash
# .env
EMAIL_USER=admin@example.com
SENDGRID_API_KEY=SG.votre_api_key_ici
```

### Étape 2: Ajouter votre clé SendGrid

1. Allez sur: https://app.sendgrid.com/settings/api_keys
2. Créez une nouvelle clé API (si vous n'en avez pas)
3. Copiez-la complètement (elle commence par `SG.`)
4. Remplacez `SG.votre_api_key_ici` par votre clé réelle

**Exemple (à adapter avec votre clé):**
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Important:** Ne committez jamais votre vraie clé sur GitHub!

### Étape 3: Personnaliser l'email

Dans `EMAIL_USER`, mettez **votre vrai email** (où vous voulez recevoir les notifications):

```bash
EMAIL_USER=votre.email@gmail.com
# ou
EMAIL_USER=votre.email@votredomaine.com
```

### Étape 4: Vérifier localement

Testez que SendGrid fonctionne:

```bash
cd "c:\Users\Jocelyn\Desktop\Mon jeu .io"
npm start
```

Regardez les logs du serveur. Vous devriez voir:

```
📧 Email Config: user=votre.email@gmail.com, hasApiKey=true
🔧 Configuration de SendGrid...
✅ SendGrid configuré
📧 Envoi d'un email de test...
✅ Email de test SendGrid envoyé
```

Si vous voyez ça ✅, c'est bon! Allez vérifier votre email.

---

## 2️⃣ Configuration Render

### Étape 1: Accédez à Render Dashboard

1. Allez sur: https://dashboard.render.com/
2. Connectez-vous avec votre compte
3. Cliquez sur **jeu-1-io** (votre service)

### Étape 2: Allez dans Environment

1. Cliquez sur l'onglet **Environment** en haut
2. Vous verrez les variables actuelles

### Étape 3: Nettoyez les anciennes variables

Si vous voyez ces variables, **supprimez-les** (cliquez la croix ❌):
- `EMAIL_PASSWORD`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`

**Gardez seulement:**
- `MONGODB_URI` (pour la base de données)
- `EMAIL_USER` (pour l'email admin)

### Étape 4: Vérifiez/Mettez à jour EMAIL_USER

Cliquez sur la variable `EMAIL_USER` et changez la valeur si nécessaire:

**Clé:** `EMAIL_USER`
**Valeur:** `votre.email@gmail.com` (ou votre email réel)

### Étape 5: Ajoutez SENDGRID_API_KEY

**Important:** Ne mettez la vraie clé SendGrid que sur Render (pas sur GitHub!)

1. Cliquez **Add Environment Variable**
2. Remplissez:
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** Votre clé SendGrid (commence par `SG.`)

### Étape 6: Sauvegardez et redémarrez

1. Cliquez **Save** en haut à droite
2. Render redémarrera automatiquement (30-60 secondes)
3. Attendez que le statut passe de "Deploying" à "Live" ✅

---

## 3️⃣ Vérification

### 🧪 Test 1: Vérifier les logs Render

1. Allez sur Dashboard → **jeu-1-io**
2. Cliquez **Logs** en bas
3. Cherchez ces messages:

```
✅ SendGrid configuré
✅ Email de test SendGrid envoyé
```

Si vous les voyez = ✅ OK!

### 🧪 Test 2: Chercher l'email de test

1. Ouvrez votre email (celui défini dans `EMAIL_USER`)
2. Cherchez un email avec le sujet:
   ```
   ✅ Service d'email SendGrid initialisé - Jeu .io
   ```

Si vous le voyez = ✅ OK!

### 🧪 Test 3: Tester le système complet

1. Allez sur votre app: https://jeu-1-io.onrender.com/
2. Jouez un peu au jeu
3. Cliquez le bouton 🚩 (flag) pour ouvrir le modal de bug
4. Remplissez:
   - **Description:** "Test SendGrid configuration"
   - **Email:** Votre email (optionnel)
   - **Cochez:** "Capture d'écran" et "Logs"
5. Cliquez **Envoyer**
6. Vérifiez dans votre email:
   - Email de notification reçu ✅
   - Avec description, logs, screenshot ✅

---

## 4️⃣ Dépannage

### ❌ "SENDGRID_API_KEY manquant" sur Render

**Cause:** La variable n'est pas configurée sur Render

**Solution:**
1. Allez sur Render Dashboard
2. Vérifiez que `SENDGRID_API_KEY` existe dans Environment
3. Vérifiez qu'elle n'est pas vide
4. Cliquez Save et attendez le redémarrage

### ❌ Pas d'email reçu

**Vérifications:**
1. Consultez les logs Render (Dashboard → Logs)
2. Cherchez des messages d'erreur
3. Vérifiez que l'email est bon dans `EMAIL_USER`
4. Vérifiez que la clé SendGrid est complète (commence par `SG.`)
5. Vérifiez les spams/filtres de votre email

### ❌ "Timeout" dans les logs

**Cause:** Render fait redémarrer le service

**Solution:**
1. C'est normal lors du premier déploiement
2. Attendez 1-2 minutes
3. Rechargez la page
4. Vérifiez les logs à nouveau

### ❌ Email vide ou sans contenu

**Cause:** Le formulaire de bug n'a pas bien envoyé les données

**Solution:**
1. Assurez-vous de remplir la description
2. Rechargez le jeu (F5)
3. Réessayez

### ❌ Service n'a pas redémarré

**Cause:** Le redéploiement est bloqué

**Solution:**
1. Allez sur Render Dashboard
2. Cliquez **Manual Deploy** (bouton en haut)
3. Attendez la fin du déploiement

---

## 🔍 Checklist Finale

Avant de déclarer victoire, vérifiez:

- [ ] `.env` local contient `SENDGRID_API_KEY` avec votre clé
- [ ] `.env` local contient `EMAIL_USER` avec votre email
- [ ] Render Dashboard a `SENDGRID_API_KEY` défini
- [ ] Render Dashboard a `EMAIL_USER` défini
- [ ] Render Dashboard n'a pas `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`
- [ ] Tests locaux passent: `npm test` (349/349)
- [ ] Logs Render montrent "✅ Email de test SendGrid envoyé"
- [ ] Vous avez reçu l'email de test
- [ ] Vous avez testé un bug report complet
- [ ] Vous avez reçu l'email de notification

---

## 📚 Ressources

- [Documentation SendGrid](https://docs.sendgrid.com/)
- [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

## 💬 Besoin d'aide?

1. Consultez les fichiers de documentation:
   - `SENDGRID_QUICK_SETUP.md` - Guide rapide
   - `docs/SENDGRID_SETUP.md` - Documentation détaillée
   - `docs/VERIFICATION_SENDGRID.md` - Vérification

2. Vérifiez les logs:
   - Localement: Console du serveur
   - Render: Dashboard → Logs

3. Si rien n'y fait:
   - Vérifiez que votre clé SendGrid est valide
   - Allez sur https://app.sendgrid.com/account/billing pour vérifier votre compte
   - Assurez-vous de ne pas avoir atteint votre limite gratuite (100 emails/jour)
