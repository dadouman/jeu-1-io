// socket-events.js - Tous les événements Socket.io

/**
 * Attache tous les événements de jeu à un socket donné.
 * source: 'primary' | 'secondary'
 */
function bindCoreSocketEvents(targetSocket, source = 'primary') {
    if (!targetSocket) return;

    // --- ÉVÉNEMENTS CONNEXION ---
    targetSocket.on('init', (id) => {
        if (source === 'primary') {
            myPlayerId = id;
        } else {
            myPlayerIdSecondary = id;
            console.log(`🎮 Joueur 2 connecté (split-screen) : ${id}`);
            if (currentGameMode) {
                targetSocket.emit('selectGameMode', { mode: currentGameMode });
            }
        }
    });

    targetSocket.on('connect', () => {
        if (source === 'primary') {
            if (!myPlayerId) myPlayerId = targetSocket.id;
        } else {
            if (!myPlayerIdSecondary) myPlayerIdSecondary = targetSocket.id;
            if (currentGameMode) {
                targetSocket.emit('selectGameMode', { mode: currentGameMode });
            }
        }
    });

    if (source === 'secondary') {
        // Gestion dédiée du socket secondaire
        targetSocket.on('connect_error', (err) => {
            console.error('❌ Erreur de connexion du socket secondaire:', err?.message || err);
            disableSplitScreen();
        });

        targetSocket.on('disconnect', () => {
            console.log('ℹ️ Socket secondaire déconnecté');
            myPlayerIdSecondary = null;
            if (typeof detachSecondaryStateListener === 'function') {
                detachSecondaryStateListener();
            }
        });
    }

    // --- ÉVÉNEMENTS JEU ---
    targetSocket.on('mapData', (data) => {
        map = data;
    });

    targetSocket.on('requestSoloBestSplits', () => {
        targetSocket.emit('getSoloBestSplits');
    });

    targetSocket.on('highScoreUpdate', (data) => {
        currentHighScore = data;
        const targetPlayerId = source === 'secondary' ? myPlayerIdSecondary : myPlayerId;
        
        if (currentGameMode === 'classic') {
            classicLeaderboardBest = data.score;
            
            const savedPersonalBest = localStorage.getItem('classicPersonalBest');
            if (savedPersonalBest) {
                classicPersonalBestScore = parseInt(savedPersonalBest);
            }
            
            const myPlayer = currentPlayers[targetPlayerId];
            if (myPlayer && myPlayer.score > (classicPersonalBestScore || 0)) {
                classicPersonalBestScore = myPlayer.score;
                localStorage.setItem('classicPersonalBest', myPlayer.score.toString());
                console.log(`%c🎯 Nouveau record personnel classique! ${myPlayer.score}💎`, 'color: #00FF00; font-weight: bold');
            }
        }
    });

    targetSocket.on('checkpointUpdate', (data) => {
        checkpoint = data;
    });

    targetSocket.on('levelUpdate', (newLevel) => {
        if (currentGameMode === 'solo') return;
        
        if (newLevel !== lastLevel && lastLevel !== 0) {
            isInTransition = true;
            inputsBlocked = true;
            transitionStartTime = Date.now();
            levelUpTime = levelStartTime ? (Date.now() - levelStartTime) / 1000 : 0;
            const idForSkin = source === 'secondary' ? myPlayerIdSecondary : myPlayerId;
            levelUpPlayerSkin = idForSkin ? (currentPlayers[idForSkin]?.skin || '❓') : '❓';
            
            const playerData = currentPlayers[idForSkin];
            if (playerData) {
                console.log(`%c${levelUpPlayerSkin} Niveau ${lastLevel} complété en ${levelUpTime.toFixed(1)}s | ${playerData.gems}💎 | Score: ${playerData.score}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
            }
            
            levelStartTime = Date.now();
        } else if (newLevel === 1 && lastLevel === 0) {
            isInTransition = true;
            inputsBlocked = true;
            isFirstLevel = true;
            transitionStartTime = Date.now();
            playerCountStart = Object.keys(currentPlayers).length;
            levelStartTime = Date.now();
        }
        
        level = newLevel;
        lastLevel = newLevel;
        
        checkpoint = null;
        trails = {};
    });

    // --- ÉVÉNEMENTS SOLO ---
    targetSocket.on('soloGameState', (state) => {
        updateSoloGameState(state);
    });

    // --- ÉVÉNEMENTS SHOP ---
    targetSocket.on('shopOpen', (data) => {
        if (currentGameMode === 'solo') return;

        const now = Date.now();
        const isSecondary = source === 'secondary';

        if (isSecondary) {
            isShopOpenP2 = true;
            isPlayerReadyToContinueP2 = false;
            shopItemsP2 = data.items;
            shopTypeP2 = data.shopType || 'classic';
            dutchAuctionStateP2 = (shopTypeP2 === 'dutchAuction' && data.auction) ? data.auction : null;
            shopTimerStartP2 = now;

            if (shopTypeP2 === 'dutchAuction') {
                const itemKeys = data?.items ? Object.keys(data.items) : [];
                const lotsCount = Array.isArray(data?.auction?.lots) ? data.auction.lots.length : 0;
                console.log(`%c🧩 [P2] AUCTION shopOpen: ${lotsCount} lot(s), items=${itemKeys.join(', ') || '(none)'}`,
                    'color:#FFD700; font-weight:bold');
            }
        } else {
            isShopOpen = true;
            isPlayerReadyToContinue = false;
            shopItems = data.items;
            shopType = data.shopType || 'classic';
            dutchAuctionState = (shopType === 'dutchAuction' && data.auction) ? data.auction : null;
            shopTimerStart = now;

            if (shopType === 'dutchAuction') {
                const itemKeys = data?.items ? Object.keys(data.items) : [];
                const lotsCount = Array.isArray(data?.auction?.lots) ? data.auction.lots.length : 0;
                console.log(`%c🧩 [P1] AUCTION shopOpen: ${lotsCount} lot(s), items=${itemKeys.join(', ') || '(none)'}`,
                    'color:#FFD700; font-weight:bold');
            }
        }

        levelStartTime = null;

        // Compteur global (même lobby)
        shopTotalPlayers = currentPlayers ? Object.keys(currentPlayers).length : 1;
        shopReadyCount = 0;

        const shopNumber = Math.floor(data.level / 5);
        const who = isSecondary ? 'P2' : 'P1';
        console.log(`%c🏪 [${who}] SHOP ${shopNumber} OUVERT | 1-5 pour acheter (${shopTotalPlayers} joueur(s))`, 'color: #FFD700; font-weight: bold; font-size: 12px');
    });

    targetSocket.on('dutchAuctionState', (data) => {
        const auction = data?.auction || null;
        const isSecondary = source === 'secondary';
        if (isSecondary) {
            dutchAuctionStateP2 = auction;
            dutchAuctionTickAnchorP2 = Date.now();

            const lotsCount = Array.isArray(auction?.lots) ? auction.lots.length : 0;
            console.log(`%c📡 [P2] AUCTION state: ${lotsCount} lot(s)`, 'color:#999');
        } else {
            dutchAuctionState = auction;
            dutchAuctionTickAnchor = Date.now();

            const lotsCount = Array.isArray(auction?.lots) ? auction.lots.length : 0;
            console.log(`%c📡 [P1] AUCTION state: ${lotsCount} lot(s)`, 'color:#999');
        }
    });

    targetSocket.on('dutchAuctionLotSold', (data) => {
        const lotId = data?.lotId;
        if (!lotId) return;
        const isSecondary = source === 'secondary';
        const state = isSecondary ? dutchAuctionStateP2 : dutchAuctionState;
        if (!state || !Array.isArray(state.lots)) return;
        const lot = state.lots.find(l => l.lotId === lotId);
        if (lot) {
            lot.sold = true;
        }
    });

    targetSocket.on('shopPurchaseSuccess', (data) => {
        const isSecondary = source === 'secondary';
        const targetFeatures = isSecondary ? purchasedFeaturesP2 : purchasedFeatures;

        if (data.itemId === 'speedBoost') {
            targetFeatures[data.itemId] = (targetFeatures[data.itemId] || 0) + 1;
        } else {
            targetFeatures[data.itemId] = true;
        }

        if (isSecondary) {
            purchasedFeaturesP2 = targetFeatures;
            playerGemsP2 = data.gemsLeft;
        } else {
            purchasedFeatures = targetFeatures;
            playerGems = data.gemsLeft;
        }

        const who = isSecondary ? 'P2' : 'P1';
        console.log(`%c✅ [${who}] ${data.item.name} acheté! | ${data.gemsLeft}💎`, 'color: #00FF00; font-weight: bold');
    });

    targetSocket.on('shopPurchaseFailed', (data) => {
        console.log(`%c❌ ${data.reason} | Vous avez ${data.current}/${data.required} 💎`, 'color: #FF6B6B; font-weight: bold');
    });

    targetSocket.on('shopClosed', () => {
        if (currentGameMode !== 'solo') {
            const isSecondary = source === 'secondary';
            if (isSecondary) {
                isShopOpenP2 = false;
                isPlayerReadyToContinueP2 = false;
                shopTimerStartP2 = null;
                shopItemsP2 = {};
                shopTypeP2 = 'classic';
                dutchAuctionStateP2 = null;
            } else {
                isShopOpen = false;
                isPlayerReadyToContinue = false;
                shopTimerStart = null;
                shopItems = {};
                shopType = 'classic';
                dutchAuctionState = null;
            }
            shopReadyCount = 0;
            shopTotalPlayers = 0;
            console.log(`%c🏪 SHOP FERMÉ | Retour au niveau`, 'color: #FFD700; font-weight: bold');
            levelStartTime = Date.now();
        }
    });

    targetSocket.on('shopPlayersReadyUpdate', (data) => {
        shopReadyCount = data.readyCount;
        shopTotalPlayers = data.totalPlayers;
        console.log(`%c🏪 Joueurs prêts: ${shopReadyCount}/${shopTotalPlayers}`, 'color: #FFD700; font-weight: bold');
    });

    targetSocket.on('shopClosedAutomatically', (data) => {
        if (currentGameMode !== 'solo') {
            const isSecondary = source === 'secondary';
            if (isSecondary) {
                isShopOpenP2 = false;
                isPlayerReadyToContinueP2 = false;
                shopTimerStartP2 = null;
                shopItemsP2 = {};
                shopTypeP2 = 'classic';
                dutchAuctionStateP2 = null;
            } else {
                isShopOpen = false;
                isPlayerReadyToContinue = false;
                shopTimerStart = null;
                shopItems = {};
                shopType = 'classic';
                dutchAuctionState = null;
            }
            shopReadyCount = 0;
            shopTotalPlayers = 0;
            const reason = data?.reason ? String(data.reason) : 'auto';
            console.log(`%c🏪 SHOP FERMÉ (${reason}) | Retour au niveau`, 'color: #FFD700; font-weight: bold');
            levelStartTime = Date.now();
        }
    });

    // --- ÉVÉNEMENTS VOTE ---
    targetSocket.on('restartVoteStarted', (data) => {
        isVoteActive = true;
        voteStartTime = Date.now();
        myVote = null;
        console.log(`%c🗳️ VOTE POUR REDÉMARRER LANCÉ (${data.playerCount} joueur(s)) - Tapez O pour OUI, N/Aucun pour NON`, 'color: #FF00FF; font-weight: bold; font-size: 12px');
    });

    targetSocket.on('restartVoteFinished', (data) => {
        isVoteActive = false;
        myVote = null;
        
        if (data.shouldRestart) {
            voteResult = 'success';
            console.log(`%c✅ REDÉMARRAGE VALIDÉ! ${data.yesVotes}/${data.requiredYes} votes pour OUI`, 'color: #00FF00; font-weight: bold');
            
            isInTransition = true;
            isFirstLevel = true;
            transitionStartTime = Date.now();
            playerCountStart = data.playerCount;
            levelStartTime = Date.now() + TRANSITION_DURATION;
            level = 1;
            lastLevel = 1;
        } else {
            voteResult = 'failed';
            console.log(`%c❌ Vote rejeté: ${data.yesVotes}/${data.requiredYes} votes pour OUI`, 'color: #FF0000; font-weight: bold');
        }
        
        voteResultTime = Date.now();
    });

    targetSocket.on('lobbiesRebooting', (data) => {
        lobbiesRebooting = data.rebooting;
        if (data.rebooting) {
            console.log('⏳ Lobbies en redémarrage...');
            // Revenir au menu principal immédiatement
            showMainMenu();
            mainMenuGameStarting = false;
        } else {
            console.log('✅ Lobbies redémarrés et prêts!');
        }
    });

    targetSocket.on('returnToModeSelection', () => {
        if (source === 'secondary') {
            return; // Ignorer le socket secondaire pour éviter de fermer la session locale
        }

        console.log(`%c🎮 Retour à la sélection de mode!`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.style.display = 'flex';
        }
        
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('active');
        }
        
        selectedMode = null;
        level = 1;
        lastLevel = 0;
        map = null;
        currentPlayers = {};
        voteResult = null;
        inputsBlocked = false; // Débloquer les inputs
        currentGameMode = null; // Réinitialiser le mode courant
        
        console.log(`%c✨ Prêt à choisir un nouveau mode!`, 'color: #00FF00; font-weight: bold');
    });

    targetSocket.on('gameModSelected', (data) => {
        currentGameMode = data.mode;
        currentGameEndType = data.endType || 'multi';
        soloMaxLevel = data.mode === 'solo' ? 10 : 20;
    });

    targetSocket.on('gameFinished', (data) => {
        const endType = data.endType || currentGameEndType || 'multi';

        if (endType === 'solo') {
            console.log(`%c🏁 SOLO TERMINÉ! Temps total: ${data.totalTime?.toFixed(2) || 'N/A'}s`, 'color: #FF00FF; font-weight: bold; font-size: 16px');
            // Le flux solo complet est déjà géré ailleurs (soloGameState)
        } else {
            const modeLabel = (data.mode || currentGameMode || 'GAME').toUpperCase();
            console.log(`%c🏁 ${modeLabel} TERMINÉ! Vous avez atteint le niveau ${data.finalLevel}`, 'color: #00FFFF; font-weight: bold; font-size: 16px');
            
            isClassicGameFinished = true;
            classicEndScreenStartTime = Date.now();
            
            const players = Object.values(currentPlayers || {}).map(p => ({
                skin: p.skin,
                score: p.score,
                id: p.id
            }));
            
            const recordFallback = currentHighScore ? { skin: currentHighScore.skin, score: currentHighScore.score } : { skin: '❓', score: 0 };
            
            finalClassicData = {
                finalLevel: data.finalLevel,
                mode: data.mode,
                players: players,
                record: data.record || recordFallback,
                endType
            };
        }
    });

    targetSocket.on('soloBestSplits', (data) => {
        window.soloBestSplits = data.splits || {};
        soloBestSplits = data.splits || {};
        console.log(`%c📊 Meilleurs splits reçus: ${JSON.stringify(data.splits)}`, 'color: #00FF00; font-weight: bold');
    });

    targetSocket.on('modeSelectionRequired', (data) => {
        if (source === 'secondary') {
            return; // Ne pas casser l'écran principal si le socket secondaire demande un mode
        }

        console.log(`%c🔄 ${data.message}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        
        // Si le menu principal est visible, ne pas afficher le mode selector
        // L'utilisateur doit d'abord cliquer sur "Commencer"
        if (mainMenuVisible) {
            console.log('%c🎮 Menu principal affiché - mode selector masqué', 'color: #00BFFF');
            return;
        }
        
        if (data.reason === 'gameEnded') {
            console.log(`%c⏳ L'écran de fin s'affichera pendant 5 secondes...`, 'color: #FF6B6B; font-weight: bold');
            setTimeout(() => {
                isClassicGameFinished = false;
                isSoloGameFinished = false;
                currentGameMode = null;
                selectedMode = null; // Réinitialiser pour permettre Échap → menu principal
                inputsBlocked = false; // Débloquer les inputs
                
                const modeSelector = document.getElementById('modeSelector');
                if (modeSelector) {
                    modeSelector.style.display = 'flex';
                }
                
                console.log(`%c✅ Retour au sélecteur de mode!`, 'color: #00FF00; font-weight: bold');
            }, 5000);
        } else {
            isClassicGameFinished = false;
            isSoloGameFinished = false;
            currentGameMode = null;
            selectedMode = null; // Réinitialiser pour permettre Échap → menu principal
            inputsBlocked = false; // Débloquer les inputs
            
            const modeSelector = document.getElementById('modeSelector');
            if (modeSelector) {
                modeSelector.style.display = 'flex';
            }
        }
    });

    // --- ÉVÉNEMENTS VOTE RETOUR AU MODE ---
    targetSocket.on('returnToModeVoteStarted', (data) => {
        if (source === 'secondary') return;
        
        returnToModeVoteActive = true;
        returnToModeVoteTime = Date.now();
        console.log(`%c🗳️ Vote pour retour au mode commencé! Durée: ${data.timeoutSeconds || 30}s`, 'color: #FFD700; font-weight: bold');
    });

    targetSocket.on('returnToModeVoteFinished', (data) => {
        if (source === 'secondary') return;
        
        returnToModeVoteActive = false;
        returnToModeVoteTime = null;
        
        if (data.success) {
            console.log(`%c✅ Vote réussi! Retour au mode sélection...`, 'color: #00FF00; font-weight: bold');
            
            // Réinitialiser l'état du jeu
            isClassicGameFinished = false;
            isSoloGameFinished = false;
            isPaused = false;
            pauseMenuVisible = false;
            currentGameMode = null;
            selectedMode = null;
            map = [];
            currentPlayers = {};
            
            // Afficher le sélecteur de mode
            const modeSelector = document.getElementById('modeSelector');
            if (modeSelector) {
                modeSelector.style.display = 'flex';
            }
            
            mainMenuVisible = false;
        } else {
            console.log(`%c❌ Vote échoué. Poursuite du jeu...`, 'color: #FF6B6B; font-weight: bold');
        }
    });

    targetSocket.on('error', (data) => {
        console.log(`%c⚠️ ${data.message}`, 'color: #FFA500; font-weight: bold');
    });
}

// Attacher les événements sur le socket principal immédiatement
bindCoreSocketEvents(socket, 'primary');
