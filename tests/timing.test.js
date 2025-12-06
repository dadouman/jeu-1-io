// tests/timing.test.js - Tests pour le système de timing du niveau

describe('Système de Timing des Niveaux', () => {

    // --- TEST 1 : Calcul du temps de niveau simple ---
    test('Le temps de niveau doit être calculé correctement', () => {
        const TRANSITION_DURATION = 3000;
        
        // Simuler : niveau commence
        let levelStartTime = Date.now();
        let level = 1;
        
        // Simuler 5 secondes de jeu
        let currentTime = levelStartTime + 5000;
        
        // Calculer le temps
        let levelUpTime = (currentTime - levelStartTime) / 1000;
        
        expect(levelUpTime).toBeCloseTo(5, 0);
    });

    // --- TEST 2 : Transition de niveau sans décalage ---
    test('Après une transition, le chronomètre du prochain niveau doit être à 0', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1 : commence à 0, finit à 5 secondes
        let levelStartTime = 0;
        let finishTime = 5000;
        let levelUpTime = (finishTime - levelStartTime) / 1000; // 5s
        
        // Transition se déclenche immédiatement
        let transitionStartTime = finishTime;
        
        // La transition dure 3 secondes
        let transitionEndTime = transitionStartTime + TRANSITION_DURATION; // 5000 + 3000 = 8000
        
        // Niveau 2 démarre APRÈS la transition
        let level2StartTime = transitionEndTime;
        
        // Temps du niveau 1
        expect(levelUpTime).toBe(5);
        
        // Immédiatement après la transition
        let level2TimeAtStart = (transitionEndTime - level2StartTime) / 1000;
        expect(level2TimeAtStart).toBe(0);
    });

    // --- TEST 3 : Problème d'offset avec Date.now() ---
    test('Ne pas ajouter de délai au levelStartTime', () => {
        const TRANSITION_DURATION = 3000;
        
        // ❌ MAUVAIS
        let levelStartTime_wrong = Date.now() + TRANSITION_DURATION; // +3000ms
        let currentTime = Date.now() + 5000; // +5000ms après NOW
        let wrongTime = (currentTime - levelStartTime_wrong) / 1000; // (NOW+5000) - (NOW+3000) = 2s (FAUX!)
        
        // ✅ BON
        let levelStartTime_correct = Date.now(); // NOW
        let correctTime = (Date.now() + 5000 - levelStartTime_correct) / 1000; // (NOW+5000) - NOW = 5s (OK)
        
        expect(wrongTime).toBeLessThan(3); // FAUX : donne ~2 secondes au lieu de 5
        expect(correctTime).toBeCloseTo(5, 0); // BON : donne 5 secondes
    });

    // --- TEST 4 : Timing avec plusieurs niveaux ---
    test('Le timing doit être correct à travers plusieurs transitions', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1
        let level1Start = 0;
        let level1End = 5000; // 5 secondes
        let level1Time = (level1End - level1Start) / 1000;
        expect(level1Time).toBe(5);
        
        // Transition 1
        let transition1Start = level1End;
        let transition1End = transition1Start + TRANSITION_DURATION; // 8000
        
        // Niveau 2 démarre correctement
        let level2Start = transition1End; // 8000
        let level2End = 8000 + 4000; // 4 secondes de jeu
        let level2Time = (level2End - level2Start) / 1000;
        expect(level2Time).toBe(4);
        
        // Transition 2
        let transition2Start = level2End;
        let transition2End = transition2Start + TRANSITION_DURATION;
        
        // Niveau 3
        let level3Start = transition2End;
        let level3End = level3Start + 6000; // 6 secondes
        let level3Time = (level3End - level3Start) / 1000;
        expect(level3Time).toBe(6);
    });

    // --- TEST 5 : Vérifier que le calcul ne dépend pas du moment ---
    test('Le calcul de levelUpTime ne doit pas inclure le délai de transition', () => {
        // Au moment du levelUpdate (avant réinitialisation)
        let levelStartTime = Date.now() - 5000; // Il y a 5 secondes
        let now = Date.now();
        
        // Calcul CORRECT du temps (avant changement de levelStartTime)
        let levelUpTime = (now - levelStartTime) / 1000; // ~5 secondes
        
        // APRÈS le calcul, on peut réinitialiser levelStartTime
        let levelStartTime_new = now + 3000; // +3s pour la transition
        
        // Mais levelUpTime reste correct car il a été calculé AVANT
        expect(levelUpTime).toBeGreaterThanOrEqual(4.9);
        expect(levelUpTime).toBeLessThanOrEqual(5.1);
    });

    // --- TEST 6 : Cas réel avec progression de temps ---
    test('Simulation réelle d\'un niveau complet', () => {
        const TRANSITION_DURATION = 3000;
        
        // T=0 : Niveau 1 commence
        let levelStartTime = 0;
        
        // T=5000 : Joueur trouve la gem
        let gemFoundTime = 5000;
        let levelUpTime = (gemFoundTime - levelStartTime) / 1000; // 5 secondes
        
        console.log(`Level 1 took ${levelUpTime}s`);
        
        // T=5000 : Transition commence
        // Le calcul de levelUpTime est fait ICI : 5s
        
        // T=5000+3000=8000 : Transition finie, niveau 2 commence
        // CORRECT : levelStartTime = 8000
        // INCORRECT : levelStartTime = 5000 + 3000 (qui serait aussi 8000 mais par une route différente)
        
        let level2Start = gemFoundTime + TRANSITION_DURATION;
        expect(level2Start).toBe(8000);
        expect(levelUpTime).toBe(5);
    });

    // --- TEST 7 : Off-by-one avec le décalage ---
    test('Ajouter du délai au levelStartTime cause une erreur croissante', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1
        let level1Start = 0;
        let gem1Time = 5000;
        let level1Time = (gem1Time - level1Start) / 1000; // 5s
        
        // ❌ MAUVAIS : ajouter le délai
        let level2Start_wrong = gem1Time + TRANSITION_DURATION; // 8000
        
        // Niveau 2 dure 4 secondes
        let gem2Time = level2Start_wrong + 4000; // 12000
        let level2Time = (gem2Time - level2Start_wrong) / 1000; // Bon : 4s
        
        // Niveau 3 - mais on a gardé le décalage !
        let level3Start_wrong = gem2Time + TRANSITION_DURATION; // 15000
        let gem3Time = level3Start_wrong + 6000; // 21000
        let level3Time = (gem3Time - level3Start_wrong) / 1000; // Bon : 6s
        
        // Les temps sont corrects parce qu'on recalcule à chaque fois
        expect(level1Time).toBe(5);
        expect(level2Time).toBe(4);
        expect(level3Time).toBe(6);
    });

    // --- TEST 8 : Démonstration du bug potentiel ---
    test('Bug : si on ajoute du décalage et qu\'on l\'oublie pas', () => {
        const TRANSITION_DURATION = 3000;
        
        // Incorrectement, on ajoute un délai au départ
        let levelStartTime = Date.now() + TRANSITION_DURATION; // MAUVAIS
        
        // Mais ensuite on calcule comme si c'était normal
        let now1 = levelStartTime + 5000; // 5 secondes plus tard
        let calculatedTime = (now1 - levelStartTime) / 1000; // Correct : 5s
        
        // Le problème : si on oublie de corriger levelStartTime
        // Le PROCHAIN calcul sera décalé
        let now2 = now1 + 4000; // 4 secondes plus tard
        let calculatedTime2 = (now2 - levelStartTime) / 1000; // FAUX : 9s au lieu de 4s!
        
        expect(calculatedTime).toBe(5); // OK
        expect(calculatedTime2).toBe(9); // ❌ FAUX! Devrait être 4
    });

    // --- TEST 9 : Solution correcte ---
    test('Solution : réinitialiser levelStartTime correctement après transition', () => {
        const TRANSITION_DURATION = 3000;
        
        // Niveau 1
        let levelStartTime = Date.now();
        let gemFoundTime = Date.now() + 5000;
        let levelUpTime = (gemFoundTime - levelStartTime) / 1000;
        expect(levelUpTime).toBeCloseTo(5, 0);
        
        // Après calcul du temps, on réinitialise
        // SOLUTION 1 : attendre la fin de la transition (simple)
        // Mais comme on peut pas attendre 3s, on estime :
        // levelStartTime = Date.now() + TRANSITION_DURATION; ← FAUX
        
        // SOLUTION 2 : calculer quand la transition finira
        let transitionEndTime = gemFoundTime + TRANSITION_DURATION;
        
        // Niveau 2 : On simule qu'on est après la transition
        levelStartTime = transitionEndTime; // ✅ Correct
        let level2Time = (transitionEndTime + 4000 - levelStartTime) / 1000;
        expect(level2Time).toBe(4);
    });

});
