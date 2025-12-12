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
    playerModes
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

app.use(express.static('public'));

// --- MIDDLEWARE ---
app.use(express.json({ limit: '50mb' }));  // Augmenter la limite pour les screenshots base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- INITIALISATION DU SERVICE D'EMAIL ---
emailService.initialize().then(success => {
    if (success) {
        console.log('✅ Service d\'email initialisé');
    } else {
        console.log('⚠️  Service d\'email désactivé');
    }
});

// --- ROUTES API ---
app.use('/api/bugs', bugRoutes);

// --- INITIALISATION DU LABYRINTHE INITIAL ---
const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
lobbies.classic.map = generateMaze(15, 15);
lobbies.classic.coin = getRandomEmptyPosition(lobbies.classic.map);
lobbies.infinite.map = generateMaze(15, 15);
lobbies.infinite.coin = getRandomEmptyPosition(lobbies.infinite.map);

// --- INITIALISATION DES ÉVÉNEMENTS SOCKET ---
initializeSocketEvents(io, lobbies, soloSessions, playerModes, {
    SoloRunModel,
    SoloBestSplitsModel,
    mongoURI
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
