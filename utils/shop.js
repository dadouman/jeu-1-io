// utils/shop.js - Gestion du système de magasin

const SHOP_ITEMS = {
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

const SHOP_LEVEL = 5; // Le magasin s'ouvre tous les 5 niveaux

/**
 * Vérifie si c'est un niveau de magasin
 * @param {number} level - Le niveau actuel
 * @returns {boolean} - True si c'est un niveau de magasin
 */
function isShopLevel(level) {
    return level > 1 && level % SHOP_LEVEL === 0;
}

/**
 * Retourne la liste des items du shop
 * @returns {object} - Les items disponibles au shop
 */
function getShopItems() {
    return SHOP_ITEMS;
}

/**
 * Retourne le prix d'un item
 * @param {string} itemId - L'ID de l'item
 * @returns {number|null} - Le prix ou null si l'item n'existe pas
 */
function getItemPrice(itemId) {
    return SHOP_ITEMS[itemId]?.price || null;
}

/**
 * Vérifie si un joueur peut acheter un item
 * @param {number} playerGems - Les gems du joueur
 * @param {string} itemId - L'ID de l'item
 * @returns {boolean} - True si le joueur peut acheter
 */
function canAfford(playerGems, itemId) {
    const price = getItemPrice(itemId);
    return price !== null && playerGems >= price;
}

/**
 * Effectue l'achat d'un item
 * @param {object} player - L'objet joueur
 * @param {string} itemId - L'ID de l'item à acheter
 * @param {object} customShopItems - (Optionnel) Dictionnaire d'items personnalisés avec les prix
 * @returns {object} - { success: boolean, message: string, gemsLeft: number }
 */
function purchaseItem(player, itemId, customShopItems = null) {
    // Utiliser les items personnalisés si fournis, sinon utiliser les défauts
    const itemsToUse = customShopItems || SHOP_ITEMS;
    const item = itemsToUse[itemId];
    
    if (!item) {
        return { success: false, message: 'Item non trouvé' };
    }
    
    // Vérifier si l'item a déjà été acheté (sauf speedBoost qui peut être acheté plusieurs fois)
    if (itemId !== 'speedBoost' && player.purchasedFeatures[itemId] === true) {
        return {
            success: false,
            message: `${item.name} a déjà été acheté cette partie!`
        };
    }
    
    if (player.gems < item.price) {
        return {
            success: false,
            message: `Pas assez de gems. Vous en avez ${player.gems}/${item.price}`,
            gemsRequired: item.price,
            gemsAvailable: player.gems
        };
    }
    
    // Effectuer l'achat
    player.gems -= item.price;
    if(itemId === 'speedBoost') {
        player.purchasedFeatures.speedBoost = (player.purchasedFeatures.speedBoost || 0) + 1;
    } else {
        player.purchasedFeatures[itemId] = true;
    }    
    
    return {
        success: true,
        message: `Achat réussi : ${item.name}`,
        gemsLeft: player.gems,
        item
    };
}

/**
 * Retourne l'état du shop pour un niveau donné
 * @param {number} level - Le niveau actuel
 * @returns {object} - L'état du shop
 */
function getShopState(level) {
    return {
        isOpen: isShopLevel(level),
        items: SHOP_ITEMS,
        level: level
    };
}

module.exports = {
    SHOP_ITEMS,
    SHOP_LEVEL,
    isShopLevel,
    getShopItems,
    getItemPrice,
    canAfford,
    purchaseItem,
    getShopState
};
