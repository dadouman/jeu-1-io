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

socket.on('highScoreUpdate', (data) => {
    currentHighScore = data;
});

socket.on('checkpointUpdate', (data) => {
    checkpoint = data;
});

socket.on('levelUpdate', (newLevel) => {
    // Détecter si c'est vraiment un changement de niveau
    if (newLevel !== lastLevel && lastLevel !== 0) {
        // Niveau a changé ! Déclencher la transition
        console.log(`📥 [LEVEL UPDATE] Reçu levelUpdate: ${newLevel} (lastLevel était ${lastLevel})`);
        isInTransition = true;
        transitionStartTime = Date.now();
        // Calculer le temps SEULEMENT si le timer était actif (pas null pendant le shop)
        levelUpTime = levelStartTime ? (Date.now() - levelStartTime) / 1000 : 0;
        levelUpPlayerSkin = myPlayerId ? (currentPlayers[myPlayerId]?.skin || "❓") : "❓";
        
        // Log de jeu
        const playerData = currentPlayers[myPlayerId];
        if (playerData) {
            console.log(`%c${levelUpPlayerSkin} Niveau ${lastLevel} complété en ${levelUpTime.toFixed(1)}s | ${playerData.gems}💎 | Score: ${playerData.score}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        }
    } else if (newLevel === 1 && lastLevel === 0) {
        console.log(`📥 [FIRST LEVEL] Premier niveau`);
        // Premier niveau : déclencher une transition spéciale
        isInTransition = true;
        isFirstLevel = true;
        transitionStartTime = Date.now();
        playerCountStart = Object.keys(currentPlayers).length;
        levelStartTime = Date.now() + TRANSITION_DURATION;
    }
    
    level = newLevel;
    lastLevel = newLevel;
    
    // Si c'est une vraie transition (pas le premier niveau), attendre 3s
    if (lastLevel > 1 && !isFirstLevel) {
        levelStartTime = Date.now() + TRANSITION_DURATION;
    }
    
    checkpoint = null;
    trails = {};
});

// --- ÉVÉNEMENTS SHOP ---
socket.on('shopOpen', (data) => {
    console.log(`🏪 [SHOP OPEN EVENT] Reçu shopOpen avec level: ${data.level}`);
    isShopOpen = true;
    shopItems = data.items;
    shopTimerStart = Date.now();
    // PAUSE le temps du niveau pendant que le shop est ouvert
    levelStartTime = null;
    const shopNumber = Math.floor(data.level / 5);
    console.log(`%c🏪 SHOP ${shopNumber} OUVERT | Appuyez sur 1,2,3,4 pour acheter`, 'color: #FFD700; font-weight: bold; font-size: 12px');
});

socket.on('shopPurchaseSuccess', (data) => {
    purchasedFeatures[data.itemId] = true;
    playerGems = data.gemsLeft;
    console.log(`%c✅ ${data.item.name} acheté! | ${data.gemsLeft}💎 restants`, 'color: #00FF00; font-weight: bold');
});

socket.on('shopPurchaseFailed', (data) => {
    console.log(`%c❌ ${data.reason} | Vous avez ${data.current}/${data.required} 💎`, 'color: #FF6B6B; font-weight: bold');
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
    console.log(`%c🎮 Mode de jeu confirmé: ${data.mode === 'classic' ? '40 NIVEAUX 🎯' : 'MODE INFINI ∞'}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
});

socket.on('gameFinished', (data) => {
    console.log(`%c🏁 Jeu terminé! Vous avez atteint le niveau ${data.finalLevel} en mode ${data.mode}`, 'color: #00FFFF; font-weight: bold; font-size: 16px');
});

socket.on('error', (data) => {
    console.log(`%c⚠️ ${data.message}`, 'color: #FFA500; font-weight: bold');
});
