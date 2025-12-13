// config/gameModes.js - Configuration centralisée pour tous les modes de jeu

/**
 * Fonction générique pour calculer une valeur linéaire progressive
 * @param {number} level - Le niveau actuel
 * @param {number} baseValue - Valeur de départ (niveau 1)
 * @param {number} linearIncrement - Augmentation par niveau
 * @returns {number} La valeur calculée
 */
function calculateLinearProgression(level, baseValue, linearIncrement) {
    return Math.max(baseValue, baseValue + (level - 1) * linearIncrement);
}

/**
 * Fonction générique pour calculer la taille du maze
 * @param {number} level - Le niveau actuel
 * @param {Array<number>} sizeArray - Tableau de tailles disponibles
 * @returns {Object} { width, height }
 */
function calculateMazeSize(level, sizeArray) {
    const size = sizeArray[Math.min(level - 1, sizeArray.length - 1)];
    return {
        width: size,
        height: size
    };
}

/**
 * Configuration flexible pour chaque mode de jeu
 * Permet de varier: niveaux, shops, prix, joueurs max, objets, etc
 */

const GAME_MODES_CONFIG = {
    classic: {
        name: 'Classic',
        description: 'Mode classique multijoueur',
        maxPlayers: 8,
        maxLevels: Infinity,  // Pas de limite
        levelConfig: {
            // Tableau de tailles pour chaque niveau
            sizes: [15, 17, 19, 21, 23, 25, 27, 29, 31, 33],
            // Fonction pour calculer la taille du maze selon le niveau
            calculateSize: (level) => {
                const sizes = [15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
                return calculateMazeSize(level, sizes);
            }
        },
        
        shop: {
            enabled: true,
            // Niveaux où le shop apparaît (après nivel 5, 10, 15, etc)
            levels: [5, 10, 15, 20, 25, 30],
            duration: 15000,  // 15 secondes
        },

        // Objets achetables avec leurs propriétés
        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 20,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 30,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 25,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 15,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true  // Peut être acheté plusieurs fois
            }
        ],

        // Gems gagnées selon le niveau
        // Formule: baseValue + (level - 1) * increment
        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            calculateGems: (level) => calculateLinearProgression(level, 10, 5)
        },

        // Features débloquées au départ
        startingFeatures: {
            dash: false,
            checkpoint: false,
            rope: false,
            speedBoost: 0  // Niveau de boost
        },

        // Collision et mouvement
        movement: {
            baseSpeed: 3,
            speedBoostIncrement: 1,  // +1 par niveau d'achat
            wallCollisionDistance: 30
        },

        // Timing
        transitionDuration: 5000,  // Entre les niveaux
        
        // Système de vote (restart)
        voting: {
            enabled: true,
            voteDuration: 10000
        }
    },

    infinite: {
        name: 'Infinite',
        description: 'Mode infini - niveaux générés aléatoirement',
        maxPlayers: 4,
        maxLevels: Infinity,
        levelConfig: {
            sizes: [21, 23, 25, 27, 29, 31, 33],
            calculateSize: (level) => {
                const sizes = [21, 23, 25, 27, 29, 31, 33];
                return calculateMazeSize(level, sizes);
            }
        },

        shop: {
            enabled: true,
            levels: [3, 6, 9, 12, 15],  // Shop plus fréquent
            duration: 15000,
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 20,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 30,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 25,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 15,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            }
        ],

        gemsPerLevel: {
            baseValue: 15,
            linearIncrement: 3,
            calculateGems: (level) => calculateLinearProgression(level, 15, 3)
        },

        startingFeatures: {
            dash: true,        // Débloqué au départ
            checkpoint: true,  // Débloqué au départ
            rope: true,        // Débloqué au départ
            speedBoost: 0
        },

        movement: {
            baseSpeed: 3,
            speedBoostIncrement: 1,
            wallCollisionDistance: 30
        },

        transitionDuration: 5000,
        
        voting: {
            enabled: true,
            voteDuration: 10000
        }
    },

    solo: {
        name: 'Solo',
        description: 'Mode solo - speedrun personnel',
        maxPlayers: 1,
        maxLevels: 10,  // ← FACILE À CHANGER À 20, 30, etc
        levelConfig: {
            sizes: [15, 17, 19, 21, 23, 25, 27, 29, 31, 33],
            calculateSize: (level) => {
                const sizes = [15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
                return calculateMazeSize(level, sizes);
            }
        },

        shop: {
            enabled: true,
            levels: [5, 10],  // Shop aux niveaux 5 et 10
            duration: 15000,
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 20,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 30,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 25,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 15,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            }
        ],

        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            calculateGems: (level) => calculateLinearProgression(level, 10, 5)
        },

        startingFeatures: {
            dash: true,
            checkpoint: true,
            rope: true,
            speedBoost: 0
        },

        movement: {
            baseSpeed: 3,
            speedBoostIncrement: 1,
            wallCollisionDistance: 30
        },

        transitionDuration: 0,  // Pas de transition en solo
        
        voting: {
            enabled: false  // Pas de vote en solo
        },

        // Système de speedrun spécifique au solo
        speedrun: {
            enabled: true,
            trackSplitTimes: true,  // Tracker les temps par niveau
            trackPersonalBest: true,
            trackWorldRecord: true,
            leaderboard: true
        }
    },

    // Exemple: mode 20 niveaux
    solo20: {
        name: 'Solo 20',
        description: 'Mode solo - 20 niveaux speedrun',
        maxPlayers: 1,
        maxLevels: 20,  // ← À la place de changer partout dans le code
        levelConfig: {
            sizes: [15, 17, 19, 21, 23, 25, 27, 29, 31, 33],
            calculateSize: (level) => {
                const sizes = [15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
                return calculateMazeSize(level, sizes);
            }
        },

        shop: {
            enabled: true,
            levels: [5, 10, 15, 20],
            duration: 15000,
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 20,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 30,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 25,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 15,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            },
            {
                id: 'doubleJump',
                name: 'Double Jump',
                price: 50,
                description: 'Saute deux fois',
                type: 'feature'
            }
        ],

        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            calculateGems: (level) => calculateLinearProgression(level, 10, 5)
        },

        startingFeatures: {
            dash: true,
            checkpoint: true,
            rope: true,
            speedBoost: 0,
            doubleJump: false
        },

        movement: {
            baseSpeed: 3,
            speedBoostIncrement: 1,
            wallCollisionDistance: 30
        },

        transitionDuration: 0,
        
        voting: {
            enabled: false
        },

        speedrun: {
            enabled: true,
            trackSplitTimes: true,
            trackPersonalBest: true,
            trackWorldRecord: true,
            leaderboard: true
        }
    }
};

/**
 * Récupère la configuration d'un mode
 * @param {string} mode - Le nom du mode ('classic', 'infinite', 'solo', etc)
 * @returns {object} La configuration du mode
 */
function getGameModeConfig(mode) {
    if (!GAME_MODES_CONFIG[mode]) {
        throw new Error(`Mode "${mode}" non configuré. Modes disponibles: ${Object.keys(GAME_MODES_CONFIG).join(', ')}`);
    }
    return GAME_MODES_CONFIG[mode];
}

/**
 * Récupère tous les modes disponibles
 * @returns {object} Tous les modes configurés
 */
function getAllGameModes() {
    return GAME_MODES_CONFIG;
}

/**
 * Crée une copie profonde de la config pour éviter les mutations
 * @param {string} mode
 * @returns {object} Copie de la configuration
 */
function getGameModeConfigCopy(mode) {
    const config = getGameModeConfig(mode);
    return JSON.parse(JSON.stringify(config));
}

module.exports = {
    GAME_MODES_CONFIG,
    getGameModeConfig,
    getAllGameModes,
    getGameModeConfigCopy,
    calculateLinearProgression,
    calculateMazeSize
};
