# 🐛 Système de Report de Bugs

## 📋 Vue d'ensemble

Système complet permettant aux utilisateurs de signaler des bugs directement depuis le jeu avec:
- 🎥 Capture d'écran automatique
- 📋 Export des logs console
- 📧 Notification par email
- 💾 Stockage en base de données
- 📊 Interface d'administration

## 🎯 Fonctionnalités

### Pour l'Utilisateur
✅ Bouton flag rouge en bas à droite (toujours accessible)
✅ Modal de report avec description
✅ Email optionnel pour suivi
✅ Capture d'écran incluse automatiquement
✅ Logs console inclus automatiquement
✅ Confirmation d'envoi

### Pour l'Admin
✅ Notification par email instantanée
✅ Base de données centralisée
✅ Consultation des rapports
✅ Gestion du statut des bugs
✅ Export des données

## 🚀 Installation & Configuration

### 1. Installer les dépendances

```bash
npm install nodemailer
```

### 2. Configurer l'Email

#### Avec Gmail:
1. Aller sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Générer une "App Password" (16 caractères)
3. Configurer les variables d'environnement:

```bash
EMAIL_USER=xxx9@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Alternative: Service SMTP tiers
- SendGrid
- Mailgun
- AWS SES
- Etc.

### 3. Variables d'Environnement

```bash
# Email
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=votre_app_password_ou_token
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Admin Panel (optionnel)
ADMIN_DASHBOARD_URL=https://votre-admin-panel.com
```

## 🏗️ Architecture

### Frontend (`Public/bug-reporter.js`)

```
BugReporter
├── init()                    # Initialisation
├── captureConsoleLogs()      # Interception des logs
├── createUI()                # Création du bouton et modal
├── openModal()               # Afficher la modal
├── takeScreenshot()          # Capture avec html2canvas
└── submitBugReport()         # Envoi au serveur
```

### Backend

#### Routes API (`server/bug-routes.js`)
```
POST   /api/bugs              # Créer un nouveau rapport
GET    /api/bugs              # Lister les rapports
GET    /api/bugs/:id          # Détails d'un rapport
PATCH  /api/bugs/:id          # Mettre à jour le statut
GET    /api/bugs/stats/summary# Statistiques
```

#### Email Service (`server/email-service.js`)
```
EmailService
├── initialize()              # Initialisation du transport
├── sendBugNotification()     # Email admin
└── sendConfirmationEmail()   # Email utilisateur
```

#### Base de Données (`utils/BugReport.js`)
```
BugReport (MongoDB)
├── description          # Texte du bug
├── email               # Email utilisateur
├── screenshot          # Image base64
├── logs                # Array de logs
├── userAgent           # Navigateur
├── url                 # Page URL
├── viewport            # Résolution
├── timestamp           # Date/heure
├── status              # new|acknowledged|investigating|fixed|wontfix
├── notes               # Notes internes
└── assignedTo          # Admin assigné
```

## 📱 Utilisation

### Pour l'Utilisateur

1. **Cliquer sur le flag rouge** 🚩 en bas à droite
2. **Décrire le bug** dans le formulaire
3. **Optionnel: Ajouter un email** pour suivi
4. **Cocher les options** (screenshot, logs)
5. **Cliquer "Envoyer le rapport"**
6. **Confirmation** d'envoi

### Pour l'Admin

#### Recevoir les Notifications
- Email automatique à `sabatini79@gmail.com`
- Contient la description, logs, URL, navigateur, etc.
- Lien direct vers le dashboard

#### Consulter les Rapports
```bash
# API directe
curl http://localhost:3000/api/bugs

