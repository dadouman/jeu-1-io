// config/gameModes.js - Configuration centralisée pour tous les modes de jeu

/**
 * Fonction générique pour calculer une valeur linéaire progressive avec décroissance optionnelle
 * @param {number} level - Le niveau actuel
 * @param {number} baseValue - Valeur de départ (niveau 1)
 * @param {number} linearIncrement - Augmentation par niveau (positif ou négatif)
 * @param {number} peakLevel - Niveau à partir duquel la valeur décroît (optionnel)
 * @param {number} decayIncrement - Taux de décroissance (défaut: même que linearIncrement)
 * @returns {number} La valeur calculée
 * 
 * @example
 * // Croissance simple: 10 + (level - 1) * 5
 * calculateLinearProgression(3, 10, 5) // = 20
 * 
 * // Avec décroissance après le niveau 5 au même taux:
 * calculateLinearProgression(7, 10, 5, 5) // level 5 = 30, level 7 = 20 (décroit)
 * 
 * // Avec décroissance plus lente:
 * calculateLinearProgression(7, 10, 5, 5, 2) // level 5 = 30, level 7 = 26
 */
function calculateLinearProgression(level, baseValue, linearIncrement, peakLevel = null, decayIncrement = null) {
    // Si pas de décroissance définie, utiliser le même taux pour la décroissance
    if (decayIncrement === null) {
        decayIncrement = linearIncrement;
    }
    
    // Si pas de pic défini, croissance simple
    if (peakLevel === null) {
        const value = baseValue + (level - 1) * linearIncrement;
        return Math.max(baseValue, Math.round(value));
    }
    
    // Avec pic: croissance jusqu'au pic, puis décroissance
    if (level <= peakLevel) {
        // Phase de croissance jusqu'au pic
        const value = baseValue + (level - 1) * linearIncrement;
        return Math.max(baseValue, Math.round(value));
    } else {
        // Phase de décroissance après le pic
        const peakValue = baseValue + (peakLevel - 1) * linearIncrement;
        const distancePastPeak = level - peakLevel;
        const value = peakValue - (distancePastPeak * decayIncrement);
        return Math.max(baseValue, Math.round(value));
    }
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
 * Génère un tableau de tailles de maze selon une progression linéaire
 * @param {number} startSize - Taille de départ (niveau 1)
 * @param {number} increment - Augmentation par niveau
 * @param {number} numLevels - Nombre de niveaux à générer
 * @param {number} [highlevel] - Niveau de pic pour décroissance (optionnel)
 * @param {number} [decroissanceTaux] - Taux de décroissance (optionnel)
 * @returns {Array<number>} Tableau de tailles
 *
 * 
 * @example
 * // Génère 10 niveaux: 15, 17, 19, 21, 23, 25, 27, 29, 31, 33
 * generateSizesArray(15, 2, 10)
 * 
 * // Génère 7 niveaux: 21, 23, 25, 27, 29, 31, 33
 * generateSizesArray(21, 2, 7)
 */
function generateSizesArray(startSize, increment, numLevels, highlevel, decroissanceTaux) {
    const sizes = [];
    for (let i = 1; i <= numLevels; i++) {
        // Utilise calculateLinearProgression pour la cohérence
        sizes.push(calculateLinearProgression(i, startSize, increment, highlevel, decroissanceTaux));
    }
    console.log(`🎮 Classic mode sizes (${numLevels} levels):`, sizes);
    return sizes;
}

/**
 * Génère les niveaux de shop (ex: [5, 10] ou [3, 6, 9, 12, 15]) pour éviter les tableaux hardcodés.
 * @param {number} interval - Intervalle entre 2 shops (ex: 5 => tous les 5 niveaux)
 * @param {number} maxLevel - Niveau max inclus
 * @returns {number[]}
 */
function generateShopLevelsByMax(interval, maxLevel) {
    if (!Number.isFinite(interval) || interval <= 0) return [];
    if (!Number.isFinite(maxLevel) || maxLevel <= 0) return [];

    const levels = [];
    for (let level = interval; level <= maxLevel; level += interval) {
        levels.push(level);
    }
    return levels;
}

/**
 * Génère une liste de niveaux de shop basée sur un nombre d'occurrences.
 * @param {number} interval - Intervalle entre 2 shops
 * @param {number} count - Nombre de niveaux à générer
 * @returns {number[]}
 */
function generateShopLevelsByCount(interval, count) {
    if (!Number.isFinite(interval) || interval <= 0) return [];
    if (!Number.isFinite(count) || count <= 0) return [];

    const levels = [];
    for (let i = 1; i <= count; i++) {
        levels.push(interval * i);
    }
    return levels;
}

/**
 * Configuration flexible pour chaque mode de jeu
 * Permet de varier: niveaux, shops, prix, joueurs max, objets, etc
 */

const GAME_MODES_CONFIG = {
    // ⚠️ Pour activer la boutique dégressive (enchères) en multi, il faut mettre type: 'dutchAuction' dans la config shop du mode custom !
    // Exemple d'utilisation côté custom :
    // custom: {
    //   ...
    //   shop: {
    //     enabled: true,
    //     levels: [5, 10, 15],
    //     duration: 20000,
    //     type: 'dutchAuction', // ← active la boutique dégressive
    //     auction: { gridSize: 3, tickMs: 2000, decrement: 1, startPriceMultiplier: 2, minPriceMultiplier: 0.5 }
    //   },
    //   ...
    // }

    classic: {
        name: 'Couloirs',
        description: 'Mode classique - Longs couloirs',
        maxPlayers: 8,
        maxLevels: 10,  // 10 niveaux
        endType: 'multi',
        levelConfig: {
            // Départ taille 15, augmentation de 2 par niveau jusqu'au niveau 5, puis diminution
            // Génère: 15, 17, 19, 21, 23, 21, 19, 17, 15, 13
            sizes: generateSizesArray(15, 2, 10, 5, 2)
        },
        
        mazeGeneration: {
            algorithm: 'backtracker',
            density: 1.0
        },
        
        shop: {
            enabled: true,
            // Niveaux où le shop apparaît
            levels: generateShopLevelsByMax(5, 10),
            duration: 15000,  // 15 secondes
            // Type de boutique: 'classic' (boutique actuelle) | 'dutchAuction' (enchères dégressives)
            type: 'classic'
        },

        // Objets achetables avec leurs propriétés
        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 5,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 3,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 1,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 2,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true  // Peut être acheté plusieurs fois
            }
        ],

        // Gems gagnées selon le niveau
        // Formule: baseValue + (level - 1) * increment
        // Croît jusqu'à l'infini (pas de peakLevel)
        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            peakLevel: null,  // Pas de décroissance
            calculateGems: (level) => calculateLinearProgression(level, 10, 5, null)
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
        shopIntroDuration: 3000,  // Durée de l'introduction de la boutique
        transitionDuration: 5000,  // Entre les niveaux
        
        // Système de vote (restart)
        voting: {
            enabled: true,
            voteDuration: 10000
        }
    },

    classicPrim: {
        name: 'Organique',
        description: 'Mode classique - Labyrinthes organiques',
        maxPlayers: 8,
        maxLevels: 10,  // 10 niveaux
        endType: 'multi',
        levelConfig: {
            sizes: generateSizesArray(15, 2, 10, 5, 2)
        },
        
        mazeGeneration: {
            algorithm: 'prim',
            density: 0.5
        },
        
        shop: {
            enabled: true,
            levels: generateShopLevelsByMax(5, 10),
            duration: 15000,
            type: 'classic'
        },

        shopItems: [
            { id: 'dash', name: 'Dash', price: 5, description: 'Accélération rapide', type: 'feature' },
            { id: 'checkpoint', name: 'Checkpoint', price: 3, description: 'Sauvegarde ta position', type: 'feature' },
            { id: 'rope', name: 'Rope', price: 1, description: 'Trace une corde derrière toi', type: 'feature' },
            { id: 'speedBoost', name: 'Vitesse +1', price: 2, description: 'Augmente ta vitesse', type: 'speedBoost', stackable: true }
        ],

        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            peakLevel: null,
            calculateGems: (level) => calculateLinearProgression(level, 10, 5, null)
        },

        startingFeatures: { dash: false, checkpoint: false, rope: false, speedBoost: 0 },
        movement: { baseSpeed: 3, speedBoostIncrement: 1, wallCollisionDistance: 30 },
        transitionDuration: 5000,
        voting: { enabled: true, voteDuration: 10000 }
    },

    infinite: {
        name: 'Infinite',
        description: 'Mode infini - niveaux générés aléatoirement',
        maxPlayers: 4,
        maxLevels: Infinity,
        endType: 'multi',
        levelConfig: {
            // Génère: 21, 23, 25, 27, 29, 31, 33 (7 tailles)
            sizes: generateSizesArray(21, 2, 7)
        },

        shop: {
            enabled: true,
            levels: generateShopLevelsByCount(3, 5),  // Shop plus fréquent
            duration: 15000,
            type: 'classic'
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 5,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 3,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 1,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 2,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            }
        ],

        gemsPerLevel: {
            baseValue: 15,
            linearIncrement: 3,
            peakLevel: null,  // Pas de décroissance
            calculateGems: (level) => calculateLinearProgression(level, 15, 3, null)
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
        description: 'Dan est le plus fort',
        maxPlayers: 1,
        maxLevels: 10,  // ← FACILE À CHANGER À 20, 30, etc
        endType: 'solo',
        levelConfig: {
            // Croisance 15->23 (niveaux 1-5), puis décroissance 21->13 (niveaux 6-10)
            sizes: generateSizesArray(15, 2, 10, 5, 2)
        },

        shop: {
            enabled: true,
            levels: generateShopLevelsByMax(5, 10),  // Shop aux niveaux 5 et 10
            duration: 15000,
            type: 'classic'
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 5,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 3,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 1,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 2,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            }
        ],

        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 0,  // Pas d'augmentation
            peakLevel: null,
            calculateGems: (level) => 10  // Toujours 10 gems
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
        endType: 'solo',
        levelConfig: {
            // Génère: 15, 17, 19, 21, 23, 25, 27, 29, 31, 33 (10 tailles)
            sizes: generateSizesArray(15, 2, 10)
        },

        shop: {
            enabled: true,
            levels: generateShopLevelsByMax(5, 20),
            duration: 15000,
            type: 'classic'
        },

        shopItems: [
            {
                id: 'dash',
                name: 'Dash',
                price: 5,
                description: 'Accélération rapide',
                type: 'feature'
            },
            {
                id: 'checkpoint',
                name: 'Checkpoint',
                price: 3,
                description: 'Sauvegarde ta position',
                type: 'feature'
            },
            {
                id: 'rope',
                name: 'Rope',
                price: 1,
                description: 'Trace une corde derrière toi',
                type: 'feature'
            },
            {
                id: 'speedBoost',
                name: 'Vitesse +1',
                price: 2,
                description: 'Augmente ta vitesse',
                type: 'speedBoost',
                stackable: true
            },
            {
                id: 'doubleJump',
                name: 'Double Jump',
                price: 3,
                description: 'Saute deux fois',
                type: 'feature'
            }
        ],

        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 0,  // Pas d'augmentation
            peakLevel: null,
            calculateGems: (level) => 10  // Toujours 10 gems
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

// --- AJOUT DES MODES ENCHÈRES ---
const auctionModes = {};
for (const [key, config] of Object.entries(GAME_MODES_CONFIG)) {
    if (key !== 'custom') {
        const auctionConfig = JSON.parse(JSON.stringify(config));
        auctionConfig.name += ' (Enchères)';
        auctionConfig.shop.type = 'dutchAuction';
        auctionConfig.shop.auction = { 
            gridSize: 3, 
            tickMs: 2000, 
            decrement: 1, 
            startPriceMultiplier: 2, 
            minPriceMultiplier: 0.5 
        };
        auctionModes[key + 'Auction'] = auctionConfig;
    }
}
Object.assign(GAME_MODES_CONFIG, auctionModes);

module.exports = {
    GAME_MODES_CONFIG,
    getGameModeConfig,
    getAllGameModes,
    getGameModeConfigCopy,
    calculateLinearProgression,
    calculateMazeSize,
    generateSizesArray,
    generateShopLevelsByMax,
    generateShopLevelsByCount
};
