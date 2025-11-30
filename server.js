const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require('mongoose');

// On supprime 'fs' car on n'utilise plus de fichiers locaux
// const fs = require('fs'); <--- POUBELLE !

// Import de nos modules perso
const { generateMap, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');

app.use(express.static('public'));

// --- 1. CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("⚠️ ATTENTION : Pas de MONGO_URI configuré !");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connecté à MongoDB !'))
        .catch(err => console.error('❌ Erreur Mongo :', err));
}

// --- 2. CRÉATION DU MODÈLE DE DONNÉES ---
// On définit à quoi ressemble un HighScore dans la base
const HighScoreSchema = new mongoose.Schema({
    score: Number,
    skin: String
});
const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);

// --- INITIALISATION DU JEU ---
let players = {};
const map = generateMap();
let coin = getRandomEmptyPosition(map);
const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃"];

// Variable locale pour stocker le record en mémoire (pour éviter de demander à la BDD 60 fois par seconde)
let currentRecord = { score: 0, skin: "❓" };

// Au démarrage, on va chercher le record dans la BDD
async function loadHighScore() {
    try {
        // On cherche le premier (et unique) record
        let doc = await HighScoreModel.findOne();
        if (doc) {
            currentRecord = { score: doc.score, skin: doc.skin };
            console.log(`🏆 Record chargé depuis Mongo : ${doc.score}`);
        } else {
            // Si la base est vide, on en crée un à 0
            const newRecord = new HighScoreModel({ score: 0, skin: "❓" });
            await newRecord.save();
            console.log("🆕 Base vide, création du record à 0");
        }
    } catch (err) {
        console.error("Erreur chargement record:", err);
    }
}
// On lance le chargement
if (mongoURI) loadHighScore();


io.on('connection', (socket) => {
    // 1. Envoyer la map
    socket.emit('mapData', map);
    
    // 2. Envoyer le record actuel
    socket.emit('highScoreUpdate', currentRecord);

    // 3. Créer le joueur
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

        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        }
    });
});

// BOUCLE DE JEU
setInterval(() => {
    for (const id in players) {
        const p = players[id];
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        if (dist < 30) {
            p.score++;
            coin = getRandomEmptyPosition(map);

            // --- GESTION DU RECORD VIA MONGO ---
            if (p.score > currentRecord.score) {
                // 1. Mise à jour mémoire locale (rapide)
                currentRecord.score = p.score;
                currentRecord.skin = p.skin;
                
                // 2. Prévenir tout le monde
                io.emit('highScoreUpdate', currentRecord);

                // 3. Sauvegarde en BDD (Asynchrone, on ne bloque pas le jeu)
                if (mongoURI) {
                    // On met à jour le premier document qu'on trouve
                    HighScoreModel.updateOne({}, { score: p.score, skin: p.skin }).exec();
                }
            }
        }
    }
    io.emit('state', { players, coin });
}, 1000 / 60);

// Configuration du port pour Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});