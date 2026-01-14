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
const { withValidation } = require('../validation/middleware');

function stopDutchAuctionForMode(mode, lobbies) {
    const lobby = lobbies?.[mode];
    if (!lobby || !lobby.dutchAuction) return;
    if (lobby.dutchAuction._intervalId) {
        try { clearInterval(lobby.dutchAuction._intervalId); } catch (e) {}
    }
    delete lobby.dutchAuction;
}

function handleShopEvents(socket, io, lobbies, soloSessions, playerModes) {
    // === PLAYER READY TO CONTINUE (fermeture du shop) ===
    socket.on('playerReadyToContinueShop', () => {
        const mode = playerModes[socket.id];
        if (!mode) return;

        // Mode solo - géré différemment
        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (session && session.closeShop) {
                session.closeShop();
                console.log(`🏪 [SOLO] Shop fermé pour ${socket.id}`);
                socket.emit('shopClosed', { reason: 'playerReady' });
            }
            return;
        }

        const lobby = lobbies[mode];
        if (!lobby) return;

        // Initialiser le Set de joueurs prêts si nécessaire
        if (!lobby.shopPlayersReady) {
            lobby.shopPlayersReady = new Set();
        }

        // Marquer ce joueur comme prêt
        lobby.shopPlayersReady.add(socket.id);
        const totalPlayers = Object.keys(lobby.players).length;
        const readyPlayers = lobby.shopPlayersReady.size;

        console.log(`🏪 [SHOP ${mode}] Joueur ${socket.id} prêt (${readyPlayers}/${totalPlayers})`);

        // Émettre la progression à tous les joueurs
        emitToLobby(mode, 'shopReadyProgress', {
            readyCount: readyPlayers,
            totalCount: totalPlayers
        }, io, lobbies);

        // Si tous les joueurs sont prêts, fermer le shop
        if (readyPlayers >= totalPlayers) {
            console.log(`🏪 [SHOP ${mode}] Tous les joueurs prêts! Fermeture du shop.`);
            
            // Annuler le timer de timeout automatique
            if (lobby._shopTimeoutId) {
                try { clearTimeout(lobby._shopTimeoutId); } catch (e) {}
                delete lobby._shopTimeoutId;
            }
            
            // Nettoyer le dutch auction si actif
            stopDutchAuctionForMode(mode, lobbies);
            
            // Réinitialiser les joueurs prêts
            lobby.shopPlayersReady.clear();
            
            // Notifier tous les joueurs que le shop est fermé
            emitToLobby(mode, 'shopClosed', { reason: 'allPlayersReady' }, io, lobbies);
        }
    });

    // Dutch auction purchase
    socket.on('dutchAuctionPurchase', (data) => {
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'dutchAuctionPurchase', data);
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

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
        // Valider et rate-limit
        const validation = withValidation(socket.id, 'shopPurchase', data);
        if (!validation.valid) {
            socket.emit('error', { message: validation.errors[0] });
            return;
        }

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
