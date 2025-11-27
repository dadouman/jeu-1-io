const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));

let players = {};
// La pièce est maintenant un diamant
let coin = { x: 300, y: 300 };

// 1. LISTE DES SKINS (Tu peux en rajouter d'autres !)
const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃", "💩", "🤠"];

io.on('connection', (socket) => {
  console.log('Nouveau joueur : ' + socket.id);

  // 2. CHOIX DU SKIN ALÉATOIRE
  const randomSkin = skins[Math.floor(Math.random() * skins.length)];

  players[socket.id] = {
    x: Math.random() * 700,
    y: Math.random() * 500,
    score: 0,
    skin: randomSkin // On stocke l'emoji ici
  };

  socket.on('disconnect', () => {
    delete players[socket.id];
  });

  socket.on('movement', (data) => {
    const player = players[socket.id] || {};
    const speed = 5; // Vitesse constante
    
    if (data.left) player.x -= speed;
    if (data.up) player.y -= speed;
    if (data.right) player.x += speed;
    if (data.down) player.y += speed;

    // Limites du terrain
    if(player.x < 0) player.x = 0;
    if(player.x > 760) player.x = 760;
    if(player.y < 0) player.y = 0;
    if(player.y > 560) player.y = 560;
  });
});

setInterval(() => {
  for (const id in players) {
    const player = players[id];
    
    // Collision simple (on considère que l'emoji fait 40x40 pixels)
    if (
      player.x < coin.x + 40 &&
      player.x + 40 > coin.x &&
      player.y < coin.y + 40 &&
      player.y + 40 > coin.y
    ) {
      player.score++;
      coin.x = Math.random() * 700;
      coin.y = Math.random() * 500;
    }
  }
  io.emit('state', { players, coin });
}, 1000 / 60);

server.listen(3000, () => {
  console.log('Serveur Skins prêt !');
});