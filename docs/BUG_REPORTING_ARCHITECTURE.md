# 🐛 Bug Reporting System - Architecture Visuelle

## 🎯 Flux Global

```
┌─────────────────────────────────────────────────────────┐
│                   JOUEUR EN JEU                          │
│                                                          │
│  Le joueur rencontre un bug et clique sur le flag 🚩    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PUBLIC/BUG-REPORTER.JS                      │
│                 (Frontend Modal)                         │
│                                                          │
│  ✓ Capture description                                   │
│  ✓ Prend screenshot (html2canvas)                        │
│  ✓ Récupère logs console                                │
│  ✓ Collecte infos système                               │
│  ✓ Optionnel: Email utilisateur                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│         POST /api/bugs (Server/BUG-ROUTES.JS)           │
│                  (Backend API)                          │
│                                                          │
│  ✓ Valide les données                                   │
│  ✓ Sauvegarde en MongoDB                                │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ┌─────────────────────┐  ┌──────────────────┐
    │   MONGODB STORAGE   │  │  EMAIL SERVICE   │
    │                     │  │                  │
    │ • Description       │  │ ✓ Notification   │
    │ • Screenshot (base64)  │   admin @gmail   │
    │ • Logs array        │  │                  │
    │ • System info       │  │ ✓ Confirmation   │
    │ • User email        │  │   utilisateur    │
    │ • Timestamp         │  │                  │
    │ • Status (new...)   │  │ ✓ Lien dashboard │
    │ • Notes internes    │  │                  │
    └─────────────────────┘  └────────┬─────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │  EMAIL NOTIFICATION  │
                           │                      │
                           │  To: sabatini79@    │
                           │      gmail.com       │
                           │                      │
                           │  • Description       │
                           │  • Screenshot        │
                           │  • Logs              │
                           │  • URL/navigateur    │
                           │  • Lien vers bug     │
                           │  • Dashboard link    │
                           └──────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │     ADMIN INBOX      │
                           │                      │
                           │  Email reçu ✅       │
                           │  Peut consulter BD   │
                           │  Mettre à jour       │
                           │  statut du bug       │
                           │  Répondre utilisateur│
                           └──────────────────────┘
```

## 📊 Architecture des Données

```
BugReport (MongoDB Document)
├── _id: ObjectId                      ← ID unique
├── description: String (max 5000)     ← Requis
├── email: String                      ← Email utilisateur (optionnel)
├── screenshot: String (base64)        ← Image JPEG max 5MB
├── logs: Array[                       ← Console logs
│   ├── level: String (LOG/ERROR/WARN)
│   ├── timestamp: String
│   └── message: String
│ ]
├── userAgent: String                  ← Navigateur
├── url: String                        ← Page URL
├── viewport: {                        ← Résolution
│   ├── width: Number
│   └── height: Number
│ }
├── timestamp: Date                    ← Quand créé
├── status: String (new/acknowled...)  ← Pour l'admin
├── notes: String                      ← Notes internes
└── assignedTo: String                 ← Dev assigné
```

## 🔄 Flux de Requête HTTP

### POST /api/bugs

```
CLIENT ──────────────────────────────────────────► SERVER
                    POST /api/bugs
                    {
                        description: "...",
                        email: "...",
                        screenshot: "data:image/jpeg;base64,...",
                        logs: [...],
                        userAgent: "...",
                        url: "...",
                        viewport: { width: 1920, height: 1080 }
                    }

CLIENT ◄──────────────────────────────────────────── SERVER
                    200 OK
                    {
                        success: true,
                        bugId: "507f1f77bcf86cd799439011",
                        message: "Merci pour votre rapport!"
                    }
```

### GET /api/bugs (Admin)

```
ADMIN ──────────────────────────────────────────► SERVER
                    GET /api/bugs

ADMIN ◄──────────────────────────────────────────── SERVER
                    200 OK
                    [
                        {
                            _id: "507f...",
                            description: "...",
                            email: "...",
                            status: "new",
                            timestamp: "2025-12-07T...",
                            ...
                        },
                        { ... },
                        ...
                    ]
```

## 📱 Interface Utilisateur

