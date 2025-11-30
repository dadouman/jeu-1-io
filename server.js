const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require('mongoose'); // NOUVEAU : Import de mongoose

const { generateMap, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');

app.use(express.static('public'));

// --- 1. CONNEXION BASE DE DONNÉES ---
// Remplace <password> par ton vrai mot de passe (sans les chevrons < >)
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connecté à MongoDB !'))
    .catch(err => console.error('Erreur MongoDB:', err));

// --- 2. DÉFINITION DU MODÈLE (À quoi ressemble un record ?) ---
const HighScoreSchema = new mongoose.Schema({
    score: Number,
    skin: String,
    date: { type: Date, default: Date.now }
});
const HighScore = mongoose.model('HighScore', HighScoreSchema);

// --- 3. VARIABLES DU JEU ---
let players = {};
const map = generateMap();
let coin = getRandomEmptyPosition(map);
const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃","💩"];

// Variable pour stocker le record actuel en mémoire (pour aller vite)
let globalHighScore = { score: 0, skin: 'UNKNOWN' };

// Au démarrage, on va chercher le vrai record dans la base de données
HighScore.findOne().sort({ score: -1 }).then(record => {
    if (record) {
        globalHighScore = { score: record.score, skin: record.skin };
        console.log(`Record actuel chargé : ${record.score} par ${record.skin}`);
    }
});

io.on('connection', (socket) => {
    socket.emit('mapData', map);

    const startPos = getRandomEmptyPosition(map);
    players[socket.id] = {
        x: startPos.x,
        y: startPos.y,
        score: 0,
        skin: skins[Math.floor(Math.random() * skins.length)]
    };

    socket.on('disconnect', () => { delete players[socket.id]; });

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

        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        }
    });
});

setInterval(() => {
    for (const id in players) {
        const p = players[id];
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        if (dist < 30) {
            p.score++;
            coin = getRandomEmptyPosition(map);
            
            // --- 4. VÉRIFICATION DU RECORD ---
            if (p.score > globalHighScore.score) {
                // Mise à jour locale (rapide)
                globalHighScore = { score: p.score, skin: p.skin };
                
                // Sauvegarde en base de données (asynchrone)
                const newRecord = new HighScore({ score: p.score, skin: p.skin });
                newRecord.save().then(() => console.log("Nouveau record sauvegardé !"));
            }
        }
    }

    // On envoie le record actuel aux joueurs pour l'affichage
    io.emit('state', { players, coin, highScore: globalHighScore });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});