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
        destX: startPos.x,
        destY: startPos.y,
        score: 0,
        skin: skins[Math.floor(Math.random() * skins.length)]
    };

    socket.on('disconnect', () => { delete players[socket.id]; });

socket.on('movement', (input) => {
        const player = players[socket.id];
        if (!player) return;

        // VITESSE DU JEU
        // IMPORTANT : 40 (taille case) doit être divisible par speed (5). 
        // 40 / 5 = 8 frames pour faire une case. C'est fluide.
        const speed = 5; 
        const TILE_SIZE = 40;

        // CAS 1 : Le joueur est en train de se déplacer vers une case
        // On continue de le faire avancer tant qu'il n'est pas pile sur la destination
        if (player.x !== player.destX || player.y !== player.destY) {
            
            if (player.x < player.destX) player.x += speed;
            else if (player.x > player.destX) player.x -= speed;
            
            if (player.y < player.destY) player.y += speed;
            else if (player.y > player.destY) player.y -= speed;

        } 
        // CAS 2 : Le joueur est arrivé sur une case (Aligné)
        // On a le droit de choisir une nouvelle direction
        else {
            // On regarde où le joueur VEUT aller
            let nextX = player.x;
            let nextY = player.y;

            // On priorise les axes pour éviter les diagonales bizarres
            if (input.up) nextY -= TILE_SIZE;
            else if (input.down) nextY += TILE_SIZE;
            else if (input.left) nextX -= TILE_SIZE;
            else if (input.right) nextX += TILE_SIZE;

            // Si la destination a changé ET qu'il n'y a pas de mur
            if ((nextX !== player.x || nextY !== player.y) && !checkWallCollision(nextX, nextY, map)) {
                // On valide la nouvelle destination !
                // Au prochain tour de boucle, le CAS 1 va prendre le relais pour le déplacer
                player.destX = nextX;
                player.destY = nextY;
            }
        }
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