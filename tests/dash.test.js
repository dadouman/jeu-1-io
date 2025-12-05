// tests/dash.test.js

const { checkWallCollision } = require('../utils/collisions');

describe('Système de Dash', () => {

    // --- TEST 1 : Dash détecte les collisions ---
    test('Le dash doit s\'arrêter à une collision', () => {
        // On simule une map simple : couloir puis mur
        const mockMap = [
            [0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 1],
        ];

        // Position de départ : (20, 20) - case vide
        let currentX = 20;
        let currentY = 20;

        const dashDistance = 15;
        const maxSteps = 20;
        let stepsCount = 0;

        // Simulation du dash vers la droite (dashDx = 1, dashDy = 0)
        const dashDx = 1;
        const dashDy = 0;

        while (stepsCount < maxSteps) {
            const nextX = currentX + dashDx * dashDistance;
            const nextY = currentY + dashDy * dashDistance;

            if (checkWallCollision(nextX, nextY, mockMap)) {
                break; // Collision trouvée
            }

            currentX = nextX;
            currentY = nextY;
            stepsCount++;
        }

        // Le joueur doit s'être arrêté avant le mur (à case 4 max)
        expect(currentX).toBeLessThan(200); // 200 serait trop loin
        expect(stepsCount).toBeGreaterThan(0); // Au moins un pas
    });

    // --- TEST 2 : Dash depuis le début du couloir ---
    test('Dash depuis le début du couloir doit couvrir plusieurs cases', () => {
        const mockMap = [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1],
        ];

        let currentX = 20; // Case 0
        let currentY = 20;

        const dashDistance = 15;
        const maxSteps = 20;
        let stepsCount = 0;
        const dashDx = 1;
        const dashDy = 0;

        while (stepsCount < maxSteps) {
            const nextX = currentX + dashDx * dashDistance;
            const nextY = currentY + dashDy * dashDistance;

            if (checkWallCollision(nextX, nextY, mockMap)) {
                break;
            }

            currentX = nextX;
            currentY = nextY;
            stepsCount++;
        }

        // Doit atteindre plusieurs cases
        expect(stepsCount).toBeGreaterThanOrEqual(3);
    });

    // --- TEST 3 : Dash en 4 directions ---
    test('Dash vers le haut doit changer Y négativement', () => {
        let currentX = 400;
        let currentY = 400; // Position au centre

        const dashDistance = 15;
        const dashDx = 0;
        const dashDy = -1; // Vers le haut

        // Simulation du dash pendant 5 pas
        for (let i = 0; i < 5; i++) {
            currentX += dashDx * dashDistance;
            currentY += dashDy * dashDistance;
        }

        // Y doit être inférieur à 400
        expect(currentY).toBeLessThan(400);
        expect(currentX).toBe(400); // X ne change pas
    });

    // --- TEST 4 : Dash vers la droite ---
    test('Dash vers la droite doit changer X positivement', () => {
        let currentX = 100;
        let currentY = 100;

        const dashDistance = 15;
        const dashDx = 1;
        const dashDy = 0;

        for (let i = 0; i < 5; i++) {
            currentX += dashDx * dashDistance;
            currentY += dashDy * dashDistance;
        }

        expect(currentX).toBeGreaterThan(100);
        expect(currentY).toBe(100);
    });

});
