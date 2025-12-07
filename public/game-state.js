// game-state.js - Variables d'état du jeu centralisées

// --- CONFIGURATION SOCKET ---
const socket = io({
    transports: ['websocket'],
    upgrade: false
});

// --- VARIABLES DU JEU ---
let map = [];
let inputs = { up: false, down: false, left: false, right: false };
let inputsMomentum = { up: 0, down: 0, left: 0, right: 0 }; // Inertie pour les touches
const MOMENTUM_DECAY = 0.85; // 85% de l'inertie persiste par frame
let currentHighScore = null;
let myPlayerId = null;

// --- VARIABLES NIVEAU ---
let level = 1;
let levelStartTime = null;
let lastLevel = 0;

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
let soloCheckpoints = [];
let isSoloGameFinished = false;
let soloFinishedTime = null;
let soloSessionStartTime = null; // Temps de démarrage de la session solo
let currentGameMode = null; // 'classic', 'infinite', 'solo'
let isExpressMode = false; // true si solo-express, false si solo standard
let soloMaxLevel = 20; // 20 pour solo standard, 10 pour solo express
let soloCurrentLevelTime = 0; // Temps du niveau actuel
let soloPersonalBestTime = null; // Meilleur temps personnel (localStorage)
let soloLeaderboardBest = null; // Meilleur temps du leaderboard (record mondial)
let soloShowPersonalDelta = true; // Toggle: true = delta personnel, false = delta mondial
let soloInactiveTime = 0; // Temps total d'inactivité (shop + transition)
let soloShopStartTime = null; // Temps de début du shop
let soloTransitionStartTime = null; // Temps de début de la transition
