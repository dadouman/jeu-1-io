// game-loop.js - Boucle de rendu et gestion de l'état du jeu

socket.on('state', (gameState) => {
    const finalId = myPlayerId || socket.id;

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
            
            // Récupérer gems et purchasedFeatures du joueur actuel
            if (playerId === finalId) {
                playerGems = player.gems || 0;
                purchasedFeatures = player.purchasedFeatures || {};
                
                // Normaliser les données: speedBoost doit être un nombre, pas un booléen
                if (typeof purchasedFeatures.speedBoost !== 'number') {
                    purchasedFeatures.speedBoost = purchasedFeatures.speedBoost ? 1 : 0;
                }
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
            if (soloSessionStartTime) {
                soloInactiveTime += SHOP_DURATION;
            }
            isShopOpen = false;
            shopTimerStart = null;
            
            // Redémarrer le timer du niveau (sans countdown cinéma)
            if (currentGameMode === 'solo') {
                levelStartTime = Date.now();
            }
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
            isFirstLevel = false;
            transitionStartTime = null;
            voteResult = null;
            
            // Redémarrer le timer du niveau (sans countdown cinéma)
            if (currentGameMode === 'solo') {
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

    // --- GESTION DU COUNTDOWN SOLO (Tous les 16ms ~ 60 FPS) ---
    // Le countdown cinématique est géré dans countdown-cinema.js
    // Le déverrouillage des inputs et démarrage du timer se fait dans le callback
    if (soloStartCountdownActive && soloStartCountdownStartTime) {
        const countdownElapsed = Date.now() - soloStartCountdownStartTime;
        
        // À 3500ms: Terminer le countdown solo (visuel est géré par countdown-cinema.js)
        if (countdownElapsed >= 3500) {
            soloStartCountdownActive = false;
        }
    }

    // --- RENDU ---
    if (typeof renderGame === "function") {
        const shopTimeRemaining = isShopOpen && shopTimerStart ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000)) : 0;
        const currentLevelTime = levelStartTime ? Math.max(0, (Date.now() - levelStartTime) / 1000) : 0;
        const voteTimeRemaining = isVoteActive && voteStartTime ? Math.max(0, Math.ceil((VOTE_TIMEOUT - (Date.now() - voteStartTime)) / 1000)) : 0;
        
        // Calculer le temps total de la session solo (déduire le temps inactif)
        let soloRunTotalTime = 0;
        if (soloSessionStartTime) {
            const totalRawTime = (Date.now() - soloSessionStartTime) / 1000;
            soloRunTotalTime = Math.max(0, totalRawTime - (soloInactiveTime / 1000));
        }
        
        // Stocker le temps du niveau actuel en mode solo
        soloCurrentLevelTime = currentLevelTime;
        
        // Calculer le delta time (différence avec le record)
        let soloDeltaTime = null;
        let soloDeltaReference = null; // 'personal' ou 'global'
        
        if (soloRunTotalTime > 0) {
            if (soloShowPersonalDelta && soloPersonalBestTime) {
                soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                soloDeltaReference = 'personal';
            } else if (soloLeaderboardBest) {
                soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                soloDeltaReference = 'global';
            }
        }
        
        // Utiliser la fonction de mode pour calculer le zoom
        const zoomLevel = typeof calculateZoomForMode === 'function' ? calculateZoomForMode(level) : Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        // === GESTION DU COUNTDOWN (4 PHASES) ===
        let soloStartCountdownElapsed = 0;
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
        
        renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed);
    }
});

// --- BOUCLE DE RENDU CONTINUE (pour l'écran de fin solo et transitions) ---
function continuousRender() {
    if (typeof renderGame === "function" && ctx && canvas) {
        const shopTimeRemaining = isShopOpen && shopTimerStart ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000)) : 0;
        const currentLevelTime = levelStartTime ? Math.max(0, (Date.now() - levelStartTime) / 1000) : 0;
        const voteTimeRemaining = isVoteActive && voteStartTime ? Math.max(0, Math.ceil((VOTE_TIMEOUT - (Date.now() - voteStartTime)) / 1000)) : 0;
        
        // Calculer le temps total de la session solo
        let soloRunTotalTime = 0;
        if (soloSessionStartTime && !isSoloGameFinished) {
            const totalRawTime = (Date.now() - soloSessionStartTime) / 1000;
            soloRunTotalTime = Math.max(0, totalRawTime - (soloInactiveTime / 1000));
        } else if (isSoloGameFinished) {
            soloRunTotalTime = soloTotalTime; // Utiliser le temps sauvegardé
        }
        
        // Stocker le temps du niveau actuel en mode solo
        soloCurrentLevelTime = currentLevelTime;
        
        // Calculer le delta time (différence avec le record)
        let soloDeltaTime = null;
        let soloDeltaReference = null; // 'personal' ou 'global'
        
        if (soloRunTotalTime > 0) {
            if (soloShowPersonalDelta && soloPersonalBestTime) {
                soloDeltaTime = soloRunTotalTime - soloPersonalBestTime;
                soloDeltaReference = 'personal';
            } else if (soloLeaderboardBest) {
                soloDeltaTime = soloRunTotalTime - soloLeaderboardBest;
                soloDeltaReference = 'global';
            }
        }
        
        const zoomLevel = typeof calculateZoomForMode === 'function' ? calculateZoomForMode(level) : Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        // === GESTION DU COUNTDOWN (4 PHASES) ===
        let soloStartCountdownElapsed = 0;
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
        
        renderGame(ctx, canvas, map, currentPlayers, coin, myPlayerId || socket.id, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime, isFirstLevel, playerCountStart, isVoteActive, voteTimeRemaining, voteResult, soloRunTotalTime, soloDeltaTime, soloDeltaReference, soloPersonalBestTime, soloLeaderboardBest, isSoloGameFinished, soloCurrentLevelTime, currentGameMode, soloStartCountdownActive, soloStartCountdownElapsed);
    }
    requestAnimationFrame(continuousRender);
}

// Démarrer la boucle de rendu continue
requestAnimationFrame(continuousRender);
