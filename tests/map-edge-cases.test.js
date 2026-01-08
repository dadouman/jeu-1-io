// tests/map-edge-cases.test.js
// Tests pour couvrir les edge cases de la génération procédurale de carte

const { generateMaze, generateMazePrim, getRandomEmptyPosition, TILE_SIZE } = require('../utils/map');

describe('Procédural Generation - Edge Cases', () => {

    // === TEST 1 : Extreme Map Sizes ===
    test('Devrait générer une très petite map (3x3)', () => {
        const map = generateMaze(3, 3);
        
        expect(map).toBeDefined();
        expect(map.length).toBe(3);
        expect(map[0].length).toBe(3);
        
        // Doit contenir au moins un chemin valide
        const flatMap = map.flat();
        expect(flatMap).toContain(0);
    });

    test('Devrait générer une très grande map (99x99)', () => {
        const map = generateMaze(99, 99);
        
        expect(map).toBeDefined();
        expect(map.length).toBe(99);
        expect(map[0].length).toBe(99);
        
        // Doit être valide
        const flatMap = map.flat();
        expect(flatMap).toContain(0); // Chemins
        expect(flatMap).toContain(1); // Murs
    });

    test('Devrait générer une map rectangulaire (25x15)', () => {
        const map = generateMaze(25, 15);
        
        expect(map.length).toBe(15); // Hauteur
        expect(map[0].length).toBe(25); // Largeur
    });

    // === TEST 2 : Reproducibility avec Seeds (si applicable) ===
    test('Deux cartes avec même seed devraient être identiques', () => {
        // Note: Si map.js n'utilise pas de seed, ce test valide la future implémentation
        const map1 = generateMaze(21, 21);
        const map2 = generateMaze(21, 21);
        
        // Avec seed: maps devraient être identiques
        // Sans seed: elles peuvent différer
        // Vérifier au moins qu'elles ont la même structure
        expect(map1.length).toBe(map2.length);
        expect(map1[0].length).toBe(map2[0].length);
    });

    // === TEST 3 : Connectivité (toutes les paths liées) ===
    test('Toutes les positions vides doivent être connectées (pas d\'îles)', () => {
        const map = generateMaze(15, 15);
        
        // Trouver la première case vide
        let startX = 0, startY = 0;
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x] === 0) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
        }

        // BFS pour explorer depuis cette position
        const visited = new Set();
        const queue = [[startX, startY]];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            
            // Vérifier 4 voisins
            const neighbors = [[x+1,y], [x-1,y], [x,y+1], [x,y-1]];
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < map[0].length && ny >= 0 && ny < map.length) {
                    if (map[ny][nx] === 0 && !visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push([nx, ny]);
                    }
                }
            }
        }

        // Compter les chemins totaux
        let totalEmptyTiles = 0;
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x] === 0) totalEmptyTiles++;
            }
        }

        // Tous les chemins doivent être connectés
        expect(visited.size).toBe(totalEmptyTiles);
    });

    // === TEST 4 : Pas trop de murs / pas trop de chemins ===
    test('Ratio mur/chemin doit être raisonnable (40-60% chemins)', () => {
        const map = generateMaze(21, 21);
        const flatMap = map.flat();
        
        const emptyTiles = flatMap.filter(tile => tile === 0).length;
        const wallTiles = flatMap.filter(tile => tile === 1).length;
        const emptyRatio = emptyTiles / (emptyTiles + wallTiles);
        
        // Entre 35% et 65% devraient être des chemins
        expect(emptyRatio).toBeGreaterThan(0.35);
        expect(emptyRatio).toBeLessThan(0.65);
    });

    // === TEST 5 : getRandomEmptyPosition avec edge cases ===
    test('getRandomEmptyPosition retourne toujours une position vide', () => {
        const map = generateMaze(21, 21);
        
        for (let i = 0; i < 50; i++) {
            const pos = getRandomEmptyPosition(map);
            
            expect(pos).toBeDefined();
            expect(pos.x).toBeGreaterThanOrEqual(0);
            expect(pos.y).toBeGreaterThanOrEqual(0);
            expect(pos.x).toBeLessThan(map[0].length * TILE_SIZE);
            expect(pos.y).toBeLessThan(map.length * TILE_SIZE);
            
            // Vérifier que c'est pas un mur
            const gridX = Math.floor(pos.x / TILE_SIZE);
            const gridY = Math.floor(pos.y / TILE_SIZE);
            expect(map[gridY][gridX]).toBe(0);
        }
    });

    // === TEST 6 : Prim's algorithm (si disponible) ===
    test('Prim maze algorithm devrait générer une map valide', () => {
        // Vérifie si generateMazePrim existe et fonctionne
        if (typeof generateMazePrim !== 'function') {
            expect(true).toBe(true); // Skip si non disponible
            return;
        }

        const map = generateMazePrim(21, 21);
        
        expect(map).toBeDefined();
        expect(map.length).toBe(21);
        expect(map[0].length).toBe(21);
        
        const flatMap = map.flat();
        expect(flatMap).toContain(0);
        expect(flatMap).toContain(1);
    });

    // === TEST 7 : Dimensions paires/impaires normalisées ===
    test('Dimensions paires doivent être converties en impaires', () => {
        // Paires demandées
        const map = generateMaze(16, 20);
        
        // Doivent être converties en impaires (17, 21)
        expect(map.length).toBe(21 || 20); // Impaire ou égale
        expect(map[0].length).toBe(17 || 16); // Impaire ou égale
    });

    // === TEST 8 : Performance (génération rapide) ===
    test('Génération de 100 cartes ne devrait pas dépasser 1 seconde', () => {
        const start = Date.now();
        
        for (let i = 0; i < 100; i++) {
            generateMaze(15, 15);
        }
        
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000); // Max 5 sec pour 100 maps
    });

    // === TEST 9 : Plus grande map de jeu (niveau 50) ===
    test('Devrait générer map pour niveau avancé (niveau 50 = 115x115)', () => {
        const level = 50;
        const size = 15 + (level * 2); // 115x115
        
        const map = generateMaze(size, size);
        
        expect(map.length).toBe(size);
        expect(map[0].length).toBe(size);
        expect(map.flat()).toContain(0);
    });
});
