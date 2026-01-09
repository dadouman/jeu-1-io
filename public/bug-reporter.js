// Public/bug-reporter.js
// Système de report de bugs avec capture d'écran et logs

class BugReporter {
    constructor() {
        this.consoleLogs = [];
        this.isOpen = false;
        this.init();
    }

    /**
     * Initialiser le système de capture des logs
     */
    init() {
        // Capturer tous les logs de la console
        this.captureConsoleLogs();
        // Créer l'interface du reporter
        this.createUI();
    }

    /**
     * Intercepter tous les appels à la console
     */
    captureConsoleLogs() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        const captureLog = (level, args) => {
            const timestamp = new Date().toLocaleTimeString();
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            this.consoleLogs.push({
                level,
                timestamp,
                message
            });

            // Limiter à 500 logs pour ne pas surcharger la mémoire
            if (this.consoleLogs.length > 500) {
                this.consoleLogs.shift();
            }
        };

        console.log = function(...args) {
            captureLog('LOG', args);
            originalLog.apply(console, args);
        };

        console.error = function(...args) {
            captureLog('ERROR', args);
            originalError.apply(console, args);
        };

        console.warn = function(...args) {
            captureLog('WARN', args);
            originalWarn.apply(console, args);
        };

        console.info = function(...args) {
            captureLog('INFO', args);
            originalInfo.apply(console, args);
        };
    }

    /**
     * Créer le bouton flag et la modal
     */
    createUI() {
        // Créer le bouton flag en bas à droite
        const flagButton = document.createElement('button');
        flagButton.id = 'bug-report-flag';
        flagButton.title = 'Signaler un bug';
        flagButton.innerHTML = '🚩';
        flagButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #ff4444;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        flagButton.addEventListener('mouseenter', () => {
            flagButton.style.transform = 'scale(1.1)';
            flagButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
        });

        flagButton.addEventListener('mouseleave', () => {
            flagButton.style.transform = 'scale(1)';
            flagButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        });

        flagButton.addEventListener('click', () => this.openModal());
        document.body.appendChild(flagButton);

        // Créer la modal
        this.createModal();
    }

    /**
     * Créer la modal de report
     */
    createModal() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'bug-report-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            z-index: 9999;
            display: none;
        `;

        // Modal
        const modal = document.createElement('div');
        modal.id = 'bug-report-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            z-index: 10000;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            display: none;
            max-height: 90vh;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">Signaler un Bug</h2>
                <button id="bug-report-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>

            <form id="bug-report-form" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">
                        Description du bug *
                    </label>
                    <textarea 
                        id="bug-report-description" 
                        placeholder="Décrivez le problème que vous avez rencontré..." 
                        required 
                        style="
                            width: 100%;
                            min-height: 120px;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-family: Arial, sans-serif;
                            resize: vertical;
                            box-sizing: border-box;
                        "
                    ></textarea>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">
                        Email (optionnel)
                    </label>
                    <input 
                        type="email" 
                        id="bug-report-email" 
                        placeholder="votre@email.com"
                        style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            box-sizing: border-box;
                        "
                    />
                </div>

                <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                    <label style="display: flex; align-items: center; gap: 8px; color: #666; cursor: pointer;">
                        <input type="checkbox" id="bug-report-screenshot" checked style="cursor: pointer;">
                        <span>Inclure une capture d'écran</span>
                    </label>
                </div>

                <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                    <label style="display: flex; align-items: center; gap: 8px; color: #666; cursor: pointer;">
                        <input type="checkbox" id="bug-report-logs" checked style="cursor: pointer;">
                        <span>Inclure les logs de console (${this.consoleLogs.length} logs)</span>
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button 
                        type="button" 
                        id="bug-report-cancel" 
                        style="
                            padding: 10px 20px;
                            border: 1px solid #ddd;
                            background-color: white;
                            color: #333;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        "
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        style="
                            padding: 10px 20px;
                            background-color: #ff4444;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        "
                    >
                        Envoyer le rapport
                    </button>
                </div>
            </form>

            <div id="bug-report-status" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Event listeners
        overlay.addEventListener('click', () => this.closeModal());
        document.getElementById('bug-report-close').addEventListener('click', () => this.closeModal());
        document.getElementById('bug-report-cancel').addEventListener('click', () => this.closeModal());
        document.getElementById('bug-report-form').addEventListener('submit', (e) => this.submitBugReport(e));
    }

    /**
     * Ouvrir la modal
     */
    openModal() {
        this.isOpen = true;
        document.getElementById('bug-report-overlay').style.display = 'block';
        document.getElementById('bug-report-modal').style.display = 'block';
        document.getElementById('bug-report-description').focus();
    }

    /**
     * Fermer la modal
     */
    closeModal() {
        this.isOpen = false;
        document.getElementById('bug-report-overlay').style.display = 'none';
        document.getElementById('bug-report-modal').style.display = 'none';
        document.getElementById('bug-report-form').reset();
        document.getElementById('bug-report-status').style.display = 'none';
    }

    /**
     * Prendre une capture d'écran avec html2canvas
     * Optimisée pour réduire la taille du fichier
     */
    async takeScreenshot() {
        try {
            // Vérifier que html2canvas est disponible
            if (typeof html2canvas === 'undefined') {
                console.warn('❌ html2canvas non disponible');
                return null;
            }

            console.log('📸 Capture d\'écran en cours...');
            
            const canvas = await html2canvas(document.body, {
                allowTaint: true,
                useCORS: true,
                backgroundColor: '#ffffff',
                scale: 0.75  // Réduire à 75% de la résolution pour diminuer la taille
            });

            const screenshot = canvas.toDataURL('image/jpeg', 0.5);  // Qualité 50% pour économiser
            console.log(`✅ Screenshot capturé (${(screenshot.length / 1024 / 1024).toFixed(2)} MB)`);
            
            return screenshot;
        } catch (error) {
            console.error('❌ Erreur lors de la capture d\'écran:', error);
            return null;
        }
    }

    /**
     * Soumettre le rapport de bug
     */
    async submitBugReport(event) {
        event.preventDefault();

        const description = document.getElementById('bug-report-description').value;
        const email = document.getElementById('bug-report-email').value;
        const includeScreenshot = document.getElementById('bug-report-screenshot').checked;
        const includeLogs = document.getElementById('bug-report-logs').checked;
        const statusDiv = document.getElementById('bug-report-status');

        // Afficher le statut "envoi en cours"
        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = '#fff3cd';
        statusDiv.style.color = '#856404';
        statusDiv.innerHTML = '⏳ Traitement du rapport...';

        try {
            let screenshot = null;
            if (includeScreenshot) {
                statusDiv.innerHTML = '📸 Capture d\'écran en cours...';
                screenshot = await this.takeScreenshot();
                
                // Avertir si la capture a échoué
                if (!screenshot) {
                    statusDiv.style.backgroundColor = '#fff3cd';
                    statusDiv.style.color = '#856404';
                    statusDiv.innerHTML = '⚠️ Attention: Capture d\'écran non disponible. Le rapport sera quand même envoyé.';
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            statusDiv.innerHTML = '📤 Envoi du rapport...';
            
            const logs = includeLogs ? this.consoleLogs : [];

            const bugReport = {
                description,
                email: email || null,
                screenshot,
                logs,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };

            console.log('🐛 Envoi du rapport de bug...', bugReport);

            // Envoyer au serveur
            const response = await fetch('/api/bugs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bugReport)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Rapport envoyé avec succès:', result.bugId);
                
                statusDiv.style.backgroundColor = '#c8e6c9';
                statusDiv.style.color = '#2e7d32';
                statusDiv.innerHTML = '✅ Merci! Votre rapport a été envoyé avec succès.\\n' +
                                     '<small style="display: block; margin-top: 5px; font-size: 11px;">ID: ' + result.bugId + '</small>';

                // Fermer la modal après 2.5 secondes
                setTimeout(() => this.closeModal(), 2500);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'envoi');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du rapport:', error);
            statusDiv.style.backgroundColor = '#ffcdd2';
            statusDiv.style.color = '#c62828';
            statusDiv.innerHTML = '❌ Erreur lors de l\'envoi: ' + error.message + '<br><small>Veuillez réessayer.</small>';
        }
    }
}

// Initialiser automatiquement quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bugReporter = new BugReporter();
    });
} else {
    window.bugReporter = new BugReporter();
}
