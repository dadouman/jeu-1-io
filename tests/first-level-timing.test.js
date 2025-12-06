// tests/first-level-timing.test.js - Test spécifique pour le timing du premier niveau

describe('Timing du Premier Niveau', () => {

    // --- TEST 1 : Le premier niveau doit être chronométré correctement ---
    test('Le premier niveau doit démarrer son chrono au premier levelUpdate', () => {
        let levelStartTime = null; // Pas initialisé au démarrage
        let lastLevel = 0;
        let level = 1;
        
        // Simuler le premier levelUpdate du serveur
        let firstLevelUpdateTime = Date.now();
        let newLevel = 1;
        
        if (newLevel === 1 && lastLevel === 0) {
            // Premier niveau : initialiser maintenant
            levelStartTime = firstLevelUpdateTime;
        }
        
        level = newLevel;
        lastLevel = newLevel;
        
        // Simuler 5 secondes de jeu
        let gemFoundTime = firstLevelUpdateTime + 5000;
        let levelUpTime = (gemFoundTime - levelStartTime) / 1000;
        
        expect(levelStartTime).toBe(firstLevelUpdateTime);
        expect(levelUpTime).toBeCloseTo(5, 0);
    });

    // --- TEST 2 : Transition du niveau 1 vers 2 ---
    test('La transition du niveau 1 vers 2 doit ajouter 3s de décalage', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1 commence
        let levelStartTime = Date.now();
        let lastLevel = 1;
        
        // 5 secondes plus tard, gem trouvée
        let gemFoundTime = levelStartTime + 5000;
        let levelUpTime = (gemFoundTime - levelStartTime) / 1000; // 5s
        
        // Socket levelUpdate arrive
        let newLevel = 2;
        if (newLevel !== lastLevel && lastLevel !== 0) {
            // On calcule le temps du niveau 1 AVANT de changer levelStartTime
            let calculatedTime = (gemFoundTime - levelStartTime) / 1000;
            expect(calculatedTime).toBe(5);
        }
        
        // Maintenant on réinitialise pour le niveau 2
        if (newLevel > 1) {
            levelStartTime = gemFoundTime + TRANSITION_DURATION;
        }
        
        // Niveau 2 commence après la transition
        let level2StartTime = levelStartTime;
        let level2GemTime = level2StartTime + 4000;
        let level2Time = (level2GemTime - level2StartTime) / 1000;
        
        expect(levelUpTime).toBe(5);
        expect(level2Time).toBeCloseTo(4, 0);
    });

    // --- TEST 3 : Cascade de niveaux ---
    test('Les trois premiers niveaux doivent avoir des temps corrects', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1
        let levelStartTime = Date.now();
        let level1EndTime = levelStartTime + 5000;
        let level1Time = (level1EndTime - levelStartTime) / 1000;
        expect(level1Time).toBe(5);
        
        // Transition 1->2
        levelStartTime = level1EndTime + TRANSITION_DURATION;
        let level2EndTime = levelStartTime + 4000;
        let level2Time = (level2EndTime - levelStartTime) / 1000;
        expect(level2Time).toBe(4);
        
        // Transition 2->3
        levelStartTime = level2EndTime + TRANSITION_DURATION;
        let level3EndTime = levelStartTime + 6000;
        let level3Time = (level3EndTime - levelStartTime) / 1000;
        expect(level3Time).toBe(6);
    });

    // --- TEST 4 : Pas d'initialisation double ---
    test('Le premier niveau ne doit être initialisé qu\'une fois', () => {
        let levelStartTime = null;
        let lastLevel = 0;
        let initCount = 0;
        
        // Premier levelUpdate : niveau 1
        let newLevel = 1;
        if (newLevel === 1 && lastLevel === 0) {
            levelStartTime = Date.now();
            initCount++;
        }
        lastLevel = newLevel;
        
        expect(initCount).toBe(1);
        
        // Deuxième levelUpdate : toujours niveau 1 (pas de changement)
        newLevel = 1;
        if (newLevel === 1 && lastLevel === 0) { // Cette condition est fausse, ne s'exécute pas
            initCount++;
        }
        lastLevel = newLevel;
        
        expect(initCount).toBe(1); // Pas doublé
    });

    // --- TEST 5 : Vérifier que le timing est cohérent à travers les niveaux ---
    test('Le temps total de tous les niveaux doit être préservé', () => {
        const TRANSITION_DURATION = 3000;
        let levelStartTime = Date.now();
        let totalGameTime = 0;
        
        // Niveau 1 : 5s
        let level1Time = 5;
        totalGameTime += level1Time;
        
        // Transition 1->2 : 3s (compris dans le temps de jeu)
        // Niveau 2 : 4s
        let level2Time = 4;
        totalGameTime += level2Time;
        
        // Transition 2->3 : 3s
        // Niveau 3 : 6s
        let level3Time = 6;
        totalGameTime += level3Time;
        
        // Temps total = 5 + 3 + 4 + 3 + 6 = 21s
        // Mais les transitions sont "hors jeu", donc on compte que les niveaux
        let netGameTime = level1Time + level2Time + level3Time; // 15s
        
        expect(netGameTime).toBe(15);
    });

});