```
┌────────────────────────────────────────────────────────┐
│                    JEU                                 │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                    ┌──────┐            │
│                                    │  🚩  │            │
│                                    │FLAG  │            │
│                                    └──────┘            │
│                                                        │
└────────────────────────────────────────────────────────┘
                         ▼ Click
        ┌────────────────────────────────────┐
        │  📝 SIGNALER UN BUG                 │
        │                                    │
        │  Description du bug *              │
        │  ┌──────────────────────────────┐  │
        │  │ [Texte du bug ...]          │  │
        │  │                              │  │
        │  │                              │  │
        │  └──────────────────────────────┘  │
        │                                    │
        │  Email (optionnel)                 │
        │  ┌──────────────────────────────┐  │
        │  │ votre@email.com              │  │
        │  └──────────────────────────────┘  │
        │                                    │
        │  ☑ Inclure une capture d'écran    │
        │  ☑ Inclure les logs (137 logs)    │
        │                                    │
        │  [ Annuler ] [ Envoyer ]           │
        │                                    │
        │  ✅ Merci! Rapport envoyé.         │
        │                                    │
        └────────────────────────────────────┘
```

## 🔌 Intégration Serveur

```javascript
// server/index.js

// 1. Import
const bugRoutes = require('./bug-routes');
const emailService = require('./email-service');

// 2. Middleware pour JSON large (screenshots)
app.use(express.json({ limit: '50mb' }));

// 3. Initialisation email
emailService.initialize();

// 4. Routes
app.use('/api/bugs', bugRoutes);
```

## 📧 Email Notifications

### Email Admin
```
From: [Automatique]
To: sabatini79@gmail.com
Subject: 🚨 Nouveau Bug Reporté - La gem ne s'affiche pas...

┌─────────────────────────────────────────┐
│ 🚨 Nouveau Rapport de Bug                │
│                                         │
│ Description                             │
│ La gem ne s'affiche pas au niveau 6     │
│                                         │
│ Informations                            │
│ • Date: 07/12/2025 21:45:32            │
│ • URL: http://localhost:3000/#classic  │
│ • Email: john@example.com               │
│ • Navigateur: Chrome 120 (Win10)        │
│ • Résolution: 1920x1080                 │
│                                         │
│ Logs Console (5 entrées)                │
│ [21:45:30] LOG: Joueur started          │
│ [21:45:31] LOG: Entering level 6        │
│ [21:45:32] ERROR: Gem undefined         │
│ ...                                     │
│                                         │
│ Capture d'écran                         │
│ [Incluse en pièce jointe]               │
│                                         │
│ [Gérer ce bug]                          │
│ ID: 507f1f77bcf86cd799439011           │
└─────────────────────────────────────────┘
```

### Email Utilisateur (Confirmation)
```
From: [Admin]
To: john@example.com
Subject: ✅ Merci pour votre rapport de bug

┌─────────────────────────────────────────┐
│ Merci pour votre aide!                   │
│                                         │
│ Votre rapport de bug a été reçu         │
│ avec succès.                            │
│                                         │
│ Numéro du rapport:                      │
│ 507f1f77bcf86cd799439011               │
│                                         │
│ Nous allons étudier votre signalement   │
│ et prendre les mesures nécessaires.     │
│                                         │
│ Si vous avez d'autres questions,        │
│ répondez à cet email.                   │
└─────────────────────────────────────────┘
```

## 🔐 Sécurité

```
Côté Client
├── html2canvas (CDN externe)
├── Limite de screenshot (visuel seulement)
├── Logs sans données sensibles
└── Validation basique

Côté Serveur
├── Validation complète des données
├── Limite de taille (5MB images, 100 logs)
├── Base de données sécurisée (MongoDB)
├── Email via SMTP sécurisé (TLS)
├── Rate-limiting (À implémenter)
└── Authentification admin (À implémenter)
```

## 📈 Statuts du Bug

```
     new (nouveau)
         ▼
   acknowledged
         ▼
   investigating
         ▼
    ┌────┴────┐
    ▼         ▼
  fixed   wontfix
```

## 🚀 Points d'Entrée

### Pour Utilisateur
- Click flag 🚩
- Remplir modal
- Envoyer

### Pour Admin
- Email: sabatini79@gmail.com
- API: GET /api/bugs
- API: GET /api/bugs/[ID]
- API: PATCH /api/bugs/[ID]
- MongoDB: Accès direct

### Pour Dev
- Public/bug-reporter.js (frontend)
- server/bug-routes.js (API)
- server/email-service.js (email)
- utils/BugReport.js (DB)

---

**Architecture simple, scalable et professionnel!** ✅
