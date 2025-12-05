try {
    require('dotenv').config();
} catch (e) {
    console.log("On est sur Render (ou dotenv manquant), on utilise les variables d'environnement directes.");
}
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');

// Configuration Socket.io pour Render
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// IMPORTANT : On importe la NOUVELLE fonction 'generateMaze'
const { generateMaze, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');

app.use(express.static('public'));

// --- CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.warn("⚠️ Pas de MONGO_URI. Le HighScore ne sera pas sauvegardé.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connecté à MongoDB !'))
        .catch(err => console.error('❌ Erreur Mongo :', err));
}

// Modèle HighScore
const HighScoreSchema = new mongoose.Schema({ score: Number, skin: String });
const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);

// --- INITIALISATION DU JEU ---
let players = {};

// VARIABLES DU ROGUE-LIKE
let currentLevel = 1;
// On commence petit (15x15)
// ATTENTION : On utilise 'let' car la map va changer, et on appelle generateMaze(15, 15)
let map = generateMaze(15, 15); 
let coin = getRandomEmptyPosition(map);

const skins = ["👻", "👽", "🤖", "🦄", "🐷", "🐸", "🐵", "🐶", "🦁", "🎃","💩", "🤣"];
let currentRecord = { score: 0, skin: "❓" };

// Palette de couleurs pour les joueurs (distinctes et visibles)
const playerColors = [
    "#FF6B6B", // Rouge
    "#4ECDC4", // Cyan
    "#FFE66D", // Jaune
    "#95E1D3", // Menthe
    "#F38181", // Rose
    "#AA96DA", // Violet
    "#FCBAD3", // Rose pâle
    "#A8D8EA", // Bleu ciel
    "#FFB4A2", // Corail
    "#E0AFA0"  // Beige
];

function getPlayerColor(playerIndex) {
    return playerColors[playerIndex % playerColors.length];
}

// Chargement du record
async function loadHighScore() {
    if (!mongoURI) return;
    try {
        let doc = await HighScoreModel.findOne();
        if (doc) {
            currentRecord = { score: doc.score, skin: doc.skin };
            console.log(`🏆 Record chargé : ${doc.score}`);
        } else {
            const newRecord = new HighScoreModel({ score: 0, skin: "❓" });
            await newRecord.save();
        }
    } catch (err) { console.error(err); }
}
loadHighScore();

// --- GESTION JOUEURS ---
io.on('connection', (socket) => {
    console.log('Joueur connecté : ' + socket.id);
    
    // Init immédiat
    socket.emit('init', socket.id);
    socket.emit('mapData', map);
    socket.emit('levelUpdate', currentLevel); // On envoie le niveau actuel
    socket.emit('highScoreUpdate', currentRecord);

    const startPos = getRandomEmptyPosition(map);
    players[socket.id] = {
        x: startPos.x,
        y: startPos.y,
        score: 0,
        skin: skins[Math.floor(Math.random() * skins.length)],
        checkpoint: null, // Le checkpoint du joueur
        trail: [], // L'historique des positions
        color: getPlayerColor(Object.keys(players).length) // Couleur unique par joueur
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
            
            // Ajouter la position à la trace du joueur
            // On garde seulement les 200 dernières positions pour éviter une charge trop grande
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 200) {
                player.trail.shift(); // Supprimer la plus ancienne position
            }
        }
    });

    // Gestion des checkpoints
    socket.on('checkpoint', (actions) => {
        const player = players[socket.id];
        if (!player) return;

        // Appui sur Espace : créer ou déplacer le checkpoint
        if (actions.setCheckpoint) {
            player.checkpoint = {
                x: player.x,
                y: player.y
            };
            console.log(`🚩 Checkpoint créé pour ${socket.id} à (${player.checkpoint.x}, ${player.checkpoint.y})`);
            socket.emit('checkpointUpdate', player.checkpoint);
        }

        // Appui sur R : téléporter au checkpoint
        if (actions.teleportCheckpoint && player.checkpoint) {
            player.x = player.checkpoint.x;
            player.y = player.checkpoint.y;
            console.log(`✨ Téléportation de ${socket.id} au checkpoint`);
        }
    });
});

// --- BOUCLE DE JEU ---
setInterval(() => {
    let recordChanged = false;
    let levelChanged = false;

    for (const id in players) {
        const p = players[id];
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        // --- COLLISION AVEC LA PIÈCE ---
        if (dist < 30) {
            p.score++;
            
            // 1. ON AUGMENTE LE NIVEAU
            currentLevel++;
            levelChanged = true;

            // 2. ON AGRANDIT LE LABYRINTHE
            // Taille de base 15 + (2 cases par niveau)
            const newSize = 15 + (currentLevel * 2);
            map = generateMaze(newSize, newSize); // Génération du nouveau labyrinthe
            
            // 3. ON DÉPLACE LA PIÈCE
            coin = getRandomEmptyPosition(map);

            // 4. ON TÉLÉPORTE TOUS LES JOUEURS (Sécurité anti-mur)
            for (let pid in players) {
                const safePos = getRandomEmptyPosition(map);
                players[pid].x = safePos.x;
                players[pid].y = safePos.y;
                // Réinitialiser le checkpoint et la trace
                players[pid].checkpoint = null;
                players[pid].trail = [];
            }

            // Gestion Record
            if (p.score > currentRecord.score) {
                currentRecord.score = p.score;
                currentRecord.skin = p.skin;
                recordChanged = true;
            }
            
            // Si on a trouvé la pièce, on arrête la boucle des joueurs ici 
            // pour éviter que 2 joueurs la prennent en même temps
            break; 
        }
    }

    // SI LE NIVEAU A CHANGÉ
    if (levelChanged) {
        io.emit('mapData', map); // On envoie la nouvelle carte
        io.emit('levelUpdate', currentLevel); // On prévient du niveau
        console.log(`🆙 Niveau ${currentLevel} généré !`);
    }

    // SI LE RECORD A CHANGÉ
    if (recordChanged) {
        io.emit('highScoreUpdate', currentRecord);
        if (mongoURI) {
            HighScoreModel.updateOne({}, { score: currentRecord.score, skin: currentRecord.skin }).exec();
        }
    }

    io.emit('state', { players, coin });

}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});