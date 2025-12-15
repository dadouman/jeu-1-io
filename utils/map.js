// utils/map.js

const TILE_SIZE = 40;

// ============================================================
// ALGORITHME 1: Recursive Backtracker (existant)
// Génère un labyrinthe parfait avec des couloirs longs
// ============================================================
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

// ============================================================
// ALGORITHME 2: Prim's Algorithm avec densité ajustable
// Génère un labyrinthe plus organique avec des ramifications
// ============================================================

/**
 * Génère un labyrinthe en utilisant l'algorithme de Prim
 * @param {number} width - Largeur du labyrinthe
 * @param {number} height - Hauteur du labyrinthe
 * @param {Object} options - Options de génération
 * @param {number} options.density - Densité des murs (0.0 = beaucoup de passages, 1.0 = minimum de passages). Défaut: 0.5
 * @param {boolean} options.openBorders - Si true, ouvre quelques cases sur les bords. Défaut: false
 * @returns {Array<Array<number>>} Grille 2D (0 = chemin, 1 = mur)
 */
function generateMazePrim(width, height, options = {}) {
    const { 
        density = 0.5,      // 0.0 = très ouvert, 1.0 = très fermé (labyrinthe parfait)
        openBorders = false 
    } = options;

    // 1. Forcer des dimensions impaires (nécessaire pour l'algorithme)
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    // 2. Initialiser la grille avec des murs (1)
    const map = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(1);
        }
        map.push(row);
    }

    // 3. Structure pour suivre les murs frontières
    const walls = [];
    
    // Directions possibles (sauter 2 cases pour maintenir la structure)
    const directions = [
        { dx: 0, dy: -2 },  // Haut
        { dx: 0, dy: 2 },   // Bas
        { dx: -2, dy: 0 },  // Gauche
        { dx: 2, dy: 0 }    // Droite
    ];

    // 4. Fonction helper pour ajouter les murs frontières
    function addWalls(x, y) {
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            // Vérifier que le voisin est dans les limites et est un mur
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                if (map[ny][nx] === 1) {
                    // Ajouter le mur entre la cellule actuelle et le voisin
                    walls.push({
                        x: nx,
                        y: ny,
                        wallX: x + dir.dx / 2,
                        wallY: y + dir.dy / 2
                    });
                }
            }
        }
    }

    // 5. Commencer à une position aléatoire impaire
    const startX = 1 + Math.floor(Math.random() * ((width - 2) / 2)) * 2;
    const startY = 1 + Math.floor(Math.random() * ((height - 2) / 2)) * 2;
    
    // Marquer comme passage
    map[startY][startX] = 0;
    addWalls(startX, startY);

    // 6. Algorithme de Prim
    while (walls.length > 0) {
        // Choisir un mur aléatoire
        const randomIndex = Math.floor(Math.random() * walls.length);
        const wall = walls[randomIndex];
        
        // Retirer le mur de la liste
        walls.splice(randomIndex, 1);

        // Vérifier si la cellule de l'autre côté est un mur
        if (map[wall.y][wall.x] === 1) {
            // Creuser le passage
            map[wall.y][wall.x] = 0;
            map[wall.wallY][wall.wallX] = 0;
            
            // Ajouter les nouveaux murs frontières
            addWalls(wall.x, wall.y);
        }
    }

    // 7. Appliquer la densité (ouvrir des passages supplémentaires)
    if (density < 1.0) {
        const inverseDensity = 1.0 - density;
        const totalWalls = countWalls(map);
        const wallsToRemove = Math.floor(totalWalls * inverseDensity * 0.3); // Max 30% des murs
        
        let removed = 0;
        let attempts = 0;
        const maxAttempts = wallsToRemove * 10;

        while (removed < wallsToRemove && attempts < maxAttempts) {
            attempts++;
            
            // Position aléatoire (éviter les bords)
            const x = 1 + Math.floor(Math.random() * (width - 2));
            const y = 1 + Math.floor(Math.random() * (height - 2));
            
            if (map[y][x] === 1 && canRemoveWall(map, x, y, width, height)) {
                map[y][x] = 0;
                removed++;
            }
        }
    }

    // 8. Option: ouvrir quelques cases sur les bords intérieurs
    if (openBorders) {
        const borderOpenings = Math.floor(Math.min(width, height) / 5);
        for (let i = 0; i < borderOpenings; i++) {
            // Côtés horizontaux
            const topX = 2 + Math.floor(Math.random() * (width - 4));
            const bottomX = 2 + Math.floor(Math.random() * (width - 4));
            if (map[2] && map[2][topX] !== undefined) map[2][topX] = 0;
            if (map[height - 3] && map[height - 3][bottomX] !== undefined) map[height - 3][bottomX] = 0;
            
            // Côtés verticaux
            const leftY = 2 + Math.floor(Math.random() * (height - 4));
            const rightY = 2 + Math.floor(Math.random() * (height - 4));
            if (map[leftY] && map[leftY][2] !== undefined) map[leftY][2] = 0;
            if (map[rightY] && map[rightY][width - 3] !== undefined) map[rightY][width - 3] = 0;
        }
    }

    return map;
}

/**
 * Compte le nombre de murs dans la grille (hors bordures)
 */
function countWalls(map) {
    let count = 0;
    for (let y = 1; y < map.length - 1; y++) {
        for (let x = 1; x < map[0].length - 1; x++) {
            if (map[y][x] === 1) count++;
        }
    }
    return count;
}

