const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));

let players = {};
// 1. Création de la pièce au démarrage
let coin = {
  x: Math.random() * 700,
  y: Math.random() * 500
};

io.on('connection', (socket) => {
  console.log('Nouveau joueur : ' + socket.id);

  players[socket.id] = {
    x: Math.random() * 700,
    y: Math.random() * 500,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    score: 0 // 2. On ajoute le score à 0
  };

  socket.on('disconnect', () => {
    delete players[socket.id];
  });

  socket.on('movement', (data) => {
    const player = players[socket.id] || {};
    const speed = 5;
    if (data.left) player.x -= speed;
    if (data.up) player.y -= speed;
    if (data.right) player.x += speed;
    if (data.down) player.y += speed;

    // Garder le joueur dans l'écran (limites)
    if(player.x < 0) player.x = 0;
    if(player.x > 780) player.x = 780;
    if(player.y < 0) player.y = 0;
    if(player.y > 580) player.y = 580;
  });
});

// BOUCLE DU JEU
setInterval(() => {
  // 3. Vérification des collisions (Serveur fait autorité)
  for (const id in players) {
    const player = players[id];
    // Formule simple de collision entre deux carrés
    if (
      player.x < coin.x + 20 &&
      player.x + 20 > coin.x &&
      player.y < coin.y + 20 &&
      player.y + 20 > coin.y
    ) {
      // TOUCHÉ !
      player.score++; // Augmente le score
      // Déplace la pièce ailleurs
      coin.x = Math.random() * 700;
      coin.y = Math.random() * 500;
      
      // Petit message dans la console serveur
      console.log(`Le joueur ${id} a marqué ! Score: ${player.score}`);
    }
  }

  // 4. On envoie TOUT : les joueurs ET la pièce
  io.emit('state', { players, coin });
}, 1000 / 60);

server.listen(3000, () => {
  console.log('Jeu lancé sur http://localhost:3000');
});