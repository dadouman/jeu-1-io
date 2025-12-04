// utils/collisions.js

const TILE_SIZE = 40;

function checkWallCollision(targetX, targetY, map) {
    
    // 1. SÉCURITÉ PIXELS : Vérification immédiate
    // Si on est dans le négatif (même de 1 pixel), c'est un mur.
    if (targetX < 0 || targetY < 0) {
        return true;
    }

    // On calcule la case de la grille
    // On garde le petit +5 pour ne pas être gêné si on dépasse d'un pixel à droite
    const gridX = Math.floor((targetX + 5) / TILE_SIZE);
    const gridY = Math.floor((targetY + 5) / TILE_SIZE);

    // 2. SÉCURITÉ GRILLE : Est-ce qu'on sort de la map (en bas ou à droite) ?
    if (gridY >= map.length || gridX >= map[0].length) {
        return true; 
    }

    // 3. VÉRIFICATION DU MUR
    if (map[gridY][gridX] === 1) {
        return true;
    }

    return false;
}

module.exports = { checkWallCollision };