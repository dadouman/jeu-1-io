// server-utils.js - Fonctions utilitaires du serveur

const { generateMaze, getRandomEmptyPosition } = require('./utils/map');
const { isShopLevel, getShopItems } = require('./utils/shop');
const { initializePlayer } = require('./utils/player');

// --- FONCTION POUR CALCULER LA TAILLE DU LABYRINTHE SELON LE MODE ---
function calculateMazeSize(level, mode = 'classic') {
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
    } else if (mode === 'solo') {
        // Mode solo: 20 niveaux (10 expansion, 10 contraction)
        if (level <= 10) {
            // Niveaux 1-10: Expansion (15x15 -> 35x35)
            const size = baseSize + (level - 1) * sizeIncrement;
            return { width: size, height: size };
        } else {
            // Niveaux 11-20: Contraction (35x35 -> 15x15)
            const contractLevel = level - 10;
            const size = baseSize + (10 - contractLevel) * sizeIncrement;
            return { width: size, height: size };
        }
    }
}

// --- FONCTION POUR OBTENIR LES ITEMS DU SHOP SELON LE MODE ---
function getShopItemsForMode(mode = 'classic') {
    const allItems = getShopItems();
    
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
        if (socket) {
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
