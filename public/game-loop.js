// game-loop.js - Boucle de rendu et gestion de l'état du jeu

socket.on('state', (gameState) => {
    const finalId = myPlayerId || socket.id;

    // Sauvegarder les joueurs pour la transition
    if (gameState.players) {
        currentPlayers = gameState.players;
    }

    // Récupérer les traces de tous les joueurs
    if (gameState.players) {
        for (let playerId in gameState.players) {
            const player = gameState.players[playerId];
            
            // Récupérer gems et purchasedFeatures du joueur actuel
            if (playerId === finalId) {
                playerGems = player.gems || 0;
                purchasedFeatures = player.purchasedFeatures || {};
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

    // --- FERMETURE AUTOMATIQUE DU MAGASIN APRÈS 15 SECONDES ---
    if (isShopOpen && shopTimerStart) {
        const elapsed = Date.now() - shopTimerStart;
        if (elapsed >= SHOP_DURATION) {
            isShopOpen = false;
            shopTimerStart = null;
        }
    }

    // --- FERMETURE AUTOMATIQUE DE LA TRANSITION APRÈS 3 SECONDES ---
    if (isInTransition && transitionStartTime) {
        const transitionElapsed = Date.now() - transitionStartTime;
        if (transitionElapsed >= TRANSITION_DURATION) {
            isInTransition = false;
            isFirstLevel = false;
            transitionStartTime = null;
            voteResult = null;
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

    // --- RENDU ---
    if (typeof renderGame === "function") {
        const shopTimeRemaining = isShopOpen && shopTimerStart ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000)) : 0;
        const currentLevelTime = levelStartTime ? (Date.now() - levelStartTime) / 1000 : 0;
        const voteTimeRemaining = isVoteActive && voteStartTime ? Math.max(0, Math.ceil((VOTE_TIMEOUT - (Date.now() - voteStartTime)) / 1000)) : 0;
        const zoomLevel = Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult);
    }
});
