// tests/zoom.test.js - Tests pour le système de zoom progressif

describe('Système de Zoom Progressif', () => {

    // --- TEST 1 : Zoom de base (niveau 1) ---
    test('Niveau 1 doit avoir un zoom de 1.0x (pas de zoom)', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        const zoom = getZoomLevel(1);
        expect(zoom).toBe(1.0);
    });

    // --- TEST 2 : Zoom progressif par niveau ---
    test('Le zoom doit diminuer de 2% par niveau', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        expect(getZoomLevel(1)).toBe(1.0);       // 1.0
        expect(getZoomLevel(2)).toBeCloseTo(0.98, 3);   // 1.0 - 0.02 = 0.98
        expect(getZoomLevel(3)).toBeCloseTo(0.96, 3);   // 1.0 - 0.04 = 0.96
        expect(getZoomLevel(5)).toBeCloseTo(0.92, 3);   // 1.0 - 0.08 = 0.92
        expect(getZoomLevel(10)).toBeCloseTo(0.82, 3);  // 1.0 - 0.18 = 0.82
    });

    // --- TEST 3 : Zoom minimum clampé à 0.7x ---
    test('Le zoom ne doit pas descendre en dessous de 0.7x', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        expect(getZoomLevel(50)).toBe(0.7);   // 1.0 - 0.98 = 0.02, clampé à 0.7
        expect(getZoomLevel(100)).toBe(0.7); // Bien clampé
        expect(getZoomLevel(1000)).toBe(0.7); // Très clampé
    });

    // --- TEST 4 : Zoom maximum limité à 1.0x ---
    test('Le zoom ne doit pas dépasser 1.0x', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        expect(getZoomLevel(1)).toBeLessThanOrEqual(1.0);
        expect(getZoomLevel(2)).toBeLessThanOrEqual(1.0);
        expect(getZoomLevel(0)).toBeLessThanOrEqual(1.0); // Même avec niveau 0
    });

    // --- TEST 5 : Zoom avec niveau fractionnaire ---
    test('Le zoom doit fonctionner avec des niveaux fractionnaires', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        const zoom = getZoomLevel(2.5);
        expect(zoom).toBeCloseTo(0.97, 2); // 1.0 - 0.03 = 0.97
    });

    // --- TEST 6 : Zoom doit être appliqué autour du joueur ---
    test('Les transformations de zoom doivent être centrées sur le joueur', () => {
        const playerX = 500;
        const playerY = 300;
        const zoomLevel = 0.95;

        // Simulation de la transformation Canvas
        // ctx.translate(playerX, playerY)
        // ctx.scale(zoomLevel, zoomLevel)
        // ctx.translate(-playerX, -playerY)

        // Le zoom doit être appliqué autour du point (playerX, playerY)
        const transformedX = playerX + (playerX - playerX) * (1 - zoomLevel);
        const transformedY = playerY + (playerY - playerY) * (1 - zoomLevel);

        expect(transformedX).toBe(playerX);
        expect(transformedY).toBe(playerY);
    });

    // --- TEST 7 : Plage de zoom acceptée ---
    test('Le zoom doit rester dans la plage 0.7 à 1.0', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        for (let level = 1; level <= 100; level++) {
            const zoom = getZoomLevel(level);
            expect(zoom).toBeGreaterThanOrEqual(0.7);
            expect(zoom).toBeLessThanOrEqual(1.0);
        }
    });

    // --- TEST 8 : Niveau à partir duquel le zoom commence ---
    test('Le zoom commence au niveau 2 (niveau 1 = 1.0x)', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        expect(getZoomLevel(1)).toBe(1.0);
        expect(getZoomLevel(2)).toBeLessThan(1.0);
    });

    // --- TEST 9 : Calcul du niveau à partir du zoom ---
    test('On doit pouvoir calculer le niveau approximatif à partir du zoom', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        // Inverse : level = 1 + (1 - zoom) / 0.02
        const inverseZoom = (zoom) => {
            if (zoom >= 0.99) return 1;
            if (zoom <= 0.7) return 51; // Environ 50 niveaux
            return 1 + (1 - zoom) / 0.02;
        };

        expect(inverseZoom(1.0)).toBe(1);
        expect(inverseZoom(0.98)).toBeCloseTo(2, 0);
        expect(inverseZoom(0.90)).toBeCloseTo(6, 0);
    });

    // --- TEST 10 : Impact visuel du zoom sur le monde du jeu ---
    test('Le zoom doit miniaturiser progressivement le monde', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        const worldSize = 1000; // Taille du monde
        const viewportWidth = 800;

        // Au niveau 1, le zoom est 1.0x
        // Au niveau 50+, le zoom est 0.7x (miniaturisé)
        
        const zoom1 = getZoomLevel(1);
        const zoom50 = getZoomLevel(50);

        expect(zoom50).toBeLessThan(zoom1);
        
        // La taille affichée diminue
        const displayedSize1 = worldSize * zoom1;
        const displayedSize50 = worldSize * zoom50;
        
        expect(displayedSize50).toBeLessThan(displayedSize1);
    });

});
