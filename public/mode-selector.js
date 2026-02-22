// mode-selector.js - Gestion de la sélection du mode de jeu

var selectedMode = null; // var pour accès global

/**
 * Change le type de boutique (classic ou auction)
 */
function setShopMode(mode) {
    console.log(`🛍️ Changement du mode boutique: ${mode}`);
    currentShopMode = mode;
    
    // Mettre à jour les boutons d'onglets
    const tabClassic = document.getElementById('tabClassic');
    const tabAuction = document.getElementById('tabAuction');
    
    if (mode === 'classic') {
        if (tabClassic) tabClassic.classList.add('active');
        if (tabAuction) tabAuction.classList.remove('active');
    } else if (mode === 'auction') {
        if (tabClassic) tabClassic.classList.remove('active');
        if (tabAuction) tabAuction.classList.add('active');
    }
}

/**
 * Met à jour l'état des boutons JOUER selon lobbiesRebooting
 */
function updateModeButtonsState() {
    console.log('� ====== updateModeButtonsState() CALLED ======');
    console.log('📍 lobbiesRebooting =', lobbiesRebooting);
    
    const buttons = document.querySelectorAll('.mode-card button');
    console.log('📍 Boutons trouvés:', buttons.length);
    console.log('📍 Boutons details:', buttons);
    
    buttons.forEach((button, index) => {
        console.log(`  📍 Bouton ${index}:`, button.outerHTML.substring(0, 50));
        if (lobbiesRebooting) {
            button.disabled = true;
            button.style.pointerEvents = 'none';
            console.log(`    ✓ Bouton ${index} DÉSACTIVÉ`);
        } else {
            button.disabled = false;
            button.style.pointerEvents = 'auto';
            console.log(`    ✓ Bouton ${index} RÉACTIVÉ`);
        }
    });
    console.log('📍 ====== updateModeButtonsState() DONE ======');
}

// Event listener global pour empêcher les clics sur les boutons désactivés
document.addEventListener('click', (event) => {
    if (lobbiesRebooting && event.target.tagName === 'BUTTON' && event.target.closest('.mode-card')) {
        console.log('⏳ Clic bloqué: les lobbies se redémarrent...');
        event.preventDefault();
        event.stopPropagation();
    }
}, true); // Utilisé la phase de capture pour intercepter avant le handler onclick

/**
 * Wrapper pour bloquer les clics si lobbiesRebooting = true
 * @param {string} mode - Le mode à sélectionner
 */
function selectModeWithGuard(mode) {
    if (lobbiesRebooting) {
        console.log('⏳ Clique bloqué: les lobbies se redémarrent...');
        return;
    }
    selectMode(mode);
}

/**
 * Sélectionne un mode de jeu
 * @param {string} mode - 'classic', 'infinite', 'solo', ou 'custom'
 */
