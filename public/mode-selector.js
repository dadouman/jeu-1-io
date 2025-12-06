// mode-selector.js - Gestion de la sélection du mode de jeu

let selectedMode = null;

/**
 * Sélectionne un mode de jeu
 * @param {string} mode - 'classic' ou 'infinite'
 */
function selectMode(mode) {
    if (mode === 'classic' || mode === 'infinite') {
        selectedMode = mode;
        console.log(`%c🎮 Mode sélectionné: ${mode === 'classic' ? '40 Niveaux' : 'Mode Infini'}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        
        // Masquer l'écran de sélection
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.style.display = 'none';
        }
        
        // Émettre l'événement au serveur
        if (socket) {
            socket.emit('selectGameMode', { mode });
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
    
    if (mode === 'classic') {
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
    }
}

/**
 * Calcule le zoom de la caméra selon le mode et le niveau
 * @param {number} level - Niveau actuel
 * @returns {number} - Facteur de zoom (1.0 = normal)
 */
function calculateZoomForMode(level) {
    const mode = selectedMode;
    
    if (mode === 'classic') {
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
    }
}

/**
 * Vérifie si le jeu atteint la fin (pour le mode classic)
 * @param {number} level - Niveau actuel
 * @returns {boolean} - True si c'est le dernier niveau
 */
function isGameFinished(level) {
    const mode = selectedMode;
    
    if (mode === 'classic') {
        return level > 40;
    } else if (mode === 'infinite') {
        return false; // Jamais fini en mode infini
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
            rope: true,
            speedBoost: 0
        };
    } else {
        // Mode classic: rien de déverrouillé au départ
        return {
            dash: false,
            checkpoint: false,
            rope: false,
            speedBoost: 0
        };
    }
}
