#!/usr/bin/env node

/**
 * Script pour nettoyer la base de données solo
 * 
 * Usage: 
 *   node scripts/cleanSoloData.js --runs       (supprime les runs uniquement)
 *   node scripts/cleanSoloData.js --splits     (supprime les meilleurs splits uniquement)
 *   node scripts/cleanSoloData.js --all        (supprime tout)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jeu-io';

// Définir les schémas
const SoloRunSchema = new mongoose.Schema({
    playerId: String,
    playerSkin: String,
    mode: { type: String, default: 'solo' },
    totalTime: Number,
    splitTimes: [Number],
    finalLevel: { type: Number, default: 10 },
    personalBestTime: { type: Number, default: null },
    bestSplitTimes: [Number],
    createdAt: { type: Date, default: Date.now }
});

const SoloBestSplitsSchema = new mongoose.Schema({
    level: { type: Number, required: true },
    bestSplitTime: Number,
    playerSkin: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SoloRunModel = mongoose.model('SoloRun', SoloRunSchema);
const SoloBestSplitsModel = mongoose.model('SoloBestSplits', SoloBestSplitsSchema);

async function cleanSoloData() {
    const mode = process.argv[2] || '--all';
    
    try {
        console.log(`🔗 Connexion à MongoDB: ${mongoURI}`);
        await mongoose.connect(mongoURI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log(`✅ Connecté à MongoDB\n`);

        if (mode === '--runs' || mode === '--all') {
            const countRunsBefore = await SoloRunModel.countDocuments();
            console.log(`📊 Nombre de runs solo avant: ${countRunsBefore}`);
            
            const resultRuns = await SoloRunModel.deleteMany({});
            console.log(`🗑️ Suppression des runs solo: ${resultRuns.deletedCount} documents supprimés`);
            
            const countRunsAfter = await SoloRunModel.countDocuments();
            console.log(`✅ Nombre de runs solo après: ${countRunsAfter}\n`);
        }

        if (mode === '--splits' || mode === '--all') {
            const countSplitsBefore = await SoloBestSplitsModel.countDocuments();
            console.log(`📊 Nombre de meilleurs splits avant: ${countSplitsBefore}`);
            
            const resultSplits = await SoloBestSplitsModel.deleteMany({});
            console.log(`🗑️ Suppression des meilleurs splits: ${resultSplits.deletedCount} documents supprimés`);
            
            const countSplitsAfter = await SoloBestSplitsModel.countDocuments();
            console.log(`✅ Nombre de meilleurs splits après: ${countSplitsAfter}\n`);
        }

        console.log(`✅ Nettoyage des données solo réussi!`);
        console.log(`📝 Les prochaines runs créeront de nouvelles données fiables.`);

    } catch (err) {
        console.error(`❌ Erreur lors du nettoyage:`, err);
    } finally {
        await mongoose.disconnect();
        console.log(`\n🔌 Déconnecté de MongoDB`);
    }
}

cleanSoloData();
