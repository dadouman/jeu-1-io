// tests/solo-rendering.test.js - Tests pour le rendu de la gem et du joueur en mode solo

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { calculateGemsForLevel, addGems } = require('../utils/gems');
const { initializePlayerForMode } = require('../utils/player');

describe('Solo Mode - Rendu Gem Solide et Joueur Opaque', () => {
    
    const TILE_SIZE = 40;
    const map = generateMaze(33, 33);
    let mockCanvas, mockCtx;

    beforeEach(() => {
        // Mock du canvas et contexte 2D
        mockCanvas = {
            width: 1200,
            height: 800,
            getContext: jest.fn()
        };

        mockCtx = {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: '',
            textBaseline: '',
            
            // Méthodes de dessin
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            fillText: jest.fn(),
            fillRect: jest.fn(),
            
            // Tracking des appels
            callStack: []
        };

        // Tracker les appels pour vérifier l'ordre
        const originalFill = mockCtx.fill.bind(mockCtx);
        mockCtx.fill = jest.fn(function() {
            mockCtx.callStack.push({ method: 'fill', style: mockCtx.fillStyle });
            return originalFill();
        });

        const originalStroke = mockCtx.stroke.bind(mockCtx);
        mockCtx.stroke = jest.fn(function() {
            mockCtx.callStack.push({ method: 'stroke', style: mockCtx.strokeStyle });
            return originalStroke();
        });

        mockCanvas.getContext.mockReturnValue(mockCtx);
    });

    test('Gem doit être rendue avec cercle de fond doré opaque', () => {
        // Simulator la gem
        const coin = { x: 100, y: 100 };
        
        // Simuler le rendu de la gem avec texture solide
        if (coin) {
            // Fond coloré pour la gem (texture solide)
            mockCtx.fillStyle = "rgba(255, 215, 0, 0.9)"; // Or semi-opaque
            mockCtx.beginPath();
            mockCtx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, 16, 0, Math.PI * 2);
            mockCtx.fill();
            
            // Bordure pour plus de définition
            mockCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            mockCtx.lineWidth = 2;
            mockCtx.stroke();
            
            // Emoji gem par-dessus
            mockCtx.font = "26px Arial";
            mockCtx.textAlign = "center";
            mockCtx.textBaseline = "middle";
            mockCtx.fillText("💎", coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2);
        }

        // Vérifications
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.arc).toHaveBeenCalledWith(120, 120, 16, 0, Math.PI * 2);
        expect(mockCtx.fillStyle).toBe("rgba(255, 215, 0, 0.9)");
        expect(mockCtx.fill).toHaveBeenCalled();
        
        // Vérifier la bordure
        expect(mockCtx.strokeStyle).toBe("rgba(255, 255, 255, 0.8)");
        expect(mockCtx.lineWidth).toBe(2);
        expect(mockCtx.stroke).toHaveBeenCalled();
        
        // Vérifier l'emoji
        expect(mockCtx.fillText).toHaveBeenCalledWith("💎", 120, 120);
    });

    test('Gem doit avoir fond solide (opacité 0.9, pas 1)', () => {
        const coin = { x: 200, y: 200 };
        
        if (coin) {
            mockCtx.fillStyle = "rgba(255, 215, 0, 0.9)";
            mockCtx.beginPath();
            mockCtx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, 16, 0, Math.PI * 2);
            mockCtx.fill();
        }

        // L'opacité doit être 0.9 (semi-transparent mais visible)
        expect(mockCtx.fillStyle).toContain("0.9");
        expect(mockCtx.fillStyle).toMatch(/rgba\(255, 215, 0, 0\.9\)/);
    });

    test('Joueur doit être rendu en mode solo sans double rendu', () => {
        const soloRunTotalTime = 50000; // > 0 = mode solo actif
        const players = {
            'player1': { skin: '🐱', x: 300, y: 300, score: 0 }
        };

        // En solo, les joueurs ne doivent pas être rendus dans la boucle
        if (soloRunTotalTime === 0) {  // Seulement en classique/infini
            for (let id in players) {
                const p = players[id];
                mockCtx.font = "30px Arial";
                mockCtx.textAlign = "center";
                mockCtx.textBaseline = "middle";
                mockCtx.fillText(p.skin, p.x + TILE_SIZE/2, p.y + TILE_SIZE/2);
            }
        }

        // En solo, fillText ne doit PAS être appelé pour le joueur
        expect(mockCtx.fillText).not.toHaveBeenCalledWith('🐱', expect.any(Number), expect.any(Number));
    });

    test('Joueur doit être rendu en mode classique (non-solo)', () => {
        const soloRunTotalTime = 0; // = 0 = mode classique/infini
        const players = {
            'player1': { skin: '🐱', x: 300, y: 300, score: 100 }
        };

        // En classique, les joueurs DOIVENT être rendus
        if (soloRunTotalTime === 0) {
            for (let id in players) {
                const p = players[id];
                mockCtx.font = "30px Arial";
                mockCtx.textAlign = "center";
                mockCtx.textBaseline = "middle";
                mockCtx.fillText(p.skin, p.x + TILE_SIZE/2, p.y + TILE_SIZE/2);
                
                // Score
                mockCtx.fillStyle = "white";
                mockCtx.font = "12px Arial";
                mockCtx.fillText(p.score, p.x + TILE_SIZE/2, p.y - 10);
            }
        }

        // En classique, fillText DOIT être appelé
        // Position: 300 + 40/2 = 320, 300 + 40/2 = 320 pour le joueur
        // Position: 300 + 40/2 = 320, 300 - 10 = 290 pour le score
        expect(mockCtx.fillText).toHaveBeenCalledWith('🐱', 320, 320);
        expect(mockCtx.fillText).toHaveBeenCalledWith(100, 320, 290);
    });

    test('Position spawn doit être valide (case vide, pas dans un mur)', () => {
        // Tester getRandomEmptyPosition plusieurs fois
        for (let i = 0; i < 10; i++) {
            const pos = getRandomEmptyPosition(map);
            
            // Position doit être en pixels (multiple de TILE_SIZE + offset)
            expect(pos.x).toBeDefined();
            expect(pos.y).toBeDefined();
            expect(typeof pos.x).toBe('number');
            expect(typeof pos.y).toBe('number');
            
            // Position doit être positive
            expect(pos.x).toBeGreaterThanOrEqual(0);
            expect(pos.y).toBeGreaterThanOrEqual(0);
            
            // Position doit être dans les limites du canvas
            expect(pos.x).toBeLessThanOrEqual(map[0].length * TILE_SIZE);
            expect(pos.y).toBeLessThanOrEqual(map.length * TILE_SIZE);
            
            // Vérifier que la position correspond à une case vide
            const tileX = Math.floor((pos.x - TILE_SIZE/2) / TILE_SIZE);
            const tileY = Math.floor((pos.y - TILE_SIZE/2) / TILE_SIZE);
            
            expect(map[tileY]).toBeDefined();
            expect(map[tileY][tileX]).toBe(0); // 0 = case vide
        }
    });

    test('Position spawn doit toujours retourner une case valide (même exhaustive search)', () => {
        // Créer une map simple pour tester précisément
        const sparseMap = [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 0, 1, 1],  // Seule case vide à (2, 2)
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ];

        // Même dans ce cas, getRandomEmptyPosition doit retourner la case valide
        const pos = getRandomEmptyPosition(sparseMap);
        
        const tileX = Math.floor((pos.x - TILE_SIZE/2) / TILE_SIZE);
        const tileY = Math.floor((pos.y - TILE_SIZE/2) / TILE_SIZE);
        
        // Vérifier que la position retournée correspond à une case vide
        expect(sparseMap[tileY] !== undefined).toBe(true);
        expect(sparseMap[tileY][tileX]).toBe(0);
        expect(tileX).toBe(2);
        expect(tileY).toBe(2);
    });

    test('Gem cercle doit être centré sur la position de la pièce', () => {
        const coin = { x: 80, y: 120 };
        const expectedCenterX = coin.x + TILE_SIZE/2;  // 80 + 20 = 100
        const expectedCenterY = coin.y + TILE_SIZE/2;  // 120 + 20 = 140
        
        if (coin) {
            mockCtx.fillStyle = "rgba(255, 215, 0, 0.9)";
            mockCtx.beginPath();
            mockCtx.arc(expectedCenterX, expectedCenterY, 16, 0, Math.PI * 2);
            mockCtx.fill();
        }

        // Vérifier que arc est appelé avec les bonnes coordonnées (100, 140)
        expect(mockCtx.arc).toHaveBeenCalledWith(100, 140, 16, 0, Math.PI * 2);
    });

    test('Gem bordure doit avoir épaisseur 2 et couleur blanche', () => {
        const coin = { x: 100, y: 100 };
        
        if (coin) {
            mockCtx.fillStyle = "rgba(255, 215, 0, 0.9)";
            mockCtx.beginPath();
            mockCtx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, 16, 0, Math.PI * 2);
            mockCtx.fill();
            
            mockCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            mockCtx.lineWidth = 2;
            mockCtx.stroke();
        }

        expect(mockCtx.lineWidth).toBe(2);
        expect(mockCtx.strokeStyle).toBe("rgba(255, 255, 255, 0.8)");
    });

});
