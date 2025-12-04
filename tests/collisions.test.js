// utils/collisions.js

const TILE_SIZE = 40;

function checkWallCollision(targetX, targetY, map) {
    // On convertit la position en pixels (ex: 80, 40) en index de grille (ex: 2, 1)
    // On ajoute un petit offset (+5) pour être sûr de tomber dans la case
    const gridX = Math.floor((targetX + 5) / TILE_SIZE);
    const gridY = Math.floor((targetY + 5) / TILE_SIZE);

    // 1. Sécurité : Est-ce qu'on sort de la map ?
    if (gridY < 0 || gridX < 0 || gridY >= map.length || gridX >= map[0].length) {
        return true; // C'est un mur (le vide intersidéral)
    }

    // 2. Est-ce un mur ?
    return map[gridY][gridX] === 1;
}

module.exports = { checkWallCollision };