/**
 * Vérifie si on peut retirer un mur sans créer de problème
 * (évite de créer des zones 2x2 vides qui casseraient l'esthétique)
 */
function canRemoveWall(map, x, y, width, height) {
    // Ne pas toucher aux bordures
    if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        return false;
    }
    
    // Vérifier qu'on ne crée pas un bloc 2x2 vide
    const patterns = [
        [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}],
        [{dx: -1, dy: 0}, {dx: 0, dy: 0}, {dx: -1, dy: 1}, {dx: 0, dy: 1}],
        [{dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 0, dy: 0}, {dx: 1, dy: 0}],
        [{dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: -1, dy: 0}, {dx: 0, dy: 0}]
    ];

    for (const pattern of patterns) {
        let wouldBeEmpty = true;
        for (const offset of pattern) {
            const nx = x + offset.dx;
            const ny = y + offset.dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                wouldBeEmpty = false;
                break;
            }
            
            // Si ce n'est pas la case qu'on veut retirer, vérifier si c'est un mur
            if (offset.dx !== 0 || offset.dy !== 0) {
                if (map[ny][nx] === 1) {
                    wouldBeEmpty = false;
                    break;
                }
            }
        }
        
        if (wouldBeEmpty) return false;
    }

    return true;
}

// ============================================================
// FONCTION UNIFIÉE: Choisir l'algorithme de génération
// ============================================================

/**
 * Génère un labyrinthe avec l'algorithme spécifié
 * @param {number} width - Largeur
 * @param {number} height - Hauteur  
 * @param {Object} options - Options de génération
 * @param {string} options.algorithm - 'backtracker' (défaut) ou 'prim'
 * @param {number} options.density - Pour Prim: 0.0 (ouvert) à 1.0 (fermé). Défaut: 0.5
 * @param {boolean} options.openBorders - Pour Prim: ouvrir des passages près des bords
 * @returns {Array<Array<number>>} Grille 2D (0 = chemin, 1 = mur)
 */
function generateMazeAdvanced(width, height, options = {}) {
    const { algorithm = 'backtracker' } = options;
    
    if (algorithm === 'prim') {
        return generateMazePrim(width, height, options);
    }
    
    // Par défaut: Recursive Backtracker
    return generateMaze(width, height);
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

/**
 * Trouve une position vide suffisamment éloignée de tous les joueurs
 * @param {Array<Array<number>>} map - La grille du labyrinthe
 * @param {Array<{x: number, y: number}>} players - Liste des positions des joueurs (en pixels)
 * @param {number} minDistance - Distance minimale en pixels (défaut: 200)
 * @returns {{x: number, y: number}} Position en pixels
 */
function getRandomEmptyPositionFarFromPlayers(map, players = [], minDistance = 200) {
    // Si pas de joueurs, utiliser la fonction standard
    if (!players || players.length === 0) {
        return getRandomEmptyPosition(map);
    }

    const maxAttempts = 200;
    let bestPosition = null;
    let bestMinDistance = 0;

    // Collecter toutes les cases vides
    const emptyCells = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y] && map[y][x] === 0) {
                emptyCells.push({ x, y });
            }
        }
    }

    if (emptyCells.length === 0) {
        return { x: TILE_SIZE + TILE_SIZE / 2, y: TILE_SIZE + TILE_SIZE / 2 };
    }

    // Mélanger les cases pour randomiser
    for (let i = emptyCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }

    const centerOffset = TILE_SIZE / 2;

    // Essayer de trouver une position qui respecte la distance minimale
    for (let attempt = 0; attempt < Math.min(maxAttempts, emptyCells.length); attempt++) {
        const cell = emptyCells[attempt];
        const pixelX = cell.x * TILE_SIZE + centerOffset;
        const pixelY = cell.y * TILE_SIZE + centerOffset;

        // Calculer la distance minimale avec tous les joueurs
        let minDistToPlayers = Infinity;
        for (const player of players) {
            const dist = Math.hypot(pixelX - player.x, pixelY - player.y);
            if (dist < minDistToPlayers) {
                minDistToPlayers = dist;
            }
        }

        // Si cette position respecte la distance minimale, la retourner
        if (minDistToPlayers >= minDistance) {
            return { x: pixelX, y: pixelY };
        }

        // Sinon, garder la meilleure position trouvée jusqu'ici
        if (minDistToPlayers > bestMinDistance) {
            bestMinDistance = minDistToPlayers;
            bestPosition = { x: pixelX, y: pixelY };
        }
    }

    // Si aucune position idéale trouvée, retourner la meilleure qu'on a
    if (bestPosition) {
        console.log(`⚠️ Gem placée à ${bestMinDistance.toFixed(0)}px du joueur le plus proche (min demandé: ${minDistance}px)`);
        return bestPosition;
    }

    // Fallback: position aléatoire standard
    return getRandomEmptyPosition(map);
}

module.exports = { 
    generateMaze,           // Algorithme original (Recursive Backtracker)
    generateMazePrim,       // Algorithme de Prim avec densité
    generateMazeAdvanced,   // Fonction unifiée pour choisir l'algorithme
    getRandomEmptyPosition,
    getRandomEmptyPositionFarFromPlayers,  // Position éloignée des joueurs
    TILE_SIZE 
};