// game-state.js - Variables d'état du jeu centralisées

// --- CONFIGURATION SOCKET ---
const socket = io({
    transports: ['websocket'],
    upgrade: false
});

// --- VARIABLES DU JEU ---
let map = [];
let coin = null; // Position de la pièce (gems)
let inputs = { up: false, down: false, left: false, right: false };
let inputsMomentum = { up: 0, down: 0, left: 0, right: 0 }; // Inertie pour les touches
const MOMENTUM_DECAY = 0.85; // 85% de l'inertie persiste par frame
let currentHighScore = null;
let myPlayerId = null;

// --- VARIABLES NIVEAU ---
let level = 1;
let levelStartTime = null;
let lastLevel = 0;

// --- VARIABLES COUNTDOWN (Solo Mode Only) ---
let countdownActive = false; // Countdown actuellement en cours
let countdownStartTime = null; // Timestamp du démarrage du countdown
let inputsBlocked = false; // Bloquer inputs pendant countdown (0-3000ms)

// --- VARIABLES CHECKPOINT ---
let checkpoint = null;
let actions = { setCheckpoint: false, teleportCheckpoint: false, dash: false };

// --- VARIABLES TRACES ---
let trails = {}; // { playerId: { color, positions } }

// --- VARIABLES SHOP ---
let isShopOpen = false;
let shopItems = {};
let playerGems = 0;
let purchasedFeatures = {};
let shopTimerStart = null;
let shopAnimations = { hoveredItemId: null, purchaseAnimations: {} }; // Animations du shop
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
let currentGameMode = null; // 'classic', 'infinite', 'solo'
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

// === FONCTION POUR DÉMARRER LE COUNTDOWN ===
function startCountdown() {
    if (!countdownActive) {
        countdownActive = true;
        countdownStartTime = Date.now();
        inputsBlocked = true;
        levelStartTime = null;
        console.log('%c🎬 Countdown lancé!', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
    }
}
