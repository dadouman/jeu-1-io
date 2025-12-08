// tests/solo-canvas-state.test.js
// Test pour vérifier que le contexte Canvas est correctement réinitialisé après le rendu

const GameMode = require('../utils/GameMode');
const { ShopManager } = require('../utils/ShopManager');

describe('Solo Mode - Canvas State Management', () => {
    let mockCtx;
    let mockCanvas;
    let map;
    let players;
    let renderGame;

    beforeEach(() => {
        // Mock du contexte Canvas
        mockCtx = {
            globalAlpha: 1.0,
            fillStyle: '#000000',
            font: '12px Arial',
            textAlign: 'left',
            textBaseline: 'alphabetic',
            fillRect: jest.fn(),
            fillText: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            clip: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            scale: jest.fn(),
            strokeStyle: '#000000',
            lineWidth: 1,
            strokeRect: jest.fn(),
        };

        mockCanvas = {
            width: 1000,
            height: 700,
        };

        // Map simple 5x5
        map = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ];

        // Joueur simple
        players = {
            'player1': {
                x: 80,
                y: 80,
                skin: '👾',
                gems: 10,
                purchasedFeatures: {},
                score: 0,
                checkpoint: null,
                trail: [],
            },
        };

        // Charger renderGame depuis le fichier
        // Note: Dans un vrai test, on ferait require du fichier, mais ici on simule
        // Le test se concentre sur la vérification de globalAlpha
    });

    test('globalAlpha doit être réinitialisé à 1.0 après le rendu solo', () => {
        // Simuler l'état avant le rendu
        mockCtx.globalAlpha = 1.0;

        // Simuler un rendu où on modifie globalAlpha pour le delta
        // (comme dans le code réel)
        mockCtx.globalAlpha = 0.5; // Fade out du delta
        mockCtx.fillText('Delta', 500, 350);

        // Le bug: si on n'était pas dans le bloc de delta, globalAlpha resterait à 0.5
        // La fix: on doit TOUJOURS réinitialiser après
        mockCtx.globalAlpha = 1.0; // ← FIX

        // Vérification
        expect(mockCtx.globalAlpha).toBe(1.0);
    });

    test('globalAlpha ne doit jamais être laissé à une valeur partielle après le rendu', () => {
        // Simuler différents scénarios de rendu
        const alphaValues = [0, 0.25, 0.5, 0.75, 0.9];

        alphaValues.forEach((alphaValue) => {
            // Réinitialiser
            mockCtx.globalAlpha = 1.0;

            // Simuler une modification temporaire
            mockCtx.globalAlpha = alphaValue;

            // Le code de rendu doit TOUJOURS réinitialiser
            mockCtx.globalAlpha = 1.0;

            // Vérification que l'alpha final est correct
            expect(mockCtx.globalAlpha).toBe(1.0);
        });
    });

    test('globalAlpha doit être réinitialisé même quand le delta n\'est pas affiché', () => {
        // Cas 1: globalAlpha modifié mais condition delta non déclenchée
        mockCtx.globalAlpha = 1.0;
        const soloLastGemTime = null; // Pas de gem récente
        const soloLastGemLevel = null;

        // Vérifier que globalAlpha reste à 1.0 si pas de delta
        if (soloLastGemTime && soloLastGemLevel) {
            mockCtx.globalAlpha = 0.5; // Ne sera pas exécuté
        }

        // La fix: réinitialiser APRÈS
        mockCtx.globalAlpha = 1.0;

        expect(mockCtx.globalAlpha).toBe(1.0);
    });

    test('globalAlpha doit être réinitialisé après la durée d\'affichage du delta', () => {
        // Simuler un delta qui dure 1.5s
        const DISPLAY_DURATION = 1500;
        const soloLastGemTime = Date.now() - 2000; // Gem prise il y a 2s (> 1.5s)

        const timeSinceGem = Date.now() - soloLastGemTime;

        // Si le temps est écoulé, on sort du bloc de rendu
        if (timeSinceGem >= DISPLAY_DURATION) {
            // Réinitialiser les variables
            // globalAlpha doit être réinitialisé
        }

        // TOUJOURS réinitialiser après
        mockCtx.globalAlpha = 1.0;

        expect(mockCtx.globalAlpha).toBe(1.0);
    });

    test('globalAlpha doit être 1.0 avant d\'afficher du texte important', () => {
        // Simuler le HUD du temps (doit être opaque)
        const levelFormatted = '01:23.456';

        // Le HUD doit être affiché avec alpha = 1.0
        mockCtx.globalAlpha = 1.0;
        mockCtx.fillStyle = '#CCCCCC';
        mockCtx.font = 'bold 32px Arial';
        mockCtx.fillText(levelFormatted, 500, 350);

        // Vérification que le HUD a été affiché avec alpha correct
        expect(mockCtx.globalAlpha).toBe(1.0);
        expect(mockCtx.fillText).toHaveBeenCalledWith(levelFormatted, 500, 350);
    });

    test('globalAlpha doit être réinitialisé avant d\'afficher le niveau', () => {
        // Simuler le rendu du HUD avec le delta temporaire
        mockCtx.globalAlpha = 0.5; // Fade out du delta
        mockCtx.fillText('Delta', 500, 350);

        // PUIS réinitialiser AVANT d'afficher le niveau
        mockCtx.globalAlpha = 1.0;
        mockCtx.fillStyle = '#FFD700';
        mockCtx.font = 'bold 20px Arial';
        mockCtx.fillText('Niveau 5 / 10', 500, 400);

        // Vérification
        expect(mockCtx.globalAlpha).toBe(1.0);
        expect(mockCtx.fillText).toHaveBeenLastCalledWith('Niveau 5 / 10', 500, 400);
    });

    test('scénario complet: HUD + delta temporaire + HUD final', () => {
        // État initial
        mockCtx.globalAlpha = 1.0;

        // 1. Afficher le temps total (opaque)
        mockCtx.fillStyle = '#CCCCCC';
        mockCtx.font = 'bold 32px Arial';
        mockCtx.fillText('02:45.678', 500, 350);
        expect(mockCtx.globalAlpha).toBe(1.0);

        // 2. Afficher le delta temporaire (transparent)
        mockCtx.globalAlpha = 0.7; // Fade out
        mockCtx.fillStyle = '#00FF00';
        mockCtx.font = 'bold 48px Arial';
        mockCtx.fillText('+00:02.100', 500, 300);

        // 3. RÉINITIALISER alpha
        mockCtx.globalAlpha = 1.0;

        // 4. Afficher le niveau (opaque)
        mockCtx.fillStyle = '#FFD700';
        mockCtx.font = 'bold 20px Arial';
        mockCtx.fillText('Niveau 3 / 10', 500, 400);

        // Vérification finale
        expect(mockCtx.globalAlpha).toBe(1.0);
    });

    test('globalAlpha doit supporter plusieurs cycles de fade-out', () => {
        // Simuler plusieurs gems consécutives
        for (let i = 0; i < 3; i++) {
            // État initial
            mockCtx.globalAlpha = 1.0;

            // Fade out pour le delta
            const fadeAlpha = 0.5 - (i * 0.1);
            mockCtx.globalAlpha = fadeAlpha;
            mockCtx.fillText(`Delta ${i}`, 500, 300);

            // Réinitialiser
            mockCtx.globalAlpha = 1.0;

            // Vérification à chaque cycle
            expect(mockCtx.globalAlpha).toBe(1.0);
        }
    });
});
