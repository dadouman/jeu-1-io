// socket-events.js - Tous les événements Socket.io

// --- ÉVÉNEMENTS CONNEXION ---
socket.on('init', (id) => {
    myPlayerId = id;
});

socket.on('connect', () => {
    if (!myPlayerId) myPlayerId = socket.id;
});

// --- ÉVÉNEMENTS JEU ---
socket.on('mapData', (data) => {
    map = data;
});

socket.on('requestSoloBestSplits', () => {
    // Le serveur demande qu'on lui demande les meilleurs splits
    socket.emit('getSoloBestSplits');
});

socket.on('highScoreUpdate', (data) => {
    currentHighScore = data;
    
    // En mode classique: sauvegarder le meilleur score personnel
    if (currentGameMode === 'classic') {
        classicLeaderboardBest = data.score; // Le record du lobby (qui est synchro avec MongoDB)
        
        // Charger le meilleur score personnel depuis localStorage
        const savedPersonalBest = localStorage.getItem('classicPersonalBest');
        if (savedPersonalBest) {
            classicPersonalBestScore = parseInt(savedPersonalBest);
        }
        
        // Si le joueur actuel a battu son record personnel, le sauvegarder
        const myPlayer = currentPlayers[myPlayerId];
        if (myPlayer && myPlayer.score > (classicPersonalBestScore || 0)) {
            classicPersonalBestScore = myPlayer.score;
            localStorage.setItem('classicPersonalBest', myPlayer.score.toString());
            console.log(`%c🎯 Nouveau record personnel classique! ${myPlayer.score}💎`, 'color: #00FF00; font-weight: bold');
        }
    }
});

socket.on('checkpointUpdate', (data) => {
    checkpoint = data;
});

