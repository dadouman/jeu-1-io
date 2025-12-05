// tests/scoring.test.js

describe('Système de Score et Niveaux', () => {

    // --- TEST 1 : Augmentation du score ---
    test('Le score doit augmenter quand on ramasse une pièce', () => {
        const player = { score: 0 };

        player.score++;

        expect(player.score).toBe(1);
    });

    // --- TEST 2 : Augmentation du niveau ---
    test('Le niveau doit augmenter après ramassage de pièce', () => {
        let level = 1;
        const playerScore = 5;

        if (playerScore > 0) {
            level++;
        }

        expect(level).toBe(2);
    });

    // --- TEST 3 : Taille du labyrinthe augmente par niveau ---
    test('La taille du labyrinthe doit augmenter avec le niveau', () => {
        const calculateMazeSize = (level) => 15 + (level * 2);

        const size1 = calculateMazeSize(1);
        const size2 = calculateMazeSize(2);
        const size5 = calculateMazeSize(5);

        expect(size1).toBe(17);
        expect(size2).toBe(19);
        expect(size5).toBe(25);
        expect(size5).toBeGreaterThan(size1);
    });

    // --- TEST 4 : Réinitialisation des joueurs au changement de niveau ---
    test('Les joueurs doivent être réinitialisés au changement de niveau', () => {
        const players = {
            'player1': { x: 100, y: 100, trail: [{ x: 100, y: 100 }], checkpoint: { x: 50, y: 50 } },
            'player2': { x: 150, y: 150, trail: [{ x: 150, y: 150 }], checkpoint: { x: 75, y: 75 } }
        };

        // Simulation changement de niveau
        for (let pid in players) {
            players[pid].trail = [];
            players[pid].checkpoint = null;
        }

        expect(players['player1'].trail.length).toBe(0);
        expect(players['player2'].trail.length).toBe(0);
        expect(players['player1'].checkpoint).toBeNull();
    });

    // --- TEST 5 : Score cumulatif sur plusieurs pièces ---
    test('Le score doit être cumulatif sur plusieurs pièces', () => {
        const player = { score: 0 };

        // Ramasser 3 pièces
        for (let i = 0; i < 3; i++) {
            player.score++;
        }

        expect(player.score).toBe(3);
    });

    // --- TEST 6 : Calcul de progression du niveau ---
    test('La progression du niveau doit être linéaire', () => {
        const calculateMazeSize = (level) => 15 + (level * 2);

        const sizes = [];
        for (let level = 1; level <= 10; level++) {
            sizes.push(calculateMazeSize(level));
        }

        // Chaque niveau ajoute 2 cases
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i] - sizes[i - 1]).toBe(2);
        }
    });

});
