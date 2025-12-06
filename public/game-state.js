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
