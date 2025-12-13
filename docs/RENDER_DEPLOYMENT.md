# Configuration Render - Guide Complet

## 📋 Vue d'ensemble

Ce guide explique comment configurer et déployer l'application sur Render.com

## 🔧 Configuration Requise

### Variables d'Environnement sur Render

Accédez au **Dashboard Render** → Votre Service → **Environment**

#### 1. MongoDB (pour la sauvegarde des données)

**Variable:** `MONGO_URI`

```
mongodb+srv://username:password@cluster.mongodb.net/jeu-io
```

Où obtenir:
- Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Créez un cluster
- Copiez la connection string
- Remplacez `username` et `password`

#### 2. SendGrid (pour les emails de bugs)

**Variable:** `SENDGRID_API_KEY`

```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Où obtenir:
- Allez sur [SendGrid](https://app.sendgrid.com/settings/api_keys)
- Créez une API Key
- Copiez la clé

**Variable:** `EMAIL_USER` (optionnel)

```
admin@example.com
```

#### 3. Port (optionnel)

**Variable:** `PORT`

```
3000
```

Render l'assigne automatiquement si non défini.

## 🚀 Déploiement

### Première Fois

1. Créez un compte sur [Render.com](https://render.com)
2. Connectez votre repository GitHub
3. Créez un **New Web Service**
4. Sélectionnez ce repository
5. Configuration:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node.js
6. Ajoutez les variables d'environnement dans l'onglet **Environment**
7. Cliquez **Create Web Service**

### Mises à Jour

Le déploiement se fait automatiquement quand vous pushez sur `main`:

```bash
git push origin main
```

## ✅ Vérification

Après le déploiement, visitez: `https://jeu-1-io.onrender.com`

### Problèmes Courants

#### ❌ WebSocket connection failed

**Cause:** Le serveur Render s'est arrêté après 15 minutes d'inactivité (plan gratuit)

**Solution:** 
- Attendez que le service redémarre (quelques secondes après un accès)
- Mettez à jour le plan vers `Starter` ou plus

#### ❌ MONGO_URI manquant

**Cause:** La variable d'environnement n'est pas définie

**Solution:**
- Allez dans **Environment** sur Render
- Ajoutez `MONGO_URI`
- Les données ne seront pas sauvegardées sinon

#### ❌ SENDGRID_API_KEY manquant

**Cause:** La variable d'environnement n'est pas définie

**Solution:**
- C'est optionnel - les bugs seront loggés localement
- Pour activer: allez dans **Environment** et ajoutez la clé

## 🧪 Test Local

Pour tester avant de déployer:

```bash
npm start
```

Visitez: `http://localhost:3000`

## 📊 Logs

Voir les logs en temps réel sur Render:
1. Allez dans le Dashboard
2. Cliquez sur votre service
3. Onglet **Logs**

## 💡 Conseils

- ✅ Committez vos changements et pushez avant de vérifier sur Render
- ✅ Vérifiez les logs si quelque chose ne fonctionne pas
- ✅ Les 10 premiers redémarrages gratuits peuvent être lents (cold start)
- ✅ Considérez un upgrade du plan si vous voulez une meilleure performance

## 🔗 Liens Utiles

- [Render Dashboard](https://dashboard.render.com)
- [Render Environment Variables](https://docs.render.com/environment-variables)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [SendGrid](https://sendgrid.com)
