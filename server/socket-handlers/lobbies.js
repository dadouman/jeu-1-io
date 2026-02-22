// server/socket-handlers/lobbies.js - Gestion des lobbies en cours

const { debugLog } = require('../debug');

/**
 * Récupère les informations des lobbies actifs
 * Retourne: [{ mode, players: count, level, uptime, joinable: bool }, ...]
 */
function getActiveLobbiesInfo(lobbies, soloSessions) {
    const activeLobies = [];
    
    Object.entries(lobbies).forEach(([mode, lobby]) => {
        if (!lobby) return;
        
        const playerCount = Object.keys(lobby.players || {}).length;
        
        // Ne retourner que les lobbies avec au moins 1 joueur
        if (playerCount > 0) {
            // Calculer le temps écoulé depuis le démarrage du niveau
            const uptimeMs = Date.now() - (lobby.levelStartTime || Date.now());
            const uptimeSec = Math.floor(uptimeMs / 1000);
            
            activeLobies.push({
                mode,
                players: playerCount,
                level: lobby.currentLevel || 1,
                uptime: uptimeSec,
                joinable: true, // Toujours joinable sauf si en redémarrage
                modeDisplay: getModeDisplayName(mode)
            });
        }
    });
    
    return activeLobies;
}

/**
 * Obtient le nom d'affichage du mode
 */
function getModeDisplayName(mode) {
    const names = {
        'classic': '🔀 Couloirs',
        'classicPrim': '🌳 Organique',
        'infinite': '♾️ Infini',
        'classicAuction': '🔀 Couloirs (Enchères)',
        'classicPrimAuction': '🌳 Organique (Enchères)',
        'infiniteAuction': '♾️ Infini (Enchères)',
        'solo': '🎯 Solo'
    };
    return names[mode] || mode;
}

/**
 * Gère les événements liés aux lobbies
 */
function handleLobbiesEvents(socket, io, lobbies, soloSessions, playerModes, { getIsRebooting }) {
    debugLog(`🎮 handleLobbiesEvents initialisé pour client ${socket.id}`);
    
    // Récupérer la liste des lobbies actifs
    socket.on('getActiveLobies', () => {
        try {
            debugLog(`📡 Reçu getActiveLobies de ${socket.id}`);
            const activeLobies = getActiveLobbiesInfo(lobbies, soloSessions);
            debugLog(`📊 Envoi de ${activeLobies.length} lobby(ies)`);
            socket.emit('activeLobiesUpdate', { lobbies: activeLobies });
            debugLog(`📊 Envoi des lobbies actifs au client ${socket.id}: ${activeLobies.length} lobby(ies)`);
        } catch (err) {
            console.error('Erreur dans getActiveLobies:', err);
            socket.emit('error', { message: 'Erreur lors de la récupération des lobbies' });
        }
    });

    // Rejoindre un lobby existant
    socket.on('joinExistingLobby', ({ mode }) => {
        try {
            if (getIsRebooting && getIsRebooting()) {
                socket.emit('error', { message: 'Les lobbies se redémarrent actuellement...' });
                return;
            }

            const lobby = lobbies[mode];
            if (!lobby) {
                socket.emit('error', { message: `Lobby ${mode} n'existe pas` });
                return;
            }

            // Vérifier qu'il y a déjà des joueurs (ne pas rejoindre un lobby vide)
            const playerCount = Object.keys(lobby.players || {}).length;
            if (playerCount === 0) {
                socket.emit('error', { message: 'Ce lobby est maintenant vide' });
                return;
            }

            // Ajouter le joueur au lobby existant
            const playerId = socket.id;
            
            // Initialiser le joueur avec les infos actuelles du lobby
            const playerSkin = socket.handshake.query.skin || '❓';
            lobby.players[playerId] = {
                id: playerId,
                skin: playerSkin,
                level: lobby.currentLevel,
                joinedAt: Date.now(),
                x: 0,
                y: 0,
                checkpoints: [],
                score: 0
            };

            playerModes[playerId] = mode;

            // Joindre la room socket
            socket.join(`mode_${mode}`);

            // Notifier tous les joueurs du lobby
            io.to(`mode_${mode}`).emit('playerJoinedLobby', {
                playerId,
                skin: playerSkin,
                totalPlayers: Object.keys(lobby.players).length,
                level: lobby.currentLevel
            });

            debugLog(`✅ Joueur ${playerId} a rejoint le lobby ${mode}`);
            socket.emit('joinedLobby', {
                mode,
                level: lobby.currentLevel,
                totalPlayers: Object.keys(lobby.players).length,
                success: true
            });
        } catch (err) {
            console.error('Erreur dans joinExistingLobby:', err);
            socket.emit('error', { message: 'Erreur lors de l\'adhésion au lobby' });
        }
    });
}

module.exports = {
    handleLobbiesEvents,
    getActiveLobbiesInfo,
    getModeDisplayName
};
