// utils/map.js

const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const TILE_SIZE = 40;

function generateMap() {
    let newMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                row.push(1);
            } else {
                if (Math.random() < 0.2 && (x > 5 && y > 5)) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
        }
        newMap.push(row);
    }
    return newMap;
}

// Fonction pour trouver une case vide
function getRandomEmptyPosition(map) {
    let x, y;
    do {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
    } while (map[y][x] === 1);
    
    return { x: x * TILE_SIZE, y: y * TILE_SIZE };
}

// On EXPORTE ce qu'on veut rendre disponible aux autres fichiers
module.exports = {
    generateMap,
    getRandomEmptyPosition,
    TILE_SIZE // On exporte aussi les constantes utiles
};