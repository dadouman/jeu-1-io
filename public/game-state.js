// game-state.js - Variables d'état du jeu centralisées

// --- CONFIGURATION SOCKET ---
// Socket principal (joueur 1)
const socket = io({
    transports: ['polling', 'websocket'],  // Polling d'abord pour réveiller Render, puis upgrade WebSocket
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
});

// Socket secondaire (joueur 2 local en split-screen). Instancié uniquement si nécessaire.
let socketSecondary = null;

// --- VARIABLES DU JEU ---
let map = [];
let coin = null; // Position de la pièce (gems)
let inputs = { up: false, down: false, left: false, right: false };
let inputsMomentum = { up: 0, down: 0, left: 0, right: 0 }; // Inertie pour les touches
// Joueur 2 (split-screen)
let inputsP2 = { up: false, down: false, left: false, right: false };
let inputsMomentumP2 = { up: 0, down: 0, left: 0, right: 0 };
const MOMENTUM_DECAY = 0.85; // 85% de l'inertie persiste par frame
let currentHighScore = null;
let myPlayerId = null; // Joueur 1
let myPlayerIdSecondary = null; // Joueur 2 (split)
let isPaused = false; // Pause globale
let pauseMenuVisible = false; // Overlay pause affiché
let lastPauseToggleSource = null; // keyboard-escape, gamepad-start, etc.
let gamepadEnabled = false; // Autoriser la manette à piloter les inputs
let isGamepadConnected = false; // Présence d'une manette détectée
let activeGamepadName = '';
let gamepadStatusMessage = '';
let gamepadStatusMessageTime = 0;
// Zones cliquables du menu pause (renseignées par le renderer)
const pauseMenuClickAreas = { gamepad: null, split: null, returnToMode: null };

// --- VARIABLES NIVEAU ---
let level = 1;
let levelStartTime = null;
let lastLevel = 0;

// --- VARIABLES COUNTDOWN (Solo Mode Only) ---
let soloStartCountdownActive = false; // Countdown actuellement en cours
let soloStartCountdownStartTime = null; // Timestamp du démarrage du countdown
let inputsBlocked = false; // Bloquer inputs pendant countdown (0-3000ms)

// --- VARIABLES CHECKPOINT ---
let checkpoint = null;
let actions = { setCheckpoint: false, teleportCheckpoint: false, dash: false };
// Actions joueur 2 (split-screen)
let actionsP2 = { setCheckpoint: false, teleportCheckpoint: false, dash: false };

// --- VARIABLES TRACES ---
let trails = {}; // { playerId: { color, positions } }

// --- VARIABLES SHOP ---
let isShopOpen = false;
let shopItems = {};
let shopType = 'classic'; // 'classic' | 'dutchAuction'
let dutchAuctionState = null; // { type, gridSize, tickMs, lots: [...] }
let dutchAuctionTickAnchor = null; // Date.now() du dernier update serveur (affichage "prochain prix")
let playerGems = 0;
let purchasedFeatures = {};
let playerGemsP2 = 0;
let purchasedFeaturesP2 = {};
let playerGemsById = {};
let purchasedFeaturesById = {};
let shopTimerStart = null;
let shopAnimations = { hoveredItemId: null, purchaseAnimations: {} }; // Animations du shop
let isPlayerReadyToContinue = false; // Joueur prêt à continuer du shop

// Split-screen: état shop séparé pour le joueur 2
let isShopOpenP2 = false;
let shopItemsP2 = {};
let shopTypeP2 = 'classic'; // 'classic' | 'dutchAuction'
let dutchAuctionStateP2 = null;
let dutchAuctionTickAnchorP2 = null;
let shopTimerStartP2 = null;
let shopAnimationsP2 = { hoveredItemId: null, purchaseAnimations: {} };
let isPlayerReadyToContinueP2 = false;

// Routing clavier: quel écran/shop est actif (mis à jour via mousemove/click)
let activeShopSide = 'primary'; // 'primary' | 'secondary'
let shopReadyCount = 0; // Nombre de joueurs prêts à continuer
let shopTotalPlayers = 0; // Nombre total de joueurs dans le shop
const SHOP_DURATION = 15000; // 15 secondes

// --- VARIABLES TRANSITION ---
let isInTransition = false;
let transitionStartTime = null;
const TRANSITION_DURATION = 3000; // 3 secondes
let levelUpPlayerSkin = null;
let levelUpTime = 0;
let currentPlayers = {};
let isFirstLevel = false;
let playerCountStart = 0;

// --- VARIABLES VOTE ---
let isVoteActive = false;
let voteStartTime = null;
let myVote = null;
const VOTE_TIMEOUT = 60000; // 60 secondes
let voteResult = null; // 'success' | 'failed' | null
let voteResultTime = null;

