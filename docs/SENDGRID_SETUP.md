# Configuration SendGrid pour Render

## 🎯 Objectif
Remplacer Gmail SMTP (qui est bloqué par Render) par l'API SendGrid pour envoyer les notifications de bugs.

## ✅ Étapes complétées
- [x] Package `@sendgrid/mail` installé
- [x] `server/email-service.js` reécrit avec SendGrid
- [x] `.env.example` mis à jour
- [x] `.env` local mis à jour avec la clé SendGrid

## 🔧 Configuration Render.com

### Variables d'environnement à définir

1. **Accédez à Render Dashboard**
   - Allez sur: https://dashboard.render.com/
   - Sélectionnez votre service Node.js (jeu-1-io)

2. **Cliquez sur "Environment"**
   - Vous verrez les variables actuelles:
     - `MONGODB_URI`
     - `EMAIL_USER` ← Gardez celle-ci (sabatini79@gmail.com)
     - ❌ Supprimez: `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`

3. **Ajoutez la nouvelle variable:**
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: `SG.your_api_key_here` (remplacez par votre clé SendGrid réelle)
   - ⚠️ La clé a été fournie à part (pas dans GitHub pour des raisons de sécurité)

4. **Cliquez "Save"** → Render redémarrera automatiquement le service

### Variables finales attendues:
```
MONGODB_URI=mongodb+srv://...
EMAIL_USER=sabatini79@gmail.com
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
```

## 📧 Qu'est-ce que SendGrid?

SendGrid est un service d'envoi d'emails fiable qui utilise une API REST au lieu du SMTP direct.

**Avantages:**
- ✅ Pas de ports bloqués (REST API sur HTTP/HTTPS)
- ✅ Gratuit: 100 emails/jour (suffisant pour bug reports)
- ✅ Fiable et scalable
- ✅ Logs détaillés des emails
- ✅ Pas besoin de password Gmail App

**Plan gratuit SendGrid:**
- 100 emails/jour
- Support communautaire
- Domaine d'envoi personnalisé

## 🧪 Test après déploiement

Après redémarrage sur Render:

1. Allez sur votre app: https://jeu-1-io.onrender.com/
2. Consultez les logs Render (Dashboard > Logs)
   - Vous devriez voir: `✅ Email de test SendGrid envoyé`
3. Vérifiez que l'email de test est arrivé dans sabatini79@gmail.com
4. Testez le système en envoyant un bug report via le jeu

## 🚀 Déploiement

Le code est déjà pushé sur GitHub. Render redéploiera automatiquement une fois:
1. Les variables d'environnement mises à jour sur Render Dashboard
2. Le service redémarré

## ⚠️ Sécurité

La clé SendGrid est sensible:
- ✅ Stockée dans `.env` (ignoré par Git)
- ✅ Template dans `.env.example` (sans clé réelle)
- ✅ Sécurisée sur Render (variables d'environnement chiffrées)
- ✅ Jamais committée dans GitHub

## 📚 Ressources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- [Node.js SendGrid Library](https://github.com/sendgrid/sendgrid-nodejs)

## 🆘 Dépannage

### "SENDGRID_API_KEY manquant" error
→ Vérifiez que la variable est bien définie sur Render Dashboard

### Email non reçu
1. Vérifiez les logs Render pour les erreurs
2. Confirmez que `noreply@jeu.io` n'est pas en spam
3. Consultez SendGrid Activity Log: https://app.sendgrid.com/email_activity

### Service en attente du redémarrage
→ Cliquez "Manual Deploy" sur Render Dashboard si ça prend trop longtemps
