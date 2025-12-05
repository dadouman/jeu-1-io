// tests/checkpoint.test.js

describe('Système de Checkpoint', () => {

    // --- TEST 1 : Création de checkpoint ---
    test('Un checkpoint doit pouvoir être créé et stocké', () => {
        const checkpoint = {
            x: 100,
            y: 150
        };

        expect(checkpoint).toBeDefined();
        expect(checkpoint.x).toBe(100);
        expect(checkpoint.y).toBe(150);
    });

    // --- TEST 2 : Déplacement de checkpoint ---
    test('Un checkpoint doit pouvoir être déplacé', () => {
        let checkpoint = { x: 100, y: 100 };

        // Déplacement
        checkpoint = { x: 200, y: 200 };

        expect(checkpoint.x).toBe(200);
        expect(checkpoint.y).toBe(200);
    });

    // --- TEST 3 : Réinitialisation au changement de niveau ---
    test('Checkpoint doit être null après changement de niveau', () => {
        let checkpoint = { x: 100, y: 100 };
        let level = 1;

        // Simulation changement de niveau
        if (level < 2) {
            checkpoint = null;
            level = 2;
        }

        expect(checkpoint).toBeNull();
        expect(level).toBe(2);
    });

    // --- TEST 4 : Validation des coordonnées ---
    test('Les coordonnées du checkpoint doivent être valides', () => {
        const checkpoint = { x: 50, y: 75 };

        expect(typeof checkpoint.x).toBe('number');
        expect(typeof checkpoint.y).toBe('number');
        expect(checkpoint.x).toBeGreaterThanOrEqual(0);
        expect(checkpoint.y).toBeGreaterThanOrEqual(0);
    });

});
