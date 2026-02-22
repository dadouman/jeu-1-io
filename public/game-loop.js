// game-loop.js - Boucle de rendu et gestion de l'état du jeu

function handleServerState(gameState) {
    const finalId = myPlayerId || socket.id;
    const secondaryId = splitScreenEnabled ? myPlayerIdSecondary : null;

    // Sauvegarder les joueurs pour la transition
    if (gameState.players) {
        currentPlayers = gameState.players;
    }

    // Récupérer la position de la pièce (gems)
    if (gameState.coin) {
        coin = gameState.coin;
    }

    // Récupérer les traces de tous les joueurs
    if (gameState.players) {
        for (let playerId in gameState.players) {
            const player = gameState.players[playerId];

            // Sauvegarder gems/features par joueur (split-screen)
            playerGemsById[playerId] = player.gems || 0;
            purchasedFeaturesById[playerId] = { ...(player.purchasedFeatures || {}) };
            if (typeof purchasedFeaturesById[playerId].speedBoost !== 'number') {
                purchasedFeaturesById[playerId].speedBoost = purchasedFeaturesById[playerId].speedBoost ? 1 : 0;
            }

            // Récupérer gems/features du joueur principal
            if (playerId === finalId) {
                playerGems = player.gems || 0;
                purchasedFeatures = purchasedFeaturesById[playerId];
            }

            // Récupérer gems/features du joueur secondaire (split-screen)
            if (secondaryId && playerId === secondaryId) {
                playerGemsP2 = player.gems || 0;
                purchasedFeaturesP2 = purchasedFeaturesById[playerId];
            }

            // Afficher la trace SEULEMENT si la feature "rope" est achetée
            if (player.trail && player.color && player.purchasedFeatures && player.purchasedFeatures.rope) {
                trails[playerId] = {
                    color: player.color,
                    positions: player.trail
                };
            } else {
                delete trails[playerId];
            }
        }
    }

    // Récupérer le checkpoint du joueur actuel depuis le serveur
    if (gameState.players && gameState.players[finalId] && gameState.players[finalId].checkpoint) {
        checkpoint = gameState.players[finalId].checkpoint;
    }

    // --- FERMETURE AUTOMATIQUE DU MAGASIN APRÈS 15 SECONDES (classique/infini/custom) ---
    // IMPORTANT: la boutique d'enchères dégressives n'est PAS limitée dans le temps.
    if (!currentGameMode || currentGameMode === 'classic' || currentGameMode === 'infinite' || currentGameMode === 'custom') {
        const shouldAutoClosePrimary = isShopOpen && shopType !== 'dutchAuction';
        const shouldAutoCloseSecondary = splitScreenEnabled && isShopOpenP2 && shopTypeP2 !== 'dutchAuction';
        const anyAutoClosableShopOpen = shouldAutoClosePrimary || shouldAutoCloseSecondary;

        const startPrimary = shouldAutoClosePrimary && typeof shopTimerStart === 'number' ? shopTimerStart : Number.POSITIVE_INFINITY;
        const startSecondary = shouldAutoCloseSecondary && typeof shopTimerStartP2 === 'number' ? shopTimerStartP2 : Number.POSITIVE_INFINITY;
        const effectiveStart = Math.min(startPrimary, startSecondary);

        if (anyAutoClosableShopOpen && Number.isFinite(effectiveStart)) {
            const elapsed = Date.now() - effectiveStart;
            if (elapsed >= SHOP_DURATION) {
                if (soloSessionStartTime) {
                    soloInactiveTime += SHOP_DURATION;
                }

                // Fermer localement (P1 + P2 si split)
                isShopOpen = false;
                isPlayerReadyToContinue = false;
                shopTimerStart = null;
                shopItems = {};

                if (splitScreenEnabled) {
                    isShopOpenP2 = false;
                    isPlayerReadyToContinueP2 = false;
                    shopTimerStartP2 = null;
                    shopItemsP2 = {};
                }

                shopReadyCount = 0;
                shopTotalPlayers = 0;

                // Envoyer l'événement au serveur une seule fois (socket principal)
                if (socket) {
                    socket.emit('shopClosedByTimeout');
                }

                levelStartTime = Date.now();
            }
        }
    } else if (currentGameMode === 'solo') {
        // Solo: shop fermé automatiquement par le serveur via soloGameState
        if (soloGameState && soloGameState.shop) {
            isShopOpen = soloGameState.shop.active;
        }
    }

    // --- FERMETURE AUTOMATIQUE DE LA TRANSITION APRÈS 3 SECONDES ---
    if (isInTransition && transitionStartTime) {
        const transitionElapsed = Date.now() - transitionStartTime;
        if (transitionElapsed >= TRANSITION_DURATION) {
            if (soloSessionStartTime) {
                soloInactiveTime += TRANSITION_DURATION;
            }
            isInTransition = false;
            inputsBlocked = false; // DÉBLOQUER LES INPUTS À LA FIN DE LA TRANSITION
            isFirstLevel = false;
            transitionStartTime = null;
            voteResult = null;
            
            // Redémarrer le timer du niveau (classique/infini seulement)
            if (currentGameMode === 'classic' || currentGameMode === 'infinite' || currentGameMode === 'custom') {
                levelStartTime = Date.now();
            }
        }
    }

    // --- AFFICHAGE DU RÉSULTAT DU VOTE PENDANT 2 SECONDES ---
    if (voteResult === 'failed' && voteResultTime) {
        const resultElapsed = Date.now() - voteResultTime;
        if (resultElapsed >= 2000) {
            voteResult = null;
            voteResultTime = null;
        }
    }

    // --- GESTION DU COUNTDOWN SOLO ---
    // Le countdown est maintenant géré entièrement par le serveur via soloGameState.countdown
    // Le client utilise soloGameState.countdown.active et soloGameState.countdown.elapsed

    // --- RENDU ---
    if (typeof renderGame === "function") {
        const shopTimeRemaining = (isShopOpen && shopTimerStart && shopType !== 'dutchAuction')
            ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000))
            : null;
        const shopTimeRemainingP2 = (isShopOpenP2 && shopTimerStartP2 && shopTypeP2 !== 'dutchAuction')
            ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStartP2)) / 1000))
            : null;
        const currentLevelTime = levelStartTime ? Math.max(0, (Date.now() - levelStartTime) / 1000) : 0;
        const voteTimeRemaining = isVoteActive && voteStartTime ? Math.max(0, Math.ceil((VOTE_TIMEOUT - (Date.now() - voteStartTime)) / 1000)) : 0;
        
        // === SOLO: UTILISER L'ÉTAT REÇU DU SERVEUR ===
        let soloRunTotalTime = 0;
        let soloCurrentLevelTime = 0;
        let soloDeltaTime = null;
        let soloDeltaReference = null;
        let soloStartCountdownActive = false;
        let soloStartCountdownElapsed = 0;
        
        if (currentGameMode === 'solo' && soloGameState) {
            // Utiliser l'état reçu du serveur
            soloRunTotalTime = soloGameState.runTotalTime || 0;
            soloCurrentLevelTime = soloGameState.currentLevelTime || 0;
            soloStartCountdownActive = soloGameState.countdown?.active || false;
            soloStartCountdownElapsed = soloGameState.countdown?.elapsed || 0;
            
            // Bloquer les inputs pendant le countdown serveur
            if (soloStartCountdownActive) {
                inputsBlocked = true;
            } else if (inputsBlocked && !soloGameState.shop?.active && !soloGameState.transition?.active) {
                // Débloquer les inputs quand le countdown est terminé (et pas en shop ni en transition)
                inputsBlocked = false;
            }
            
            // Bloquer les inputs pendant les transitions (changement de niveau)
            if (soloGameState.transition?.active) {
                inputsBlocked = true;
            }
            
            // Mettre à jour l'état global de fin de jeu
            if (soloGameState.isGameFinished) {
                isSoloGameFinished = true;
                soloTotalTime = soloGameState.runTotalTime || 0;
            }
            
            // Calculer le delta avec le meilleur personnel/global
            if (soloRunTotalTime > 0) {
                if (soloShowPersonalDelta && soloPersonalBestTime) {
                    soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                    soloDeltaReference = 'personal';
                } else if (soloLeaderboardBest) {
                    soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                    soloDeltaReference = 'global';
                }
            }
        } else {
            // CLASSIQUE/INFINI: Calculer le timing localement
            if (soloSessionStartTime) {
                const totalRawTime = (Date.now() - soloSessionStartTime) / 1000;
                soloRunTotalTime = Math.max(0, totalRawTime - (soloInactiveTime / 1000));
            }
            
            // Stocker le temps du niveau actuel
            soloCurrentLevelTime = currentLevelTime;
            
            // Calculer le delta time
            if (soloRunTotalTime > 0) {
                if (soloShowPersonalDelta && soloPersonalBestTime) {
                    soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                    soloDeltaReference = 'personal';
                } else if (soloLeaderboardBest) {
                    soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                    soloDeltaReference = 'global';
                }
            }
        }
        
        // Utiliser la fonction de mode pour calculer le zoom
        const zoomLevel = typeof calculateZoomForMode === 'function' ? calculateZoomForMode(level) : Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        if (splitScreenEnabled && myPlayerIdSecondary && gameState.players && gameState.players[myPlayerIdSecondary]) {
            const halfW = canvas.width / 2;
            const viewportLeft = { x: 0, y: 0, width: halfW, height: canvas.height };
            const viewportRight = { x: halfW, y: 0, width: halfW, height: canvas.height };

            renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItems, animations: shopAnimations, isPlayerReadyToContinue, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType, auction: dutchAuctionState, auctionTickAnchor: dutchAuctionTickAnchor }, viewportLeft);

            renderGame(ctx, canvas, map, gameState.players, gameState.coin, myPlayerIdSecondary, currentHighScore, level, checkpoint, trails, isShopOpenP2, playerGemsP2, purchasedFeaturesP2, shopTimeRemainingP2, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItemsP2, animations: shopAnimationsP2, isPlayerReadyToContinue: isPlayerReadyToContinueP2, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType: shopTypeP2, auction: dutchAuctionStateP2, auctionTickAnchor: dutchAuctionTickAnchorP2 }, viewportRight);
        } else {
            renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItems, animations: shopAnimations, isPlayerReadyToContinue, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType, auction: dutchAuctionState, auctionTickAnchor: dutchAuctionTickAnchor });
        }
    }
}

