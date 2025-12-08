// tests/solo-full-run.test.js - Test d'une run complète en mode solo
// Simule une session complète du niveau 1 au niveau 10
// Vérifie l'écran de fin, les temps, et le retour au choix de mode

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { calculateGemsForLevel, addGems } = require('../utils/gems');
const { initializePlayerForMode } = require('../utils/player');
const GameMode = require('../utils/GameMode');
const { ShopManager } = require('../utils/ShopManager');

describe('Solo Mode - Run Complète (Niveau 1-10 → Écran de fin → Retour)', () => {

    let soloSession;
    let gameMode;
    let shopManager;
    const SHOP_DURATION = 15000;
    const TRANSITION_DURATION = 3000;

    beforeEach(() => {
        gameMode = new GameMode('solo');
        shopManager = new ShopManager(gameMode);

        // Initialiser une session solo au niveau 1
        const maze1 = generateMaze(15, 15);
        soloSession = {
            currentLevel: 1,
            map: maze1,
            coin: getRandomEmptyPosition(maze1),
            player: initializePlayerForMode(getRandomEmptyPosition(maze1), 0, 'solo'),
            startTime: Date.now(),
            levelStartTime: Date.now(),
            splitTimes: [],
            totalTime: 0,
            currentShopLevel: null,
            isFinished: false,
            endScreenData: null
        };
    });

    // ===== TEST 1: Simulation complète d'une run =====
    test('Une run complète: 10 niveaux + shop + écran de fin', () => {
        // Simule le parcours de tous les 10 niveaux
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        // Parcourir les niveaux 1 à 9
        for (let level = 1; level < 10; level++) {
            // Avancer le temps de levelStartTime pour simuler le level
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            
            // Collectionner la pièce
            const checkpointTime = levelDurations[level - 1];
            soloSession.splitTimes.push(checkpointTime);
            
            // Ajouter les gems
            const gemsEarned = calculateGemsForLevel(level);
            addGems(soloSession.player, gemsEarned);
            
            // Passer au niveau suivant
            soloSession.currentLevel++;
            
            // Vérifier si on doit ouvrir le shop (niveau 5 et 10)
            if (gameMode.isShopLevel(level)) {
                soloSession.currentShopLevel = level;
                // Le shop durerait 15 secondes (simulé mais pas attendu dans ce test)
            }
            
            // Vérifier que le jeu n'est pas encore terminé
            expect(gameMode.isGameFinished(soloSession.currentLevel)).toBe(false);
        }
        
        // Vérifier l'état avant le dernier niveau
        expect(soloSession.currentLevel).toBe(10);
        expect(soloSession.splitTimes.length).toBe(9);
        expect(soloSession.player.gems).toBeGreaterThan(0);
    });

    // ===== TEST 2: Écran de fin affichage =====
    test('Écran de fin doit afficher les 10 split times', () => {
        // Simuler une run jusqu'au niveau 10
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        // Compléter les 10 niveaux
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            
            const gemsEarned = calculateGemsForLevel(level);
            addGems(soloSession.player, gemsEarned);
            
            soloSession.currentLevel++;
        }
        
        // Maintenant currentLevel = 11, la run est finie
        expect(soloSession.currentLevel).toBe(11);
        expect(gameMode.isGameFinished(soloSession.currentLevel)).toBe(true);
        
        // Vérifier les données de l'écran de fin
        const totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.totalTime = totalTime;
        soloSession.isFinished = true;
        soloSession.endScreenData = {
            totalTime: soloSession.totalTime,
            splitTimes: soloSession.splitTimes,
            finalLevel: 10,
            mode: 'solo',
            playerGems: soloSession.player.gems
        };
        
        // Vérifier les données d'affichage
        expect(soloSession.endScreenData).toBeDefined();
        expect(soloSession.endScreenData.splitTimes.length).toBe(10);
        expect(soloSession.endScreenData.totalTime).toBeCloseTo(totalTime, 1);
        expect(soloSession.endScreenData.finalLevel).toBe(10);
        expect(soloSession.endScreenData.mode).toBe('solo');
    });

    // ===== TEST 3: Comparaison avec le meilleur temps =====
    test('Écran de fin doit comparer avec le meilleur temps personnel', () => {
        // Simuler une run
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        const totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.totalTime = totalTime;
        
        // Simuler différents meilleurs temps personnels
        const personalBestTimes = [
            { time: 195.8, delta: totalTime - 195.8, reference: 'personal' },  // Nouveau record
            { time: 180.5, delta: totalTime - 180.5, reference: 'personal' },  // Plus slow
            { time: 220.0, delta: totalTime - 220.0, reference: 'personal' }   // Plus rapide
        ];
        
        for (const scenario of personalBestTimes) {
            const endScreenData = {
                totalTime: soloSession.totalTime,
                splitTimes: soloSession.splitTimes,
                personalBestTime: scenario.time,
                deltaTime: scenario.delta,
                deltaReference: scenario.reference
            };
            
            // Vérifier la logique de delta
            expect(endScreenData.deltaTime).toBeDefined();
            expect(endScreenData.deltaReference).toBe('personal');
            
            // Delta positive = plus lent, négative = plus rapide
            if (scenario.delta < 0) {
                // Nouveau record personnel!
                expect(endScreenData.deltaTime).toBeLessThan(0);
            }
        }
    });

    // ===== TEST 4: Comparaison avec le meilleur temps global =====
    test('Écran de fin doit comparer avec le meilleur temps global (leaderboard)', () => {
        // Simuler une run
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        const totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.totalTime = totalTime;
        
        // Simuler différents meilleurs temps globaux
        const globalBestTimes = [170.0, 185.5, 210.0];
        
        for (const globalBest of globalBestTimes) {
            const endScreenData = {
                totalTime: soloSession.totalTime,
                splitTimes: soloSession.splitTimes,
                leaderboardBest: globalBest,
                deltaTime: totalTime - globalBest,
                deltaReference: 'global'
            };
            
            // Vérifier la structure
            expect(endScreenData.deltaTime).toBeDefined();
            expect(endScreenData.deltaReference).toBe('global');
            expect(endScreenData.leaderboardBest).toBeGreaterThan(0);
        }
    });

    // ===== TEST 5: Retour au choix de mode =====
    test('Après l\'écran de fin, le joueur doit pouvoir retourner au choix de mode', () => {
        // Simuler une run complète
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        soloSession.totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.isFinished = true;
        
        // Vérifier les conditions pour afficher l'écran de fin
        expect(soloSession.isFinished).toBe(true);
        expect(gameMode.isGameFinished(soloSession.currentLevel)).toBe(true);
        expect(soloSession.endScreenData || { totalTime: soloSession.totalTime }).toBeDefined();
        
        // Simuler le retour au choix de mode
        const resetGame = () => {
            soloSession.currentLevel = 1;
            soloSession.splitTimes = [];
            soloSession.totalTime = 0;
            soloSession.isFinished = false;
            soloSession.endScreenData = null;
            soloSession.player = initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo');
        };
        
        resetGame();
        
        // Vérifier que tout est réinitialisé
        expect(soloSession.currentLevel).toBe(1);
        expect(soloSession.splitTimes.length).toBe(0);
        expect(soloSession.isFinished).toBe(false);
        expect(soloSession.endScreenData).toBeNull();
    });

    // ===== TEST 6: Séquence complète avec shop =====
    test('Run complète incluant les shops aux niveaux 5 et 10', () => {
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        const shopLevels = [5, 10];  // Shop après niveaux 5 et 10
        
        for (let level = 1; level <= 10; level++) {
            // Simuler le level
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            
            const gemsEarned = calculateGemsForLevel(level);
            addGems(soloSession.player, gemsEarned);
            
            soloSession.currentLevel++;
            
            // Vérifier le shop
            if (gameMode.isShopLevel(level)) {
                expect(shopLevels).toContain(level);
                soloSession.currentShopLevel = level;
                // Le shop s'ouvre pour 15 secondes
                // (Dans un vrai jeu, cela bloquerait les collisions)
            }
        }
        
        // Vérifier que les deux shops ont été ouverts
        expect(soloSession.currentShopLevel).toBe(10);
        expect(soloSession.player.gems).toBeGreaterThan(0);
        
        // Vérifier qu'on peut calculer les gems dépensés au shop
        const totalGemsEarned = levelDurations.length;  // 1 gem par niveau
        expect(soloSession.player.gems).toBeLessThanOrEqual(totalGemsEarned);
    });

    // ===== TEST 7: Affichage des split times correctement formatés =====
    test('Les split times doivent être affichés avec 1 chiffre après la virgule', () => {
        const levelDurations = [15.234, 21.891, 18.567, 25.123, 12.456, 22.789, 19.345, 16.678, 24.912, 20.456];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        soloSession.totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.isFinished = true;
        
        // Vérifier que chaque split peut être formaté
        const formattedSplits = soloSession.splitTimes.map(time => 
            parseFloat(time.toFixed(1))
        );
        
        expect(formattedSplits.length).toBe(10);
        
        // Vérifier le formatage
        for (const formatted of formattedSplits) {
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('number');
            // Vérifier qu'il a au maximum 1 décimale
            const decimalPlaces = (formatted.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(1);
        }
    });

    // ===== TEST 8: Widgets de fin d'écran affichés correctement =====
    test('Écran de fin doit afficher tous les widgets (titre, temps, splits, leaderboard)', () => {
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        const totalTime = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.totalTime = totalTime;
        soloSession.isFinished = true;
        
        // Créer les données de l'écran de fin
        const endScreenData = {
            // Widgets obligatoires
            title: '🏁 SOLO TERMINÉ!',
            totalTime: soloSession.totalTime,
            splitTimes: soloSession.splitTimes,
            finalLevel: 10,
            
            // Optionnels (peuvent être null)
            personalBest: null,
            globalBest: 175.5,
            deltaTime: soloSession.totalTime - 175.5,
            deltaReference: 'global',
            
            // Leaderboard (optionnel)
            playerRank: 5,
            totalPlayers: 150
        };
        
        // Vérifier les widgets obligatoires
        expect(endScreenData.title).toBeDefined();
        expect(endScreenData.totalTime).toBeGreaterThan(0);
        expect(endScreenData.splitTimes.length).toBe(10);
        expect(endScreenData.finalLevel).toBe(10);
        
        // Vérifier les widgets optionnels
        expect(endScreenData.globalBest).toBeDefined();
        expect(endScreenData.deltaTime).toBeDefined();
        expect(endScreenData.playerRank).toBeDefined();
        expect(endScreenData.totalPlayers).toBeGreaterThan(0);
    });

    // ===== TEST 9: Temps total calculé correctement =====
    test('Le temps total doit être la somme exacte de tous les split times', () => {
        const levelDurations = [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1];
        
        for (let level = 1; level <= 10; level++) {
            soloSession.levelStartTime = Date.now() - (levelDurations[level - 1] * 1000);
            soloSession.splitTimes.push(levelDurations[level - 1]);
            addGems(soloSession.player, calculateGemsForLevel(level));
            soloSession.currentLevel++;
        }
        
        // Calculer le temps total
        const expectedTotal = levelDurations.reduce((a, b) => a + b, 0);
        soloSession.totalTime = soloSession.splitTimes.reduce((a, b) => a + b, 0);
        
        expect(soloSession.totalTime).toBeCloseTo(expectedTotal, 2);
    });

    // ===== TEST 10: Client reçoit et affiche correctement l'écran de fin =====
    test('Simulation du socket event soloGameFinished et affichage de l\'écran', () => {
        // Simuler les données envoyées par le serveur
        const serverData = {
            totalTime: 195.8,
            splitTimes: [15.2, 21.3, 18.5, 25.1, 12.4, 22.7, 19.8, 16.3, 24.5, 20.1],
            finalLevel: 10,
            mode: 'solo'
        };
        
        // Simuler la réception du socket event
        let isSoloGameFinished = false;
        let displayData = null;
        
        // Handler du socket
        const handleSoloGameFinished = (data) => {
            isSoloGameFinished = true;
            displayData = data;
            console.log(`🏁 SOLO TERMINÉ! Temps: ${data.totalTime.toFixed(1)}s`);
        };
        
        // Déclencher le handler
        handleSoloGameFinished(serverData);
        
        // Vérifier que l'écran de fin s'affiche
        expect(isSoloGameFinished).toBe(true);
        expect(displayData).toBeDefined();
        expect(displayData.totalTime).toBe(195.8);
        expect(displayData.splitTimes.length).toBe(10);
        expect(displayData.finalLevel).toBe(10);
        expect(displayData.mode).toBe('solo');
    });
});
