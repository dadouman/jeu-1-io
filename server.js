const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
    cors: {
        origin: "*", // Autorise tout le monde (Important pour Render)
        methods: ["GET", "POST"]
    }
});
const mongoose = require('mongoose');

// IMPORTANT : On n'utilise PLUS 'fs' (fichiers) car on est sur le Cloud
// const fs = require('fs'); // <--- Supprimé volontairement

// Import de nos modules perso (Vérifie que le dossier 'utils' est bien là)
const { generateMap, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');

app.use(express.static('public'));

// --- 1. CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;

// Sécurité pour éviter le crash si la variable manque
if (!mongoURI) {
    console.warn("⚠️ ATTENTION : Pas de MONGO_URI configuré ! Le HighScore ne sera pas sauvegardé.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connecté à MongoDB !'))
        .catch(err => console.error('❌ Erreur connexion Mongo :', err));
}

// --- 2. MODÈLE DE DONNÉES ---
const HighScoreSchema = new mongoose.Schema({
    score: Number,
    skin: String
});
const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);

// --- 3. INITIALISATION DU JEU ---
let players = {};
// On génère la map une seule fois au démarrage
const map = generateMap();
// On place la pièce
let coin = getRandomEmptyPosition(map);
// Liste des skins
const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃","💩", "🤣"];

// Variable mémoire pour le record (pour aller vite)
let currentRecord = { score: 0, skin: "❓" };

// FONCTION : Charger le record depuis la BDD au démarrage
async function loadHighScore() {
    if (!mongoURI) return; // Si pas de BDD, on ne fait rien

    try {
        // On cherche le premier document
        let doc = await HighScoreModel.findOne();
        if (doc) {
            currentRecord = { score: doc.score, skin: doc.skin };
            console.log(`🏆 Record chargé : ${doc.score} par ${doc.skin}`);
            // NOUVEAU : On met à jour les joueurs si jamais ils sont déjà connectés
            io.emit('highScoreUpdate', currentRecord);
        } else {
            // Si la base est vide, on crée le premier record à 0
            const newRecord = new HighScoreModel({ score: 0, skin: "❓" });
            await newRecord.save();
            console.log("🆕 Base vide, record initialisé à 0");
        }
    } catch (err) {
        console.error("Erreur chargement record:", err);
    }
}
// On lance le chargement immédiatement
loadHighScore();

// --- 4. GESTION DES JOUEURS (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log('Joueur connecté : ' + socket.id);

    socket.emit('init', socket.id); 

    // A. Envoyer la carte et le record actuel
    socket.emit('mapData', map);
    socket.emit('highScoreUpdate', currentRecord);

    // B. Créer le joueur avec un skin aléatoire
    const startPos = getRandomEmptyPosition(map);
    players[socket.id] = {
        x: startPos.x,
        y: startPos.y,
        score: 0,
        skin: skins[Math.floor(Math.random() * skins.length)]
    };

    // C. Déconnexion
    socket.on('disconnect', () => {
        delete players[socket.id];
    });

    // D. Mouvement
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

        // Vérification Collision Mur
        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        }
    });
});

// --- 5. BOUCLIER DU JEU (60 FPS) ---
setInterval(() => {
    let recordChanged = false;

    for (const id in players) {
        const p = players[id];
        
        // Vérification Collision Pièce (Distance < 30px)
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        if (dist < 30) {
            p.score++;
            coin = getRandomEmptyPosition(map);

            // GESTION RECORD
            if (p.score > currentRecord.score) {
                currentRecord.score = p.score;
                currentRecord.skin = p.skin;
                recordChanged = true;
            }
        }
    }

    // Si le record a été battu pendant ce tour
    if (recordChanged) {
        // 1. On prévient tout le monde
        io.emit('highScoreUpdate', currentRecord);

        // 2. On sauvegarde en BDD (si connectée)
        if (mongoURI) {
            // updateOne met à jour le premier document trouvé (il n'y en a qu'un)
            HighScoreModel.updateOne({}, { score: currentRecord.score, skin: currentRecord.skin }).exec();
        }
    }

    // Envoi de l'état du monde
    io.emit('state', { players, coin });

}, 1000 / 60);

// --- 6. DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});