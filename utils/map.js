// utils/map.js

const TILE_SIZE = 40;

// Fonction qui génère un labyrinthe parfait selon la taille demandée
function generateMaze(width, height) {
    // 1. On force des dimensions impaires (nécessaire pour cet algo)
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    // 2. On remplit tout de MURS (1)
    let map = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            row.push(1);
        }
        map.push(row);
    }

    // 3. Algorithme de creusage (Recursive Backtracker)
    const stack = [];
    const startX = 1;
    const startY = 1;
    
    // On commence à (1,1) et on le marque comme vide (0)
    map[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
        { x: 0, y: -2 }, // Haut
        { x: 0, y: 2 },  // Bas
        { x: -2, y: 0 }, // Gauche
        { x: 2, y: 0 }   // Droite
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        
        // Trouver les voisins valides (qui sont des murs)
        let neighbors = [];
        for (let dir of directions) {
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && map[ny][nx] === 1) {
                neighbors.push({ x: nx, y: ny, dx: dir.x / 2, dy: dir.y / 2 });
            }
        }

        if (neighbors.length > 0) {
            // Choisir un voisin au hasard
            const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Casser le mur entre les deux
            map[current.y + chosen.dy][current.x + chosen.dx] = 0;
            // Casser le mur de destination
            map[chosen.y][chosen.x] = 0;
            
            stack.push({ x: chosen.x, y: chosen.y });
        } else {
            stack.pop(); // Retour en arrière
        }
    }

    return map;
}

// Fonction pour trouver une case vide (inchangée)
function getRandomEmptyPosition(map) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    let found = false;
    
    // Tentative 1: Random (100 essais)
    do {
        x = Math.floor(Math.random() * map[0].length);
        y = Math.floor(Math.random() * map.length);
        attempts++;
        
        // Check if this position is valid
        if (map[y] !== undefined && map[y][x] === 0) {
            found = true;
            break;
        }
    } while (attempts < maxAttempts);
    
    // Tentative 2: Recherche exhaustive si random a échoué
    if (!found) {
        for (let sy = 0; sy < map.length && !found; sy++) {
            for (let sx = 0; sx < map[0].length && !found; sx++) {
                if (map[sy] !== undefined && map[sy][sx] === 0) {
                    x = sx;
                    y = sy;
                    found = true;
                }
            }
        }
    }
    
    // Sécurité: si aucune case vide trouvée (impossible mais par prudence)
    if (!found) {
        x = 1;
        y = 1;
    }
    
    // Position au centre de la case
    const centerOffset = TILE_SIZE / 2;
    return { 
        x: x * TILE_SIZE + centerOffset,
        y: y * TILE_SIZE + centerOffset
    };
}

module.exports = { generateMaze, getRandomEmptyPosition, TILE_SIZE };