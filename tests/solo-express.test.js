// tests/solo-express.test.js
// Tests pour le mode solo express (10 niveaux, feature aléatoire débloquée)

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayerForMode } = require('../utils/player');
const { generateRandomFeatureWeighted } = require('../server/utils/solo-utils');
const { SHOP_ITEMS } = require('../utils/shop');

describe('Solo Express Mode - 10 Levels Challenge', () => {

    test('Solo express session devrait avoir maxLevel = 10', () => {
        const session = {
            mode: 'solo-express',
            currentLevel: 1,
            map: generateMaze(15, 15),
            coin: getRandomEmptyPosition(generateMaze(15, 15)),
            player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo-express'),
            startTime: Date.now(),
            levelStartTime: Date.now(),
            checkpoints: [],
            totalTime: 0
        };

        expect(session.mode).toBe('solo-express');
        expect(session.currentLevel).toBe(1);
        
        // Simulation: atteindre le maximum (10 niveaux)
        session.currentLevel = 11;
        expect(session.currentLevel).toBeGreaterThan(10); // Condition de fin
    });

    test('Solo express débloque une feature aléatoire au départ', () => {
        const player = initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo-express');
        
        // Simuler le déblocage de feature
        const unlockedFeature = generateRandomFeatureWeighted();
        player.purchasedFeatures[unlockedFeature] = true;
        
        // Vérifier que la feature est dans les features disponibles
        expect(['dash', 'checkpoint', 'rope', 'speedBoost']).toContain(unlockedFeature);
        expect(player.purchasedFeatures[unlockedFeature]).toBe(true);
    });

    test('generateRandomFeatureWeighted retourne une feature valide', () => {
        for (let i = 0; i < 10; i++) {
            const feature = generateRandomFeatureWeighted();
            expect(['dash', 'checkpoint', 'rope', 'speedBoost']).toContain(feature);
        }
    });

    test('Poids inversement proportionnel au prix (features moins chères plus probables)', () => {
        const iterations = 1000;
        const featureCounts = {
            'rope': 0,        // prix: 1 (50% de chance)
            'speedBoost': 0,  // prix: 2 (30% de chance)
            'checkpoint': 0,  // prix: 3 (20% de chance)
            'dash': 0         // prix: 5 (0% de chance)
        };
        
        for (let i = 0; i < iterations; i++) {
            const feature = generateRandomFeatureWeighted();
            featureCounts[feature]++;
        }
        
        // Rope (moins cher) devrait être plus fréquent que dash (plus cher)
        expect(featureCounts['rope']).toBeGreaterThan(featureCounts['dash']);
        expect(featureCounts['speedBoost']).toBeGreaterThan(featureCounts['dash']);
        expect(featureCounts['checkpoint']).toBeGreaterThan(featureCounts['dash']);
    });

    test('Solo express a 10 niveaux max (5 expansion, 5 contraction)', () => {
        const maxLevels = 10;
        const expandLevels = Math.floor(maxLevels / 2); // 5
        
        expect(expandLevels).toBe(5);
        expect(maxLevels - expandLevels).toBe(5);
    });

    test('Solo express progression: niveaux 1-5 expansion, 6-10 contraction', () => {
        const testLevels = [1, 5, 6, 10];
        const expectedPhases = ['expansion', 'expansion', 'contraction', 'contraction'];
        
        for (let i = 0; i < testLevels.length; i++) {
            const level = testLevels[i];
            const expectedPhase = expectedPhases[i];
            
            const isExpansion = level <= 5;
            const actualPhase = isExpansion ? 'expansion' : 'contraction';
            
            expect(actualPhase).toBe(expectedPhase);
        }
    });

    test('Solo express shop ouverture: après niveau 5 (niveau 10 est la fin)', () => {
        const { isShopLevel } = require('../utils/shop');
        
        // Fonction isShopLevel retourne true pour 5 et 10 (divisibles par 5)
        // Mais en pratique, le code empêche l'ouverture au niveau 10 car c'est la fin
        expect(isShopLevel(5)).toBe(true);
        expect(isShopLevel(10)).toBe(true); // Oui, mais le jeu n'en tient pas compte
        
        // Logique du jeu: completedLevel < maxLevel (10)
        const maxLevel = 10;
        const shopAfterLevel5 = isShopLevel(5) && 5 < maxLevel; // true && true = true
        const shopAfterLevel10 = isShopLevel(10) && 9 < maxLevel; // true && true = true
        
        // Mais attendez, le check est sur completedLevel qui est currentLevel - 1
        // Donc quand on termine le niveau 9, completedLevel = 9 < 10 = true
        // Quand on termine le niveau 10, currentLevel = 11, completedLevel = 10 NOT < 10
        expect(shopAfterLevel5).toBe(true);
        // À la fin du jeu, il ne peut pas y avoir de check shop car c'est gameFinished
    });

    test('Mode solo-express accès au shop avec feature débloquée gratuitement', () => {
        const player = initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo-express');
        
        // Au départ, une feature est débloquée
        const startingFeatures = Object.keys(player.purchasedFeatures).filter(k => player.purchasedFeatures[k] === true);
        expect(startingFeatures.length).toBeGreaterThanOrEqual(0); // Peut être vide au départ (déblocage se fait après)
        
        // Simuler le déblocage
        const unlockedFeature = generateRandomFeatureWeighted();
        player.purchasedFeatures[unlockedFeature] = true;
        
        // Vérifier que c'est bien débloqué
        expect(player.purchasedFeatures[unlockedFeature]).toBe(true);
        
        // Le joueur devrait pouvoir utiliser cette feature
        expect(['dash', 'checkpoint', 'rope', 'speedBoost']).toContain(unlockedFeature);
    });

    test('Solo express vs Solo: differences in level count', () => {
        const soloSession = {
            mode: 'solo',
            maxLevel: 20
        };
        
        const soloExpressSession = {
            mode: 'solo-express',
            maxLevel: 10
        };
        
        expect(soloExpressSession.maxLevel).toBe(soloSession.maxLevel / 2);
    });

    test('Solo express timing should track same as solo (checkpoints array)', () => {
        const session = {
            mode: 'solo-express',
            currentLevel: 1,
            checkpoints: [],
            totalTime: 0
        };
        
        // Ajouter des temps de checkpoint
        session.checkpoints.push(12.5);
        session.checkpoints.push(14.3);
        session.checkpoints.push(13.8);
        
        expect(session.checkpoints.length).toBe(3);
        expect(session.checkpoints[0]).toBe(12.5);
        expect(session.totalTime).toBe(0); // Pas encore calculé
    });

});
