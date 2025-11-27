const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
  console.log('Nouveau joueur : ' + socket.id);

  players[socket.id] = {
    x: Math.random() * 500,
    y: Math.random() * 500,
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
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
  });
});

setInterval(() => {
  io.emit('state', players);
}, 1000 / 60);

server.listen(3000, () => {
  console.log('Serveur prêt : http://localhost:3000');
});