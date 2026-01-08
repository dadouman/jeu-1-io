// tests/collision-boundaries.test.js
// Tests pour couvrir les edge cases du système de collision

const { checkWallCollision } = require('../utils/collisions');

describe('Collision System - Boundary Cases', () => {

    // Setup: Mock map 5x5
    const mockMap = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ];

    // === TEST 1 : Exact Boundaries ===
    test('Collision à l\'extrême bord gauche (x=0)', () => {
        expect(checkWallCollision(0, 50, mockMap)).toBe(false);
    });

    test('Collision à l\'extrême bord haut (y=0)', () => {
        expect(checkWallCollision(50, 0, mockMap)).toBe(false);
    });

    test('Collision juste avant les limites', () => {
        const mapWidth = mockMap[0].length * 40; // 200
        const mapHeight = mockMap.length * 40; // 200
        
        // (195 + 5) / 40 = 5 >= mapWidth(5), donc collision
        expect(checkWallCollision(mapWidth - 5, mapHeight - 5, mockMap)).toBe(true);
    });

    test('Collision juste après les limites (hors map)', () => {
        const mapWidth = mockMap[0].length * 40;
        const mapHeight = mockMap.length * 40;
        
        expect(checkWallCollision(mapWidth + 1, mapHeight, mockMap)).toBe(true);
    });

    // === TEST 2 : Negative Coordinates ===
    test('Collision aux coordonnées négatives (x<0)', () => {
        expect(checkWallCollision(-1, 50, mockMap)).toBe(true);
    });

    test('Collision aux coordonnées négatives (y<0)', () => {
        expect(checkWallCollision(50, -1, mockMap)).toBe(true);
    });

    test('Collision aux coordonnées négatives (x,y<0)', () => {
        expect(checkWallCollision(-100, -100, mockMap)).toBe(true);
    });

    test('Collision très proche de 0 négatif', () => {
        expect(checkWallCollision(-0.5, 50, mockMap)).toBe(true);
    });

    // === TEST 3 : Floating Point Precision ===
    test('Collision avec coordonnées décimales', () => {
        expect(checkWallCollision(10.5, 10.7, mockMap)).toBe(false);
    });

    test('Collision décimale sur un mur', () => {
        // Case 1,1 est un mur (50-80 pixels)
        expect(checkWallCollision(65.3, 65.7, mockMap)).toBe(true);
    });

    // === TEST 4 : Multiple Simultaneous Collisions ===
    test('Collision avec 4 joueurs à différentes positions', () => {
        const positions = [
            { x: 10, y: 10, shouldCollide: false },
            { x: 100, y: 100, shouldCollide: false },
            { x: 65, y: 65, shouldCollide: true },  // Mur
            { x: 150, y: 150, shouldCollide: true }  // Hors map (gridY >= 5, gridX >= 5)
        ];

        positions.forEach(pos => {
            const result = checkWallCollision(pos.x, pos.y, mockMap);
            expect(result).toBe(pos.shouldCollide);
        });
    });

    // === TEST 5 : Large Map Edge Cases ===
    test('Collision sur très grande map (100x100)', () => {
        const largeMap = [];
        for (let i = 0; i < 100; i++) {
            largeMap.push(new Array(100).fill(0));
        }
        largeMap[50][50] = 1; // Un seul mur au centre
        
        expect(checkWallCollision(10, 10, largeMap)).toBe(false);
        expect(checkWallCollision(2000, 2000, largeMap)).toBe(true); // Hors limites
        expect(checkWallCollision(2005, 2005, largeMap)).toBe(true); // Hors limites
    });

    // === TEST 6 : Grid Transition Boundary ===
    test('Collision au passage entre deux cases', () => {
        // Case (0,0) est vide (0-40)
        // Case (1,0) contient un mur
        // Note: le code ajoute +5 au X avant de diviser
        
        expect(checkWallCollision(39, 10, mockMap)).toBe(false);  // (39+5)/40 = 1, mockMap[0][1] = 0
        expect(checkWallCollision(41, 10, mockMap)).toBe(false);  // (41+5)/40 = 1, mockMap[0][1] = 0
    });

    // === TEST 7 : Precision + 5 Buffer ===
    test('Buffer de +5 pixels devrait être appliqué', () => {
        // Le code ajoute +5 au X pour éviter les glitches
        // Position 35 (dans case 0) + 5 = 40 = case 1 limit
        // Donc 35 devrait pas collisionner
        expect(checkWallCollision(35, 10, mockMap)).toBe(false);
    });

    // === TEST 8 : All-Wall Map ===
    test('Map remplie de murs partout (sauf entrée)', () => {
        const wallMap = [];
        for (let i = 0; i < 5; i++) {
            wallMap.push(new Array(5).fill(1));
        }
        wallMap[0][0] = 0; // Une seule case vide

        expect(checkWallCollision(10, 10, wallMap)).toBe(false);   // Position vide
        expect(checkWallCollision(50, 50, wallMap)).toBe(true);    // Mur
        expect(checkWallCollision(100, 100, wallMap)).toBe(true);  // Hors limites
    });

    // === TEST 9 : All-Empty Map ===
    test('Map complètement vide (pas de murs)', () => {
        const emptyMap = [];
        for (let i = 0; i < 5; i++) {
            emptyMap.push(new Array(5).fill(0));
        }

        expect(checkWallCollision(10, 10, emptyMap)).toBe(false);
        // (199+5)/40 = 5.1 >= 5 (map.length), collision
        expect(checkWallCollision(199, 199, emptyMap)).toBe(true);
        expect(checkWallCollision(200, 200, emptyMap)).toBe(true); // Hors limites
    });

    // === TEST 10 : Corners ===
    test('Collisions aux 4 coins de la map', () => {
        const maxX = mockMap[0].length * 40 - 1; // 199
        const maxY = mockMap.length * 40 - 1;    // 199

        expect(checkWallCollision(0, 0, mockMap)).toBe(false);           // Coin haut-gauche
        // (199+5)/40 = 5.1 >= 5, donc collision
        expect(checkWallCollision(maxX, 0, mockMap)).toBe(true);         // Hors limites
        expect(checkWallCollision(0, maxY, mockMap)).toBe(true);         // Hors limites
        expect(checkWallCollision(maxX, maxY, mockMap)).toBe(true);      // Hors limites
    });

    // === TEST 11 : Spiral Movement (complexe) ===
    test('Mouvements en spirale (10 pas) ne devraient pas crasher', () => {
        let x = 50, y = 50;
        const radius = 30;
        
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            x = 50 + Math.cos(angle) * radius;
            y = 50 + Math.sin(angle) * radius;
            
            // Ne devrait pas crasher
            const result = checkWallCollision(x, y, mockMap);
            expect(typeof result).toBe('boolean');
        }
    });
});
