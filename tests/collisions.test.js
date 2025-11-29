// tests/collisions.test.js

// On importe ta fonction de collision
const { checkWallCollision } = require('../utils/collisions');

// On simule une petite map pour le test (1 = Mur, 0 = Vide)
// C'est une map de 3x3 cases
const mockMap = [
    [0, 0, 0],
    [0, 1, 0], // Il y a un mur au milieu (case [1][1])
    [0, 0, 0]
];

// -- TEST 1 : Vérifier qu'on peut marcher sur le sol --
test('Renvoie FALSE si le joueur est sur du vide', () => {
    // Case [0][0] -> x=0, y=0 (sol)
    const result = checkWallCollision(0, 0, mockMap);
    expect(result).toBe(false);
});

// -- TEST 2 : Vérifier qu'on se cogne dans un mur --
test('Renvoie TRUE si le joueur touche un mur', () => {
    // La case [1][1] est un mur.
    // TILE_SIZE est de 40. Donc x=40, y=40 nous met dans la case [1][1].
    const result = checkWallCollision(40, 40, mockMap);
    expect(result).toBe(true);
});

// -- TEST 3 : Vérifier qu'on ne sort pas de la map --
test('Renvoie TRUE si le joueur sort de la map', () => {
    // Position négative
    const result = checkWallCollision(-50, -50, mockMap);
    expect(result).toBe(true);
});