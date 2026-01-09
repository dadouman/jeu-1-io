// mode-selector.js - Gestion de la sélection du mode de jeu

var selectedMode = null; // var pour accès global

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
        console.log('⏳ Sélection bloquée: les lobbies se redémarrent...');
        return;
    }
    
    if (mode === 'classic' || mode === 'classicPrim' || mode === 'infinite' || mode === 'solo' || mode === 'custom') {
        // Vérifier que le mode personnalisé existe
        if (mode === 'custom' && !customModeConfig) {
            alert('❌ Aucun mode personnalisé configuré. Appuyez sur @ pour configurer.');
            return;
        }
        
        selectedMode = mode;
        currentGameEndType = mode === 'solo' ? 'solo' : 'multi';
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
 * Calcule la taille du labyrinthe selon le mode et le niveau
 * @param {number} level - Niveau actuel
 * @param {number} maxLevels - Nombre max de niveaux (40 pour classic, infini pour infinite)
 * @returns {object} - { width, height }
 */
function calculateMazeSize(level, maxLevels = 40) {
    const mode = selectedMode;
    
    // Taille de base
    const baseSize = 15;
    const sizeIncrement = 2;
    
    if (mode === 'custom' && customModeConfig && customModeConfig.levelConfig && customModeConfig.levelConfig.sizes) {
        // Mode personnalisé: utiliser les tailles définies
        const size = customModeConfig.levelConfig.sizes[Math.min(level - 1, customModeConfig.levelConfig.sizes.length - 1)];
        return { width: size, height: size };
    } else if (mode === 'classic') {
        // 40 niveaux: 20 montée, 20 descente
        if (level <= 20) {
            // Phase montante: 15x15 -> 55x55
            const size = baseSize + (level - 1) * sizeIncrement;
            return { width: size, height: size };
        } else {
            // Phase descendante: 55x55 -> 15x15
            const descendLevel = level - 20;
            const size = baseSize + (20 - descendLevel) * sizeIncrement;
            return { width: size, height: size };
        }
    } else if (mode === 'infinite') {
        // Mode infini: continue à grandir
        const size = baseSize + (level - 1) * sizeIncrement;
        return { width: size, height: size };
    } else if (mode === 'solo') {
        // Mode solo: 10 niveaux (5 expansion, 5 contraction)
        const maxLvl = 10;
        const expandLvl = 5;
        
        if (level <= expandLvl) {
            // Phase d'expansion
            const size = baseSize + (level - 1) * sizeIncrement;
            return { width: size, height: size };
        } else {
            // Phase de contraction
            const contractLevel = level - expandLvl;
            const size = baseSize + (expandLvl - contractLevel) * sizeIncrement;
            return { width: size, height: size };
        }
    }
}

/**
 * Calcule le zoom de la caméra selon le mode et le niveau
 * @param {number} level - Niveau actuel
 * @returns {number} - Facteur de zoom (1.0 = normal)
 */
function calculateZoomForMode(level) {
    const mode = selectedMode;
    
    if (mode === 'custom' && customModeConfig) {
        // Mode personnalisé: zoom progressif modéré
        const maxLevels = customModeConfig.maxLevels;
        const maxZoom = 0.7;
        return Math.max(maxZoom, Math.min(1.0, 1.0 - (level - 1) * (0.3 / maxLevels)));
    } else if (mode === 'classic') {
        // 40 niveaux avec zoom adapté
        if (level <= 20) {
            // Phase montante: zoom inversé progressive (0.9 -> 0.6)
            return Math.max(0.6, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        } else {
            // Phase descendante: zoom qui revient progressivement (0.6 -> 0.9)
            const descendLevel = level - 20;
            const zoomAtMax = 0.6; // Zoom minimal atteint au niveau 20
            const normalZoom = Math.max(0.6, Math.min(1.0, 1.0 - (descendLevel - 1) * 0.02));
            // Inverser la progression pour que ça revienne
            return Math.max(0.6, Math.min(1.0, 1.0 - (20 - descendLevel) * 0.02));
        }
    } else if (mode === 'infinite') {
        // Mode infini: zoom progressif normal
        return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
    } else if (mode === 'solo') {
        // Mode solo: 10 niveaux (5 expansion, 5 contraction)
        const maxLvl = 10;
        const expandLvl = 5;
        const zoomStep = 0.04; // Zoom modéré
        
        if (level <= expandLvl) {
            // Expansion: zoom qui diminue
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * zoomStep));
        } else {
            // Contraction: zoom qui augmente
            const contractLevel = level - expandLvl;
            return Math.max(0.7, Math.min(1.0, 1.0 - (expandLvl - contractLevel) * zoomStep));
        }
    }
}

/**
 * Vérifie si le jeu atteint la fin (pour le mode classic)
 * @param {number} level - Niveau actuel
 * @returns {boolean} - True si c'est le dernier niveau
 */
function isGameFinished(level) {
    const mode = selectedMode;
    
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
    const mode = selectedMode;
    
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
    const mode = selectedMode;
    
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
