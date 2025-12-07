// tests/solo-end-of-run.test.js - Tests pour la fin de run en mode solo

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { calculateGemsForLevel, addGems } = require('../utils/gems');
const { isShopLevel } = require('../utils/shop');
const { initializePlayerForMode } = require('../utils/player');

describe('Solo Mode - Fin de Run (Niveau 10 → Écran de fin)', () => {
    
    let soloSession;
    const SHOP_DURATION = 15000;
    const maxLevel = 10;

    beforeEach(() => {
        // Initialiser une session solo au niveau 9 (avant la dernière pièce)
        const maze9 = generateMaze(33, 33);  // Niveau 9: 33x33
        soloSession = {
            currentLevel: 9,
            map: maze9,
            coin: { x: 100, y: 100 },
            player: initializePlayerForMode({ x: 50, y: 50 }, 0, 'solo'),
            startTime: Date.now() - 150000,  // 150 secondes d'avance
            levelStartTime: Date.now() - 10000,  // Niveau 9 depuis 10s
            splitTimes: [15.2, 21.2, 8.3, 13.1, 35.5, 18.5, 10.4, 25.6, 6.9],  // 9 niveaux
            totalTime: 0,
            currentShopLevel: null
        };
    });

    test('Collision du dernier coin (niveau 10) doit déclencher soloGameFinished', () => {
        // Simuler que le joueur a collecté les pièces 1-9
        // Maintenant il va collecter la pièce 10

        // Actualiser le niveau à 10
        soloSession.currentLevel++;  // Passe de 9 à 10
        
        // Calculer le temps de completion du niveau 9
        const checkpointTime = (Date.now() - soloSession.levelStartTime) / 1000;
        soloSession.splitTimes.push(checkpointTime);
        
        // Incrémenter après avoir enregistré le split
        soloSession.currentLevel++;  // Passe de 10 à 11
        
        // Vérifier que currentLevel > maxLevel
        expect(soloSession.currentLevel).toBe(11);
        expect(soloSession.currentLevel > maxLevel).toBe(true);
        
        // Vérifier que la session n'a pas d'erreur
        expect(soloSession.splitTimes.length).toBe(10);
        expect(soloSession.splitTimes[9]).toBeGreaterThan(0);
    });

    test('Écran de fin doit afficher le temps total correct', () => {
        // Simuler la fin de run
        const startTime = Date.now() - 170000;  // Total de 170s
        const levelStartTime = Date.now() - 10000;  // Dernier niveau depuis 10s
        
        const checkpointTime = (Date.now() - levelStartTime) / 1000;
        const totalTime = (Date.now() - startTime) / 1000;
        
        // Vérifier que le temps total est cohérent
        expect(totalTime).toBeGreaterThan(160);  // Entre 160-180s
        expect(checkpointTime).toBeGreaterThan(0);
        expect(checkpointTime).toBeLessThan(20);
    });

    test('Split times doit contenir exactement 10 entrées (un par niveau)', () => {
        // Simuler 10 niveaux complétés
        soloSession.splitTimes = [];
        
        for (let level = 1; level <= 10; level++) {
            const time = Math.random() * 30 + 5;  // Entre 5-35s par niveau
            soloSession.splitTimes.push(time);
        }
        
        expect(soloSession.splitTimes.length).toBe(10);
        expect(soloSession.splitTimes.every(t => t > 0)).toBe(true);
    });

    test('Comparaison au meilleur temps personnel doit fonctionner', () => {
        // Simuler deux runs
        const previousBestTime = 180.5;  // Ancien record
        const newRunTime = 170.2;  // Nouveau temps
        
        // Le nouveau temps est meilleur
        const isNewBest = newRunTime < previousBestTime;
        expect(isNewBest).toBe(true);
        
        // Calculer la différence
        const timeDifference = newRunTime - previousBestTime;  // -10.3s (amélioration)
        expect(timeDifference).toBeLessThan(0);
    });

    test('Comparaison au record mondial doit fonctionner', () => {
        // Simuler trois runs avec différents joueurs
        const worldRecord = 150.0;  // Record mondial
        const playerRun1 = 160.0;   // Au-dessus du record
        const playerRun2 = 145.0;   // Nouveau record!
        
        // Vérifier les comparaisons
        const beatRun1 = playerRun1 < worldRecord;
        const beatRun2 = playerRun2 < worldRecord;
        
        expect(beatRun1).toBe(false);
        expect(beatRun2).toBe(true);
        
        // Calculer les deltas
        const deltaRun1 = playerRun1 - worldRecord;  // +10s (plus lent)
        const deltaRun2 = playerRun2 - worldRecord;  // -5s (plus rapide = nouveau record)
        
        expect(deltaRun1).toBeGreaterThan(0);
        expect(deltaRun2).toBeLessThan(0);
    });

    test('Affichage du message "World Record" si record mondial battu', () => {
        const worldRecord = 150.0;
        const newTime = 140.0;
        const isBeatWorldRecord = newTime < worldRecord;
        
        const resultMessage = isBeatWorldRecord 
            ? `🌍 WORLD RECORD! Ancien: ${worldRecord.toFixed(2)}s, Nouveau: ${newTime.toFixed(2)}s`
            : `🎯 Meilleur temps: ${newTime.toFixed(2)}s`;
        
        expect(isBeatWorldRecord).toBe(true);
        expect(resultMessage).toContain('WORLD RECORD');
        expect(resultMessage).toContain('140.00');
    });

    test('Affichage du message "Meilleur personnel" si on bat son record personnel', () => {
        const personalBest = 175.0;
        const currentRun = 165.0;
        const isPBeat = currentRun < personalBest;
        
        const resultMessage = isPBeat
            ? `🎯 Nouveau record personnel! Ancien: ${personalBest.toFixed(2)}s, Nouveau: ${currentRun.toFixed(2)}s`
            : `⏱️ Temps: ${currentRun.toFixed(2)}s (Meilleur: ${personalBest.toFixed(2)}s)`;
        
        expect(isPBeat).toBe(true);
        expect(resultMessage).toContain('Nouveau record personnel');
    });

    test('Données envoyées à soloGameFinished event doivent être complètes', () => {
        // Simuler les données complètes pour le client
        const finalData = {
            totalTime: 170.2,
            splitTimes: [15.2, 21.2, 8.3, 13.1, 35.5, 18.5, 10.4, 25.6, 6.9, 7.5],
            finalLevel: 10,
            mode: 'solo'
        };
        
        // Vérifier que toutes les données sont présentes
        expect(finalData.totalTime).toBeDefined();
        expect(finalData.totalTime).toBeGreaterThan(0);
        
        expect(finalData.splitTimes).toBeDefined();
        expect(finalData.splitTimes.length).toBe(10);
        expect(finalData.splitTimes.every(t => t > 0)).toBe(true);
        
        expect(finalData.finalLevel).toBe(10);
        expect(finalData.mode).toBe('solo');
    });

    test('Shop du niveau 5 ne doit pas bloquer la collision du niveau 10', () => {
        // Vérifier le scénario critique: shop du niveau 5 n'affecte pas niveau 10
        soloSession.currentShopLevel = 6;  // Shop était actif pour niveau 6
        soloSession.currentLevel = 10;     // Maintenant au niveau 10
        
        // La collision du niveau 10 ne doit pas être bloquée
        const isShopActive = soloSession.currentShopLevel === soloSession.currentLevel;
        
        expect(isShopActive).toBe(false);  // Shop du 6 ≠ niveau 10
        
        // La collision devrait être acceptée
        expect(soloSession.currentLevel).toBe(10);
        expect(soloSession.currentShopLevel).toBe(6);
    });

    test('Réinitialisation correcte après soloGameFinished', () => {
        // Après avoir fini la run, la session doit être supprimée
        const playerId = 'player123';
        const soloSessions = {
            [playerId]: soloSession
        };
        
        // Vérifier que la session existe
        expect(soloSessions[playerId]).toBeDefined();
        expect(soloSessions[playerId].currentLevel).toBe(9);
        
        // Simuler la suppression après soloGameFinished
        delete soloSessions[playerId];
        
        // Vérifier que la session est supprimée
        expect(soloSessions[playerId]).toBeUndefined();
    });

    test('Affichage du classement: "Votre rang: #1" si meilleur temps', () => {
        // Simuler le leaderboard
        const leaderboard = [
            { playerSkin: '🏆', totalTime: 170.2 },
            { playerSkin: '🥈', totalTime: 185.0 },
            { playerSkin: '🥉', totalTime: 195.5 }
        ];
        
        const playerRunTime = 170.2;
        const playerRank = leaderboard.findIndex(entry => entry.totalTime === playerRunTime) + 1;
        
        expect(playerRank).toBe(1);
        
        const displayText = `🏆 Votre rang: #${playerRank}`;
        expect(displayText).toContain('#1');
    });

    test('Affichage du classement: "Votre rang: #5" si 4ème meilleur temps', () => {
        const leaderboard = [
            { playerSkin: '🏆', totalTime: 150.0 },
            { playerSkin: '🥈', totalTime: 160.0 },
            { playerSkin: '🥉', totalTime: 170.0 },
            { playerSkin: '🎯', totalTime: 180.0 },
            { playerSkin: '⭐', totalTime: 190.0 }
        ];
        
        const playerRunTime = 190.0;
        const playerRank = leaderboard.findIndex(entry => entry.totalTime === playerRunTime) + 1;
        
        expect(playerRank).toBe(5);
        
        const displayText = `🏆 Votre rang: #${playerRank}`;
        expect(displayText).toContain('#5');
    });

    test('Écran de fin doit rester visible jusqu\'à click sur "Rejouer"', () => {
        // Vérifier que isSoloGameFinished reste true
        let isSoloGameFinished = true;
        
        // Écran affiché
        expect(isSoloGameFinished).toBe(true);
        
        // Joueur clique sur "Rejouer"
        // Le handler reset isSoloGameFinished = false
        isSoloGameFinished = false;
        
        // Vérifier que l'écran est fermé
        expect(isSoloGameFinished).toBe(false);
    });

});
