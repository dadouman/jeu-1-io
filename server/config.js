// server/config.js - Configuration du serveur, base de données, constantes

const mongoose = require('mongoose');

// --- CONSTANTES (Doit correspondre au client) ---
const SHOP_DURATION = 15000; // 15 secondes (ms)
const TRANSITION_DURATION = 3000; // 3 secondes (ms)

// --- CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.warn("⚠️ Pas de MONGO_URI. Le HighScore et les résultats solo ne seront pas sauvegardés.");
    console.warn("   Pour activer la sauvegarde, définis la variable d'environnement MONGO_URI");
} else {
    console.log("📡 Tentative de connexion à MongoDB...");
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
    mode: { type: String, default: 'solo' },
    totalTime: Number, // Temps total en secondes
    splitTimes: [Number], // Array des temps intermédiaires pour chaque niveau (cumulatifs)
    finalLevel: { type: Number, default: 10 }, // Solo toujours 10 niveaux
    personalBestTime: { type: Number, default: null }, // Meilleur temps personnel (total)
    bestSplitTimes: [Number], // Meilleur temps pour chaque niveau (pour chaque run)
    createdAt: { type: Date, default: Date.now }
});
const SoloRunModel = mongoose.model('SoloRun', SoloRunSchema);

// Modèle SoloBestSplits - Pour tracker les meilleurs splits par niveau globalement
const SoloBestSplitsSchema = new mongoose.Schema({
    level: { type: Number, required: true }, // Niveau 1-10
    bestSplitTime: Number, // Meilleur temps pour atteindre ce niveau (cumulatif)
    playerSkin: String, // Skin du joueur qui a le meilleur time
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const SoloBestSplitsModel = mongoose.model('SoloBestSplits', SoloBestSplitsSchema);

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
    classicPrim: {
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
        },
        mazeGeneration: {
            algorithm: 'prim',
            density: 0.5
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

// État de redémarrage des lobbies
let isRebooting = false;

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
    SoloBestSplitsModel,
    lobbies,
    soloSessions,
    playerModes,
    isRebooting,
    setIsRebooting: (value) => { isRebooting = value; },
    getIsRebooting: () => isRebooting
};
