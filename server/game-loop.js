// server/game-loop.js - Boucle de jeu principale

const { processLobbyGameLoop } = require('./game-loops/lobby-loop');
const SoloGameLoop = require('./game-loops/solo-game-loop');

function startGameLoop(io, lobbies, soloSessions, playerModes, { 
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
}) {
    // Créer une instance de SoloGameLoop avec les modèles
    const soloGameLoop = new SoloGameLoop(soloSessions, io, { 
        SoloRunModel,
        SoloBestSplitsModel
    });
    
    setInterval(() => {
        // --- TRAITEMENT DES LOBBIES CLASSIQUE ET INFINI ---
        processLobbyGameLoop(lobbies, io, { 
            calculateMazeSize, 
            getShopItemsForMode, 
            emitToLobby 
        }, { 
            mongoURI, 
            HighScoreModel, 
            TRANSITION_DURATION, 
            SHOP_DURATION 
        });
        
        // --- TRAITEMENT DES SESSIONS SOLO ---
        soloGameLoop.process();
    }, 1000 / 60); // 60 FPS
}

module.exports = { startGameLoop };