function selectMode(mode) {
    // Bloquer la sélection si les lobbies se redémarrent
    if (lobbiesRebooting) {
        console.log(`%c🔴 BLOQUEÉ: Mode ${mode} - lobbiesRebooting = ${lobbiesRebooting}`, 'color: #FF0000; font-weight: bold; font-size: 14px');
        return;
    }
    
    console.log(`%c✅ AUTORISÉ: Mode ${mode} - lobbiesRebooting = ${lobbiesRebooting}`, 'color: #00FF00; font-weight: bold; font-size: 14px');
    
    const baseMode = mode.replace('Auction', '');
    if (baseMode === 'classic' || baseMode === 'classicPrim' || baseMode === 'infinite' || baseMode === 'solo' || baseMode === 'custom') {
        // Vérifier que le mode personnalisé existe
        if (baseMode === 'custom' && !customModeConfig) {
            alert('❌ Aucun mode personnalisé configuré. Appuyez sur @ pour configurer.');
            return;
        }
        
        selectedMode = mode;
        currentGameEndType = baseMode === 'solo' ? 'solo' : 'multi';
        const modeNames = {
            'classic': 'Couloirs (10 Niveaux)',
            'classicPrim': 'Organique (10 Niveaux)',
            'infinite': 'Mode Infini',
            'solo': 'Mode Solo (10 niveaux)',
            'custom': customModeConfig ? customModeConfig.name + ' (' + customModeConfig.maxLevels + ' niveaux)' : 'Personnalisé'
        };
        console.log(`%c🎮 Mode sélectionné: ${modeNames[mode]}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        
        // Masquer l'écran de sélection
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.style.display = 'none';
        }

        // Fermer le navigateur de lobbies si ouvert
        if (typeof hideLobbiesBrowser === 'function') {
            hideLobbiesBrowser();
        }

        // === RÉINITIALISER LES ÉTATS DE FIN DE JEU POUR TOUS LES MODES ===
        isClassicGameFinished = false;
        finalClassicData = null;
        classicEndScreenStartTime = null;
        isSoloGameFinished = false;
        soloTotalTime = 0;
        soloSplitTimes = [];

        // === INITIALISATION SOLO (sans countdown client) ===
        if (mode === 'solo') {
            // Définir le mode AVANT le countdown
            currentGameMode = 'solo';
            
            // Réinitialiser les variables solo
            soloInactiveTime = 0;
            isSoloGameFinished = false;
            soloTotalTime = 0;
            soloSplitTimes = [];
            
            // Charger les meilleurs splits personnels depuis localStorage
            try {
                const savedSplits = localStorage.getItem('soloPersonalBestSplits');
                if (savedSplits) {
                    soloPersonalBestSplits = JSON.parse(savedSplits);
                    console.log('%c📊 Meilleurs splits personnels chargés depuis localStorage', 'color: #00FF00; font-weight: bold');
                }
                const savedBestTime = localStorage.getItem('soloPersonalBestTime');
                if (savedBestTime) {
                    soloPersonalBestTime = parseFloat(savedBestTime);
                    console.log(`%c🏆 Meilleur temps personnel: ${soloPersonalBestTime.toFixed(2)}s`, 'color: #00FF00; font-weight: bold');
                }
            } catch (e) {
                console.error('Erreur lors du chargement des splits personnels:', e);
                soloPersonalBestSplits = {};
            }
            
            // Le countdown sera géré par le serveur via soloGameState.countdown
            // Le client affichera le countdown basé sur soloGameState.countdown.active
            console.log('%c🎬 Mode Solo lancé! Countdown géré par le serveur', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
        }
        
        // Émettre l'événement au serveur
        if (socket) {
            if (mode === 'custom' && customModeConfig) {
                // Envoyer la configuration du mode personnalisé
                socket.emit('selectGameMode', { mode: 'custom', customConfig: customModeConfig });
            } else {
                socket.emit('selectGameMode', { mode });
            }
            
            // En mode solo, demander les meilleurs splits pour afficher les deltas
            if (mode === 'solo') {
                socket.emit('getSoloBestSplits');
                socket.emit('getSoloLeaderboard');
                console.log('%c📊 Demande des meilleurs splits et leaderboard', 'color: #00FF00; font-weight: bold');
            }
        }
    }
}

/**
 * Récupère le mode sélectionné
 * @returns {string} - Le mode actuel
 */
function getSelectedMode() {
    return selectedMode;
}



/**
 * Vérifie si le jeu atteint la fin (pour le mode classic)
 * @param {number} level - Niveau actuel
 * @returns {boolean} - True si c'est le dernier niveau
 */
function isGameFinished(level) {
    const mode = selectedMode ? selectedMode.replace('Auction', '') : null;
    
    if (mode === 'custom' && customModeConfig) {
        return level > customModeConfig.maxLevels;
    } else if (mode === 'classic') {
        return level > 40;
    } else if (mode === 'infinite') {
        return false; // Jamais fini en mode infini
    } else if (mode === 'solo') {
        return level > 20; // 20 niveaux en solo
    }
}

/**
 * Obtient les features disponibles pour l'achat selon le mode
 * @returns {object} - Les items disponibles au shop
 */
function getShopItemsForMode() {
    const mode = selectedMode ? selectedMode.replace('Auction', '') : null;
    
    if (mode === 'infinite') {
        // Mode infini: seulement la vitesse est à l'achat
        return {
            speedBoost: {
                id: 'speedBoost',
                name: 'Vitesse+ 💨',
                price: 2,
                description: 'Boost de vitesse'
            }
        };
    } else if (mode === 'solo') {
        // Mode solo: tous les items disponibles à l'achat
        return {
            dash: {
                id: 'dash',
                name: 'Dash ⚡',
                price: 5,
                description: 'Dash rapide en direction'
            },
            checkpoint: {
                id: 'checkpoint',
                name: 'Checkpoint 🚩',
                price: 3,
                description: 'Marquer et téléporter'
            },
            compass: {
                id: 'compass',
                name: 'Boussole 🧭',
                price: 4,
                description: 'Indique la gemme la plus proche'
            },
            rope: {
                id: 'rope',
                name: 'Corde 🪢',
                price: 1,
                description: 'Se déplacer plus vite'
            },
            speedBoost: {
                id: 'speedBoost',
                name: 'Vitesse+ 💨',
                price: 2,
                description: 'Boost de vitesse'
            }
        };
    } else {
        // Mode classic: tous les items normaux
        return {
            dash: {
                id: 'dash',
                name: 'Dash ⚡',
                price: 5,
                description: 'Dash rapide en direction'
            },
            checkpoint: {
                id: 'checkpoint',
                name: 'Checkpoint 🚩',
                price: 3,
                description: 'Marquer et téléporter'
            },
            compass: {
                id: 'compass',
                name: 'Boussole 🧭',
                price: 4,
                description: 'Indique la gemme la plus proche'
            },
            rope: {
                id: 'rope',
                name: 'Corde 🪢',
                price: 1,
                description: 'Se déplacer plus vite'
            },
            speedBoost: {
                id: 'speedBoost',
                name: 'Vitesse+ 💨',
                price: 2,
                description: 'Boost de vitesse'
            }
        };
    }
}

/**
 * Initialise les features achetées pour un joueur selon le mode
 * @returns {object} - Les features initialisées
 */
function getInitialPurchasedFeaturesForMode() {
    const mode = selectedMode ? selectedMode.replace('Auction', '') : null;
    
    if (mode === 'infinite') {
        // Mode infini: tous les objets sont déverrouillés sauf speedBoost
        return {
            dash: true,
            checkpoint: true,
            compass: false,
            rope: true,
            speedBoost: 0
        };
    } else if (mode === 'solo') {
        // Mode solo: rien de déverrouillé au départ (comme en classic)
        return {
            dash: false,
            checkpoint: false,
            compass: false,
            rope: false,
            speedBoost: 0
        };
    } else {
        // Mode classic: rien de déverrouillé au départ
        return {
            dash: false,
            checkpoint: false,
            compass: false,
            rope: false,
            speedBoost: 0
        };
    }
}


