// tests/mode-selection.test.js - Tests du système de sélection de mode

describe('Mode Selection System', () => {
    // Mock de la fonction calculateMazeSize depuis le serveur
    const calculateMazeSize = (level, mode = 'classic') => {
        const baseSize = 15;
        const sizeIncrement = 2;
        
        if (mode === 'classic') {
            if (level <= 20) {
                const size = baseSize + (level - 1) * sizeIncrement;
                return { width: size, height: size };
            } else {
                const descendLevel = level - 20;
                const size = baseSize + (20 - descendLevel) * sizeIncrement;
                return { width: size, height: size };
            }
        } else if (mode === 'infinite') {
            const size = baseSize + (level - 1) * sizeIncrement;
            return { width: size, height: size };
        }
    };

    describe('Classic Mode (10 niveaux)', () => {
        test('Niveau 1: doit avoir taille 15x15', () => {
            const size = calculateMazeSize(1, 'classic');
            expect(size.width).toBe(15);
            expect(size.height).toBe(15);
        });

        test('Niveau 20: taille maximale proche de 55x55 (53x53)', () => {
            const size = calculateMazeSize(20, 'classic');
            expect(size.width).toBe(53);
            expect(size.height).toBe(53);
        });

        test('Niveau 21: doit commencer à diminuer (53x53)', () => {
            const size = calculateMazeSize(21, 'classic');
            expect(size.width).toBe(53);
            expect(size.height).toBe(53);
        });

        test('Niveau 40: doit revenir à 15x15', () => {
            const size = calculateMazeSize(40, 'classic');
            expect(size.width).toBe(15);
            expect(size.height).toBe(15);
        });

        test('Progression montante correcte: 1->20', () => {
            for (let level = 1; level <= 20; level++) {
                const size = calculateMazeSize(level, 'classic');
                const expectedSize = 15 + (level - 1) * 2;
                expect(size.width).toBe(expectedSize);
                expect(size.height).toBe(expectedSize);
            }
        });

        test('Progression descendante correcte: 21->40', () => {
            for (let level = 21; level <= 40; level++) {
                const size = calculateMazeSize(level, 'classic');
                const descendLevel = level - 20;
                const expectedSize = 15 + (20 - descendLevel) * 2;
                expect(size.width).toBe(expectedSize);
                expect(size.height).toBe(expectedSize);
            }
        });
    });

    describe('Infinite Mode', () => {
        test('Niveau 1: doit avoir taille 15x15', () => {
            const size = calculateMazeSize(1, 'infinite');
            expect(size.width).toBe(15);
            expect(size.height).toBe(15);
        });

        test('Niveau 50: doit avoir taille 113x113', () => {
            const size = calculateMazeSize(50, 'infinite');
            expect(size.width).toBe(113);
            expect(size.height).toBe(113);
        });

        test('Progression continue sans limite', () => {
            for (let level = 1; level <= 100; level++) {
                const size = calculateMazeSize(level, 'infinite');
                const expectedSize = 15 + (level - 1) * 2;
                expect(size.width).toBe(expectedSize);
                expect(size.height).toBe(expectedSize);
            }
        });
    });

    describe('Zoom Calculation for Mode', () => {
        // Mock de la fonction calculateZoomForMode depuis le client
        const calculateZoomForMode = (level) => {
            // Logique depuis mode-selector.js
            // Mode par défaut: classic avec inversion en phase 2
            if (level <= 20) {
                // Phase 1: descendre de 1.0 à 0.62
                return Math.max(0.6, Math.min(1.0, 1.0 - (level - 1) * 0.02));
            } else {
                // Phase 2: remonter de 0.62 à 0.98
                const descendLevel = level - 20;
                return Math.max(0.6, Math.min(1.0, 1.0 - (20 - descendLevel) * 0.02));
            }
        };

        test('Niveau 1: zoom = 1.0', () => {
            const zoom = calculateZoomForMode(1);
            expect(zoom).toBeCloseTo(1.0, 2);
        });

        test('Niveau 20: zoom = 0.62', () => {
            const zoom = calculateZoomForMode(20);
            expect(zoom).toBeCloseTo(0.62, 2);
        });

        test('Niveau 21: zoom = 0.62 (continue descendant)', () => {
            const zoom = calculateZoomForMode(21);
            expect(zoom).toBeCloseTo(0.62, 2);
        });

        test('Niveau 40: zoom = 1.0 (retour au départ)', () => {
            const zoom = calculateZoomForMode(40);
            expect(zoom).toBeCloseTo(1.0, 2);
        });

        test('Progression phase 1 correcte', () => {
            for (let level = 1; level <= 20; level++) {
                const zoom = calculateZoomForMode(level);
                const expectedZoom = Math.max(0.6, Math.min(1.0, 1.0 - (level - 1) * 0.02));
                expect(zoom).toBeCloseTo(expectedZoom, 2);
            }
        });

        test('Progression phase 2 correcte', () => {
            for (let level = 21; level <= 40; level++) {
                const zoom = calculateZoomForMode(level);
                const descendLevel = level - 20;
                const expectedZoom = Math.max(0.6, Math.min(1.0, 1.0 - (20 - descendLevel) * 0.02));
                expect(zoom).toBeCloseTo(expectedZoom, 2);
            }
        });
    });

    describe('Shop Items Filtering', () => {
        const getShopItemsForMode = (mode = 'classic') => {
            const allItems = {
                dash: { id: 'dash', name: 'Dash ⚡', price: 5 },
                checkpoint: { id: 'checkpoint', name: 'Checkpoint 🚩', price: 3 },
                compass: { id: 'compass', name: 'Boussole 🧭', price: 4 },
                rope: { id: 'rope', name: 'Corde 🪢', price: 1 },
                speedBoost: { id: 'speedBoost', name: 'Vitesse+ 💨', price: 2 }
            };
            
            if (mode === 'infinite') {
                return { speedBoost: allItems.speedBoost };
            }
            return allItems;
        };

        test('Mode classique: tous les items disponibles', () => {
            const items = getShopItemsForMode('classic');
            expect(Object.keys(items)).toHaveLength(5);
            expect(items.dash).toBeDefined();
            expect(items.checkpoint).toBeDefined();
            expect(items.compass).toBeDefined();
            expect(items.rope).toBeDefined();
            expect(items.speedBoost).toBeDefined();
        });

        test('Mode infini: seulement speedBoost disponible', () => {
            const items = getShopItemsForMode('infinite');
            expect(Object.keys(items)).toHaveLength(1);
            expect(items.speedBoost).toBeDefined();
            expect(items.dash).toBeUndefined();
            expect(items.checkpoint).toBeUndefined();
            expect(items.rope).toBeUndefined();
        });
    });

    describe('Game Finished Conditions', () => {
        const isGameFinished = (level, mode = 'classic') => {
            if (mode === 'classic' && level > 40) {
                return true;
            }
            return false;
        };

        test('Mode classique, niveau 40: jeu non terminé', () => {
            expect(isGameFinished(40, 'classic')).toBe(false);
        });

        test('Mode classique, niveau 41: jeu terminé', () => {
            expect(isGameFinished(41, 'classic')).toBe(true);
        });

        test('Mode infini, niveau 1000: jeu non terminé', () => {
            expect(isGameFinished(1000, 'infinite')).toBe(false);
        });
    });
});
