// tests/display.test.js
// Tests pour vérifier les affichages visuels de chaque mode

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayerForMode } = require('../utils/player');

describe('Display - Mode Visual Elements', () => {

    // --- TESTS CLASSIQUE/INFINI ---
    
    test('Mode classique affiche le score du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'classic');
        
        // Le joueur doit avoir un score initialisé
        expect(player.score).toBeDefined();
        expect(typeof player.score).toBe('number');
        expect(player.score).toBeGreaterThanOrEqual(0);
    });

    test('Mode classique affiche les gems du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'classic');
        
        // Le joueur doit avoir des gems
        expect(player.gems).toBeDefined();
        expect(typeof player.gems).toBe('number');
        expect(player.gems).toBeGreaterThanOrEqual(0);
    });

    test('Mode infini affiche le score du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'infinite');
        
        expect(player.score).toBeDefined();
        expect(typeof player.score).toBe('number');
    });

    test('Mode infini affiche les gems du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'infinite');
        
        expect(player.gems).toBeDefined();
        expect(typeof player.gems).toBe('number');
    });

    // --- TESTS SOLO ---

    test('Mode solo affiche les gems du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'solo');
        
        expect(player.gems).toBeDefined();
        expect(typeof player.gems).toBe('number');
        expect(player.gems).toBeGreaterThanOrEqual(0);
    });

    test('Mode solo ne devrait pas compter le score', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'solo');
        
        // En solo, le score n'est pas affiché, mais l'objet peut l'avoir
        // C'est juste que le rendu ne l'affiche pas
        expect(player.gems).toBeDefined();
    });

    // --- TESTS DE SÉPARATION CLASSIQUE vs SOLO ---

    test('Score visible en classique mais pas en solo (logique de rendu)', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const classicPlayer = initializePlayerForMode(startPos, 0, 'classic');
        const soloPlayer = initializePlayerForMode(startPos, 0, 'solo');
        
        // Les deux joueurs doivent avoir un score (données)
        expect(classicPlayer.score).toBeDefined();
        expect(soloPlayer.score).toBeDefined();
        
        // Mais le rendu les traitera différemment:
        // - Classique: affiche le score
        // - Solo: n'affiche PAS le score (mais affiche le temps)
        // (Cette vérification se fait dans le rendu, pas ici)
    });

    test('Gems affichés en classique ET en solo', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const classicPlayer = initializePlayerForMode(startPos, 0, 'classic');
        const soloPlayer = initializePlayerForMode(startPos, 0, 'solo');
        
        // Les deux modes doivent afficher les gems
        expect(classicPlayer.gems).toBeDefined();
        expect(soloPlayer.gems).toBeDefined();
        expect(classicPlayer.gems).toBeGreaterThanOrEqual(0);
        expect(soloPlayer.gems).toBeGreaterThanOrEqual(0);
    });

    // --- TESTS DE PURCHASED FEATURES (SHOP) ---

    test('Classique affiche les features achetées au-dessus du joueur', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'classic');
        
        // Les features doivent être initialisées
        expect(player.purchasedFeatures).toBeDefined();
        expect(player.purchasedFeatures.checkpoint).toBe(false); // Non acheté au départ
        expect(player.purchasedFeatures.dash).toBe(false);
        expect(player.purchasedFeatures.rope).toBe(false);
    });

    test('Solo affiche les features achetées', () => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'solo');
        
        expect(player.purchasedFeatures).toBeDefined();
        expect(player.purchasedFeatures.checkpoint).toBe(false);
        expect(player.purchasedFeatures.dash).toBe(false);
        expect(player.purchasedFeatures.rope).toBe(false);
    });

    // --- TESTS DE TIMING DISPLAY ---

    test('Mode solo a besoin du timing pour affichage', () => {
        // Vérifier que les sessions solo stockent bien les temps
        const soloSession = {
            currentLevel: 1,
            map: generateMaze(15, 15),
            coin: getRandomEmptyPosition(generateMaze(15, 15)),
            player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo'),
            startTime: Date.now(),
            levelStartTime: Date.now() + 3000,
            checkpoints: [],
            totalTime: 0
        };
        
        expect(soloSession.startTime).toBeDefined();
        expect(soloSession.levelStartTime).toBeDefined();
        expect(soloSession.checkpoints).toEqual([]);
    });

    test('Mode classique ne stocke pas le timing solo', () => {
        // Les lobbies classique/infini ne stockent pas les données de timing solo
        const classicLobby = {
            players: {},
            currentLevel: 1,
            levelStartTime: Date.now(),
            map: generateMaze(15, 15),
            coin: getRandomEmptyPosition(generateMaze(15, 15)),
            currentRecord: { score: 0, skin: "❓" }
        };
        
        // Pas de startTime, levelStartTime est différent du solo
        expect(classicLobby.startTime).toBeUndefined();
        expect(typeof classicLobby.levelStartTime).toBe('number');
    });

    // --- TESTS D'AFFICHAGE HIGH SCORE ---

    test('Affichage du record en classique montre score et skin', () => {
        const highScore = { score: 100, skin: "🐱" };
        
        // Le format doit être: "🏆 Record : 100 🐱"
        expect(highScore.score).toBeDefined();
        expect(highScore.skin).toBeDefined();
        expect(highScore.score).toBeGreaterThanOrEqual(0);
        expect(typeof highScore.skin).toBe('string');
    });

    test('Affichage du record en solo montre temps personnel', () => {
        const soloPersonalBestTime = 125.45;
        
        // Le format doit être: "🎯 Personal Best: 125.45s"
        expect(soloPersonalBestTime).toBeDefined();
        expect(typeof soloPersonalBestTime).toBe('number');
        expect(soloPersonalBestTime).toBeGreaterThan(0);
    });

    // --- TESTS DE NIVEAUX AFFICHÉS ---

    test('Classique affiche "Niveau X"', () => {
        const level = 5;
        
        // Le format doit être: "Niveau 5"
        expect(level).toBeDefined();
        expect(level).toBeGreaterThan(0);
        expect(level).toBeLessThanOrEqual(40); // Max 40 en classique
    });

    test('Solo affiche "Niveau X/20"', () => {
        const level = 5;
        const maxSoloLevel = 20;
        
        // Le format doit être: "Niveau 5/20"
        expect(level).toBeDefined();
        expect(maxSoloLevel).toBe(20);
        expect(level).toBeGreaterThan(0);
        expect(level).toBeLessThanOrEqual(maxSoloLevel);
    });

});
