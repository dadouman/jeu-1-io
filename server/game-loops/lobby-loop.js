// server/game-loops/lobby-loop.js
// Boucle de jeu pour modes classique et infini

const { generateMaze, generateMazeAdvanced, getRandomEmptyPosition, getRandomEmptyPositionFarFromPlayers } = require('../../utils/map');
const { resetPlayerForNewLevel, addScore } = require('../../utils/player');
const { calculateGemsForLevel, addGems } = require('../../utils/gems');
const { isShopLevel } = require('../../utils/shop');
const { getGameModeConfig } = require('../../config/gameModes');
const {
    createDutchAuctionState,
    tickDutchAuctionState,
    toPublicState
} = require('../../utils/dutchAuctionShop');
const ShopTransitionManager = require('../../utils/shopTransitionManager');

function processLobbyGameLoop(lobbies, io, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    TRANSITION_DURATION, 
    SHOP_DURATION 
}, playerModes) {
    // --- TRAITEMENT DES LOBBIES CLASSIQUE, CLASSICPRIM, INFINI ET PERSONNALISÉ ---
    for (const mode of ['classic', 'classicPrim', 'infinite', 'custom']) {
        const lobby = lobbies[mode];
        if (!lobby) continue; // Ignorer si le lobby n'existe pas
        
        let recordChanged = false;
        let levelChanged = false;
        
        // Récupérer les limites et le type de fin depuis la configuration
        let maxLevels;
        // Le mode "custom" est dynamique: il est défini par lobby.customConfig.
        // Éviter d'exiger une config statique dans config/gameModes.js.
        const modeConfig = mode === 'custom' ? null : getGameModeConfig(mode);
        const endType = mode === 'custom'
            ? (lobby.customConfig?.endType || 'multi')
            : (modeConfig?.endType || 'multi');

        if (mode === 'custom' && lobby.customConfig) {
            maxLevels = lobby.customConfig.maxLevels;
        } else {
            maxLevels = modeConfig && modeConfig.maxLevels ? modeConfig.maxLevels : Infinity;
        }

        for (const id in lobby.players) {
            const p = lobby.players[id];
            if (!p || !lobby.coin) continue; // Vérifier que le joueur et la pièce existent
            const dist = Math.hypot(p.x - lobby.coin.x, p.y - lobby.coin.y);
            
            // --- COLLISION AVEC LA PIÈCE ---
            if (dist < 30) {
                addScore(p, 1);
                
                // SYSTÈME DE GEMS : À chaque niveau, on gagne des gems
                const gemsEarned = calculateGemsForLevel(lobby.currentLevel);
                addGems(p, gemsEarned);
                
                // Afficher les stats de progression
                const isShopAfterThisLevel = isShopLevel(lobby.currentLevel);
                console.log(`✨ [PROGRESSION ${mode}] ${p.skin} Niveau ${lobby.currentLevel} complété en ${(Date.now() / 1000).toFixed(0)}s | +${gemsEarned}💎 (Total: ${p.gems}💎)${isShopAfterThisLevel ? ' | 🏪 Magasin après ce niveau!' : ''}`);
                
                // 1. ON AUGMENTE LE NIVEAU
                console.log(`🔢 [PRE-INCREMENT] Mode: ${mode}, currentLevel AVANT: ${lobby.currentLevel}`);
                lobby.currentLevel++;
                console.log(`🔢 [POST-INCREMENT] Mode: ${mode}, currentLevel APRÈS: ${lobby.currentLevel}`);
                levelChanged = true;

                // 2. VÉRIFIER SI LE JEU EST TERMINÉ (Selon le mode)
                if (maxLevels !== Infinity && lobby.currentLevel > maxLevels) {
                    // 🎯 LE JEU EST TERMINÉ!
                    console.log(`\n🏁 ════════════════════════════════════\n   JEU TERMINÉ [${mode}] - Niveau ${maxLevels} complété\n════════════════════════════════════\n`);
                    
                    // 1. Envoyer l'événement de fin aux joueurs
                    emitToLobby(mode, 'gameFinished', { finalLevel: maxLevels, mode: mode, endType }, io, lobbies);
                    
                    // 2. Exclure TOUS les joueurs du lobby
                    const playerIds = Object.keys(lobby.players);
                    for (const playerId of playerIds) {
                        delete lobby.players[playerId];
                        
                        // Nettoyer le tracking playerModes
                        if (playerModes) {
                            delete playerModes[playerId];
                        }
                        
                        // Envoyer un événement pour renvoyer au sélecteur de mode
                        const socket = io.sockets.sockets.get(playerId);
                        if (socket && socket.connected) {
                            socket.emit('modeSelectionRequired', { 
                                message: 'Jeu terminé! Veuillez sélectionner un nouveau mode.',
                                reason: 'gameEnded'
                            });
                        }
                    }
                    
                    // 3. Réinitialiser le lobby pour la prochaine partie
                    lobby.currentLevel = 1;
                    lobby.currentRecord = { score: 0, skin: 'unknown' };
                    
                    // Utiliser l'algorithme configuré pour le mode custom ou classicPrim
                    const resetMazeSize = calculateMazeSize(1, mode, lobby);
                    if ((mode === 'custom' && lobby.customConfig && lobby.customConfig.mazeGeneration) || 
                        (mode === 'classicPrim' && lobby.mazeGeneration)) {
                        const mazeGen = mode === 'custom' ? lobby.customConfig.mazeGeneration : lobby.mazeGeneration;
                        lobby.map = generateMazeAdvanced(resetMazeSize.width, resetMazeSize.height, {
                            algorithm: mazeGen.algorithm,
                            density: mazeGen.density
                        });
                    } else {
                        lobby.map = generateMaze(resetMazeSize.width, resetMazeSize.height);
                    }
                    lobby.coin = getRandomEmptyPosition(lobby.map);
                    
                    console.log(`🔄 Lobby [${mode}] réinitialisé et fermé. En attente de nouveaux joueurs.`);
                    break;
                }

                // 3. ON AGRANDIT LE LABYRINTHE SELON LE MODE
                const mazeSize = calculateMazeSize(lobby.currentLevel, mode, lobby);
                
                // Utiliser l'algorithme configuré pour le mode custom ou classicPrim
                if ((mode === 'custom' && lobby.customConfig && lobby.customConfig.mazeGeneration) ||
                    (mode === 'classicPrim' && lobby.mazeGeneration)) {
                    const mazeGen = mode === 'custom' ? lobby.customConfig.mazeGeneration : lobby.mazeGeneration;
                    lobby.map = generateMazeAdvanced(mazeSize.width, mazeSize.height, {
                        algorithm: mazeGen.algorithm,
                        density: mazeGen.density
                    });
                } else {
                    lobby.map = generateMaze(mazeSize.width, mazeSize.height);
                }
                
                // 3. ON TÉLÉPORTE TOUS LES JOUEURS D'ABORD (Sécurité anti-mur)
                for (let pid in lobby.players) {
                    const safePos = getRandomEmptyPosition(lobby.map);
                    resetPlayerForNewLevel(lobby.players[pid], safePos);
                }

                // 4. ON PLACE LA GEMME LOIN DE TOUS LES JOUEURS
                const playerPositions = Object.values(lobby.players).map(p => ({ x: p.x, y: p.y }));
                const minGemDistance = mazeSize.width * 40 * 0.4; // 40% de la largeur de la map en pixels
                lobby.coin = getRandomEmptyPositionFarFromPlayers(lobby.map, playerPositions, minGemDistance);

                // Gestion Record
                if (p.score > lobby.currentRecord.score) {
                    lobby.currentRecord.score = p.score;
                    lobby.currentRecord.skin = p.skin;
                    recordChanged = true;
                }
                
                break; 
            }
        }

        // SI LE NIVEAU A CHANGÉ
        if (levelChanged) {
            console.log(`📢 [ÉMISSION] Mode: ${mode}, Émission levelUpdate avec level: ${lobby.currentLevel}`);
            emitToLobby(mode, 'mapData', lobby.map, io, lobbies);
            emitToLobby(mode, 'levelUpdate', lobby.currentLevel, io, lobbies);
            
            // VÉRIFIER SI LE NIVEAU QU'ON VIENT DE COMPLÉTER est un niveau de MAGASIN
            const completedLevel = lobby.currentLevel - 1;
            let isShopLvl = false;
            
            if (mode === 'custom' && lobby.customConfig && lobby.customConfig.shop && lobby.customConfig.shop.levels) {
                // Pour le mode custom, utiliser les niveaux définis dans la configuration
                isShopLvl = lobby.customConfig.shop.levels.includes(completedLevel);
            } else {
                // Pour les autres modes, utiliser la fonction standard
                isShopLvl = isShopLevel(completedLevel);
            }
            
            console.log(`🏪 [CHECK SHOP] Mode: ${mode}, Niveau complété: ${completedLevel}, isShopLevel: ${isShopLvl}`);
            if (isShopLvl) {
                console.log(`🏪 [SHOP TRIGGER] Mode: ${mode}, MAGASIN VA S'OUVRIR après le niveau ${completedLevel}`);
                const shopType = (mode === 'custom')
                    ? (lobby.customConfig?.shop?.type || 'classic')
                    : (modeConfig?.shop?.type || 'classic');

                if (shopType === 'dutchAuction') {
                    // Pour éviter une boutique vide (ex: config custom incomplète), fallback sur les items classiques.
                    let itemsById = getShopItemsForMode(mode, lobby);
                    if (!itemsById || Object.keys(itemsById).length === 0) {
                        itemsById = getShopItemsForMode('classic', lobby);
                    }

                    // Garantir que les 5 upgrades “core” sont toujours proposés au moins en tant qu'options possibles.
                    // (utile si un customConfig a été sauvegardé sans certains items)
                    const requiredItemIds = ['dash', 'checkpoint', 'compass', 'rope', 'speedBoost'];
                    const fallbackItems = getShopItemsForMode('classic', lobby) || {};
                    for (const itemId of requiredItemIds) {
                        if (!itemsById?.[itemId] && fallbackItems[itemId]) {
                            itemsById[itemId] = fallbackItems[itemId];
                        }
                    }

                    console.log(`⏱️ [DUTCH AUCTION] Mode ${mode}: ${Object.keys(itemsById || {}).length} item(s) -> ${Object.keys(itemsById || {}).join(', ')}`);
                    const auctionConfig = (mode === 'custom')
                        ? (lobby.customConfig?.shop?.auction || {})
                        : (modeConfig?.shop?.auction || {});

                    // Nettoyer un ticker existant si besoin
                    if (lobby.dutchAuction && lobby.dutchAuction._intervalId) {
                        try { clearInterval(lobby.dutchAuction._intervalId); } catch (e) {}
                    }

                    lobby.dutchAuction = createDutchAuctionState(itemsById, auctionConfig);
                    tickDutchAuctionState(lobby.dutchAuction);

                    // Émettre l'ouverture avec l'état public initial
                    emitToLobby(mode, 'shopOpen', {
                        items: itemsById,
                        level: completedLevel,
                        shopType,
                        auction: toPublicState(lobby.dutchAuction)
                    }, io, lobbies);

                    // Ticker serveur pour synchroniser les prix entre tous les joueurs
                    lobby.dutchAuction._intervalId = setInterval(() => {
                        if (!lobbies[mode] || !lobbies[mode].dutchAuction) return;
                        tickDutchAuctionState(lobbies[mode].dutchAuction);

                        // Condition de fermeture: si tous les lots restants ont atteint leur prix minimum.
                        // (ou si tous les lots sont vendus)
                        const lots = Array.isArray(lobbies[mode].dutchAuction.lots) ? lobbies[mode].dutchAuction.lots : [];
                        const unsoldLots = lots.filter(l => !l.sold);
                        const allSold = unsoldLots.length === 0;
                        const allAtMin = unsoldLots.length > 0 && unsoldLots.every(l => Number(l.currentPrice) <= Number(l.minPrice));
                        if (allSold || allAtMin) {
                            try { clearInterval(lobbies[mode].dutchAuction._intervalId); } catch (e) {}
                            delete lobbies[mode].dutchAuction;
                            if (lobbies[mode].shopPlayersReady && typeof lobbies[mode].shopPlayersReady.clear === 'function') {
                                lobbies[mode].shopPlayersReady.clear();
                            }
                            emitToLobby(mode, 'shopClosedAutomatically', { reason: allSold ? 'allSold' : 'minReached' }, io, lobbies);
                            return;
                        }

                        emitToLobby(mode, 'dutchAuctionState', {
                            auction: toPublicState(lobbies[mode].dutchAuction)
                        }, io, lobbies);
                    }, lobby.dutchAuction.tickMs);

                    // Envoi immédiat d'un premier état (évite d'attendre le premier tick)
                    emitToLobby(mode, 'dutchAuctionState', {
                        auction: toPublicState(lobby.dutchAuction)
                    }, io, lobbies);
                } else {
                    // Shop classique
                    emitToLobby(mode, 'shopOpen', {
                        items: getShopItemsForMode(mode, lobby),
                        level: completedLevel,
                        shopType
                    }, io, lobbies);
                    
                    // Initialiser le Set de joueurs prêts
                    lobby.shopPlayersReady = new Set();
                    
                    // Timer de fermeture automatique après SHOP_DURATION
                    // Nettoyer un timer précédent s'il existe
                    if (lobby._shopTimeoutId) {
                        try { clearTimeout(lobby._shopTimeoutId); } catch (e) {}
                    }
                    
                    lobby._shopTimeoutId = setTimeout(() => {
                        console.log(`⏰ [SHOP ${mode}] Timeout! Fermeture automatique après ${SHOP_DURATION}ms`);
                        
                        // Réinitialiser les joueurs prêts
                        if (lobby.shopPlayersReady) {
                            lobby.shopPlayersReady.clear();
                        }
                        
                        // Notifier tous les joueurs que le shop est fermé
                        emitToLobby(mode, 'shopClosed', { reason: 'timeout' }, io, lobbies);
                        
                        delete lobby._shopTimeoutId;
                    }, SHOP_DURATION);
                }
                const shopLogLine = (shopType === 'dutchAuction')
                    ? "Boutique Enchères: pas de limite de temps (∞). Fin: tous prêts OU prix minimum atteint"
                    : `Les joueurs ont ${SHOP_DURATION/1000} secondes pour acheter!`;
                console.log(`\n🏪 ════════════════════════════════════\n   MAGASIN OUVERT [${mode}] - Après Niveau ${completedLevel}\n   ${shopLogLine}\n════════════════════════════════════\n`);
            } else {
                // Afficher la vraie taille depuis la configuration
                const mazeSize = calculateMazeSize(lobby.currentLevel, mode, lobby);
                console.log(`🌍 [NIVEAU ${lobby.currentLevel} ${mode}] Labyrinthe ${mazeSize.width}x${mazeSize.height} généré`);
            }
        }

        // ===== AJOUTER ÉCRAN DE TRANSITION =====
        const shopTransitionManager = new ShopTransitionManager(lobby.transitionDuration, lobby.shopIntroDuration);
        shopTransitionManager.handleTransition(lobby);

        // SI LE RECORD A CHANGÉ
        if (recordChanged) {
            emitToLobby(mode, 'highScoreUpdate', lobby.currentRecord, io, lobbies);
            if (mongoURI) {
                HighScoreModel.updateOne({}, { score: lobby.currentRecord.score, skin: lobby.currentRecord.skin }).exec();
            }
        }

        emitToLobby(mode, 'state', { players: lobby.players, coin: lobby.coin }, io, lobbies);
    }
}

module.exports = { processLobbyGameLoop };
