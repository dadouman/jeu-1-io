// tests/maze.test.js

const { generateMaze, getRandomEmptyPosition, TILE_SIZE } = require('../utils/map');

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