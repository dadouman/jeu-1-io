// server/game-loop.js - Boucle de jeu principale

const { processLobbyGameLoop } = require('./game-loops/lobby-loop');
const { processSoloGameLoop } = require('./game-loops/solo-loop');

function startGameLoop(io, lobbies, soloSessions, playerModes, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    SoloRunModel,
    TRANSITION_DURATION, 
    SHOP_DURATION 
}) {
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
        processSoloGameLoop(soloSessions, io, { 
            calculateMazeSize, 
            getShopItemsForMode 
        }, { 
            mongoURI, 
            SoloRunModel,
            TRANSITION_DURATION, 
            SHOP_DURATION 
        });
    }, 1000 / 60); // 60 FPS
}

module.exports = { startGameLoop };
