/**
 * solo-game-state.js
 * État du mode solo - LECTURE SEULE
 * Reçoit l'état complet du serveur via soloGameState event
 */

let soloGameState = {
    // Joueur
    player: null,
    
    // Niveaux
    currentLevel: 1,
    maxLevel: 10,
    isGameFinished: false,
    
    // Timings (envoyés par le serveur)
    runTotalTime: 0,        // Temps depuis le début de la run
    currentLevelTime: 0,    // Temps du level actuel
    splitTimes: [],         // Historique des splits
    
    // UI - Countdown
    countdown: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0
    },
    
    // UI - Shop
    shop: {
        active: false,
        duration: 15000,
        startTime: null,
        elapsed: 0,
        items: {}
    },
    
    // UI - Transition
    transition: {
        active: false,
        duration: 3000,
        startTime: null,
        elapsed: 0
    },
    
    // Map
    map: [],
    coin: null
};

/**
 * Recevoir l'état complet du serveur
 * À appeler à chaque événement soloGameState du serveur
 * @param {Object} newState - État reçu du serveur
 */
function updateSoloGameState(newState) {
    if (!newState) return;
    
    // Sauvegarder l'ancien niveau pour détecter les changements
    const previousLevel = soloGameState.currentLevel;
    const previousSplitCount = soloGameState.splitTimes ? soloGameState.splitTimes.length : 0;
    
    // Fusionner l'état du serveur avec l'état local
    soloGameState = {
        ...soloGameState,
        ...newState
    };
    
    // Calculer les timings d'affichage côté client (pour smooth animations)
    if (soloGameState.countdown.startTime) {
        soloGameState.countdown.elapsed = Date.now() - soloGameState.countdown.startTime;
    }
    if (soloGameState.shop.startTime) {
        soloGameState.shop.elapsed = Date.now() - soloGameState.shop.startTime;
    }
    if (soloGameState.transition.startTime) {
        soloGameState.transition.elapsed = Date.now() - soloGameState.transition.startTime;
    }
    
    // === SYNCHRONISER LES SPLIT TIMES ===
    // Mettre à jour soloSplitTimes (variable globale) depuis soloGameState
    if (newState.splitTimes && Array.isArray(newState.splitTimes)) {
        soloSplitTimes = newState.splitTimes;
        
        // Détecter si un nouveau split a été ajouté (= gem prise)
        if (newState.splitTimes.length > previousSplitCount && previousSplitCount >= 0) {
            // Un nouveau split! Sauvegarder pour l'affichage du delta
            soloLastGemTime = Date.now();
            soloLastGemLevel = previousLevel;
            // Le temps du level qui vient d'être terminé
            levelUpTime = newState.splitTimes[newState.splitTimes.length - 1];
        }
    }
    
    // === SYNCHRONISER AVEC LES VARIABLES GLOBALES POUR LE RENDERER ===
    // Le renderer utilise les variables globales: map, currentPlayers, coin, level
    // On doit les mettre à jour à partir de soloGameState
    
    // Mettre à jour la map
    if (newState.map && newState.map.length > 0) {
        map = newState.map;
    }
    
    // Mettre à jour la position du coin (gem)
    if (newState.coin) {
        coin = newState.coin;
    }
    
    // Mettre à jour le niveau
    if (newState.currentLevel) {
        level = newState.currentLevel;
    }
    
    // Mettre à jour le joueur dans currentPlayers (pour le renderer)
    // Le renderer attend currentPlayers[myPlayerId]
    // Utiliser socket.id si myPlayerId n'est pas encore défini
    const playerId = myPlayerId || (typeof socket !== 'undefined' ? socket.id : null);
    if (newState.player && playerId) {
        currentPlayers[playerId] = newState.player;
        
        // S'assurer que myPlayerId est défini
        if (!myPlayerId) {
            myPlayerId = playerId;
        }
        
        // Mettre à jour les gems et features pour l'affichage HUD
        playerGems = newState.player.gems || 0;
        purchasedFeatures = newState.player.purchasedFeatures || {};
        
        // === METTRE À JOUR LES TRAILS POUR LA ROPE ===
        // Le renderer affiche les trails basé sur la variable globale `trails`
        if (newState.player.trail && newState.player.purchasedFeatures && newState.player.purchasedFeatures.rope) {
            // La rope est achetée, afficher la trace
            trails[playerId] = {
                color: newState.player.color,
                positions: newState.player.trail
            };
        } else {
            // La rope n'est pas achetée, supprimer la trace
            delete trails[playerId];
        }
    }
    
    // === SYNCHRONISER LE SHOP ===
    // Mettre à jour isShopOpen et shopItems depuis soloGameState.shop
    if (newState.shop) {
        const wasShopClosed = isShopOpen && !newState.shop.active;
        isShopOpen = newState.shop.active || false;
        
        // Initialiser le compteur du shop quand il s'ouvre
        if (newState.shop.active && !wasShopClosed) {
            isPlayerReadyToContinue = false;
            shopTotalPlayers = 1; // Solo = 1 joueur
            shopReadyCount = 0;
        }
        
        // Réinitialiser quand le shop ferme
        if (wasShopClosed) {
            isPlayerReadyToContinue = false;
            shopReadyCount = 0;
            shopTotalPlayers = 0;
        }
        
        // Convertir le tableau d'items en objet avec ID comme clé (si nécessaire)
        if (newState.shop.items) {
            if (Array.isArray(newState.shop.items)) {
                // C'est un tableau, convertir en objet {id: item, ...}
                shopItems = {};
                newState.shop.items.forEach(item => {
                    if (item && item.id) {
                        shopItems[item.id] = item;
                    }
                });
            } else if (typeof newState.shop.items === 'object' && Object.keys(newState.shop.items).length > 0) {
                // C'est déjà un objet
                shopItems = newState.shop.items;
            }
        }
        
        // Définir shopTimerStart pour le timer du shop
        if (newState.shop.active && !shopTimerStart) {
            shopTimerStart = newState.shop.startTime || Date.now();
        } else if (!newState.shop.active) {
            shopTimerStart = null;
        }
    }
    
    // Mettre à jour le mode de jeu
    currentGameMode = 'solo';
}

