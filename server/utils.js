// server/utils.js - Fonctions utilitaires du serveur

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { isShopLevel, getShopItems } = require('../utils/shop');
const { initializePlayer } = require('../utils/player');
const { getGameModeConfig, calculateMazeSize: configCalculateMazeSize } = require('../config/gameModes');

// --- FONCTION POUR CALCULER LA TAILLE DU LABYRINTHE SELON LE MODE ---
function calculateMazeSize(level, mode = 'classic', lobbyConfig = null) {
    // Si une configuration de lobby est fournie (cas du mode custom), l'utiliser
    if (lobbyConfig && lobbyConfig.customConfig && lobbyConfig.customConfig.levelConfig && lobbyConfig.customConfig.levelConfig.sizes) {
        const sizeArray = lobbyConfig.customConfig.levelConfig.sizes;
        let size = sizeArray[Math.min(level - 1, sizeArray.length - 1)];
        
        // Sécurité: vérifier que la taille est valide
        if (size < 5 || size > 200 || size < 0) {
            console.warn(`⚠️ Taille invalide détectée pour le mode custom au niveau ${level}: ${size}x${size}. Utilisation de fallback.`);
            size = Math.max(5, Math.min(200, size || 15));
        }
        
        return { width: size, height: size };
    }
    
    try {
        // Utiliser la configuration depuis gameModes.js
        const config = getGameModeConfig(mode);
        if (config && config.levelConfig && config.levelConfig.sizes) {
            const sizeArray = config.levelConfig.sizes;
            let size = sizeArray[Math.min(level - 1, sizeArray.length - 1)];
            
            // Sécurité: vérifier que la taille est valide
            if (size < 5 || size > 200 || size < 0) {
                console.warn(`⚠️ Taille invalide détectée pour le mode ${mode} au niveau ${level}: ${size}x${size}. Utilisation de fallback.`);
                size = Math.max(5, Math.min(200, size || 15));
            }
            
            return { width: size, height: size };
        }
    } catch (e) {
        console.warn(`⚠️ Erreur lors du calcul de taille pour le mode ${mode}:`, e.message);
    }
    
    // Fallback si quelque chose ne marche pas
    const baseSize = 15;
    const sizeIncrement = 2;
    let size;
    
    if (mode === 'classic' || mode === 'custom') {
        // Fallback: expansion jusqu'au niveau 20, puis contraction
        if (level <= 20) {
            size = baseSize + (level - 1) * sizeIncrement;
        } else {
            const descendLevel = level - 20;
            size = baseSize + (20 - descendLevel) * sizeIncrement;
        }
    } else if (mode === 'infinite') {
        // Mode infini: continue à grandir
        size = baseSize + (level - 1) * sizeIncrement;
    } else if (mode === 'solo') {
        // Mode solo: 10 niveaux (5 expansion, 5 contraction)
        if (level <= 5) {
            // Niveaux 1-5: Expansion (15x15 -> 25x25)
            size = baseSize + (level - 1) * sizeIncrement;
        } else {
            // Niveaux 6-10: Contraction (25x25 -> 15x15)
            const contractLevel = level - 5;
            size = baseSize + (5 - contractLevel) * sizeIncrement;
        }
    }
    
    // Sécurité finale: clamper la taille entre 5 et 200
    size = Math.max(5, Math.min(200, size));
    return { width: size, height: size };
}

// --- FONCTION POUR OBTENIR LES ITEMS DU SHOP SELON LE MODE ---
function getShopItemsForMode(mode = 'classic', lobbyConfig = null) {
    const allItems = getShopItems();
    
    // Si c'est un mode custom avec sa propre configuration de shop items
    if (mode === 'custom' && lobbyConfig && lobbyConfig.customConfig) {
        const customList = lobbyConfig.customConfig.shopItems;
        // Retourner les items définis dans la configuration personnalisée si valides,
        // sinon fallback sur les items par défaut.
        if (Array.isArray(customList) && customList.length > 0) {
            const customItems = {};
            for (const item of customList) {
                if (!item || !item.id) continue;
                customItems[item.id] = item;
            }
            if (Object.keys(customItems).length > 0) {
                return customItems;
            }
        }
        return allItems;
    }
    
    if (mode === 'infinite') {
        // En mode infini, seulement le speedBoost est à acheter
        return {
            speedBoost: allItems.speedBoost
        };
    }
    
    // Mode classique et solo: tous les items disponibles
    return allItems;
}

// --- FONCTION DE LOBBY ---
function getLobby(mode, lobbies) {
    return lobbies[mode];
}

function getPlayerLobby(playerId, lobbies, playerModes) {
    const mode = playerModes[playerId];
    return mode ? lobbies[mode] : null;
}

function emitToLobby(mode, eventName, data, io, lobbies) {
    const lobby = lobbies[mode];
    if (!lobby) return;
    
    Object.keys(lobby.players).forEach(playerId => {
        const socket = io.sockets.sockets.get(playerId);
        if (socket && socket.connected) {
            socket.emit(eventName, data);
        }
    });
}

module.exports = {
    calculateMazeSize,
    getShopItemsForMode,
    getLobby,
    getPlayerLobby,
    emitToLobby
};
