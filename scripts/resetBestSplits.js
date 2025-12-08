#!/usr/bin/env node

/**
 * Script pour réinitialiser les meilleurs splits de la base de données
 * 
 * Usage: node scripts/resetBestSplits.js
 * 
 * ⚠️ ATTENTION: Cela supprime TOUS les meilleurs splits mondiaux!
 * Les futurs runs créeront de nouveaux enregistrements fiables.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jeu-io';

// Définir le schéma
const SoloBestSplitsSchema = new mongoose.Schema({
    level: { type: Number, required: true },
    bestSplitTime: Number,
    playerSkin: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SoloBestSplitsModel = mongoose.model('SoloBestSplits', SoloBestSplitsSchema);

async function resetBestSplits() {
    try {
        console.log(`🔗 Connexion à MongoDB: ${mongoURI}`);
        await mongoose.connect(mongoURI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log(`✅ Connecté à MongoDB`);

        // Compter les documents avant suppression
        const countBefore = await SoloBestSplitsModel.countDocuments();
        console.log(`\n📊 Nombre de meilleurs splits avant: ${countBefore}`);

        // Supprimer tous les meilleurs splits
        const result = await SoloBestSplitsModel.deleteMany({});
        console.log(`\n🗑️ Suppression des meilleurs splits: ${result.deletedCount} documents supprimés`);

        // Vérifier que c'est vide
        const countAfter = await SoloBestSplitsModel.countDocuments();
        console.log(`✅ Nombre de meilleurs splits après: ${countAfter}`);

        console.log(`\n✅ Base de données des meilleurs splits réinitialisée!`);
        console.log(`📝 Les futurs runs créeront de nouveaux enregistrements fiables.`);

    } catch (err) {
        console.error(`❌ Erreur lors de la réinitialisation:`, err);
    } finally {
        await mongoose.disconnect();
        console.log(`🔌 Déconnecté de MongoDB`);
    }
}

resetBestSplits();
