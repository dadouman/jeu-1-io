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
        if (currentGameMode !== 'solo') {
            isShopOpen = true;
            isPlayerReadyToContinue = false;
            shopItems = data.items;
            shopTimerStart = Date.now();
            levelStartTime = null;
            
            shopTotalPlayers = currentPlayers ? Object.keys(currentPlayers).length : 1;
            shopReadyCount = 0;
            
            const shopNumber = Math.floor(data.level / 5);
            console.log(`%c🏪 SHOP ${shopNumber} OUVERT | Appuyez sur 1,2,3,4,5 pour acheter (${shopTotalPlayers} joueur(s))`, 'color: #FFD700; font-weight: bold; font-size: 12px');
        }
    });

    targetSocket.on('shopPurchaseSuccess', (data) => {
        if (data.itemId === 'speedBoost') {
            purchasedFeatures[data.itemId] = (purchasedFeatures[data.itemId] || 0) + 1;
        } else {
            purchasedFeatures[data.itemId] = true;
        }
        playerGems = data.gemsLeft;
        console.log(`%c✅ ${data.item.name} acheté! | ${data.gemsLeft}💎 restants`, 'color: #00FF00; font-weight: bold');
    });

    targetSocket.on('shopPurchaseFailed', (data) => {
        console.log(`%c❌ ${data.reason} | Vous avez ${data.current}/${data.required} 💎`, 'color: #FF6B6B; font-weight: bold');
    });

    targetSocket.on('shopClosed', () => {
        if (currentGameMode !== 'solo') {
            isShopOpen = false;
            isPlayerReadyToContinue = false;
            shopReadyCount = 0;
            shopTotalPlayers = 0;
            shopItems = {};
            console.log(`%c🏪 SHOP FERMÉ | Retour au niveau`, 'color: #FFD700; font-weight: bold');
            levelStartTime = Date.now();
        }
    });

    targetSocket.on('shopPlayersReadyUpdate', (data) => {
        shopReadyCount = data.readyCount;
        shopTotalPlayers = data.totalPlayers;
        console.log(`%c🏪 Joueurs prêts: ${shopReadyCount}/${shopTotalPlayers}`, 'color: #FFD700; font-weight: bold');
    });

    targetSocket.on('shopClosedAutomatically', () => {
        if (currentGameMode !== 'solo') {
            isShopOpen = false;
            isPlayerReadyToContinue = false;
            shopReadyCount = 0;
            shopTotalPlayers = 0;
            shopItems = {};
            console.log(`%c🏪 SHOP FERMÉ (TIMEOUT) | Retour au niveau`, 'color: #FFD700; font-weight: bold');
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
        
        if (data.reason === 'gameEnded') {
            console.log(`%c⏳ L'écran de fin s'affichera pendant 5 secondes...`, 'color: #FF6B6B; font-weight: bold');
            setTimeout(() => {
                isClassicGameFinished = false;
                isSoloGameFinished = false;
                currentGameMode = null;
                
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
            
            const modeSelector = document.getElementById('modeSelector');
            if (modeSelector) {
                modeSelector.style.display = 'flex';
            }
        }
    });

    targetSocket.on('error', (data) => {
        console.log(`%c⚠️ ${data.message}`, 'color: #FFA500; font-weight: bold');
    });
}

// Attacher les événements sur le socket principal immédiatement
bindCoreSocketEvents(socket, 'primary');
