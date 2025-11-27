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

socket.on('state', (gameState) => {
  const players = gameState.players;
  const coin = gameState.coin;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pour faciliter le dessin, on dit que x,y est le coin haut-gauche du texte
  ctx.textBaseline = "top"; 

  // 1. DESSINER LA PIÈCE (Diamant)
  ctx.font = "40px Arial";
  ctx.fillText("💎", coin.x, coin.y);

  // 2. DESSINER LES JOUEURS
  for (let id in players) {
    const p = players[id];
    
    // On dessine l'emoji du joueur
    ctx.font = "40px Arial";
    ctx.fillText(p.skin, p.x, p.y);
    
    // On dessine le score juste au-dessus
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    // Petit calcul pour centrer le score au dessus de l'emoji
    ctx.fillText("Score: " + p.score, p.x+5, p.y +5);
  }
});