socket.on('state', handleServerState);

let secondaryStateListenerAttached = false;
function attachSecondaryStateListener() {
    if (socketSecondary && !secondaryStateListenerAttached && typeof socketSecondary.on === 'function') {
        socketSecondary.on('state', handleServerState);
        secondaryStateListenerAttached = true;
    }
}

function detachSecondaryStateListener() {
    if (socketSecondary && secondaryStateListenerAttached && typeof socketSecondary.off === 'function') {
        socketSecondary.off('state', handleServerState);
    }
    secondaryStateListenerAttached = false;
}

// --- BOUCLE DE RENDU CONTINUE (pour l'écran de fin solo et transitions) ---
let debugLogged = false;
function continuousRender() {
    // Debug: afficher l'état une seule fois
    if (!debugLogged) {
        console.log('🔄 continuousRender - Debug:', {
            renderGame: typeof renderGame,
            ctx: typeof ctx,
            canvas: typeof canvas,
            mainMenuVisible: typeof mainMenuVisible !== 'undefined' ? mainMenuVisible : 'undefined',
            renderMainMenu: typeof renderMainMenu
        });
        debugLogged = true;
    }
    
    // Vérifier que tous les éléments nécessaires sont disponibles
    if (typeof renderGame === "function" && typeof ctx !== "undefined" && ctx && canvas) {
        // === AFFICHER LE NAVIGATEUR DE LOBBIES ===
        if (lobbiesBrowserVisible && typeof renderLobbiesBrowser === 'function') {
            renderLobbiesBrowser(ctx, canvas);
            requestAnimationFrame(continuousRender);
            return;
        }

        // === AFFICHER LE MENU PRINCIPAL AVANT LA SÉLECTION DU MODE ===
        if (mainMenuVisible && typeof renderMainMenu === 'function') {
            renderMainMenu(ctx, canvas);
            requestAnimationFrame(continuousRender);
            return;
        }

        const shopTimeRemaining = (isShopOpen && shopTimerStart && shopType !== 'dutchAuction')
            ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000))
            : null;
        const shopTimeRemainingP2 = (isShopOpenP2 && shopTimerStartP2 && shopTypeP2 !== 'dutchAuction')
            ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStartP2)) / 1000))
            : null;
        const currentLevelTime = levelStartTime ? Math.max(0, (Date.now() - levelStartTime) / 1000) : 0;
        const voteTimeRemaining = isVoteActive && voteStartTime ? Math.max(0, Math.ceil((VOTE_TIMEOUT - (Date.now() - voteStartTime)) / 1000)) : 0;
        
        // === SOLO: UTILISER L'ÉTAT REÇU DU SERVEUR ===
        let soloRunTotalTime = 0;
        let soloCurrentLevelTime = 0;
        let soloDeltaTime = null;
        let soloDeltaReference = null;
        let soloStartCountdownActive = false;
        let soloStartCountdownElapsed = 0;
        
        if (currentGameMode === 'solo' && soloGameState) {
            // Utiliser l'état reçu du serveur
            soloRunTotalTime = soloGameState.runTotalTime || 0;
            soloCurrentLevelTime = soloGameState.currentLevelTime || 0;
            soloStartCountdownActive = soloGameState.countdown?.active || false;
            soloStartCountdownElapsed = soloGameState.countdown?.elapsed || 0;
            
            // Mettre à jour l'état global de fin de jeu
            if (soloGameState.isGameFinished) {
                isSoloGameFinished = true;
                soloTotalTime = soloGameState.runTotalTime || 0;
                soloRunTotalTime = soloGameState.runTotalTime;
            }
            
            // Calculer le delta
            if (soloRunTotalTime > 0) {
                if (soloShowPersonalDelta && soloPersonalBestTime) {
                    soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                    soloDeltaReference = 'personal';
                } else if (soloLeaderboardBest) {
                    soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                    soloDeltaReference = 'global';
                }
            }
        } else {
            // CLASSIQUE/INFINI: Calculer localement
            if (soloSessionStartTime && !isSoloGameFinished) {
                const totalRawTime = (Date.now() - soloSessionStartTime) / 1000;
                soloRunTotalTime = Math.max(0, totalRawTime - (soloInactiveTime / 1000));
            } else if (isSoloGameFinished) {
                soloRunTotalTime = soloTotalTime; // Utiliser le temps sauvegardé
            }
            
            // Stocker le temps du niveau actuel
            soloCurrentLevelTime = currentLevelTime;
            
            // Calculer le delta
            if (soloRunTotalTime > 0) {
                if (soloShowPersonalDelta && soloPersonalBestTime) {
                    soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                    soloDeltaReference = 'personal';
                } else if (soloLeaderboardBest) {
                    soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                    soloDeltaReference = 'global';
                }
            }
        }
        
        const zoomLevel = typeof calculateZoomForMode === 'function' ? calculateZoomForMode(level) : Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        // === GESTION DU COUNTDOWN (4 PHASES) ===
        if (soloStartCountdownActive && soloStartCountdownStartTime) {
            soloStartCountdownElapsed = Date.now() - soloStartCountdownStartTime;
            
            // À 3000ms: Démarrer le timer et déverrouiller les inputs
            if (soloStartCountdownElapsed >= 3000 && levelStartTime === null) {
                levelStartTime = Date.now();
                inputsBlocked = false;
                console.log('%c✅ PHASE 4: Timer démarré à 3000ms, inputs débloqués', 'color: #00FF00; font-weight: bold; font-size: 14px');
            }
            
            // À 3500ms: Terminer le countdown
            if (soloStartCountdownElapsed >= 3500) {
                soloStartCountdownActive = false;
                console.log('%c✅ COUNTDOWN TERMINÉ à 3500ms', 'color: #00FF00; font-weight: bold; font-size: 14px');
            }
        }
        
        const primaryId = myPlayerId || socket.id;
        if (splitScreenEnabled && myPlayerIdSecondary && currentPlayers && currentPlayers[myPlayerIdSecondary]) {
            const halfW = canvas.width / 2;
            const viewportLeft = { x: 0, y: 0, width: halfW, height: canvas.height };
            const viewportRight = { x: halfW, y: 0, width: halfW, height: canvas.height };

            renderGame(ctx, canvas, map, currentPlayers, coin, primaryId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItems, animations: shopAnimations, isPlayerReadyToContinue, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType, auction: dutchAuctionState, auctionTickAnchor: dutchAuctionTickAnchor }, viewportLeft);

            renderGame(ctx, canvas, map, currentPlayers, coin, myPlayerIdSecondary, currentHighScore, level, checkpoint, trails, isShopOpenP2, playerGemsP2, purchasedFeaturesP2, shopTimeRemainingP2, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItemsP2, animations: shopAnimationsP2, isPlayerReadyToContinue: isPlayerReadyToContinueP2, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType: shopTypeP2, auction: dutchAuctionStateP2, auctionTickAnchor: dutchAuctionTickAnchorP2 }, viewportRight);
        } else {
            renderGame(ctx, canvas, map, currentPlayers, coin, primaryId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed, { items: shopItems, animations: shopAnimations, isPlayerReadyToContinue, readyCount: shopReadyCount, totalPlayers: shopTotalPlayers, shopType, auction: dutchAuctionState, auctionTickAnchor: dutchAuctionTickAnchor });
        }
    }
    
    // Continuer la boucle de rendu seulement si les conditions sont met
    if (typeof renderGame === "function" && typeof ctx !== "undefined" && ctx && canvas) {
        requestAnimationFrame(continuousRender);
    }
}

// Démarrer la boucle de rendu continue
requestAnimationFrame(continuousRender);
