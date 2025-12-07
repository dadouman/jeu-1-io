// Script pour réinitialiser le meilleur score à 0
require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("❌ MONGO_URI non défini. Vérifiez votre fichier .env");
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ Connecté à MongoDB');
        return resetHighScore();
    })
    .then(() => {
        console.log('🎉 Meilleur score réinitialisé à 0');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erreur :', err);
        process.exit(1);
    });

async function resetHighScore() {
    const HighScoreSchema = new mongoose.Schema({ score: Number, skin: String });
    const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);
    
    await HighScoreModel.updateOne({}, { score: 0, skin: "❓" }, { upsert: true });
    console.log('✏️ Score remis à 0 ✏️');
}
