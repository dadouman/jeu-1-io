// tests/maze.test.js

const { generateMaze, generateMazePrim, generateMazeAdvanced, getRandomEmptyPosition, TILE_SIZE } = require('../utils/map');

describe('Système de Labyrinthe et Niveaux', () => {

    // --- TEST 1 : GÉNÉRATION BASIQUE ---
    test('Doit générer un labyrinthe de la taille demandée (Niveau 1)', () => {
        // On demande un labyrinthe de 15x15
        const width = 15;
        const height = 15;
        const map = generateMaze(width, height);

        // Vérifications
        expect(map).toBeDefined();
        expect(map.length).toBe(height); // Hauteur correcte
        expect(map[0].length).toBe(width); // Largeur correcte
    });

    // --- TEST 2 : LOGIQUE D\'AGRANDISSEMENT (Niveau supérieur) ---
    test('Doit générer un labyrinthe plus grand pour le Niveau 5', () => {
        // Formule utilisée dans server.js : 15 + (niveau * 2)
        const level = 5;
        const size = 15 + (level * 2); // 25
        
        const map = generateMaze(size, size);

        expect(map.length).toBe(25);
        expect(map[0].length).toBe(25);
    });

    // --- TEST 3 : CONTENU DU LABYRINTHE ---
    test('Le labyrinthe ne doit pas être vide (doit contenir des murs et des chemins)', () => {
        const map = generateMaze(15, 15);
        
        // On aplatit le tableau 2D en tableau 1D pour chercher dedans
        const flatMap = map.flat();

        // Il doit y avoir des 1 (Murs)
        expect(flatMap).toContain(1);
        // Il doit y avoir des 0 (Chemins)
        expect(flatMap).toContain(0);
    });

    // --- TEST 4 : TÉLÉPORTATION SÉCURISÉE ---
    test('getRandomEmptyPosition ne doit JAMAIS renvoyer un mur', () => {
        // On génère 100 positions aléatoires pour être sûr statistiquement
        const map = generateMaze(21, 21);

        for (let i = 0; i < 100; i++) {
            const pos = getRandomEmptyPosition(map);
            
            // On convertit les pixels (x,y) en case de grille
            const gridX = Math.floor(pos.x / TILE_SIZE);
            const gridY = Math.floor(pos.y / TILE_SIZE);

            // La case doit être 0 (Vide)
            if (map[gridY][gridX] === 1) {
                console.error(`Erreur : Position trouvée dans un mur à ${gridX},${gridY}`);
            }
            expect(map[gridY][gridX]).toBe(0);
        }
    });

    // --- TEST 5 : GESTION DES TAILLES PAIRES ---
    test('Doit corriger automatiquement une taille paire en impaire', () => {
        // L'algorithme DFS a besoin de nombres impairs.
        // Si on demande 14, il doit renvoyer 15.
        const map = generateMaze(14, 14);
        expect(map.length).toBe(15);
    });
});

// ============================================================
// TESTS POUR L'ALGORITHME DE PRIM
// ============================================================
describe('Algorithme de Prim - Génération de labyrinthe', () => {

    // --- TEST 1 : GÉNÉRATION BASIQUE PRIM ---
    test('Doit générer un labyrinthe avec Prim', () => {
        const map = generateMazePrim(15, 15);
        
        expect(map).toBeDefined();
        expect(map.length).toBe(15);
        expect(map[0].length).toBe(15);
    });

    // --- TEST 2 : TAILLES VARIABLES ---
    test('Doit supporter des tailles variables (20x20, 40x40)', () => {
        const map20 = generateMazePrim(20, 20);
        const map40 = generateMazePrim(40, 40);
        
        // Tailles impaires forcées
        expect(map20.length).toBe(21);
        expect(map40.length).toBe(41);
    });

    // --- TEST 3 : CONTENU DU LABYRINTHE ---
    test('Le labyrinthe Prim doit contenir des murs et des chemins', () => {
        const map = generateMazePrim(21, 21);
        const flatMap = map.flat();
        
        expect(flatMap).toContain(1); // Murs
        expect(flatMap).toContain(0); // Chemins
    });

    // --- TEST 4 : DENSITÉ FAIBLE (PLUS OUVERT) ---
    test('Densité faible doit créer plus de passages', () => {
        const mapDense = generateMazePrim(21, 21, { density: 1.0 });
        const mapOpen = generateMazePrim(21, 21, { density: 0.0 });
        
        const countPaths = (map) => map.flat().filter(cell => cell === 0).length;
        
        // Map ouverte doit avoir plus de passages
        expect(countPaths(mapOpen)).toBeGreaterThan(countPaths(mapDense));
    });

    // --- TEST 5 : PERFORMANCE (<100ms pour 40x40) ---
    test('Doit générer un 40x40 en moins de 100ms', () => {
        const start = Date.now();
        generateMazePrim(40, 40);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(100);
    });

    // --- TEST 6 : POSITIONS VALIDES ---
    test('getRandomEmptyPosition fonctionne avec Prim', () => {
        const map = generateMazePrim(21, 21);
        
        for (let i = 0; i < 50; i++) {
            const pos = getRandomEmptyPosition(map);
            const gridX = Math.floor(pos.x / TILE_SIZE);
            const gridY = Math.floor(pos.y / TILE_SIZE);
            
            expect(map[gridY][gridX]).toBe(0);
        }
    });

    // --- TEST 7 : BORDURES INTACTES ---
    test('Les bordures doivent rester des murs', () => {
        const map = generateMazePrim(21, 21);
        
        // Vérifier la bordure supérieure et inférieure
        for (let x = 0; x < map[0].length; x++) {
            expect(map[0][x]).toBe(1);
            expect(map[map.length - 1][x]).toBe(1);
        }
        
        // Vérifier la bordure gauche et droite
        for (let y = 0; y < map.length; y++) {
            expect(map[y][0]).toBe(1);
            expect(map[y][map[0].length - 1]).toBe(1);
        }
    });
});

// ============================================================
// TESTS POUR LA FONCTION UNIFIÉE
// ============================================================
describe('generateMazeAdvanced - Fonction unifiée', () => {

    test('Par défaut utilise backtracker', () => {
        const map = generateMazeAdvanced(15, 15);
        expect(map).toBeDefined();
        expect(map.length).toBe(15);
    });

    test('Peut utiliser Prim explicitement', () => {
        const map = generateMazeAdvanced(15, 15, { algorithm: 'prim' });
        expect(map).toBeDefined();
        expect(map.length).toBe(15);
    });

    test('Prim avec densité via generateMazeAdvanced', () => {
        const map = generateMazeAdvanced(21, 21, { 
            algorithm: 'prim', 
            density: 0.3 
        });
        
        const flatMap = map.flat();
        expect(flatMap).toContain(0);
        expect(flatMap).toContain(1);
    });
});