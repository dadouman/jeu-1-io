const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuster le canvas à la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let map = [];
let inputs = { up: false, down: false, left: false, right: false };

// Réception de la map
socket.on('mapData', (data) => {
    map = data;
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

// Boucle d'envoi des inputs
setInterval(() => {
    socket.emit('movement', inputs);
}, 1000 / 60);

// Boucle de réception et dessin
socket.on('state', (gameState) => {
    renderGame(ctx, canvas, map, gameState, socket.id);
});