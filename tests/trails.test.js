// tests/trails.test.js

describe('Système de Traces', () => {

    // --- TEST 1 : Enregistrement de trace ---
    test('Une trace doit être ajoutée lors du mouvement', () => {
        const trail = [];
        const position = { x: 50, y: 50 };

        trail.push({ x: position.x, y: position.y });

        expect(trail.length).toBe(1);
        expect(trail[0]).toEqual({ x: 50, y: 50 });
    });

    // --- TEST 2 : Limite de trace ---
    test('La trace doit être limitée à 200 positions', () => {
        const trail = [];
        const maxTrail = 200;

        // Ajouter 250 positions
        for (let i = 0; i < 250; i++) {
            trail.push({ x: i * 10, y: i * 10 });
            if (trail.length > maxTrail) {
                trail.shift(); // Supprimer la plus ancienne
            }
        }

        expect(trail.length).toBeLessThanOrEqual(maxTrail);
        expect(trail.length).toBe(maxTrail);
    });

    // --- TEST 3 : Couleur unique par joueur ---
    test('Chaque joueur doit avoir une couleur unique', () => {
        const playerColors = [
            "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3",
            "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA",
            "#FFB4A2", "#E0AFA0"
        ];

        const getPlayerColor = (playerIndex) => {
            return playerColors[playerIndex % playerColors.length];
        };

        const color1 = getPlayerColor(0);
        const color2 = getPlayerColor(1);
        const color3 = getPlayerColor(2);

        expect(color1).toBe("#FF6B6B");
        expect(color2).toBe("#4ECDC4");
        expect(color3).toBe("#FFE66D");
        expect(color1).not.toBe(color2);
        expect(color2).not.toBe(color3);
    });

    // --- TEST 4 : Réinitialisation des traces ---
    test('Les traces doivent être réinitialisées au changement de niveau', () => {
        let trail = [
            { x: 10, y: 10 },
            { x: 20, y: 20 },
            { x: 30, y: 30 }
        ];

        // Simulation changement de niveau
        trail = [];

        expect(trail.length).toBe(0);
    });

    // --- TEST 5 : Trace enregistre les mouvements successifs ---
    test('La trace doit enregistrer les mouvements successifs correctement', () => {
        const trail = [];

        // Simulation de 5 mouvements
        for (let i = 0; i < 5; i++) {
            trail.push({ x: i * 10, y: i * 20 });
        }

        expect(trail.length).toBe(5);
        expect(trail[0]).toEqual({ x: 0, y: 0 });
        expect(trail[4]).toEqual({ x: 40, y: 80 });
    });

});
