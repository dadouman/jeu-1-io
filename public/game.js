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

  // 1. Nettoyer l'écran
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Configuration du texte pour le jeu
  ctx.textBaseline = "top"; 

  // 2. DESSINER LA PIÈCE (Diamant)
  ctx.font = "40px Arial";
  ctx.fillText("💎", coin.x, coin.y);

  // 3. DESSINER LES JOUEURS
  for (let id in players) {
    const p = players[id];
    ctx.font = "40px Arial";
    ctx.fillText(p.skin, p.x, p.y);
    
    // Score au dessus du joueur
    //ctx.fillStyle = "black";
    //ctx.font = "14px Arial";
    //ctx.fillText(p.score, p.x, p.y );
  }

  // ============================================
  // 4. GESTION DU CLASSEMENT (LEADERBOARD)
  // ============================================

  // A. On transforme l'objet 'players' en tableau pour pouvoir le trier
  // Object.values(players) crée une liste : [{score: 10, skin...}, {score: 5, skin...}]
  const playerArray = Object.values(players);

  // B. On trie du plus grand score au plus petit
  playerArray.sort((a, b) => b.score - a.score);

  // C. On ne garde que le Top 5 (pour pas envahir l'écran)
  const top5 = playerArray.slice(0, 5);

  // D. On dessine la boîte du classement (Coin haut-droit)
  const boxWidth = 150;
  const startX = canvas.width - boxWidth - 10;
  const startY = 10;

  // Fond semi-transparent
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; 
  ctx.fillRect(startX, startY, boxWidth, (top5.length * 25) + 35);
  
  // Titre "Classement"
  ctx.fillStyle = "#FFD700"; // Couleur Or
  ctx.font = "bold 16px Arial";
  ctx.fillText("🏆 CLASSEMENT", startX + 5, startY + 10);

  // Liste des joueurs
  ctx.font = "14px Arial";
  ctx.fillStyle = "white";

  top5.forEach((player, index) => {
    // Ex: "1. 👽 : 12"
    const text = `${index + 1}. ${player.skin} : ${player.score}`;
    ctx.fillText(text, startX + 15, startY + 35 + (index * 25));
  });
});