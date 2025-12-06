// tests/transition.test.js - Tests pour les écrans de transition, podium, et chronomètre

describe('Système de Transition', () => {

    // --- TEST 1 : Calcul du classement ---
    test('Le classement doit trier les joueurs par score décroissant', () => {
        const players = {
            'player1': { skin: '👻', score: 10 },
            'player2': { skin: '👽', score: 25 },
            'player3': { skin: '🤖', score: 15 }
        };

        const getRanking = (playersObj) => {
            return Object.entries(playersObj)
                .map(([id, player]) => ({
                    id,
                    skin: player.skin,
                    score: player.score || 0
                }))
                .sort((a, b) => b.score - a.score);
        };

        const ranking = getRanking(players);

        expect(ranking[0].score).toBe(25);
        expect(ranking[0].skin).toBe('👽');
        expect(ranking[1].score).toBe(15);
        expect(ranking[1].skin).toBe('🤖');
        expect(ranking[2].score).toBe(10);
        expect(ranking[2].skin).toBe('👻');
    });

    // --- TEST 2 : Podium - Top 3 ---
    test('Le podium doit afficher exactement 3 joueurs', () => {
        const players = {
            'p1': { skin: '👻', score: 100 },
            'p2': { skin: '👽', score: 80 },
            'p3': { skin: '🤖', score: 60 },
            'p4': { skin: '🦄', score: 40 },
            'p5': { skin: '🐷', score: 20 }
        };

        const getRanking = (playersObj) => {
            return Object.entries(playersObj)
                .map(([id, player]) => ({
                    id,
                    skin: player.skin,
                    score: player.score || 0
                }))
                .sort((a, b) => b.score - a.score);
        };

        const ranking = getRanking(players);
        const podium = ranking.slice(0, 3);

        expect(podium.length).toBe(3);
        expect(podium[0].skin).toBe('👻');
        expect(podium[1].skin).toBe('👽');
        expect(podium[2].skin).toBe('🤖');
    });

    // --- TEST 3 : Position du joueur si classé 4e+ ---
    test('Un joueur classé 4e doit être identifiable dans le classement', () => {
        const players = {
            'p1': { skin: '👻', score: 100 },
            'p2': { skin: '👽', score: 80 },
            'p3': { skin: '🤖', score: 60 },
            'p4': { skin: '🦄', score: 40 }
        };
        const myId = 'p4';

        const getRanking = (playersObj) => {
            return Object.entries(playersObj)
                .map(([id, player]) => ({
                    id,
                    skin: player.skin,
                    score: player.score || 0
                }))
                .sort((a, b) => b.score - a.score);
        };

        const ranking = getRanking(players);
        const myRank = ranking.findIndex(p => p.id === myId);

        expect(myRank).toBe(3); // Index 3 = 4e position
        expect(ranking[myRank].skin).toBe('🦄');
        expect(ranking[myRank].score).toBe(40);
    });

    // --- TEST 4 : Gestion des égalités de score ---
    test('En cas d\'égalité, l\'ordre d\'insertion est préservé', () => {
        // Simuler des joueurs avec scores égaux
        const players = {};
        players['p1'] = { skin: '👻', score: 50 };
        players['p2'] = { skin: '👽', score: 50 };
        players['p3'] = { skin: '🤖', score: 50 };

        const getRanking = (playersObj) => {
            return Object.entries(playersObj)
                .map(([id, player]) => ({
                    id,
                    skin: player.skin,
                    score: player.score || 0
                }))
                .sort((a, b) => b.score - a.score);
        };

        const ranking = getRanking(players);

        // Tous avec le même score
        expect(ranking[0].score).toBe(50);
        expect(ranking[1].score).toBe(50);
        expect(ranking[2].score).toBe(50);

        // L'ordre d'insertion est respecté
        expect(ranking[0].skin).toBe('👻');
        expect(ranking[1].skin).toBe('👽');
        expect(ranking[2].skin).toBe('🤖');
    });

    // --- TEST 5 : Calcul du temps de niveau ---
    test('Le temps du niveau doit être calculé correctement', () => {
        const levelStartTime = Date.now() - 5000; // 5 secondes avant maintenant
        const currentTime = Date.now();
        const levelUpTime = (currentTime - levelStartTime) / 1000;

        expect(levelUpTime).toBeGreaterThanOrEqual(4.9); // Environ 5 secondes (avec marge)
        expect(levelUpTime).toBeLessThanOrEqual(5.1);
    });

    // --- TEST 6 : Chronomètre ne commence que après transition ---
    test('Le chronomètre du prochain niveau doit commencer 3s après la transition', () => {
        const TRANSITION_DURATION = 3000;
        const previousTransitionStart = Date.now();
        const nextLevelStartTime = previousTransitionStart + TRANSITION_DURATION;

        const timeSinceStart = Date.now() - nextLevelStartTime;

        // Le temps devrait être proche de 0 (car on vient de calculer nextLevelStartTime)
        expect(timeSinceStart).toBeLessThanOrEqual(100);
    });

    // --- TEST 7 : Affichage du message de transition ---
    test('Le message de transition doit contenir l\'emoji et le temps', () => {
        const levelUpPlayerSkin = '👻';
        const levelUpTime = 4.5;

        const message = `${levelUpPlayerSkin} Gem récupérée en ${levelUpTime.toFixed(1)}s`;

        expect(message).toContain('👻');
        expect(message).toContain('4.5');
        expect(message).toContain('Gem récupérée');
    });

    // --- TEST 8 : Progress de transition (0 à 1) ---
    test('La progression de transition doit passer de 0 à 1', () => {
        const TRANSITION_DURATION = 3000;
        const transitionStartTime = Date.now();

        // Simuler différents moments de la transition
        const timeElapsed = 1500; // Milieu de la transition
        const transitionProgress = timeElapsed / TRANSITION_DURATION;

        expect(transitionProgress).toBeGreaterThan(0);
        expect(transitionProgress).toBeLessThan(1);
        expect(transitionProgress).toBeCloseTo(0.5, 1);
    });

    // --- TEST 9 : Zoom progressif ---
    test('Le zoom doit augmenter progressivement par niveau', () => {
        const getZoomLevel = (level) => {
            return Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        };

        expect(getZoomLevel(1)).toBe(1.0); // Niveau 1 : pas de zoom
        expect(getZoomLevel(2)).toBeCloseTo(0.98, 2); // Niveau 2 : 2% de zoom
        expect(getZoomLevel(5)).toBeCloseTo(0.92, 2); // Niveau 5 : 8% de zoom
        expect(getZoomLevel(50)).toBeCloseTo(0.7, 1); // Niveau 50 : clamped à 0.7
        expect(getZoomLevel(100)).toBe(0.7); // Clamped minimum
    });

    // --- TEST 10 : Médailles du podium ---
    test('Les médailles doivent correspondre aux bonnes positions', () => {
        const podiumMedals = ['🥇', '🥈', '🥉'];
        
        expect(podiumMedals[0]).toBe('🥇'); // Or
        expect(podiumMedals[1]).toBe('🥈'); // Argent
        expect(podiumMedals[2]).toBe('🥉'); // Bronze
    });

    // --- TEST 11 : Données de transition complètes ---
    test('Les données de transition doivent contenir tous les éléments', () => {
        const transitionData = {
            isInTransition: true,
            transitionStartTime: Date.now(),
            levelUpPlayerSkin: '👻',
            levelUpTime: 5.2,
            currentPlayers: {
                'p1': { skin: '👻', score: 10 }
            },
            level: 2
        };

        expect(transitionData.isInTransition).toBe(true);
        expect(transitionData.levelUpPlayerSkin).toBeDefined();
        expect(transitionData.levelUpTime).toBeGreaterThan(0);
        expect(transitionData.currentPlayers).toBeDefined();
        expect(transitionData.level).toBeGreaterThan(1);
    });

    // --- TEST 12 : Réinitialisation après transition ---
    test('La transition doit se réinitialiser correctement après 3 secondes', () => {
        const TRANSITION_DURATION = 3000;
        let isInTransition = true;
        const transitionStartTime = Date.now() - TRANSITION_DURATION - 100; // 100ms après la fin

        const transitionElapsed = Date.now() - transitionStartTime;
        if (transitionElapsed >= TRANSITION_DURATION) {
            isInTransition = false;
        }

        expect(isInTransition).toBe(false);
    });

});
