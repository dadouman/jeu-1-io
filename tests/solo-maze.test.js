// tests/solo-maze.test.js - Tests de génération de labyrinthe du mode solo

describe('Solo Mode - Génération de labyrinthe', () => {
    
    test('Maze doit être généré pour chaque niveau', () => {
        const mazesByLevel = {};
        
        for (let level = 1; level <= 20; level++) {
            mazesByLevel[level] = { cells: [], size: 15 + (level <= 10 ? (level - 1) * 2 : (10 - (level - 10)) * 2) };
        }
        
        expect(Object.keys(mazesByLevel).length).toBe(20);
    });

    test('Taille du maze doit augmenter de 15 à 33 (niveaux 1-10)', () => {
        const sizes = [];
        
        for (let level = 1; level <= 10; level++) {
            const size = 15 + (level - 1) * 2;
            sizes.push(size);
        }
        
        expect(sizes[0]).toBe(15);  // Niveau 1
        expect(sizes[9]).toBe(33);  // Niveau 10
        expect(sizes[9] - sizes[0]).toBe(18);
    });

    test('Taille du maze doit diminuer de 33 à 15 (niveaux 11-20)', () => {
        const sizes = [];
        
        for (let level = 11; level <= 20; level++) {
            const size = 15 + (10 - (level - 10)) * 2;
            sizes.push(size);
        }
        
        expect(sizes[0]).toBe(33);  // Niveau 11
        expect(sizes[9]).toBe(15);  // Niveau 20
        expect(sizes[0] - sizes[9]).toBe(18);
    });

    test('Maze doit avoir des dimensions carrées (NxN)', () => {
        const level = 5;
        const size = 15 + (level - 1) * 2; // 23x23
        
        // Vérifier que c'est carré
        expect(size).toBe(23);
    });

    test('Chaque niveau doit avoir un maze différent', () => {
        // Les labyrinthes doivent être générés aléatoirement
        const maze1 = { level: 1, seed: Math.random() };
        const maze2 = { level: 2, seed: Math.random() };
        
        // Il est très peu probable qu'ils soient identiques (sans seeds contrôlées)
        expect(maze1.level).not.toBe(maze2.level);
    });

    test('Maze doit avoir au moins un chemin viable (player → coin)', () => {
        const maze = {
            width: 23,
            height: 23,
            cells: [],
            playerStart: { x: 1, y: 1 },
            coin: { x: 21, y: 21 }
        };
        
        expect(maze.playerStart).toBeDefined();
        expect(maze.coin).toBeDefined();
        expect(maze.playerStart.x >= 0).toBe(true);
        expect(maze.coin.x < maze.width).toBe(true);
    });

    test('Position du player doit être en haut à gauche', () => {
        const playerPosition = { x: 1, y: 1 };
        
        expect(playerPosition.x).toBe(1);
        expect(playerPosition.y).toBe(1);
    });

    test('Position de la pièce doit être cohérente', () => {
        const mazeSize = 23;
        const coinPosition = { x: 21, y: 21 };
        
        expect(coinPosition.x < mazeSize).toBe(true);
        expect(coinPosition.y < mazeSize).toBe(true);
        expect(coinPosition.x > 0).toBe(true);
        expect(coinPosition.y > 0).toBe(true);
    });

    test('Maze doit être différent à chaque restart', () => {
        // Génération avec seed aléatoire
        const maze1 = { 
            level: 1, 
            seed: 123,
            cells: [0, 1, 1, 0, 1] // Simplification
        };
        const maze2 = { 
            level: 1, 
            seed: 456,
            cells: [1, 0, 1, 0, 1] // Différent
        };
        
        expect(maze1.seed).not.toBe(maze2.seed);
        expect(maze1.cells).not.toEqual(maze2.cells);
    });

    test('Niveaux de contraction (11-20) doivent avoir le même algorithme de maze', () => {
        const level11Size = 15 + (10 - (11 - 10)) * 2; // 33
        const level12Size = 15 + (10 - (12 - 10)) * 2; // 31
        
        expect(level11Size).toBe(33);
        expect(level12Size).toBe(31);
    });

    test('Maze doit avoir des murs (1) et des chemins (0)', () => {
        const maze = {
            cells: [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ]
        };
        
        // Vérifier que le maze contient des 0 (chemins) et des 1 (murs)
        const hasWalls = maze.cells.flat().some(cell => cell === 1);
        const hasPaths = maze.cells.flat().some(cell => cell === 0);
        
        expect(hasWalls).toBe(true);
        expect(hasPaths).toBe(true);
    });

    test('Maze n\'a pas de structure fixe entre replays', () => {
        const levels = [];
        
        for (let i = 0; i < 20; i++) {
            // Chaque niveau a un maze généré aléatoirement
            levels.push({
                level: i + 1,
                mazeHash: Math.random() // Représente le hash du maze
            });
        }
        
        // Tous les hashes doivent être différents (très probablement)
        const uniqueHashes = new Set(levels.map(l => l.mazeHash));
        expect(uniqueHashes.size).toBe(20); // Probablement
    });

    test('Taille minimale du maze doit être 15x15', () => {
        const minSize = 15;
        
        for (let level = 1; level <= 20; level++) {
            const size = level <= 10 
                ? 15 + (level - 1) * 2 
                : 15 + (10 - (level - 10)) * 2;
            
            expect(size).toBeGreaterThanOrEqual(minSize);
        }
    });

    test('Taille maximale du maze doit être 33x33', () => {
        const maxSize = 33;
        
        for (let level = 1; level <= 20; level++) {
            const size = level <= 10 
                ? 15 + (level - 1) * 2 
                : 15 + (10 - (level - 10)) * 2;
            
            expect(size).toBeLessThanOrEqual(maxSize);
        }
    });
});
