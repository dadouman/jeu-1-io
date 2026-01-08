// server/socket-handlers/shop.js
// Gestion du système de shop (prêt à continuer, timeouts, achats Dutch auction)

const {
    tickDutchAuctionState,
    getLotById,
    markLotSold,
    computeCurrentPrice,
    toPublicState
} = require('../../utils/dutchAuctionShop');
const { emitToLobby } = require('../utils');
const { purchaseItem } = require('../../utils/shop');

function stopDutchAuctionForMode(mode, lobbies) {
    const lobby = lobbies?.[mode];
    if (!lobby || !lobby.dutchAuction) return;
    if (lobby.dutchAuction._intervalId) {
        try { clearInterval(lobby.dutchAuction._intervalId); } catch (e) {}
    }
    delete lobby.dutchAuction;
}

function handleShopEvents(socket, io, lobbies, soloSessions, playerModes) {
    // Joueur prêt à continuer après le shop
    socket.on('playerReadyToContinueShop', () => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        // Cas du SOLO : fermer le shop immédiatement (1 joueur)
        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (!session || !session.shopActive) return;
            
            console.log(`✅ [SOLO SHOP] ${session.player.skin} a fermé le shop`);
            session.shopActive = false;
            session.shopEndTime = null;
            return;
        }
        
        const lobby = lobbies[mode];
        if (!lobby) return;

        // Cas du CLASSIQUE/CUSTOM : vote de continuation
        if (!lobby.shopPlayersReady) {
            lobby.shopPlayersReady = new Set();
        }

        // Ajouter le joueur à la liste des prêts
        lobby.shopPlayersReady.add(socket.id);
        
        const totalPlayers = Object.keys(lobby.players).length;
        const readyCount = lobby.shopPlayersReady.size;
        
        console.log(`✅ [SHOP] ${lobby.players[socket.id].skin} est prêt à continuer | ${readyCount}/${totalPlayers} joueurs prêts`);
        
        // Émettre la mise à jour du compteur à tous les joueurs du lobby
        emitToLobby(mode, 'shopPlayersReadyUpdate', {
            readyCount: readyCount,
            totalPlayers: totalPlayers
        }, io, lobbies);
        
        // Si tous les joueurs sont prêts, fermer le shop
        if (readyCount === totalPlayers) {
            console.log(`🎉 [SHOP] Tous les joueurs sont prêts! Fermeture du shop...`);

            // Stopper un éventuel shop d'enchères dégressives
            stopDutchAuctionForMode(mode, lobbies);
            
            // Réinitialiser les joueurs prêts pour ce lobby
            lobby.shopPlayersReady.clear();
            
            // Émettre l'événement de fermeture du shop à tous les joueurs
            emitToLobby(mode, 'shopClosed', {}, io, lobbies);
        }
    });

    // Fermeture automatique du shop par timeout
    socket.on('shopClosedByTimeout', () => {
        const mode = playerModes[socket.id];
        if (!mode || mode === 'solo') return; // Ignorer solo et modes invalides
        
        const lobby = lobbies[mode];
        if (!lobby) return;

        // Shop enchères: pas de limite de temps
        if (lobby.dutchAuction && lobby.dutchAuction.type === 'dutchAuction') {
            return;
        }
        
        // Réinitialiser le compteur de joueurs prêts pour ce lobby
        if (lobby.shopPlayersReady) {
            lobby.shopPlayersReady.clear();
        }

        // Stopper un éventuel shop d'enchères dégressives
        stopDutchAuctionForMode(mode, lobbies);
        
        console.log(`⏱️ [SHOP TIMEOUT] Mode ${mode}: Shop fermé après 15 secondes`);
        
        // Émettre l'événement de fermeture du shop à tous les joueurs
        emitToLobby(mode, 'shopClosedAutomatically', {}, io, lobbies);
    });

    // Dutch auction purchase
    socket.on('dutchAuctionPurchase', (data) => {
        const mode = playerModes[socket.id];
        if (!mode) return;

        if (mode === 'solo') {
            socket.emit('shopPurchaseFailed', { reason: 'Shop enchères non supporté en solo', required: 0, current: 0 });
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby || !lobby.dutchAuction) {
            socket.emit('shopPurchaseFailed', { reason: 'Dutch auction non actif', required: 0, current: 0 });
            return;
        }

        const lot = getLotById(lobby.dutchAuction, data.lotId);
        if (!lot) {
            socket.emit('shopPurchaseFailed', { reason: 'Lot invalide', required: 0, current: 0 });
            return;
        }

        if (lot.sold) {
            socket.emit('shopPurchaseFailed', { reason: 'Lot déjà vendu', required: 0, current: 0 });
            return;
        }

        const player = lobby.players[socket.id];
        if (!player) {
            socket.emit('shopPurchaseFailed', { reason: 'Joueur non trouvé', required: 0, current: 0 });
            return;
        }

        const currentPrice = computeCurrentPrice(lot, lobby.dutchAuction);

        if (player.gems < currentPrice) {
            socket.emit('shopPurchaseFailed', {
                reason: 'Pas assez de gems',
                required: currentPrice,
                current: player.gems
            });
            return;
        }

        // Effectuer l'achat
        player.gems -= currentPrice;
        markLotSold(lot, socket.id);
        
        console.log(`💰 [DUTCH] Lot ${data.lotId} vendu pour ${currentPrice} gems à ${player.skin}`);

        // Émettre l'update du lot à tous les joueurs
        emitToLobby(mode, 'dutchAuctionUpdate', {
            lot: toPublicState(lot)
        }, io, lobbies);

        socket.emit('shopPurchaseSuccess', {
            lotId: data.lotId,
            price: currentPrice,
            gemsLeft: player.gems
        });
    });

    // Standard shop purchase
    socket.on('shopPurchase', (data) => {
        const mode = playerModes[socket.id];
        if (!mode) return;

        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (!session) return;

            const result = purchaseItem(session.player, data.itemId);

            if (result.success) {
                console.log(`🛒 [SOLO SHOP] ${session.player.skin} a acheté ${data.itemId} pour ${result.item.price} gems`);
                socket.emit('shopPurchaseSuccess', result);
            } else {
                console.log(`❌ [SOLO SHOP] Achat échoué: ${result.message}`);
                socket.emit('shopPurchaseFailed', result);
            }
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        const player = lobby.players[socket.id];
        if (!player) return;

        const result = purchaseItem(player, data.itemId);

        if (result.success) {
            console.log(`🛒 [SHOP] ${player.skin} a acheté ${data.itemId} pour ${result.item.price} gems`);
            socket.emit('shopPurchaseSuccess', result);
        } else {
            console.log(`❌ [SHOP] Achat échoué: ${result.message}`);
            socket.emit('shopPurchaseFailed', result);
        }
    });

    // Validate shop (send final state)
    socket.on('validateShop', () => {
        const mode = playerModes[socket.id];
        if (!mode) return;

        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (!session) return;
            
            const shopState = {
                playerGems: session.player.gems,
                purchasedFeatures: session.player.purchasedFeatures,
                level: session.level
            };
            
            socket.emit('shopValidationData', shopState);
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        const player = lobby.players[socket.id];
        if (!player) return;

        const shopState = {
            playerGems: player.gems,
            purchasedFeatures: player.purchasedFeatures,
            level: lobby.currentLevel
        };

        socket.emit('shopValidationData', shopState);
    });
}

module.exports = {
    handleShopEvents,
    stopDutchAuctionForMode
};
