/**
 * solo-game-state.js
 * État du mode solo - LECTURE SEULE
 * Reçoit l'état complet du serveur via soloGameState event
 */

const SOLO_DEBUG = false;  // Set to true for verbose logging

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
}

/**
 * Recevoir l'événement soloGameState du serveur
 * S'appelle automatiquement à chaque tick serveur
 */
socket.on('soloGameState', (state) => {
    updateSoloGameState(state);
    if (SOLO_DEBUG) console.log(`📊 [SOLO STATE] Reçu état - Level ${soloGameState.currentLevel}, Time: ${soloGameState.runTotalTime.toFixed(2)}s`);
});

/**
 * Recevoir la confirmation que le jeu est fini
 */
socket.on('gameFinished', (data) => {
    if (data.error) {
        console.error(`❌ [SOLO] Erreur jeu: ${data.error}`);
        return;
    }
    
    soloGameState.isGameFinished = true;
    console.log(`🎉 [SOLO] Jeu terminé! Temps total: ${data.totalTime.toFixed(2)}s`);
    console.log(`📊 Splits: ${data.splits.map(s => s.toFixed(2)).join('s, ')}s`);
});

/**
 * Recevoir les meilleurs splits pour afficher le delta
 */
socket.on('soloBestSplits', (data) => {
    if (data && data.splits) {
        window.soloBestSplits = data.splits;
        if (SOLO_DEBUG) console.log(`🏆 [SOLO] Meilleurs splits reçus`);
    }
});

/**
 * Recevoir le leaderboard solo
 */
socket.on('soloLeaderboard', (data) => {
    if (data && data.leaderboard) {
        window.soloLeaderboard = data.leaderboard;
        if (SOLO_DEBUG) console.log(`📈 [SOLO] Leaderboard reçu (${data.leaderboard.length} entrées)`);
    }
});
