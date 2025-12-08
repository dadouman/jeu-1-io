# 🐛 Système de Report de Bugs - Guide Rapide

## ✨ Qu'est-ce que c'est?

Un système **complet et professionnel** permettant aux joueurs de signaler des bugs directement depuis le jeu:

```
🎮 Joueur en jeu
  ↓
🚩 Clique sur le flag rouge (bas-droit)
  ↓
📝 Décrit le problème
  ↓
📸 Screenshot auto + 📋 Logs console
  ↓
✉️ Envoi direct via SendGrid à sabatini79@gmail.com
  ↓
💾 Stocké en base de données
```

## 🎯 Pour l'Utilisateur

### C'est Simple!
1. **Voir le flag 🚩** en bas à droite du jeu
2. **Cliquer dessus** pour ouvrir la modal
3. **Décrire le bug** (requis)
4. **Ajouter email** (optionnel, pour suivi)
5. **Vérifier** que screenshot et logs sont inclus
6. **Envoyer** ✅

### Ce qui est Envoyé
- ✅ Votre description
- ✅ Screenshot de la page (JPEG)
- ✅ Logs console (dernier 500)
- ✅ URL et résolution
- ✅ Navigateur (User-Agent)
- ✅ Timestamp exact

## 🔧 Configuration (Admin)

### 1️⃣ Installer
```bash
npm install
# SendGrid est déjà dans package.json ✅
```

### 2️⃣ Configurer Email avec SendGrid

1. Créer un compte SendGrid (gratuit): https://sendgrid.com
2. Générer une clé API: https://app.sendgrid.com/settings/api_keys
3. Créer `.env` à la racine du projet:

```bash
EMAIL_USER=sabatini79@gmail.com
SENDGRID_API_KEY=SG.votre_api_key_ici
```

**Pourquoi SendGrid et pas Gmail?**
- ✅ Fonctionne sur tous les serveurs (Render, Heroku, etc.)
- ✅ Pas de blocage de ports SMTP
- ✅ 100 emails/jour gratuit (suffisant pour bugs)
- ✅ Logs et monitoring intégrés
- ✅ Plus fiable et scalable

### 3️⃣ Démarrer le Serveur
```bash
npm start
# ou: node server.js
```

### 4️⃣ Tester
- Ouvrir http://localhost:3000
- Cliquer sur le flag 🚩
- Envoyer un test
- Vérifier l'email de test reçu

## 📊 Consulter les Bugs

### Via API
```bash
# Tous les bugs
curl http://localhost:3000/api/bugs

# Un bug spécifique
curl http://localhost:3000/api/bugs/[ID]

# Statistiques
curl http://localhost:3000/api/bugs/stats/summary
```

### Via MongoDB
```javascript
// Dans MongoDB Compass ou CLI
db.bugreports.find().sort({ timestamp: -1 })
```

### Mettre à Jour un Bug
```bash
curl -X PATCH http://localhost:3000/api/bugs/[ID] \
  -H "Content-Type: application/json" \
  -d '{
    "status": "investigating",
    "notes": "Reproduction confirmée",
    "assignedTo": "Dev Team"
  }'
```

## 📈 Statuts Disponibles

```
new (nouveau)
  ↓
acknowledged (reçu)
  ↓
investigating (en cours)
  ↓
fixed (corrigé) OU wontfix (ne sera pas corrigé)
```

## 🎨 Customiser

### Changer la Couleur du Flag
```javascript
// Public/bug-reporter.js, ligne ~60
flagButton.style.backgroundColor = '#00ff00';  // Vert par ex
```

### Ajouter des Champs au Formulaire
```javascript
// Public/bug-reporter.js, dans createModal()
// 1. Ajouter le HTML du champ
// 2. Lire la valeur dans submitBugReport()
// 3. Ajouter au bugReport object
// 4. Ajouter au schéma BugReport.js
```