socket.on('levelUpdate', (newLevel) => {
    // Événement pour classique/infini uniquement
    // Solo est géré via soloGameState
    if (currentGameMode === 'solo') return;
    
    // Détecter si c'est vraiment un changement de niveau
    if (newLevel !== lastLevel && lastLevel !== 0) {
        // Niveau a changé ! Déclencher la transition
        isInTransition = true;
        inputsBlocked = true; // BLOQUER LES INPUTS PENDANT LA TRANSITION
        transitionStartTime = Date.now();
        // Calculer le temps SEULEMENT si le timer était actif (pas null pendant le shop)
        levelUpTime = levelStartTime ? (Date.now() - levelStartTime) / 1000 : 0;
        levelUpPlayerSkin = myPlayerId ? (currentPlayers[myPlayerId]?.skin || "❓") : "❓";
        
        // Log de jeu
        const playerData = currentPlayers[myPlayerId];
        if (playerData) {
            console.log(`%c${levelUpPlayerSkin} Niveau ${lastLevel} complété en ${levelUpTime.toFixed(1)}s | ${playerData.gems}💎 | Score: ${playerData.score}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        }
        
        // ✅ DÉMARRER LE TIMER DU NIVEAU SUIVANT IMMÉDIATEMENT (pas après la transition)
        levelStartTime = Date.now();
    } else if (newLevel === 1 && lastLevel === 0) {
        // Premier niveau : déclencher une transition spéciale
        isInTransition = true;
        inputsBlocked = true; // BLOQUER LES INPUTS PENDANT LA TRANSITION
        isFirstLevel = true;
        transitionStartTime = Date.now();
        playerCountStart = Object.keys(currentPlayers).length;
        // ✅ DÉMARRER LE TIMER IMMÉDIATEMENT (le countdown cinéma se fera AVANT celle-ci via startCountdown())
        levelStartTime = Date.now();
    }
    
    level = newLevel;
    lastLevel = newLevel;
    
    checkpoint = null;
    trails = {};
});

// --- ÉVÉNEMENTS SHOP ---
// ===== ÉVÉNEMENTS SOLO REFACTORISÉS =====

/**
 * Événement soloGameState - Reçoit l'état complet du jeu solo du serveur
 * S'appelle à chaque tick du serveur (~60fps)
 */
socket.on('soloGameState', (state) => {
    updateSoloGameState(state);
});

// ===== ÉVÉNEMENTS SHOP (LEGACY - à conserver pour classique) =====

socket.on('shopOpen', (data) => {
    // Pour le mode classique et custom
    if (currentGameMode !== 'solo') {
        isShopOpen = true;
        isPlayerReadyToContinue = false;
        shopItems = data.items;
        shopTimerStart = Date.now();
        levelStartTime = null;
        
        // Initialiser le nombre total de joueurs (depuis gameState.players)
        shopTotalPlayers = Object.keys(gameState.players).length || 1;
        shopReadyCount = 0;
        
        const shopNumber = Math.floor(data.level / 5);
        console.log(`%c🏪 SHOP ${shopNumber} OUVERT | Appuyez sur 1,2,3,4 pour acheter (${shopTotalPlayers} joueur(s))`, 'color: #FFD700; font-weight: bold; font-size: 12px');
    }
});

socket.on('shopPurchaseSuccess', (data) => {
    if (data.itemId === 'speedBoost') {
        purchasedFeatures[data.itemId] = (purchasedFeatures[data.itemId] || 0) + 1;
    } else {
        purchasedFeatures[data.itemId] = true;
    }
    playerGems = data.gemsLeft;
    console.log(`%c✅ ${data.item.name} acheté! | ${data.gemsLeft}💎 restants`, 'color: #00FF00; font-weight: bold');
});

socket.on('shopPurchaseFailed', (data) => {
    console.log(`%c❌ ${data.reason} | Vous avez ${data.current}/${data.required} 💎`, 'color: #FF6B6B; font-weight: bold');
});

socket.on('shopClosed', (data) => {
    // Pour les modes classique et custom (pas solo)
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

socket.on('shopPlayersReadyUpdate', (data) => {
    // Mettre à jour le compteur des joueurs prêts
    shopReadyCount = data.readyCount;
    shopTotalPlayers = data.totalPlayers;
    console.log(`%c🏪 Joueurs prêts: ${shopReadyCount}/${shopTotalPlayers}`, 'color: #FFD700; font-weight: bold');
});

socket.on('shopClosedAutomatically', (data) => {
    // Le shop a été fermé automatiquement par timeout
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
socket.on('restartVoteStarted', (data) => {
    isVoteActive = true;
    voteStartTime = Date.now();
    myVote = null;
    console.log(`%c🗳️ VOTE POUR REDÉMARRER LANCÉ (${data.playerCount} joueur(s)) - Tapez O pour OUI, N/Aucun pour NON`, 'color: #FF00FF; font-weight: bold; font-size: 12px');
});

socket.on('restartVoteFinished', (data) => {
    isVoteActive = false;
    myVote = null;
    
    if (data.shouldRestart) {
        voteResult = 'success';
        console.log(`%c✅ REDÉMARRAGE VALIDÉ! ${data.yesVotes}/${data.requiredYes} votes pour OUI`, 'color: #00FF00; font-weight: bold');
        
        // Déclencher la transition de début de partie
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

socket.on('returnToModeSelection', () => {
    console.log(`%c🎮 Retour à la sélection de mode!`, 'color: #FFD700; font-weight: bold; font-size: 14px');
    
    // Afficher l'écran de sélection de mode
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
    }
    
    // Masquer les contrôles mobiles
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.classList.remove('active');
    }
    
    // Réinitialiser les variables du jeu
    selectedMode = null;
    level = 1;
    lastLevel = 0;
    map = null;
    currentPlayers = {};
    voteResult = null;
    
    console.log(`%c✨ Prêt à choisir un nouveau mode!`, 'color: #00FF00; font-weight: bold');
});

socket.on('gameModSelected', (data) => {
    currentGameMode = data.mode;
    soloMaxLevel = data.mode === 'solo' ? 10 : 20;
    // Pour solo: le serveur gère tout l'état via soloGameState
});

socket.on('gameFinished', (data) => {
    // Événement générique pour tous les modes
    if (currentGameMode === 'solo') {
        // Solo - l'état est géré via soloGameState
        console.log(`%c🏁 SOLO TERMINÉ! Temps total: ${data.totalTime?.toFixed(2) || 'N/A'}s`, 'color: #FF00FF; font-weight: bold; font-size: 16px');
    } else if (currentGameMode === 'classic' || currentGameMode === 'infinite') {
        // Classique/Infini - Afficher l'écran de fin
        console.log(`%c🏁 ${currentGameMode.toUpperCase()} TERMINÉ! Vous avez atteint le niveau ${data.finalLevel}`, 'color: #00FFFF; font-weight: bold; font-size: 16px');
        
        // Activer l'écran de fin
        isClassicGameFinished = true;
        classicEndScreenStartTime = Date.now();
        
        // Préparer les données finales avec les joueurs triés par score
        const players = Object.values(gameState.players || {}).map(p => ({
            skin: p.skin,
            score: p.score,
            id: p.id
        }));
        
        finalClassicData = {
            finalLevel: data.finalLevel,
            mode: data.mode,
            players: players,
            record: currentHighScore ? { skin: currentHighScore.skin, score: currentHighScore.score } : null
        };
});

socket.on('soloBestSplits', (data) => {
    // Événement reçu du serveur avec les meilleurs splits
    window.soloBestSplits = data.splits || {};
    // Synchroniser avec la variable globale utilisée par le renderer
    soloBestSplits = data.splits || {};
    console.log(`%c📊 Meilleurs splits reçus: ${JSON.stringify(data.splits)}`, 'color: #00FF00; font-weight: bold');
});

socket.on('error', (data) => {
    console.log(`%c⚠️ ${data.message}`, 'color: #FFA500; font-weight: bold');
});