// --- VARIABLES SOLO MODE ---
let soloTotalTime = 0;
let soloSplitTimes = [];
let isSoloGameFinished = false;
let soloFinishedTime = null;
let soloSessionStartTime = null; // Temps de démarrage de la session solo
var currentGameMode = null; // 'classic', 'infinite', 'solo' (var pour accès global)
let currentGameEndType = 'multi'; // 'multi' (podium) | 'solo' (speedrun)
let soloMaxLevel = 10; // Solo: toujours 10 niveaux
let soloCurrentLevelTime = 0; // Temps du niveau actuel
let soloPersonalBestTime = null; // Meilleur temps personnel (localStorage)
let soloPersonalBestSplits = {}; // Meilleurs splits personnels: { 1: 12.3, 2: 26.8, ... }
let soloLeaderboardBest = null; // Meilleur temps du leaderboard (record mondial)
let soloBestSplits = {}; // Meilleurs splits mondiaux: { 1: 12.1, 2: 26.5, ... }
let soloShowPersonalDelta = true; // Toggle: true = delta personnel, false = delta mondial
let soloInactiveTime = 0; // Temps total d'inactivité (shop + transition)
let soloShopStartTime = null; // Temps de début du shop
let soloTransitionStartTime = null; // Temps de début de la transition
let soloLastGemTime = null; // Temps quand la gem a été prise (pour afficher delta 1-2s)
let soloLastGemLevel = null; // Niveau quand la gem a été prise

// --- MODE CLASSIQUE RECORDS ---
let classicPersonalBestScore = null; // Meilleur score personnel (localStorage)
let classicLeaderboardBest = null; // Meilleur score du leaderboard (record mondial)
let classicShowPersonalDelta = true; // Toggle: true = personnel, false = world record

// --- FIN DU JEU CLASSIQUE/INFINI ---
let isClassicGameFinished = false; // Le jeu classique/infini est terminé
let finalClassicData = null; // Données finales: { finalLevel, mode, players, record }
let classicEndScreenStartTime = null; // Timestamp du début de l'écran de fin

// --- MODE SPLIT-SCREEN LOCAL ---
let splitScreenEnabled = false; // Option activée via le menu pause
let splitScreenPending = false; // Évite les doubles requêtes
let secondarySocketEventsBound = false;

function enableSplitScreen() {
    if (splitScreenEnabled || splitScreenPending) return true;
    if (!currentGameMode) {
        console.warn('⚠️ Split-screen indisponible: aucun mode en cours.');
        return false;
    }

    splitScreenPending = true;
    // Créer un second socket pour le joueur 2
    socketSecondary = io({
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 800,
        timeout: 20000
    });

    // Attacher les événements du socket secondaire
    if (typeof bindCoreSocketEvents === 'function') {
        bindCoreSocketEvents(socketSecondary, 'secondary');
        secondarySocketEventsBound = true;
    }

    // Brancher la réception d'état pour le rendu split
    if (typeof attachSecondaryStateListener === 'function') {
        attachSecondaryStateListener();
    }

    splitScreenEnabled = true;
    splitScreenPending = false;
    console.log('✅ Mode split-screen activé');
    return true;
}

function disableSplitScreen() {
    if (typeof detachSecondaryStateListener === 'function') {
        detachSecondaryStateListener();
    }
    if (socketSecondary) {
        try { socketSecondary.disconnect(); } catch (e) {}
    }
    socketSecondary = null;
    myPlayerIdSecondary = null;
    splitScreenEnabled = false;
    splitScreenPending = false;
    secondarySocketEventsBound = false;
    // Réinitialiser les inputs/actions du joueur 2
    inputsP2 = { up: false, down: false, left: false, right: false };
    inputsMomentumP2 = { up: 0, down: 0, left: 0, right: 0 };
    actionsP2 = { setCheckpoint: false, teleportCheckpoint: false, dash: false };
    console.log('🛑 Mode split-screen désactivé');
}

function toggleSplitScreen() {
    if (splitScreenEnabled) {
        disableSplitScreen();
        return false;
    }
    return enableSplitScreen();
}

// === FONCTION POUR DÉMARRER LE COUNTDOWN ===
function startCountdown() {
    if (!soloStartCountdownActive && !cinematicCountdownActive) {
        soloStartCountdownActive = true;
        soloStartCountdownStartTime = Date.now();
        inputsBlocked = true;
        levelStartTime = null;
        
        // Lancer le countdown cinématique
        startCinemaCountdown(() => {
            // ✅ DÉVERROUILLER LES INPUTS À LA FIN DU COUNTDOWN
            inputsBlocked = false;
            
            // ✅ DÉMARRER LE TIMER DU JEU À 00:00.00
            // IMPORTANT: Définir levelStartTime ET soloSessionStartTime au MÊME moment
            // Pour que soloRunTotalTime soit calculé à partir de ce point
            const now = Date.now();
            levelStartTime = now;
            soloSessionStartTime = now;
            soloInactiveTime = 0;
        }, currentGameMode);
    }
}

// --- VARIABLES MENU PRINCIPAL ---
// mainMenuVisible et mainMenuSelectedIndex sont définis dans main-menu.js
var lastGamepadYInput = 0; // Dernière valeur Y du stick gauche (pour éviter les inputs répétés)
