// 1. Configuration forcée en WebSocket (Meilleur pour Render)
const socket = io({
    transports: ['websocket'],
    upgrade: false
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuster le canvas à la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// VARIABLES DU JEU
let map = [];
let inputs = { up: false, down: false, left: false, right: false };
let currentHighScore = null;
let myPlayerId = null; // <--- LA VARIABLE QUI VA NOUS SAUVER

// --- RÉCEPTION DE L'ID (Le Correctif) ---
socket.on('init', (id) => {
    console.log("🆔 ID reçu du serveur via 'init' :", id);
    myPlayerId = id; // On le stocke manuellement
});

socket.on('connect', () => {
    console.log("✅ Socket connecté ! ID natif :", socket.id);
    // Si on n'a pas encore reçu l'init, on prend celui-là au cas où
    if (!myPlayerId) myPlayerId = socket.id;
});

// Réception de la map
socket.on('mapData', (data) => {
    console.log("🗺️ Map reçue (" + data.length + " lignes)");
    map = data;
});

// Réception du record
socket.on('highScoreUpdate', (data) => {
    currentHighScore = data;
});

// Gestion Clavier
document.addEventListener('keydown', (e) => {
    if(e.code === 'ArrowUp') inputs.up = true;
    if(e.code === 'ArrowDown') inputs.down = true;
    if(e.code === 'ArrowLeft') inputs.left = true;
    if(e.code === 'ArrowRight') inputs.right = true;
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'ArrowUp') inputs.up = false;
    if(e.code === 'ArrowDown') inputs.down = false;
    if(e.code === 'ArrowLeft') inputs.left = false;
    if(e.code === 'ArrowRight') inputs.right = false;
});

// Envoi des mouvements
setInterval(() => {
    socket.emit('movement', inputs);
}, 1000 / 60);

// BOUCLE DE DESSIN
socket.on('state', (gameState) => {
    // C'est ici que la magie opère :
    // On utilise notre ID manuel (s'il existe), sinon l'ID natif
    const finalId = myPlayerId || socket.id;

    if (typeof renderGame === "function") {
        renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore);
    }
});