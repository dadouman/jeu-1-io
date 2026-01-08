// server/socket-handlers/checkpoint.js
// Gestion des checkpoints et dash

const { checkWallCollision } = require('../../utils/collisions');

function performDash(player, playerId, gameMap) {
    let dashDx = 0;
    let dashDy = 0;
    
    let direction = player.lastDirection || 'right';
    
    if (direction === 'up') dashDy = -1;
    if (direction === 'down') dashDy = 1;
    if (direction === 'left') dashDx = -1;
    if (direction === 'right') dashDx = 1;

    const dashDistance = 15;
    let currentX = player.x;
    let currentY = player.y;
    let stepsCount = 0;
    const maxSteps = 20;

    while (stepsCount < maxSteps) {
        const nextX = currentX + dashDx * dashDistance;
        const nextY = currentY + dashDy * dashDistance;

        if (checkWallCollision(nextX, nextY, gameMap)) {
            break;
        }

        currentX = nextX;
        currentY = nextY;
        stepsCount++;
    }

    player.x = currentX;
    player.y = currentY;
}

function handleCheckpoint(socket, lobbies, soloSessions, playerModes) {
    socket.on('checkpoint', (actions) => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        // Solo: gérer le joueur solo
        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (!session) return;
            const player = session.player;
            
            if (actions.setCheckpoint) {
                if (!player.purchasedFeatures.checkpoint) {
                    socket.emit('error', { message: '🚩 Checkpoint non acheté ! Rendez-vous au magasin' });
                } else {
                    player.checkpoint = { x: player.x, y: player.y };
                    socket.emit('checkpointUpdate', player.checkpoint);
                }
            }
            if (actions.teleportCheckpoint && player.checkpoint) {
                if (!player.purchasedFeatures.checkpoint) {
                    socket.emit('error', { message: '🚩 Checkpoint non acheté !' });
                } else {
                    player.x = player.checkpoint.x;
                    player.y = player.checkpoint.y;
                }
            }
            if (actions.dash) {
                if (!player.purchasedFeatures.dash) {
                    socket.emit('error', { message: '⚡ Dash non acheté ! Rendez-vous au magasin' });
                } else {
                    performDash(player, socket.id, session.map);
                    socket.emit('dashActivated');
                }
            }
            return;
        }
        
        // Multiplayer modes
        const lobby = lobbies[mode];
        if (!lobby) return;
        const player = lobby.players[socket.id];
        if (!player) return;

        if (actions.setCheckpoint) {
            if (!player.purchasedFeatures.checkpoint) {
                socket.emit('error', { message: '🚩 Checkpoint non acheté ! Rendez-vous au magasin (niveau 5, 10, 15...)' });
            } else {
                player.checkpoint = {
                    x: player.x,
                    y: player.y
                };
                socket.emit('checkpointUpdate', player.checkpoint);
            }
        }

        if (actions.teleportCheckpoint && player.checkpoint) {
            if (!player.purchasedFeatures.checkpoint) {
                socket.emit('error', { message: '🚩 Checkpoint non acheté !' });
            } else {
                player.x = player.checkpoint.x;
                player.y = player.checkpoint.y;
            }
        }

        if (actions.dash) {
            if (!player.purchasedFeatures.dash) {
                socket.emit('error', { message: '⚡ Dash non acheté ! Rendez-vous au magasin' });
            } else {
                performDash(player, socket.id, lobby.map);
            }
        }
    });
}

module.exports = {
    handleCheckpoint,
    performDash
};