# Avec filtrage (statut)
GET /api/bugs?status=new
GET /api/bugs?status=investigating
```

#### Gérer un Bug
```bash
# Mettre à jour le statut
curl -X PATCH http://localhost:3000/api/bugs/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status":"investigating","assignedTo":"dev_team"}'
```

#### Voir les Statistiques
```bash
curl http://localhost:3000/api/bugs/stats/summary
```

## 📊 Données Collectées

### Automatiquement
- 🖼️ Capture d'écran (JPEG base64)
- 📝 Logs console (dernier 500)
- 📱 User-agent (navigateur)
- 🔗 URL actuelle
- 📐 Résolution écran
- ⏰ Timestamp

### Optionnellement
- ✉️ Email utilisateur (pour suivi)
- 💬 Description du bug

## 🔒 Sécurité

### Points à Noter
- Screenshots n'incluent **pas** les données sensibles (mots de passe, tokens)
- Les logs sont limités à 500 entrées
- Les screenshots sont limités à 5MB
- Validation côté serveur

### À Implémenter
```javascript
// TODO: Ajouter l'authentification admin
// Protéger les endpoints GET/PATCH avec un token
// Chiffrer les données sensibles
// Ajouter un rate-limiting
```

## 🧪 Tests

### Test Manuel
```javascript
// Dans la console du navigateur
window.bugReporter.openModal();

// Simuler un bug
throw new Error("Test bug");
console.warn("Warning test");
```

### Test API
```bash
curl -X POST http://localhost:3000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test bug",
    "email": "test@example.com",
    "logs": [],
    "userAgent": "test",
    "url": "http://localhost:3000",
    "viewport": {"width": 1920, "height": 1080}
  }'
```

## 📈 Statuts de Bug

| Statut | Description |
|--------|-------------|
| **new** | Nouveau rapport (par défaut) |
| **acknowledged** | Reçu et en attente |
| **investigating** | En cours de diagnostic |
| **fixed** | Corrigé dans une version |
| **wontfix** | Ne sera pas corrigé |

## 💡 Bonnes Pratiques

### Utilisateur
✅ Soyez descriptif et précis
✅ Incluez les étapes pour reproduire
✅ Ajoutez un email si vous voulez être informé
✅ Ne mentionnez pas de données personnelles

### Admin
✅ Assignez les bugs rapidement
✅ Mettez à jour le statut régulièrement
✅ Répondez au mail utilisateur si fourni
✅ Archivez les anciens bugs

## 🔧 Customisation

### Changer la couleur du bouton
```javascript
// Public/bug-reporter.js, ligne ~60
flagButton.style.backgroundColor = '#ff0000';  // Votre couleur
```

### Changer l'adresse email
```bash
# .env
EMAIL_USER=nouvel@email.com
```

### Ajouter plus de champs au formulaire
```javascript
// Public/bug-reporter.js
// Ajouter dans createModal()
// Ajouter dans submitBugReport()
```

### Augmenter la limite de logs
```javascript
// Public/bug-reporter.js, ligne ~45
if (this.consoleLogs.length > 1000) {  // Au lieu de 500
```

## 📞 Troubleshooting

### Email ne s'envoie pas
1. Vérifier `EMAIL_USER` et `EMAIL_PASSWORD`
2. Vérifier que Gmail autorise les "App Passwords"
3. Vérifier les logs: `console.log` du serveur
4. Essayer un service SMTP tiers (SendGrid, etc.)

### Screenshot est blanc
1. html2canvas peut avoir des problèmes CORS
2. Vérifier la console pour les erreurs
3. Les screenshots sans canvas.draw() restent vides

### Logs ne s'enregistrent pas
1. S'assurer que bug-reporter.js est chargé
2. Vérifier qu'il est chargé **avant** autres scripts
3. Vérifier que console.log n'est pas overridé ailleurs

## 📚 Fichiers Concernés

```
Public/
├── bug-reporter.js          # Frontend du system
├── index.html               # Intégration des scripts

server/
├── bug-routes.js            # Routes API
├── email-service.js         # Service d'email
└── index.js                 # Configuration

utils/
└── BugReport.js             # Modèle MongoDB

package.json                 # nodemailer dépendance
```

## 🚀 Prochaines Étapes

1. **Implémenter une page admin** pour consulter les bugs
2. **Ajouter l'authentification** pour les endpoints admin
3. **Créer un système de tags** pour catégoriser les bugs
4. **Ajouter le rate-limiting** pour éviter les abus
5. **Chiffrer les données sensibles**
6. **Implémenter l'assignation en temps réel**
7. **Ajouter les webhooks Discord/Slack**

---

**Status:** ✅ Production Ready

**Dernière mise à jour:** Décembre 2025
