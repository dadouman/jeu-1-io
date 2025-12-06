// server-config.js - Configuration du serveur, base de données, constantes

const mongoose = require('mongoose');

// --- CONSTANTES (Doit correspondre au client) ---
const SHOP_DURATION = 15000; // 15 secondes (ms)
const TRANSITION_DURATION = 3000; // 3 secondes (ms)

// --- CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.warn("⚠️ Pas de MONGO_URI. Le HighScore ne sera pas sauvegardé.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connecté à MongoDB !'))
        .catch(err => console.error('❌ Erreur Mongo :', err));
}

// --- MODÈLES MONGODB ---

// Modèle HighScore
const HighScoreSchema = new mongoose.Schema({ score: Number, skin: String });
const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);

// Modèle SoloRun - Pour tracker les résultats du mode solo
const SoloRunSchema = new mongoose.Schema({
    playerId: String,
    playerSkin: String,
    totalTime: Number, // Temps total en secondes
    checkpoints: [Number], // Array des temps de chaque niveau
    finalLevel: { type: Number, default: 20 },
    createdAt: { type: Date, default: Date.now }
});
const SoloRunModel = mongoose.model('SoloRun', SoloRunSchema);

// --- INITIALISATION DES LOBBIES ---
const lobbies = {
    classic: {
        players: {},
        currentLevel: 1,
        levelStartTime: Date.now(),
        map: null,
        coin: null,
        currentRecord: { score: 0, skin: "❓" },
        restartVote: {
            isActive: false,
            votes: {},
            startTime: null,
            VOTE_TIMEOUT: 60000
        }
    },
    infinite: {
        players: {},
        currentLevel: 1,
        levelStartTime: Date.now(),
        map: null,
        coin: null,
        currentRecord: { score: 0, skin: "❓" },
        restartVote: {
            isActive: false,
            votes: {},
            startTime: null,
            VOTE_TIMEOUT: 60000
        }
    }
};

// Solo sessions - chaque joueur a sa propre session solo
const soloSessions = {};

// Tracker le mode de chaque joueur
const playerModes = {};

// Chargement du record depuis MongoDB
async function loadHighScore() {
    if (!mongoURI) return;
    try {
        let doc = await HighScoreModel.findOne();
        if (doc) {
            lobbies.classic.currentRecord = { score: doc.score, skin: doc.skin };
            lobbies.infinite.currentRecord = { score: doc.score, skin: doc.skin };
            console.log(`🏆 Record chargé : ${doc.score}`);
        } else {
            const newRecord = new HighScoreModel({ score: 0, skin: "❓" });
            await newRecord.save();
        }
    } catch (err) {
        console.error(err);
    }
}
loadHighScore();

module.exports = {
    SHOP_DURATION,
    TRANSITION_DURATION,
    mongoURI,
    HighScoreModel,
    SoloRunModel,
    lobbies,
    soloSessions,
    playerModes
};
