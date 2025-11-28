// utils/collisions.js

// On met la taille en dur pour être sûr que ça marche
const TILE_SIZE = 40; 

function checkWallCollision(newX, newY, map) {
    // 1. On calcule le centre du joueur
    // Le joueur est en x,y (coin haut gauche). Il fait 30px de large.
    // Son centre est donc à x+15, y+15.
    const centerX = newX + 15;
    const centerY = newY + 15;

    // 2. On trouve la case de la grille correspondante
    const gridX1 = Math.floor((centerX + 15)  / TILE_SIZE);
    const gridY1 = Math.floor((centerY + 15) / TILE_SIZE);
    const gridX2 = Math.floor((centerX - 15) / TILE_SIZE);
    const gridY2 = Math.floor((centerY - 15) / TILE_SIZE);

    // 3. Sécurités (Si on sort de la map, c'est un mur)
    if (gridY1 < 0 || gridX1 < 0 || gridY1 >= map.length || gridX1 >= map[0].length) {
        return true;
    }

    if (gridY1 < 0 || gridX2 < 0 || gridY1 >= map.length || gridX2 >= map[0].length) {
        return true;
    }
    if (gridY2 < 0 || gridX1 < 0 || gridY1 >= map.length || gridX1 >= map[0].length) {
        return true;
    }
    if (gridY2 < 0 || gridX2 < 0 || gridY1 >= map.length || gridX2 >= map[0].length) {
        return true;
    }

    // 4. Vérification finale
    // Si la case vaut 1, c'est un mur.
    if (map[gridY1][gridX1] === 1) {
        return true;
    }
    if (map[gridY1][gridX2] === 1) {
        return true;
    }
    if (map[gridY2][gridX1] === 1) {
        return true;
    }
    if (map[gridY2][gridX2] === 1) {
        return true;
    }

    return false; // C'est libre !
}

module.exports = { checkWallCollision };