### Changer l'Email de Notification
```bash
# .env
EMAIL_USER=mon-nouveau@email.com
```

## ⚡ Features

### Frontend
- ✅ Interface modale intuitif
- ✅ Capture d'écran automatique (html2canvas)
- ✅ Capture des logs console en temps réel
- ✅ Validation basique (description requise)
- ✅ Feedback utilisateur (statut envoi)
- ✅ Responsive et accessible

### Backend
- ✅ API REST complète (`/api/bugs`)
- ✅ Validation côté serveur
- ✅ Stockage MongoDB
- ✅ Email automatique
- ✅ Gestion des statuts
- ✅ Statistiques

### Email
- ✅ Notification admin instantanée
- ✅ Confirmation utilisateur (optionnel)
- ✅ Lien direct au bug dans l'email
- ✅ Résumé complet du bug
- ✅ Logs inclus

## 🔒 Sécurité

### Inclus
- Limite de taille (screenshot: 5MB, logs: 100 entrées)
- Validation côté serveur
- Pas de données sensibles dans screenshot
- User-agent anonyme

### À Implémenter (TODO)
- Authentification admin pour endpoints
- Rate-limiting (éviter les abus)
- Chiffrement des données
- Sanitization des logs

## 🚀 Exemple de Workflow

### Utilisateur Rencontre un Bug
```
1. Boom! Bug dans le jeu
2. Clique flag 🚩
3. Décrit: "La gem ne s'affiche pas au niveau 6"
4. Ajoute email: john@example.com
5. Clique "Envoyer"
6. ✅ Confirmation: "Rapport envoyé!"
```

### Admin Reçoit la Notification
```
1. Email à sabatini79@gmail.com reçu
2. Subject: "🚨 Nouveau Bug Reporté - La gem ne s'affiche pas..."
3. Contient:
   - Description complète
   - Screenshot de la page
   - Logs console
   - URL et navigateur
   - Timestamp
   - Lien au dashboard
```

### Admin Gère le Bug
```bash
# 1. Consulter
curl http://localhost:3000/api/bugs

# 2. Investiguer (voir screenshot, logs)
# 3. Reproduire le bug
# 4. Mettre à jour le statut
curl -X PATCH http://localhost:3000/api/bugs/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status":"investigating"}'

# 5. Corriger le code
# 6. Vérifier
# 7. Finaliser
curl -X PATCH http://localhost:3000/api/bugs/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status":"fixed"}'

# 8. Répondre à l'utilisateur par email
```

## 📁 Fichiers

```
Public/
  └── bug-reporter.js           # Frontend (modal, capture, envoi)

server/
  ├── bug-routes.js             # API endpoints
  └── email-service.js          # Gestion des emails

utils/
  └── BugReport.js              # Modèle MongoDB

docs/
  └── BUG_REPORTING.md          # Documentation complète

.env.example                     # Template de configuration
```

## 🧪 Test Rapide

### Frontend
```javascript
// Console du navigateur
window.bugReporter.openModal();

// Simuler un log
console.error("Test error");

// Soumettre manuellement
// (remplir le formulaire et envoyer)
```

### Backend
```bash
# Test de l'API
curl -X POST http://localhost:3000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test bug",
    "email": "test@example.com",
    "logs": [],
    "userAgent": "Test",
    "url": "http://localhost:3000",
    "viewport": {"width": 1920, "height": 1080}
  }'
```

## 🐛 Troubleshooting

| Problème | Solution |
|----------|----------|
| Email ne s'envoie pas | Vérifier `.env`, App Password Gmail |
| Screenshot vide | html2canvas chargé depuis CDN |
| Pas de logs | Bug-reporter.js chargé en dernier |
| Flag n'apparaît pas | Vérifier z-index (9998) |

## 📚 Documentation Complète

Voir: [`docs/BUG_REPORTING.md`](docs/BUG_REPORTING.md)

---

**Status:** ✅ Production Ready
**Dernière mise à jour:** Décembre 2025
