// server/socket-events-refactored.js - EXEMPLE de refactorisation utilisant le nouveau système
// Ce fichier montre comment utiliser GameMode, GameSessionManager, et PlayerActions
// À adapter progressivement dans socket-events.js

const { getRandomEmptyPosition, generateMaze } = require('../utils/map');
const { GameSessionManager } = require('../utils/GameSessionManager');
const GameMode = require('../utils/GameMode');
const PlayerActions = require('../utils/PlayerActions');

/**
 * EXEMPLE: Comment initialiser une session pour un mode
 */
function exampleInitializeMode(socket, mode) {
    const sessionManager = socket.sessionManager;  // À injecter depuis server.js
    
    // 1. Créer une session unique par joueur/mode
    const sessionId = `${socket.id}-${Date.now()}`;
    const session = sessionManager.createSession(sessionId, mode);
    
    // 2. Ajouter le joueur à la session
    const startPos = getRandomEmptyPosition(generateMaze(15, 15));
    const player = sessionManager.addPlayerToSession(socket.id, sessionId, startPos, 0);
    
    // 3. Les features du joueur sont déjà initialisées selon le mode
    console.log(`✅ Session créée: ${mode}, Features: ${JSON.stringify(player.purchasedFeatures)}`);
    
    // 4. Envoyer les données du jeu
    socket.emit('mapData', session.map);
    socket.emit('levelUpdate', session.currentLevel);
    
    return session;
}

/**
 * EXEMPLE: Comment traiter le mouvement avec la nouvelle architecture
 */
function exampleProcessMovement(socket, input, sessionManager) {
    const session = sessionManager.getPlayerSession(socket.id);
    if (!session) return;
    
    const player = session.getPlayer(socket.id);
    if (!player) return;
    
    // Traiter le mouvement de manière uniforme pour tous les modes
    PlayerActions.processMovement(player, session.map, input, session.gameMode.modeId);
}

/**
 * EXEMPLE: Comment traiter le dash
 */
function exampleProcessDash(socket, sessionManager) {
    const session = sessionManager.getPlayerSession(socket.id);
    if (!session) return;
    
    const player = session.getPlayer(socket.id);
    if (!player) return;
    
    const result = PlayerActions.processDash(player, session.map, session.gameMode.modeId);
    socket.emit('dashResult', result);
}

/**
 * EXEMPLE: Comment acheter un item au shop
 */
function exampleBuyItem(socket, itemId, sessionManager) {
    const session = sessionManager.getPlayerSession(socket.id);
    if (!session) return;
    
    const player = session.getPlayer(socket.id);
    if (!player) return;
    
    // Récupérer l'item de la config du mode
    const item = session.gameMode.getShopItem(itemId);
    if (!item) {
        socket.emit('error', { message: 'Item non trouvé' });
        return;
    }
    
    // Acheter l'item de manière uniforme
    const result = PlayerActions.buyItem(player, item);
    socket.emit('shopPurchaseResult', result);
}

/**
 * EXEMPLE: Comment obtenir tous les objets d'un mode
 */
function exampleGetShopItems(socket, sessionManager) {
    const session = sessionManager.getPlayerSession(socket.id);
    if (!session) return;
    
    const items = session.gameMode.getShopItems();
    socket.emit('shopItems', items);
}

/**
 * EXEMPLE: Vérifier si le mode peut avoir N joueurs
 */
function exampleCheckMaxPlayers(socket, modeId, currentPlayerCount) {
    const gameMode = new GameMode(modeId);
    
    if (!gameMode.canAccommodatePlayers(currentPlayerCount + 1)) {
        socket.emit('error', { 
            message: `Le mode ${modeId} ne peut avoir que ${gameMode.config.maxPlayers} joueurs` 
        });
        return false;
    }
    
    return true;
}

/**
 * EXEMPLE: Configuration du shop pour un mode personnalisé
 * 
 * Tu peux maintenant créer des variantes de mode très facilement:
 * 
 * Dans config/gameModes.js, ajoute:
 * 
 * solo30: {
 *     name: 'Solo 30',
 *     maxLevels: 30,
 *     shop: {
 *         levels: [5, 10, 15, 20, 25, 30]
 *     },
 *     shopItems: [
 *         // Items custom pour ce mode
 *     ],
 *     gemsPerLevel: {
 *         calculateGems: (level) => level * 10
 *     }
 * }
 * 
 * Et ça marche immédiatement avec toute la logique de collision,
 * mouvement, shop, etc. ZÉRO duplication!
 */

module.exports = {
    exampleInitializeMode,
    exampleProcessMovement,
    exampleProcessDash,
    exampleBuyItem,
    exampleGetShopItems,
    exampleCheckMaxPlayers
};
