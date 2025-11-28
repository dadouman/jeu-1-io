const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Import de nos modules perso
const { generateMap, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');

app.use(express.static('public'));

// --- INITIALISATION DU JEU ---
let players = {};
const map = generateMap(); // On génère la map une seule fois au lancement
let coin = getRandomEmptyPosition(map);

const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃","💩"];

io.on('connection', (socket) => {
    console.log(`Joueur connecté : ${socket.id}`);

    // 1. On envoie la carte au joueur qui vient d'arriver
    socket.emit('mapData', map);

    // 2. On crée le joueur
    const startPos = getRandomEmptyPosition(map);
    players[socket.id] = {
        x: startPos.x,
        y: startPos.y,
        score: 0,
        skin: skins[Math.floor(Math.random() * skins.length)]
    };

    socket.on('disconnect', () => {
        delete players[socket.id];
    });

    socket.on('movement', (input) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 5;
        let nextX = player.x;
        let nextY = player.y;

        if (input.left) nextX -= speed;
        if (input.right) nextX += speed;
        if (input.up) nextY -= speed;
        if (input.down) nextY += speed;

        // On ne valide le mouvement QUE si pas de collision
        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        }
    });
});

// BOUCLE DE JEU (60 FPS)
setInterval(() => {
    // Vérification collision Joueur <-> Pièce
    for (const id in players) {
        const p = players[id];
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        if (dist < 30) { // Si touché
            p.score++;
            coin = getRandomEmptyPosition(map);
            io.emit('sound', 'coin'); // Bonus: on pourrait jouer un son
        }
    }

    // On envoie tout le monde aux clients
    io.emit('state', { players, coin });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});