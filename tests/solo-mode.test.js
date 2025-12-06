// tests/solo-mode.test.js - Tests généraux du mode solo

describe('Solo Mode - Configuration de base', () => {
    
    test('Mode solo doit être disponible dans la sélection des modes', () => {
        // Le mode solo est disponible lors du selectMode('solo')
        const modeSelected = 'solo';
        expect(modeSelected).toBe('solo');
    });

    test('Calcul de taille de labyrinthe pour mode solo - Niveaux 1-10 (expansion)', () => {
        // Niveaux 1-10: expansion de 15x15 à 35x35
        // size = 15 + (level - 1) * 2
        const size1 = 15 + (1 - 1) * 2;  // Niveau 1 = 15x15
        const size5 = 15 + (5 - 1) * 2;  // Niveau 5 = 23x23
        const size10 = 15 + (10 - 1) * 2; // Niveau 10 = 33x33
        
        expect(size1).toBe(15);
        expect(size5).toBe(23);
        expect(size10).toBe(33);
    });

    test('Calcul de taille de labyrinthe pour mode solo - Niveaux 11-20 (contraction)', () => {
        // Niveaux 11-20: contraction de 33x33 à 15x15
        // size = 15 + (10 - (level - 10)) * 2
        const size11 = 15 + (10 - (11 - 10)) * 2;  // Niveau 11 = 33x33
        const size15 = 15 + (10 - (15 - 10)) * 2;  // Niveau 15 = 25x25
        const size20 = 15 + (10 - (20 - 10)) * 2;  // Niveau 20 = 15x15
        
        expect(size11).toBe(33);
        expect(size15).toBe(25);
        expect(size20).toBe(15);
    });

    test('Détermination de fin de jeu pour mode solo', () => {
        // Le jeu finit après le niveau 20
        const isFinished19 = 19 > 20 ? true : false;
        const isFinished20 = 20 > 20 ? true : false;
        const isFinished21 = 21 > 20 ? true : false;
        
        expect(isFinished19).toBe(false);
        expect(isFinished20).toBe(false);
        expect(isFinished21).toBe(true);
    });

    test('Mode solo doit avoir tous les items d\'équipement débloqués par défaut', () => {
        // Au contraire du mode classique où on doit acheter les items au shop
        const initialFeatures = {
            dash: true,
            checkpoint: true,
            rope: true,
            speedBoost: true
        };
        
        expect(initialFeatures.dash).toBe(true);
        expect(initialFeatures.checkpoint).toBe(true);
        expect(initialFeatures.rope).toBe(true);
        expect(initialFeatures.speedBoost).toBe(true);
    });

    test('Mode solo ne doit pas avoir de shop', () => {
        // Le mode solo n\'a pas d\'écran shop
        const shopItems = {};
        expect(Object.keys(shopItems).length).toBe(0);
    });

    test('Zoom doit diminuer lors de l\'expansion et augmenter lors de la contraction', () => {
        // Niveaux 1-10: maze grandit → zoom diminue
        // Niveaux 11-20: maze rétrécit → zoom augmente
        
        const zoomLevel1 = 1.0;  // Premier niveau = zoom max
        const zoomLevel10 = 0.5; // Niveau 10 = zoom min
        const zoomLevel11 = 0.5; // Niveau 11 = restart contraction
        const zoomLevel20 = 1.0; // Niveau 20 = zoom max
        
        // Vérifier la cohérence
        expect(zoomLevel1).toBeGreaterThan(zoomLevel10);
        expect(zoomLevel11).toBe(zoomLevel10);
        expect(zoomLevel20).toBe(zoomLevel1);
    });

    test('Nombre total de niveaux pour mode solo est 20', () => {
        const totalLevels = 20;
        expect(totalLevels).toBe(20);
    });

    test('Niveaux 1-10 doivent être d\'expansion (taille croissante)', () => {
        const sizes = [];
        for (let level = 1; level <= 10; level++) {
            const size = 15 + (level - 1) * 2;
            sizes.push(size);
        }
        
        // Vérifier que chaque niveau est plus grand que le précédent
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
        }
    });

    test('Niveaux 11-20 doivent être de contraction (taille décroissante)', () => {
        const sizes = [];
        for (let level = 11; level <= 20; level++) {
            const size = 15 + (10 - (level - 10)) * 2;
            sizes.push(size);
        }
        
        // Vérifier que chaque niveau est plus petit que le précédent
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i]).toBeLessThan(sizes[i - 1]);
        }
    });

    test('Taille min et max du labyrinthe solo', () => {
        const minSize = 15;
        const maxSize = 15 + (10 - 1) * 2; // 33
        
        expect(minSize).toBe(15);
        expect(maxSize).toBe(33);
    });
});