/**
 * Recevoir l'événement soloGameState du serveur
 * S'appelle automatiquement à chaque tick serveur
 */
socket.on('soloGameState', (state) => {
    updateSoloGameState(state);
});

/**
 * Recevoir la confirmation que le jeu est fini
 */
socket.on('gameFinished', (data) => {
    // Ignorer si on reçoit un gameFinished d'un autre mode (classic/custom) ou sans totalTime
    if (currentGameMode !== 'solo') {
        return;
    }

    if (data.error) {
        console.error(`❌ [SOLO] Erreur jeu: ${data.error}`);
        return;
    }

    if (typeof data.totalTime !== 'number' || Number.isNaN(data.totalTime)) {
        console.warn('⚠️ [SOLO] gameFinished reçu sans totalTime valide; ignoré');
        return;
    }

    const total = data.totalTime;
    soloGameState.isGameFinished = true;
    isSoloGameFinished = true;
    console.log(`🎉 [SOLO] Jeu terminé! Temps total: ${total.toFixed(2)}s`);
    
    // === SAUVEGARDER LES MEILLEURS SPLITS PERSONNELS DANS LOCALSTORAGE ===
    if (data.splitTimes && Array.isArray(data.splitTimes)) {
        // Charger les splits existants depuis localStorage
        let savedSplits = {};
        try {
            const saved = localStorage.getItem('soloPersonalBestSplits');
            if (saved) {
                savedSplits = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Erreur lors du chargement des splits:', e);
        }
        
        // Comparer et sauvegarder les meilleurs temps pour chaque niveau
        let hasNewBest = false;
        data.splitTimes.forEach((splitTime, index) => {
            const level = index + 1;
            if (typeof splitTime !== 'number' || Number.isNaN(splitTime)) {
                console.warn(`⚠️ [SOLO] Split invalide ignoré (level ${level})`);
                return;
            }
            if (!savedSplits[level] || splitTime < savedSplits[level]) {
                savedSplits[level] = splitTime;
                hasNewBest = true;
                console.log(`%c🏆 Nouveau meilleur split niveau ${level}: ${splitTime.toFixed(2)}s`, 'color: #00FF00; font-weight: bold');
            }
        });
        
        if (hasNewBest) {
            localStorage.setItem('soloPersonalBestSplits', JSON.stringify(savedSplits));
        }
        
        // Mettre à jour la variable globale
        soloPersonalBestSplits = savedSplits;
    }
    
    // Sauvegarder le meilleur temps total
    if (data.totalTime) {
        const savedBestTime = localStorage.getItem('soloPersonalBestTime');
        if (!savedBestTime || data.totalTime < parseFloat(savedBestTime)) {
            localStorage.setItem('soloPersonalBestTime', data.totalTime.toString());
            soloPersonalBestTime = data.totalTime;
            console.log(`%c🏆 Nouveau record personnel: ${data.totalTime.toFixed(2)}s!`, 'color: #00FF00; font-weight: bold; font-size: 16px');
        }
    }
});

/**
 * Recevoir les meilleurs splits pour afficher le delta
 */
socket.on('soloBestSplits', (data) => {
    if (data && data.splits) {
        window.soloBestSplits = data.splits;
    }
});

/**
 * Recevoir le leaderboard solo
 */
socket.on('soloLeaderboard', (data) => {
    if (data && data.leaderboard) {
        window.soloLeaderboard = data.leaderboard;
    }
});
