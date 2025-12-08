// server/email-service.js - Service pour envoyer les notifications par email via SendGrid

const sgMail = require('@sendgrid/mail');

/**
 * Service d'email pour les rapports de bugs
 * Utilise SendGrid API pour envoyer les notifications
 */
class EmailService {
    constructor() {
        this.initialized = false;
        this.apiKey = null;
    }

    /**
     * Initialiser le service d'email
     * Utilise les variables d'environnement pour la configuration
     */
    async initialize() {
        try {
            // Configuration SendGrid
            const apiKey = (process.env.SENDGRID_API_KEY || '').trim();
            const emailUser = process.env.EMAIL_USER || 'sabatini79@gmail.com';
            
            // DEBUG: Afficher les variables (sans l'API key!)
            console.log(`📧 Email Config: user=${emailUser}, hasApiKey=${!!apiKey}`);
            
            if (!apiKey) {
                throw new Error('SENDGRID_API_KEY manquant!');
            }
            
            console.log('🔧 Configuration de SendGrid...');
            sgMail.setApiKey(apiKey);
            this.apiKey = apiKey;
            console.log('✅ SendGrid configuré');

            // Envoyer un email de test à l'initialisation
            try {
                console.log('📧 Envoi d\'un email de test...');
                await this.sendTestEmail();
                console.log('✅ Email de test envoyé avec succès!');
            } catch (testError) {
                console.error('❌ Erreur lors de l\'envoi de l\'email de test:', testError.message);
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du service d\'email:', error.message);
            console.log('⚠️  Les bugs seront sauvegardés mais les emails ne seront pas envoyés');
            this.initialized = false;
            return false;
        }
    }

    /**
     * Envoyer un email de test à l'initialisation
     * @returns {Promise<void>}
     */
    async sendTestEmail() {
        const adminEmail = process.env.EMAIL_USER || 'sabatini79@gmail.com';
        
        const msg = {
            to: adminEmail,
            from: 'noreply@jeu.io',
            subject: '✅ Service d\'email SendGrid initialisé - Jeu .io',
            html: `
                <h2>🎉 Service d'email SendGrid fonctionnel!</h2>
                <p><strong>Serveur redémarré:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <p>Le système de report de bugs est opérationnel et peut envoyer des notifications.</p>
                <hr>
                <p><small>Cet email a été envoyé automatiquement pour vérifier que SendGrid est configuré correctement.</small></p>
            `
        };

        try {
            // Ajouter un timeout pour ne pas bloquer indéfiniment
            const sendPromise = sgMail.send(msg);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout d\'envoi')), 10000)
            );
            const info = await Promise.race([sendPromise, timeoutPromise]);
            console.log('✅ Email de test SendGrid envoyé');
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error.message);
            // Ne pas throw - laisser le serveur continuer même si le mail échoue
        }
    }

    /**
     * Envoyer un email de notification de bug
     * @param {object} bugReport - Le rapport de bug complet
     * @returns {Promise<boolean>} - True si envoyé avec succès
     */
    async sendBugNotification(bugReport) {
        if (!this.initialized) {
            console.warn('⚠️  Service d\'email non initialisé, email non envoyé');
            return false;
        }

        try {
            // Résumé du bug en HTML
            const htmlContent = `
                <h2>🚨 Nouveau Rapport de Bug</h2>
                
                <h3>Description</h3>
                <p><strong>${bugReport.description}</strong></p>
                
                <h3>Informations</h3>
                <ul>
                    <li><strong>Date/Heure:</strong> ${new Date(bugReport.timestamp).toLocaleString('fr-FR')}</li>
                    <li><strong>URL:</strong> ${bugReport.url}</li>
                    <li><strong>Email utilisateur:</strong> ${bugReport.email || 'Non fourni'}</li>
                    <li><strong>Navigateur:</strong> ${bugReport.userAgent}</li>
                    <li><strong>Résolution:</strong> ${bugReport.viewport.width}x${bugReport.viewport.height}</li>
                </ul>
                
                <h3>Logs Console (${bugReport.logs.length} entrées)</h3>
                <pre style="background-color: #f4f4f4; padding: 10px; overflow-x: auto;">
${bugReport.logs.map(log => 
    `[${log.timestamp}] ${log.level}: ${log.message}`
).join('\n')}
                </pre>
                
                ${bugReport.screenshot ? `
                <h3>Capture d'écran</h3>
                <p>Capture d'écran attachée à ce rapport (voir en pièce jointe ou dans la base de données)</p>
                ` : '<p><em>Aucune capture d\'écran incluse</em></p>'}
                
                <hr>
                <p style="color: #666; font-size: 12px;">
                    <strong>ID du rapport:</strong> ${bugReport._id}<br>
                    Gérer ce bug: <a href="${process.env.ADMIN_DASHBOARD_URL || 'https://votre-admin-panel.com'}/bugs/${bugReport._id}">Ouvrir dans le dashboard</a>
                </p>
            `;

            const msg = {
                to: 'sabatini79@gmail.com',
                from: 'noreply@jeu.io',
                subject: `🚨 Nouveau Bug Reporté - ${bugReport.description.substring(0, 50)}...`,
                html: htmlContent,
                replyTo: bugReport.email || 'noreply@jeu.io'
            };

            // Envoyer l'email avec timeout
            const sendPromise = sgMail.send(msg);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout d\'envoi email')), 10000)
            );
            await Promise.race([sendPromise, timeoutPromise]);
            console.log(`✅ Email de notification SendGrid envoyé pour le bug ${bugReport._id}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
            return false;
        }
    }

    /**
     * Envoyer un email de confirmation à l'utilisateur (optionnel)
     * @param {string} userEmail - Email de l'utilisateur
     * @param {string} bugId - ID du rapport
     */
    async sendConfirmationEmail(userEmail, bugId) {
        if (!this.initialized || !userEmail) return false;

        try {
            const msg = {
                to: userEmail,
                from: 'noreply@jeu.io',
                subject: '✅ Merci pour votre rapport de bug',
                html: `
                    <h2>Merci pour votre aide!</h2>
                    <p>Votre rapport de bug a été reçu avec succès.</p>
                    <p><strong>Numéro du rapport:</strong> ${bugId}</p>
                    <p>Nous allons étudier votre signalement et prendre les mesures nécessaires.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        Si vous avez d'autres questions, vous pouvez répondre directement à cet email.
                    </p>
                `
            };

            await sgMail.send(msg);
            console.log(`✅ Email de confirmation SendGrid envoyé à ${userEmail}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du email de confirmation:', error.message);
            return false;
        }
    }
}

// Exporter une instance unique
const emailService = new EmailService();

module.exports = emailService;
