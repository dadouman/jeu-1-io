// tests/collisions.test.js

const { checkWallCollision } = require('../utils/collisions');

// On simule une petite map pour le test (1 = Mur, 0 = Sol)
// TILE_SIZE est de 40px.
const mockMap = [
    [0, 0, 0], // Ligne 0
    [0, 1, 0], // Ligne 1 (Mur au milieu)
    [0, 0, 0]  // Ligne 2
];

describe('Système de Collisions (Mode Grille)', () => {

    // TEST 1 : Marcher sur une case vide
    test('Ne doit pas collisionner sur une case vide (0,0)', () => {
        // Position 10,10 (Case 0,0)
        const result = checkWallCollision(10, 10, mockMap);
        expect(result).toBe(false);
    });

    // TEST 2 : Marcher dans un mur
    test('Doit collisionner sur un mur (case 1,1)', () => {
        // Position 50,50 (Case 1,1 qui est un mur)
        const result = checkWallCollision(50, 50, mockMap);
        expect(result).toBe(true);
    });

    // TEST 3 : Sortir de la carte (négatif)
    test('Doit collisionner si on sort de la map (négatif)', () => {
        const result = checkWallCollision(-5, -5, mockMap);
        expect(result).toBe(true);
    });

    // TEST 4 : Sortir de la carte (trop loin)
    test('Doit collisionner si on sort de la map (trop grand)', () => {
        const result = checkWallCollision(200, 200, mockMap);
        expect(result).toBe(true);
    });
});