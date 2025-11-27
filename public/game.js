const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const movement = { up: false, down: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
  switch(event.code) {
    case 'ArrowUp': movement.up = true; break;
    case 'ArrowDown': movement.down = true; break;
    case 'ArrowLeft': movement.left = true; break;
    case 'ArrowRight': movement.right = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch(event.code) {
    case 'ArrowUp': movement.up = false; break;
    case 'ArrowDown': movement.down = false; break;
    case 'ArrowLeft': movement.left = false; break;
    case 'ArrowRight': movement.right = false; break;
  }
});

setInterval(() => {
  socket.emit('movement', movement);
}, 1000 / 60);

// RECEPTION DES DONNEES (Joueurs + Pièce)
socket.on('state', (gameState) => {
  const players = gameState.players;
  const coin = gameState.coin;

  // 1. Nettoyer l'écran
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. DESSINER LA PIÈCE (Or)
  ctx.fillStyle = "#FFD700"; // Jaune or
  ctx.beginPath();
  // On la fait un peu ronde
  ctx.arc(coin.x + 10, coin.y + 10, 10, 0, 2 * Math.PI); 
  ctx.fill();
  ctx.strokeStyle = "orange";
  ctx.stroke();

  // 3. DESSINER LES JOUEURS
  for (let id in players) {
    const p = players[id];
    
    // Le Carré
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 20, 20);

    // Le Score (Texte au dessus du joueur)
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(p.score, p.x+5, p.y-5);
  }
});