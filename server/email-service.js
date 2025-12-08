// server/email-service.js - Service pour envoyer les notifications par email

const nodemailer = require('nodemailer');

/**
 * Service d'email pour les rapports de bugs
 * Configure le transport email et envoie les notifications
 */
class EmailService {
    constructor() {
        this.initialized = false;
        this.transporter = null;
    }

    /**
     * Initialiser le service d'email
     * Utilise les variables d'environnement pour la configuration
     */
    async initialize() {
        try {
            // Configuration pour Gmail (ou utiliser un service SMTP)
            // Note: Vous devez configurer une "App Password" dans Gmail
            // ou utiliser un service comme SendGrid, Mailgun, etc.
            
            const emailUser = process.env.EMAIL_USER || 'sabatini79@gmail.com';
            const emailPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD || '').trim();
            
            // DEBUG: Afficher les variables (sans le password!)
            console.log(`📧 Email Config: user=${emailUser}, hasPassword=${!!emailPass}`);
            
            if (!emailPass) {
                throw new Error('EMAIL_PASSWORD ou EMAIL_APP_PASSWORD manquant!');
            }
            
            console.log('🔧 Création du transporter nodemailer...');
            const emailConfig = {
                // Configuration Gmail optimisée
                service: 'gmail',  // ← Utiliser 'service' au lieu de host/port
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            };

            this.transporter = nodemailer.createTransport(emailConfig);
            console.log('✅ Transporter créé');

            // Vérifier la connexion (optionnel - on essaiera d'envoyer quand même)
            try {
                console.log('🔍 Vérification de la connexion SMTP...');
                // Ajouter un timeout pour ne pas bloquer indéfiniment
                const verifyPromise = this.transporter.verify();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout de vérification')), 5000)
                );
                await Promise.race([verifyPromise, timeoutPromise]);
                console.log('✅ Vérification SMTP réussie');
            } catch (verifyError) {
                console.warn('⚠️  Vérification SMTP échouée:', verifyError.message, '(mais on continue)');
            }
            
            // Envoyer un email de test à l'initialisation
            try {
                console.log('📧 Envoi d\'un email de test...');
                await this.sendTestEmail();
                console.log('✅ Email de test envoyé avec succès!');
            } catch (testError) {
                console.error('❌ Erreur lors de l\'envoi de l\'email de test:', testError.message);
                console.error('Stack:', testError.stack);
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
        
        const mailOptions = {
            from: adminEmail,
            to: adminEmail,
            subject: '✅ Service d\'email initialisé - Jeu .io',
            html: `
                <h2>🎉 Service d'email fonctionnel!</h2>
                <p><strong>Serveur redémarré:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <p>Le système de report de bugs est opérationnel.</p>
                <hr>
                <p><small>Cet email a été envoyé automatiquement pour vérifier la connectivité SMTP.</small></p>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de test envoyé:', info.response);
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error.message);
            throw error;
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

            const mailOptions = {
                from: process.env.EMAIL_USER || 'sabatini79@gmail.com',
                to: 'sabatini79@gmail.com',
                subject: `🚨 Nouveau Bug Reporté - ${bugReport.description.substring(0, 50)}...`,
                html: htmlContent,
                replyTo: bugReport.email || 'noreply@jeu.io'
            };

            // Envoyer l'email
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de notification envoyé: ${info.messageId}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
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
            const mailOptions = {
                from: process.env.EMAIL_USER || 'sabatini79@gmail.com',
                to: userEmail,
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

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de confirmation envoyé à ${userEmail}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du email de confirmation:', error);
            return false;
        }
    }
}

// Exporter une instance unique
const emailService = new EmailService();

module.exports = emailService;
