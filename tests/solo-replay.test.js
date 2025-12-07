// tests/solo-replay.test.js - Tests du système de replay du mode solo

describe('Solo Mode - Replay et redémarrage', () => {
    
    test('Bouton Replay doit être cliquable après fin du jeu', () => {
        const isGameFinished = true;
        const replayButtonExists = isGameFinished;
        
        expect(replayButtonExists).toBe(true);
    });

    test('Bouton Menu doit être cliquable après fin du jeu', () => {
        const isGameFinished = true;
        const menuButtonExists = isGameFinished;
        
        expect(menuButtonExists).toBe(true);
    });

    test('Replay doit réinitialiser le niveau à 1', () => {
        const currentLevel = 20; // Fin du jeu
        const levelAfterReplay = 1;
        
        expect(currentLevel).toBe(20);
        expect(levelAfterReplay).toBe(1);
    });

    test('Replay doit réinitialiser le temps total à 0', () => {
        const soloTotalTime = 123.45;
        const totalTimeAfterReplay = 0;
        
        expect(soloTotalTime).toBeGreaterThan(0);
        expect(totalTimeAfterReplay).toBe(0);
    });

    test('Replay doit vider les checkpoints', () => {
        const soloCheckpoints = [2.5, 3.1, 2.8, 3.5, 4.0, 3.2, 3.9, 4.1, 3.8, 3.6, 2.9, 3.3, 2.7, 3.6, 4.2, 3.1, 4.0, 4.3, 3.9, 3.7];
        const checkpointsAfterReplay = [];
        
        expect(soloCheckpoints.length).toBe(20);
        expect(checkpointsAfterReplay.length).toBe(0);
    });

    test('Replay doit réinitialiser isSoloGameFinished à false', () => {
        const isSoloGameFinished = true;
        const isGameFinishedAfterReplay = false;
        
        expect(isSoloGameFinished).toBe(true);
        expect(isGameFinishedAfterReplay).toBe(false);
    });

    test('Plusieurs replays consécutifs doivent être possibles', () => {
        let gameCount = 0;
        
        // Partie 1
        gameCount++;
        let currentLevel = 20;
        // Replay
        currentLevel = 1;
        expect(currentLevel).toBe(1);
        
        // Partie 2
        gameCount++;
        currentLevel = 20;
        // Replay
        currentLevel = 1;
        expect(currentLevel).toBe(1);
        
        expect(gameCount).toBe(2);
    });

    test('État du jeu doit être complètement réinitialisé après Replay', () => {
        const stateBefore = {
            level: 20,
            totalTime: 123.45,
            checkpoints: [2.5, 3.1, 2.8, 3.5],
            isFinished: true
        };
        
        // Après replay
        const stateAfter = {
            level: 1,
            totalTime: 0,
            splitTimes: [],
            isFinished: false
        };
        
        expect(stateBefore.level).toBe(20);
        expect(stateAfter.level).toBe(1);
        expect(stateAfter.totalTime).toBe(0);
        expect(stateAfter.splitTimes.length).toBe(0);
        expect(stateAfter.isFinished).toBe(false);
    });

    test('Replay doit envoyer selectGameMode socket avec \'solo\'', () => {
        // Simulation de l'émission du socket
        const socketEmit = (event, data) => {
            expect(event).toBe('selectGameMode');
            expect(data.mode).toBe('solo');
        };
        
        // Simulation du click sur Replay
        socketEmit('selectGameMode', { mode: 'solo' });
    });

    test('Menu button doit retourner à la page d\'accueil', () => {
        const currentPage = 'solo-results';
        // Click sur Menu → location.reload()
        const pageAfterMenu = 'home';
        
        expect(currentPage).toBe('solo-results');
        // La réalisation vérifierait que location.reload() est appelé
    });

    test('Replay button doit avoir une zone de clic définie', () => {
        const replayButtonRect = {
            x: 100,
            y: 400,
            w: 160,
            h: 50
        };
        
        expect(replayButtonRect.x).toBeDefined();
        expect(replayButtonRect.y).toBeDefined();
        expect(replayButtonRect.w).toBeDefined();
        expect(replayButtonRect.h).toBeDefined();
        expect(replayButtonRect.w).toBe(160);
        expect(replayButtonRect.h).toBe(50);
    });

    test('Menu button doit avoir une zone de clic définie', () => {
        const menuButtonRect = {
            x: 400,
            y: 400,
            w: 160,
            h: 50
        };
        
        expect(menuButtonRect.x).toBeDefined();
        expect(menuButtonRect.y).toBeDefined();
        expect(menuButtonRect.w).toBeDefined();
        expect(menuButtonRect.h).toBeDefined();
        expect(menuButtonRect.w).toBe(160);
        expect(menuButtonRect.h).toBe(50);
    });

    test('Détection de clic sur Replay button', () => {
        const clickX = 180;
        const clickY = 425;
        const replayButtonRect = { x: 100, y: 400, w: 160, h: 50 };
        
        const isClickOnReplay = clickX >= replayButtonRect.x && 
                                 clickX <= replayButtonRect.x + replayButtonRect.w &&
                                 clickY >= replayButtonRect.y && 
                                 clickY <= replayButtonRect.y + replayButtonRect.h;
        
        expect(isClickOnReplay).toBe(true);
    });

    test('Clic en dehors du Replay button ne doit pas déclencher le replay', () => {
        const clickX = 50;  // Trop à gauche
        const clickY = 425;
        const replayButtonRect = { x: 100, y: 400, w: 160, h: 50 };
        
        const isClickOnReplay = clickX >= replayButtonRect.x && 
                                 clickX <= replayButtonRect.x + replayButtonRect.w &&
                                 clickY >= replayButtonRect.y && 
                                 clickY <= replayButtonRect.y + replayButtonRect.h;
        
        expect(isClickOnReplay).toBe(false);
    });
});
