// server/socket-handlers/mode-selection.js
// Gestion de la sélection du mode de jeu

const { generateMaze, generateMazeAdvanced, getRandomEmptyPosition, getRandomEmptyPositionFarFromPlayers } = require('../../utils/map');
const { initializePlayerForMode } = require('../../utils/player');
const { generateRandomFeatureWeighted } = require('../utils/solo-utils');
const { emitToLobby } = require('../utils');
const gameModes = require('../../config/gameModes');
const SoloSession = require('../utils/SoloSession');

function handleModeSelection(socket, io, lobbies, soloSessions, playerModes) {
    socket.on('selectGameMode', (data) => {
        let mode = data.mode; // 'classic', 'infinite', 'solo', ou 'custom'
        
        playerModes[socket.id] = mode;
        
        if (mode === 'solo') {
            handleSoloModeSelection(socket, data, lobbies, soloSessions);
        } else if (mode === 'custom') {
            handleCustomModeSelection(socket, io, data, lobbies, playerModes);
        } else {
            handleMultiplayerModeSelection(socket, io, mode, lobbies, playerModes);
        }
    });

    // Vérifier le nombre de joueurs connectés au mode custom
    socket.on('checkCustomModeConnections', (data, callback) => {
        const lobby = lobbies['custom'];
        const playersCount = lobby ? Object.keys(lobby.players).length : 0;
        
        if (callback) {
            callback(playersCount);
        }
    });
}

function handleSoloModeSelection(socket, data, lobbies, soloSessions) {
    console.log(`🎮 Joueur ${socket.id} sélectionne le mode: SOLO (10 niveaux)`);
    
    // Récupérer la configuration du mode solo
    const soloConfig = gameModes.getGameModeConfig('solo');
    
    // Créer une nouvelle session solo avec la configuration
    const session = new SoloSession(socket.id, socket, soloConfig);
    
    // Initialiser le joueur
    const startPos = getRandomEmptyPosition(generateMaze(15, 15));
    session.player = initializePlayerForMode(startPos, 0, 'solo');
    
    // Débloquer aléatoirement une feature au départ
    const unlockedFeature = generateRandomFeatureWeighted();
    session.player.purchasedFeatures[unlockedFeature] = true;
    console.log(`   ⚡ Feature débloquée gratuitement: ${unlockedFeature}`);
    
    // Générer la première map (taille du niveau 1 selon la config)
    const firstLevelSize = soloConfig.levelConfig?.sizes?.[0] || 15;
    session.map = generateMaze(firstLevelSize, firstLevelSize);
    
    // Placer la gemme loin du joueur (40% de la largeur de la map)
    const minGemDistance = firstLevelSize * 40 * 0.4;
    session.coin = getRandomEmptyPositionFarFromPlayers(session.map, [{ x: session.player.x, y: session.player.y }], minGemDistance);
    
    // Stocker la session
    soloSessions[socket.id] = session;
    
    socket.emit('gameModSelected', { mode: 'solo', endType: soloConfig?.endType || 'solo' });
    // Envoyer l'état initial au client
    session.sendGameState();
    
    console.log(`   ✅ Session SOLO créée pour joueur ${socket.id}`);
    console.log(`   🏪 Shop aux niveaux: ${session.shopLevels.join(', ')}`);
}

function handleCustomModeSelection(socket, io, data, lobbies, playerModes) {
    if (!data.customConfig) {
        socket.emit('error', { message: 'Configuration personnalisée manquante' });
        return;
    }
    
    console.log(`🎮 Joueur ${socket.id} sélectionne le mode: PERSONNALISÉ (${data.customConfig.maxLevels} niveaux)`);
    
    if (!lobbies['custom']) {
        const firstLevelSize = data.customConfig.levelConfig.sizes[0];
        
        // Utiliser l'algorithme de génération configuré
        const mazeGenConfig = data.customConfig.mazeGeneration || { algorithm: 'backtracker', density: 0.5 };
        const generatedMap = generateMazeAdvanced(firstLevelSize, firstLevelSize, {
            algorithm: mazeGenConfig.algorithm,
            density: mazeGenConfig.density
        });
        
        lobbies['custom'] = {
            currentLevel: 1,
            currentRecord: { score: 0, skin: '❓' },
            players: {},
            map: generatedMap,
            coin: null,
            customConfig: data.customConfig,
            restartVote: {
                isActive: false,
                votes: {},
                startTime: null,
                VOTE_TIMEOUT: 10000
            }
        };
        // Initialiser le coin pour le premier niveau
        lobbies['custom'].coin = getRandomEmptyPosition(lobbies['custom'].map);
    }
    
    const lobby = lobbies['custom'];
    lobby.customConfig = data.customConfig;
    
    const playerIndex = Object.keys(lobby.players).length;
    const startPos = getRandomEmptyPosition(lobby.map);
    lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, 'custom');
    
    socket.emit('mapData', lobby.map);
    socket.emit('levelUpdate', lobby.currentLevel);
    socket.emit('highScoreUpdate', lobby.currentRecord);
    const endType = data.customConfig.endType || 'multi';
    socket.emit('gameModSelected', { mode: 'custom', endType });
    socket.emit('coinUpdate', lobby.coin);
    
    emitToLobby('custom', 'playersCountUpdate', {
        count: Object.keys(lobby.players).length
    }, io, lobbies);
    
    console.log(`   ${lobby.players[socket.id].skin} rejoint custom (${Object.keys(lobby.players).length} joueur(s))`);
}

function handleMultiplayerModeSelection(socket, io, mode, lobbies, playerModes) {
    if (!lobbies[mode]) {
        socket.emit('error', { message: 'Mode invalide' });
        return;
    }
    
    const lobby = lobbies[mode];
    const modeDisplayNames = {
        'classic': 'COULOIRS (10 Niveaux)',
        'classicPrim': 'ORGANIQUE (10 Niveaux)',
        'infinite': 'INFINI'
    };
    console.log(`🎮 Joueur ${socket.id} sélectionne le mode: ${modeDisplayNames[mode] || mode}`);
    const modeConfig = gameModes.getGameModeConfig(mode);
    const endType = modeConfig?.endType || 'multi';
    
    const playerIndex = Object.keys(lobby.players).length;
    const startPos = getRandomEmptyPosition(lobby.map);
    lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, mode);
    
    socket.emit('mapData', lobby.map);
    socket.emit('levelUpdate', lobby.currentLevel);
    socket.emit('highScoreUpdate', lobby.currentRecord);
    socket.emit('gameModSelected', { mode: mode, endType });
    socket.emit('coinUpdate', lobby.coin);
    
    emitToLobby(mode, 'playersCountUpdate', {
        count: Object.keys(lobby.players).length
    }, io, lobbies);
    
    console.log(`   ${lobby.players[socket.id].skin} rejoint ${mode} (${Object.keys(lobby.players).length} joueur(s))`);
}

module.exports = {
    handleModeSelection
};
