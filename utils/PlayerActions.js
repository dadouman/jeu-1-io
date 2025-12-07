// utils/PlayerActions.js - Utilitaires pour les actions du joueur (mouvement, collision, etc)

const { checkWallCollision } = require('./collisions');
const GameMode = require('./GameMode');

/**
 * Classe pour gérer les actions des joueurs
 */
class PlayerActions {
    /**
     * Traite le mouvement du joueur
     * @param {object} player - L'objet joueur
     * @param {object} map - La carte du labyrinthe
     * @param {object} input - {left, right, up, down, dash}
     * @param {string} modeId - Le mode de jeu
     * @returns {object} - Position mise à jour
     */
    static processMovement(player, map, input, modeId) {
        const gameMode = new GameMode(modeId);
        const speed = gameMode.getPlayerSpeed(player);

        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= speed;
        if (input.right) moveX += speed;
        if (input.up) moveY -= speed;
        if (input.down) moveY += speed;

        // Normaliser les diagonales
        if (moveX !== 0 && moveY !== 0) {
            const diagonal = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX = (moveX / diagonal) * speed;
            moveY = (moveY / diagonal) * speed;
        }

        let nextX = player.x + moveX;
        let nextY = player.y + moveY;

        // Tester la collision
        if (!checkWallCollision(nextX, nextY, map)) {
            player.x = nextX;
            player.y = nextY;
        } else if (moveX !== 0 && moveY !== 0) {
            // Essayer les mouvements séparé si diagonal échoue
            if (!checkWallCollision(player.x + moveX, player.y, map)) {
                player.x += moveX;
            } else if (!checkWallCollision(player.x, player.y + moveY, map)) {
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

        // Tracker la direction
        if (input.left) player.lastDirection = 'left';
        if (input.right) player.lastDirection = 'right';
        if (input.up) player.lastDirection = 'up';
        if (input.down) player.lastDirection = 'down';

        // Gérer le rope trail
        if (player.purchasedFeatures?.rope) {
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

        return player;
    }

    /**
     * Traite le dash du joueur
     * @param {object} player
     * @param {object} map
     * @param {string} modeId
     */
    static processDash(player, map, modeId) {
        if (!player.purchasedFeatures?.dash) {
            return { success: false, message: 'Dash non acheté' };
        }

        const dashDistance = 60;
        let nextX = player.x;
        let nextY = player.y;

        // Dash dans la direction où le joueur regarde
        if (player.lastDirection === 'right') nextX += dashDistance;
        else if (player.lastDirection === 'left') nextX -= dashDistance;
        else if (player.lastDirection === 'up') nextY -= dashDistance;
        else if (player.lastDirection === 'down') nextY += dashDistance;

        // Vérifier la collision
        if (checkWallCollision(nextX, nextY, map)) {
            return { success: false, message: 'Collision détectée' };
        }

        player.x = nextX;
        player.y = nextY;
        return { success: true, message: 'Dash effectué' };
    }

    /**
     * Traite les checkpoints
     * @param {object} player
     * @param {string} action - 'set' ou 'teleport'
     */
    static processCheckpoint(player, action) {
        if (!player.purchasedFeatures?.checkpoint) {
            return { success: false, message: 'Checkpoint non acheté' };
        }

        if (action === 'set') {
            player.checkpoint = { x: player.x, y: player.y };
            return { success: true, message: 'Checkpoint sauvegardé' };
        } else if (action === 'teleport') {
            if (!player.checkpoint) {
                return { success: false, message: 'Aucun checkpoint' };
            }
            player.x = player.checkpoint.x;
            player.y = player.checkpoint.y;
            return { success: true, message: 'Téléportation effectuée' };
        }

        return { success: false, message: 'Action inconnue' };
    }

    /**
     * Vérifie la collision avec une pièce
     * @param {object} player
     * @param {object} coin
     * @returns {boolean}
     */
    static checkCoinCollision(player, coin) {
        const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
        return dist < 30;  // Distance de collision
    }

    /**
     * Ajoute des gems au joueur
     * @param {object} player
     * @param {number} amount
     */
    static addGems(player, amount) {
        player.gems = (player.gems || 0) + amount;
    }

    /**
     * Achète un item du shop
     * @param {object} player
     * @param {object} item - L'item du shop
     * @returns {object} - {success, message, gemsLeft}
     */
    static buyItem(player, item) {
        if (player.gems < item.price) {
            return {
                success: false,
                message: `Pas assez de gems (besoin ${item.price}, as ${player.gems})`
            };
        }

        player.gems -= item.price;

        if (item.type === 'feature') {
            player.purchasedFeatures[item.id] = true;
        } else if (item.type === 'speedBoost') {
            player.purchasedFeatures.speedBoost = (player.purchasedFeatures.speedBoost || 0) + 1;
        }

        return {
            success: true,
            message: `Acheté: ${item.name}`,
            gemsLeft: player.gems
        };
    }
}

module.exports = PlayerActions;
