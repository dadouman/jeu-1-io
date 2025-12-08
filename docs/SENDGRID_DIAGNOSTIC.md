# 🔧 Diagnostic Rapide SendGrid - Troubleshooting

## 🚨 Vous avez un problème? Commencez ici

### ❓ Quel est votre problème?

#### 1️⃣ "Je ne sais pas par où commencer"
→ Lisez: `docs/SENDGRID_CONFIGURATION_MODE_EMPLOI.md`

---

#### 2️⃣ "Ça ne fonctionne pas localement (npm start)"

**Affichage anormal dans les logs:**

```
❌ SENDGRID_API_KEY manquant!
```

**Solution:**
1. Vérifiez que `.env` existe à la racine du projet
2. Vérifiez que la ligne `SENDGRID_API_KEY=SG...` est présente
3. Vérifiez qu'elle ne commence pas par `#` (commentaire)
4. Redémarrez le serveur: `npm start`

---

#### 3️⃣ "L'email de test ne s'envoie pas localement"

**Affichage dans les logs:**

```
❌ Erreur lors de l'envoi de l'email de test: ...
```

**Checklist:**

1. **Vérifiez la clé SendGrid:**
   ```bash
   # Ouvrez .env et cherchez:
   SENDGRID_API_KEY=SG.kbdJ6_9vTWGZQvGYCNCCZg...
   ```
   - Doit commencer par `SG.`
   - Doit être complète (pas tronquée)
   - Pas d'espaces à la fin

2. **Testez avec un script simple:**
   ```javascript
   // test-sendgrid.js
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   const msg = {
     to: 'votre.email@gmail.com',
     from: 'noreply@jeu.io',
     subject: 'Test SendGrid',
     text: 'Ça fonctionne!'
   };
   
   sgMail.send(msg)
     .then(() => console.log('✅ Email envoyé'))
     .catch(err => console.error('❌ Erreur:', err));
   ```

   Exécutez:
   ```bash
   node test-sendgrid.js
   ```

3. **Vérifiez votre compte SendGrid:**
   - Allez sur: https://app.sendgrid.com/settings/api_keys
   - Vérifiez que la clé est "Active" (pas "Revoked")
   - Créez une nouvelle clé si nécessaire

---

#### 4️⃣ "Ça fonctionne localement, mais pas sur Render"

**Symptômes:**
- Tests locaux OK
- Logs Render montrent une erreur

**Solution étape par étape:**

**Étape 1: Vérifiez l'environment Render**

1. Allez sur: https://dashboard.render.com/
2. Cliquez sur **jeu-1-io**
3. Allez dans **Environment**
4. Vérifiez que vous avez:
   ```
   MONGODB_URI=mongodb+srv://...
   EMAIL_USER=votre.email@gmail.com
   SENDGRID_API_KEY=SG.votre_cle_ici
   ```

5. Vérifiez que les anciennes variables sont **supprimées**:
   - ❌ EMAIL_PASSWORD
   - ❌ EMAIL_HOST
   - ❌ EMAIL_PORT
   - ❌ EMAIL_SECURE

**Étape 2: Redémarrez le service**

1. Cliquez **Manual Deploy** en haut du Dashboard
2. Attendez "Live" ✅

**Étape 3: Consultez les logs**

1. Cliquez **Logs** en bas
2. Regardez les derniers messages
3. Cherchez `SENDGRID_API_KEY manquant` ou des erreurs

---

#### 5️⃣ "Les logs Render sont vides"

**Cause:** Le service ne s'est pas bien démarré

**Solution:**

1. Vérifiez que `SENDGRID_API_KEY` est défini
2. Cliquez **Manual Deploy** pour forcer le redéploiement
3. Attendez 1-2 minutes
4. Rechargez les logs (F5)

---

#### 6️⃣ "Je reçois l'email de test mais pas les notifications de bug"

**Cause:** L'endpoint `/api/bugs` a un problème

**Solution:**

1. Ouvrez votre navigateur → Developer Tools (F12)
2. Allez dans **Network**
3. Revenez au jeu et envoyez un bug report
4. Cherchez la requête `POST /api/bugs`
5. Vérifiez le statut:
   - ✅ 200 = OK
   - ❌ 500 = Erreur serveur
   - ❌ 404 = Endpoint non trouvé

6. Si erreur 500:
   - Consultez les logs Render
   - Cherchez des messages d'erreur

---

#### 7️⃣ "Les tests échouent après changement SendGrid"

**Cause:** Les mocks de tests ne sont pas à jour

**Solution:**

```bash
npm test
```

Si tous les tests passent: ✅ OK!

Si des tests échouent:
- Les tests ne doivent pas vraiment envoyer d'emails
- Aucun changement ne devrait affecter les tests
- Si c'est le cas, c'est une erreur

---

#### 8️⃣ "Erreur: 'Cannot find module @sendgrid/mail'"

**Cause:** Le package n'est pas installé

**Solution:**

```bash
npm install @sendgrid/mail --save
npm test
```

---

#### 9️⃣ "Erreur: 'EMAIL_USER ou SENDGRID_API_KEY manquant' en production"

**Cause:** Les variables d'environnement ne sont pas configurées sur Render

**Solution:**

1. Vérifiez que vous avez cliqué **Save** (pas juste modifié)
2. Vérifiez que le redéploiement est terminé (status = "Live")
3. Attendez 2-3 minutes
4. Consultez les logs Render

---

## 🎯 Vérification Rapide (2 minutes)

Exécutez ces commandes pour tout vérifier:

```bash
# 1. Vérifiez que .env existe
ls -la .env

# 2. Vérifiez que la clé est définie
grep SENDGRID_API_KEY .env

# 3. Vérifiez que @sendgrid/mail est installé
npm list @sendgrid/mail

# 4. Lancez les tests
npm test

# 5. Démarrez le serveur
npm start
```

Consultez les logs après chaque étape.

---

## 📞 Si rien n'y fait

1. **Prenez une screenshot** des logs d'erreur
2. **Notez:**
   - Quelle étape échoue?
   - Quel message d'erreur exact?
   - Ça fonctionne localement?
   - Ça fonctionne sur Render?

3. **Vérifiez:**
   - Votre clé SendGrid est-elle valide?
   - Votre compte SendGrid est-il actif?
   - Avez-vous atteint la limite gratuite (100 emails/jour)?

4. **Consultez:**
   - `docs/SENDGRID_CONFIGURATION_MODE_EMPLOI.md`
   - https://docs.sendgrid.com/
   - https://status.sendgrid.com/ (pour les incidents)
