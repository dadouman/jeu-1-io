// server/index.js - Point d'entrée principal du serveur
// Ce fichier importe et coordonne tous les modules du serveur

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

// --- IMPORT DES MODULES ---
const {
    SHOP_DURATION,
    TRANSITION_DURATION,
    mongoURI,
    HighScoreModel,
    SoloRunModel,
    SoloBestSplitsModel,
    lobbies,
    soloSessions,
    playerModes,
    setIsRebooting,
    getIsRebooting
} = require('./config');

const {
    calculateMazeSize,
    getShopItemsForMode,
    emitToLobby
} = require('./utils');

const {
    startRestartVote,
    submitRestartVote,
    checkRestartVote,
    finishRestartVote,
    restartGame
} = require('./vote');

const { startGameLoop } = require('./game-loop');
const { initializeSocketEvents } = require('./socket-events');
const bugRoutes = require('./bug-routes');
const emailService = require('./email-service');

// Configuration Socket.io pour Render
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- MIDDLEWARE SOCKET.IO - BLOQUER PENDANT REDÉMARRAGE ---
io.use((socket, next) => {
    if (getIsRebooting && getIsRebooting()) {
        console.log(`⏳ MIDDLEWARE: Connexion refusée - Lobbies en redémarrage`);
        return next(new Error('Les lobbies se redémarrent actuellement. Veuillez patienter...'));
    }
    next();
});

const path = require('path');
app.use(express.static('public'));

// Route GET / pour servir l'index.html à la racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- MIDDLEWARE ---
app.use(express.json({ limit: '50mb' }));  // Augmenter la limite pour les screenshots base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ROUTES API ---
app.use('/api/bugs', bugRoutes);

// --- INITIALISATION DU SERVICE D'EMAIL ---
// NOTE: Email init est async mais ne bloque pas le serveur
console.log('🔧 Initialisation du service d\'email...');
emailService.initialize().then(success => {
    if (success) {
        console.log('✅ Service d\'email initialisé et prêt');
    } else {
        console.log('⚠️  Service d\'email désactivé - bugs seront sauvegardés mais pas notifiés');
    }
}).catch(err => {
    console.error('❌ Erreur lors de l\'initialisation du service d\'email:', err.message);
});

// --- INITIALISATION DU LABYRINTHE INITIAL ---
const { generateMaze, generateMazeAdvanced, getRandomEmptyPosition } = require('../utils/map');
lobbies.classic.map = generateMaze(15, 15);
lobbies.classic.coin = getRandomEmptyPosition(lobbies.classic.map);
lobbies.classicPrim.map = generateMazeAdvanced(15, 15, { algorithm: 'prim', density: 0.5 });
lobbies.classicPrim.coin = getRandomEmptyPosition(lobbies.classicPrim.map);
lobbies.infinite.map = generateMaze(15, 15);
lobbies.infinite.coin = getRandomEmptyPosition(lobbies.infinite.map);

// --- INITIALISATION DES ÉVÉNEMENTS SOCKET ---
initializeSocketEvents(io, lobbies, soloSessions, playerModes, {
    SoloRunModel,
    SoloBestSplitsModel,
    mongoURI,
    setIsRebooting,
    getIsRebooting
}, {
    startRestartVoteFunc: startRestartVote,
    submitRestartVoteFunc: submitRestartVote,
    checkRestartVoteFunc: checkRestartVote,
    restartGameFunc: restartGame
});

// --- DÉMARRAGE DE LA BOUCLE DE JEU ---
startGameLoop(io, lobbies, soloSessions, playerModes, {
    calculateMazeSize,
    getShopItemsForMode,
    emitToLobby
}, {
    mongoURI,
    HighScoreModel,
    SoloRunModel,
    SoloBestSplitsModel,
    TRANSITION_DURATION,
    SHOP_DURATION
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = server;
