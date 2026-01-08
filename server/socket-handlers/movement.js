// server/socket-handlers/movement.js
// Gestion du mouvement des joueurs

const { checkWallCollision } = require('../../utils/collisions');

function handleMovement(socket, lobbies, soloSessions, playerModes) {
    socket.on('movement', (input) => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        let player, map;
        
        if (mode === 'solo') {
            const session = soloSessions[socket.id];
            if (!session) return;
            
            // ✅ SERVEUR DÉCIDE SI INPUTS BLOQUÉS
            const isInputsBlocked = 
                session.countdownActive ||
                session.inTransition ||
                session.shopActive;
            
            if (isInputsBlocked) {
                return; // Inputs bloqués, ne pas bouger
            }
            
            player = session.player;
            map = session.map;
        } else {
            const lobby = lobbies[mode];
            if (!lobby) return;
            player = lobby.players[socket.id];
            if (!player) return;
            map = lobby.map;
        }

        // Calculer la vitesse : vitesse de base + (speedBoost * incrément par achat)
        const baseSpeed = 3;
        const speedBoostIncrement = 1;
        const speedBoostLevel = Math.max(0, player.purchasedFeatures?.speedBoost || 0);
        const speed = baseSpeed + (speedBoostLevel * speedBoostIncrement);
        
        let nextX = player.x;
        let nextY = player.y;

        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= speed;
        if (input.right) moveX += speed;
        if (input.up) moveY -= speed;
        if (input.down) moveY += speed;

        if (moveX !== 0 && moveY !== 0) {
            const diagonal = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX = (moveX / diagonal) * speed;
            moveY = (moveY / diagonal) * speed;
        }

        nextX = player.x + moveX;
        nextY = player.y + moveY;

        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        } else if (moveX !== 0 && moveY !== 0) {
            if (!checkWallCollision(player.x + moveX, player.y, map)) {
                player.x += moveX;
            }
            else if (!checkWallCollision(player.x, player.y + moveY, map)) {
                player.y += moveY;
            }
        } else if (moveX !== 0) {
            if (!checkWallCollision(player.x + moveX, player.y, map)) {
                player.x += moveX;
            }
        } else if (moveY !== 0) {
            if (!checkWallCollision(player.x, player.y + moveY, map)) {
                player.y += moveY;
            }
        }

        if (input.left) player.lastDirection = 'left';
        if (input.right) player.lastDirection = 'right';
        if (input.up) player.lastDirection = 'up';
        if (input.down) player.lastDirection = 'down';

        // Trail (rope feature)
        if (player.purchasedFeatures && player.purchasedFeatures.rope) {
            const lastTrailPoint = player.trail[player.trail.length - 1];
            if (!lastTrailPoint || Math.hypot(lastTrailPoint.x - player.x, lastTrailPoint.y - player.y) >= 4) {
                player.trail.push({ x: player.x, y: player.y });
                if (player.trail.length > 500) {
                    player.trail.shift();
                }
            }
        } else {
            player.trail = [];
        }
        
        if (mode === 'solo') {
            soloSessions[socket.id].player = player;
        }
    });
}

module.exports = {
    handleMovement
};
