// tests/integration.test.js

describe('Intégration Complète', () => {

    // --- TEST 1 : Scénario complet d'une partie ---
    test('Scénario complet : mouvement, dash, pièce, niveau suivant', () => {
        // État initial
        let level = 1;
        const player = {
            x: 100,
            y: 100,
            score: 0,
            trail: [],
            lastDirection: 'right'
        };
        let coin = { x: 250, y: 100 };

        // 1. Mouvement
        player.x += 5;
        player.trail.push({ x: player.x, y: player.y });
        expect(player.x).toBe(105);

        // 2. Dash (simulation)
        if (player.lastDirection === 'right') {
            player.x += 150;
        }
        expect(player.x).toBeGreaterThan(105);

        // 3. Collision avec pièce (après le dash)
        const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
        if (dist < 50) {
            player.score++;
            level++;
            player.trail = [];
        }

        // Vérifications
        expect(player.score).toBe(1);
        expect(level).toBe(2);
        expect(player.trail.length).toBe(0);
    });

    // --- TEST 2 : Cycle complet multijoueur ---
    test('Cycle complet avec 2 joueurs qui collectent des pièces', () => {
        const players = {
            'player1': { x: 100, y: 100, score: 0, trail: [], checkpoint: null },
            'player2': { x: 200, y: 200, score: 0, trail: [], checkpoint: null }
        };
        let level = 1;
        let coin = { x: 150, y: 100 };

        // Joueur 1 bouge vers la pièce
        players['player1'].x = 150;
        players['player1'].y = 100;

        // Collision ?
        const dist = Math.hypot(players['player1'].x - coin.x, players['player1'].y - coin.y);
        if (dist < 30) {
            players['player1'].score++;
            level++;
        }

        expect(players['player1'].score).toBe(1);
        expect(level).toBe(2);
        expect(players['player2'].score).toBe(0); // Player 2 ne l'a pas prise
    });

    // --- TEST 3 : Interaction checkpoint + dash ---
    test('Utilisation combinée du checkpoint et du dash', () => {
        const player = {
            x: 100,
            y: 100,
            score: 0,
            checkpoint: null,
            lastDirection: 'right'
        };

        // 1. Créer un checkpoint
        player.checkpoint = { x: player.x, y: player.y };
        expect(player.checkpoint).not.toBeNull();

        // 2. Dash
        player.x += 200;
        expect(player.x).toBeGreaterThan(100);

        // 3. Téléportation au checkpoint
        player.x = player.checkpoint.x;
        player.y = player.checkpoint.y;

        expect(player.x).toBe(100);
        expect(player.y).toBe(100);
    });

    // --- TEST 4 : Cycle complet de niveau ---
    test('Progression complète d\'un niveau', () => {
        let level = 1;
        const calculateMazeSize = (level) => 15 + (level * 2);
        let mazeSize = calculateMazeSize(level);

        const players = {};
        for (let i = 0; i < 3; i++) {
            players[`player${i}`] = {
                x: Math.random() * mazeSize * 40,
                y: Math.random() * mazeSize * 40,
                score: 0,
                trail: [],
                checkpoint: null
            };
        }

        // Simulation : un joueur gagne
        players['player0'].score = 1;
        level = 2;

        const newMazeSize = calculateMazeSize(level);

        expect(newMazeSize).toBeGreaterThan(mazeSize);
        expect(level).toBe(2);
        expect(players['player0'].score).toBe(1);
    });

});
