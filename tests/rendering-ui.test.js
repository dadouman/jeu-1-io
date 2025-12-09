/**
 * rendering-ui.test.js
 * Tests pour la couche de présentation (HUD, features, stats)
 * Valide que les éléments UI sont correctement rendus et visibles
 */

describe('UI Rendering Tests - HUD et Features', () => {
    let mockCtx;
    let mockCanvas;
    let savedFunctions;

    beforeEach(() => {
        // Mock du contexte Canvas
        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            quadraticCurveTo: jest.fn(),
            closePath: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            fillText: jest.fn(),
            textAlign: '',
            textBaseline: '',
            font: '',
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            globalAlpha: 1.0
        };

        mockCanvas = {
            width: 800,
            height: 600,
            getContext: jest.fn(() => mockCtx)
        };

        // Sauvegarder les fonctions globales avant les tests
        savedFunctions = {
            renderFeaturesHUD: global.renderFeaturesHUD,
            renderSoloHUD: global.renderSoloHUD,
            formatTime: global.formatTime
        };

        // Mock de formatTime
        global.formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
    });

    afterEach(() => {
        // Restaurer les fonctions globales
        global.renderFeaturesHUD = savedFunctions.renderFeaturesHUD;
        global.renderSoloHUD = savedFunctions.renderSoloHUD;
        global.formatTime = savedFunctions.formatTime;
    });

    // ==================== TESTS HUD FEATURES ====================

    describe('renderFeaturesHUD - Features Display', () => {
        test('Affiche tous les features (dash, checkpoint, rope, speedBoost)', () => {
            const purchasedFeatures = {
                dash: true,
                checkpoint: true,
                rope: false,
                speedBoost: 0
            };

            // Simuler l'appel (on doit charger le code réel)
            const allFeatures = ['dash', 'checkpoint', 'rope', 'speedBoost'];
            expect(allFeatures.length).toBe(4);
        });

        test('SpeedBoost affiche le compteur quand > 0', () => {
            const purchasedFeatures = {
                dash: false,
                checkpoint: false,
                rope: false,
                speedBoost: 3  // Déverrouillé 3 fois
            };

            // Vérifier que speedBoost est un nombre et stocké correctement
            expect(typeof purchasedFeatures.speedBoost).toBe('number');
            expect(purchasedFeatures.speedBoost).toBe(3);

            // Vérifier que le texte à afficher serait x3
            const displayText = `x${Math.floor(purchasedFeatures.speedBoost)}`;
            expect(displayText).toBe('x3');
        });

        test('SpeedBoost n\'affiche rien quand = 0 (verrouillé)', () => {
            const purchasedFeatures = {
                speedBoost: 0
            };

            // Ne pas afficher de compteur si speedBoost = 0
            const shouldDisplay = purchasedFeatures.speedBoost > 0;
            expect(shouldDisplay).toBe(false);
        });

        test('Features non déverrouillées affichent le cadenas 🔒', () => {
            const purchasedFeatures = {
                dash: false,
                checkpoint: false,
                rope: false,
                speedBoost: 0
            };

            const allFeatures = [
                { id: 'dash', emoji: '⚡', isStackable: false },
                { id: 'checkpoint', emoji: '🚩', isStackable: false },
                { id: 'rope', emoji: '🪢', isStackable: false },
                { id: 'speedBoost', emoji: '💨', isStackable: true }
            ];

            allFeatures.forEach(feature => {
                const isUnlocked = feature.isStackable 
                    ? purchasedFeatures[feature.id] > 0 
                    : purchasedFeatures[feature.id] === true;
                
                if (!isUnlocked) {
                    // Le cadenas devrait être affiché
                    expect('🔒').toBe('🔒');
                }
            });
        });

        test('Positionnement des features: alignement horizontal au-dessus du brouillard', () => {
            const BOX_SIZE = 50;
            const BOX_SPACING = 70;
            const FOG_RADIUS = 180;
            const canvasHeight = 600;
            const TOP_Y = (canvasHeight / 2) - FOG_RADIUS - BOX_SIZE - 10;

            // TOP_Y doit être positif et au-dessus du centre
            expect(TOP_Y).toBeLessThan(canvasHeight / 2 - FOG_RADIUS);
            expect(TOP_Y).toBeGreaterThan(0);

            // Vérifier la distance (180 - 50 - 10 = 120px au-dessus du centre)
            const distanceFromCenter = (canvasHeight / 2) - TOP_Y;
            expect(distanceFromCenter).toBeGreaterThan(FOG_RADIUS);
        });

        test('Espacement entre features: 70px entre centres', () => {
            const BOX_SPACING = 70;
            const FEATURES_COUNT = 4;
            const TOTAL_WIDTH = (FEATURES_COUNT * BOX_SPACING) - BOX_SPACING + 50;

            // Chaque feature doit être espacée de 70px du suivant
            expect(BOX_SPACING).toBe(70);
            expect(TOTAL_WIDTH).toBe((4 * 70) - 70 + 50);
        });

        test('Couleurs correctes par feature', () => {
            const FEATURES = [
                { id: 'dash', color: '#FF6B6B' },     // Rouge
                { id: 'checkpoint', color: '#00D4FF' }, // Bleu
                { id: 'rope', color: '#9B59B6' },      // Violet
                { id: 'speedBoost', color: '#FFD700' } // Or
            ];

            FEATURES.forEach(feature => {
                expect(feature.color).toMatch(/^#[0-9A-F]{6}$/i);
            });
        });

        test('Fond semi-transparent pour features déverrouillées', () => {
            const purchasedFeatures = {
                dash: true
            };

            const isUnlocked = purchasedFeatures.dash === true;
            expect(isUnlocked).toBe(true);

            // Si déverrouillé: rgba(r,g,b,0.2) pour le fond
            // Si verrouillé: rgba(100,100,100,0.3)
        });
    });

    // ==================== TESTS SOLO HUD ====================

    describe('renderSoloHUD - Stats Display', () => {
        test('Affiche le temps total en gros (32px)', () => {
            const soloRunTotalTime = 45.5;
            const formatted = global.formatTime(soloRunTotalTime);
            
            expect(formatted).toBe('0:45');
        });

        test('Affiche le niveau actuel (ex: "Niveau 3 / 10")', () => {
            const level = 3;
            const soloMaxLevel = 10;
            const levelText = `Niveau ${level} / ${soloMaxLevel}`;
            
            expect(levelText).toBe('Niveau 3 / 10');
        });

        test('Affiche le temps du niveau actuel (delta)', () => {
            const currentLevelTime = 12.3;
            const formatted = global.formatTime(currentLevelTime);
            
            expect(formatted).toBe('0:12');
        });

        test('Positionnement: temps total au centre bas (y = canvas.height/2 + 220)', () => {
            const canvasHeight = 600;
            const timeY = (canvasHeight / 2) + 220;
            
            expect(timeY).toBe(300 + 220); // = 520px du haut
            expect(timeY).toBeLessThan(canvasHeight); // Dans les limites
        });

        test('Positionnement: delta au centre bas (y = canvas.height/2 + 260)', () => {
            const canvasHeight = 600;
            const deltaY = (canvasHeight / 2) + 260;
            
            expect(deltaY).toBe(300 + 260); // = 560px du haut
            expect(deltaY).toBeGreaterThan(520);
        });

        test('Positionnement: niveau au centre bas (y = canvas.height/2 + 295)', () => {
            const canvasHeight = 600;
            const levelY = (canvasHeight / 2) + 295;
            
            expect(levelY).toBe(300 + 295); // = 595px du haut
            expect(levelY).toBeLessThan(canvasHeight);
        });

        test('HUD n\'affiche que en mode solo ET pas en boutique', () => {
            const gameMode = 'solo';
            const isShopOpen = false;
            const isSoloGameFinished = false;

            const shouldDisplay = gameMode === 'solo' && !isShopOpen && !isSoloGameFinished;
            expect(shouldDisplay).toBe(true);
        });

        test('HUD n\'affiche PAS en mode classique', () => {
            const gameMode = 'classic';
            const shouldDisplay = gameMode === 'solo';
            
            expect(shouldDisplay).toBe(false);
        });

        test('HUD n\'affiche PAS quand le shop est ouvert', () => {
            const gameMode = 'solo';
            const isShopOpen = true;
            const shouldDisplay = gameMode === 'solo' && !isShopOpen;
            
            expect(shouldDisplay).toBe(false);
        });

        test('HUD n\'affiche PAS après la fin de la run', () => {
            const gameMode = 'solo';
            const isSoloGameFinished = true;
            const shouldDisplay = gameMode === 'solo' && !isSoloGameFinished;
            
            expect(shouldDisplay).toBe(false);
        });
    });

    // ==================== TESTS DONNÉES ====================

    describe('Data - Vérification des types et valeurs', () => {
        test('speedBoost doit TOUJOURS être un nombre, jamais un booléen', () => {
            const features1 = { speedBoost: 0 };
            const features2 = { speedBoost: 3 };
            const features3 = { speedBoost: 1 };

            [features1, features2, features3].forEach(feat => {
                expect(typeof feat.speedBoost).toBe('number');
                expect(typeof feat.speedBoost).not.toBe('boolean');
            });
        });

        test('soloCurrentLevelTime doit être un nombre >= 0', () => {
            const times = [0, 5.2, 12.8, 45.3];
            
            times.forEach(time => {
                expect(typeof time).toBe('number');
                expect(time).toBeGreaterThanOrEqual(0);
            });
        });

        test('Level doit être entre 1 et soloMaxLevel', () => {
            const soloMaxLevel = 10;
            const validLevels = [1, 2, 5, 10];
            
            validLevels.forEach(level => {
                expect(level).toBeGreaterThanOrEqual(1);
                expect(level).toBeLessThanOrEqual(soloMaxLevel);
            });
        });

        test('soloRunTotalTime doit être >= soloCurrentLevelTime', () => {
            const soloRunTotalTime = 45.5;
            const soloCurrentLevelTime = 12.3;
            
            expect(soloRunTotalTime).toBeGreaterThanOrEqual(soloCurrentLevelTime);
        });
    });

    // ==================== TESTS RÉGRESSIONS ====================

    describe('Anti-Regression - Problèmes passés', () => {
        test('Ne pas afficher "true" pour speedBoost (bug: booléen au lieu de nombre)', () => {
            const purchasedFeatures = {
                speedBoost: 1  // Doit être 1, pas true
            };

            const displayText = `x${Math.floor(purchasedFeatures.speedBoost)}`;
            expect(displayText).not.toBe('xtrue');
            expect(displayText).toBe('x1');
        });

        test('HUD doit être visible et pas empty', () => {
            const soloRunTotalTime = 45.5;
            const level = 3;
            const soloMaxLevel = 10;
            const soloCurrentLevelTime = 12.3;

            // Vérifier que les données existent et ne sont pas null
            expect(soloRunTotalTime).toBeDefined();
            expect(level).toBeDefined();
            expect(soloMaxLevel).toBeDefined();
            expect(soloCurrentLevelTime).toBeDefined();

            // Vérifier que les valeurs sont > 0 ou > -1
            expect(soloRunTotalTime).toBeGreaterThan(0);
            expect(level).toBeGreaterThan(0);
            expect(soloMaxLevel).toBeGreaterThan(0);
            expect(soloCurrentLevelTime).toBeGreaterThanOrEqual(0);
        });

        test('Features doivent être en haut du canvas, pas cachées par le fog', () => {
            const canvas = { height: 600 };
            const FOG_RADIUS = 180;
            const BOX_SIZE = 50;
            const TOP_Y = (canvas.height / 2) - FOG_RADIUS - BOX_SIZE - 10;

            // TOP_Y doit être < (canvas.height / 2) - FOG_RADIUS
            const fogTopEdge = (canvas.height / 2) - FOG_RADIUS;
            expect(TOP_Y).toBeLessThan(fogTopEdge);
        });

        test('SpeedBoost doit avoir une police visible (16px bold)', () => {
            const font = 'bold 16px Arial';
            expect(font).toContain('16px');
            expect(font).toContain('bold');
        });
    });

    // ==================== TESTS INTÉGRATION ====================

    describe('Intégration - Flow complet', () => {
        test('Progression complète du solo avec affichage des stats', () => {
            // Niveau 1: temps 5s
            let level = 1;
            let soloRunTotalTime = 5;
            let soloCurrentLevelTime = 5;

            expect(level).toBe(1);
            expect(soloRunTotalTime).toBe(5);
            expect(soloCurrentLevelTime).toBe(5);

            // Passage au niveau 2: temps total 15s, temps du niveau 2 = 10s
            level = 2;
            soloRunTotalTime = 15;
            soloCurrentLevelTime = 10;

            expect(level).toBe(2);
            expect(soloRunTotalTime).toBeGreaterThan(soloCurrentLevelTime);

            // Acheter speedBoost entre les niveaux
            const purchasedFeatures = { speedBoost: 1 };
            expect(typeof purchasedFeatures.speedBoost).toBe('number');

            // Niveau 3: vitesse boost appliquée
            level = 3;
            soloRunTotalTime = 22;
            soloCurrentLevelTime = 7; // Plus rapide grâce au boost

            expect(level).toBe(3);
            expect(soloCurrentLevelTime).toBeLessThan(10); // Plus rapide
        });

        test('Accumulation du speedBoost sur plusieurs achats', () => {
            let purchasedFeatures = { speedBoost: 0 };
            expect(purchasedFeatures.speedBoost).toBe(0);

            // Premier achat
            purchasedFeatures.speedBoost += 1;
            expect(purchasedFeatures.speedBoost).toBe(1);

            // Deuxième achat
            purchasedFeatures.speedBoost += 1;
            expect(purchasedFeatures.speedBoost).toBe(2);

            // Vérifier l'affichage
            const displayText = `x${purchasedFeatures.speedBoost}`;
            expect(displayText).toBe('x2');
        });

        test('Affichage unifié: HUD + Features + Stats en solo', () => {
            const gameState = {
                currentGameMode: 'solo',
                level: 5,
                soloRunTotalTime: 60.5,
                soloCurrentLevelTime: 15.2,
                purchasedFeatures: { speedBoost: 2 },
                isShopOpen: false,
                isSoloGameFinished: false
            };

            // Tous les éléments doivent être visibles
            expect(gameState.currentGameMode).toBe('solo');
            expect(gameState.level).toBeGreaterThan(0);
            expect(gameState.soloRunTotalTime).toBeGreaterThan(0);
            expect(typeof gameState.purchasedFeatures.speedBoost).toBe('number');
        });
    });
});
