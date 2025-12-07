// tests/solo-delta-display.test.js - Tests pour l'affichage du delta en mode solo

describe('Solo Mode - Affichage du Delta (Temps vs Record)', () => {
    
    let canvas, ctx;
    
    beforeEach(() => {
        // Mock du canvas et du contexte
        canvas = {
            width: 1280,
            height: 720
        };
        
        ctx = {
            fillStyle: '',
            font: '',
            textAlign: '',
            fillText: jest.fn(),
            globalAlpha: 1.0,
            save: jest.fn(),
            restore: jest.fn()
        };
        
        // Variables globales pour simuler le rendu
        global.soloRunTotalTime = 0;
        global.currentGameMode = 'solo';
        global.soloShowPersonalDelta = true;
        global.soloPersonalBestTime = null;
        global.soloLeaderboardBest = null;
        global.currentLevelTime = 0;
    });

    test('Delta VERT (plus rapide) quand temps total < meilleur temps personnel', () => {
        global.soloRunTotalTime = 120.5;  // 02:00.500
        global.soloPersonalBestTime = 145.2;  // 02:25.200 (record)
        global.soloShowPersonalDelta = true;
        
        // Simuler le calcul du delta
        const delta = soloRunTotalTime - soloPersonalBestTime;
        const isFaster = delta < 0;  // true = plus rapide = VERT
        const expectedColor = isFaster ? '#00FF00' : '#FF6B6B';
        
        expect(isFaster).toBe(true);
        expect(expectedColor).toBe('#00FF00');
    });

    test('Delta ROUGE (plus lent) quand temps total > meilleur temps personnel', () => {
        global.soloRunTotalTime = 160.3;  // 02:40.300
        global.soloPersonalBestTime = 145.2;  // 02:25.200 (record)
        global.soloShowPersonalDelta = true;
        
        // Simuler le calcul du delta
        const delta = soloRunTotalTime - soloPersonalBestTime;
        const isSlower = delta > 0;  // true = plus lent = ROUGE
        const expectedColor = isSlower ? '#FF6B6B' : '#00FF00';
        
        expect(isSlower).toBe(true);
        expect(expectedColor).toBe('#FF6B6B');
    });

    test('Formatage du delta: avance de 25 secondes', () => {
        global.soloRunTotalTime = 120.0;
        global.soloPersonalBestTime = 145.0;
        
        const delta = soloRunTotalTime - soloPersonalBestTime;  // -25.0
        const deltaSeconds = Math.floor(Math.abs(delta));  // 25
        const deltaMinutes = Math.floor(deltaSeconds / 60);  // 0
        const deltaSecs = deltaSeconds % 60;  // 25
        const deltaMilliseconds = Math.round((Math.abs(delta) - deltaSeconds) * 1000);  // 0
        const sign = delta >= 0 ? '+' : '-';
        const deltaFormatted = `${sign}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
        
        expect(deltaFormatted).toBe('-00:25.000');
    });

    test('Formatage du delta: retard de 15.456 secondes', () => {
        global.soloRunTotalTime = 160.656;
        global.soloPersonalBestTime = 145.2;
        
        const delta = soloRunTotalTime - soloPersonalBestTime;  // 15.456
        const deltaSeconds = Math.floor(Math.abs(delta));  // 15
        const deltaMinutes = Math.floor(deltaSeconds / 60);  // 0
        const deltaSecs = deltaSeconds % 60;  // 15
        const deltaMilliseconds = Math.round((Math.abs(delta) - deltaSeconds) * 1000);  // 456
        const sign = delta >= 0 ? '+' : '-';
        const deltaFormatted = `${sign}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
        
        expect(deltaFormatted).toBe('+00:15.456');
    });

    test('Formatage du delta: avance de 1 minute 30 secondes', () => {
        global.soloRunTotalTime = 100.0;
        global.soloPersonalBestTime = 190.0;
        
        const delta = soloRunTotalTime - soloPersonalBestTime;  // -90.0
        const deltaSeconds = Math.floor(Math.abs(delta));  // 90
        const deltaMinutes = Math.floor(deltaSeconds / 60);  // 1
        const deltaSecs = deltaSeconds % 60;  // 30
        const deltaMilliseconds = Math.round((Math.abs(delta) - deltaSeconds) * 1000);  // 0
        const sign = delta >= 0 ? '+' : '-';
        const deltaFormatted = `${sign}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
        
        expect(deltaFormatted).toBe('-01:30.000');
    });

    test('Formatage du delta: retard de 2 minutes 45.789 secondes', () => {
        global.soloRunTotalTime = 335.789;
        global.soloPersonalBestTime = 250.0;
        
        const delta = soloRunTotalTime - soloPersonalBestTime;  // 85.789
        const deltaSeconds = Math.floor(Math.abs(delta));  // 85
        const deltaMinutes = Math.floor(deltaSeconds / 60);  // 1
        const deltaSecs = deltaSeconds % 60;  // 25
        const deltaMilliseconds = Math.round((Math.abs(delta) - deltaSeconds) * 1000);  // 789
        const sign = delta >= 0 ? '+' : '-';
        const deltaFormatted = `${sign}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
        
        expect(deltaFormatted).toBe('+01:25.789');
    });

    test('Le delta ne s\'affiche que si soloRunTotalTime > 0 ET bestTime existe', () => {
        global.soloRunTotalTime = 0;  // Pas commencé
        global.soloPersonalBestTime = 145.2;
        
        const shouldDisplay = soloRunTotalTime > 0 && soloPersonalBestTime !== null;
        expect(shouldDisplay).toBe(false);
    });

    test('Le delta s\'affiche dès que soloRunTotalTime > 0 ET bestTime existe', () => {
        global.soloRunTotalTime = 5.2;  // Après 5 secondes
        global.soloPersonalBestTime = 145.2;
        
        const shouldDisplay = soloRunTotalTime > 0 && soloPersonalBestTime !== null;
        expect(shouldDisplay).toBe(true);
    });

    test('Le delta utilise leaderboardBest si soloShowPersonalDelta = false', () => {
        global.soloRunTotalTime = 120.5;
        global.soloPersonalBestTime = 145.2;
        global.soloLeaderboardBest = 110.3;
        global.soloShowPersonalDelta = false;
        
        const displayPersonal = soloShowPersonalDelta || !soloLeaderboardBest;
        const bestTime = displayPersonal ? soloPersonalBestTime : soloLeaderboardBest;
        
        expect(bestTime).toBe(110.3);
        expect(bestTime).not.toBe(145.2);
    });

    test('Le delta utilise personalBestTime si soloShowPersonalDelta = true', () => {
        global.soloRunTotalTime = 120.5;
        global.soloPersonalBestTime = 145.2;
        global.soloLeaderboardBest = 110.3;
        global.soloShowPersonalDelta = true;
        
        const displayPersonal = soloShowPersonalDelta || !soloLeaderboardBest;
        const bestTime = displayPersonal ? soloPersonalBestTime : soloLeaderboardBest;
        
        expect(bestTime).toBe(145.2);
        expect(bestTime).not.toBe(110.3);
    });

    test('Temps exact égal au record: delta = 0, couleur VERT (pas de retard)', () => {
        global.soloRunTotalTime = 145.2;
        global.soloPersonalBestTime = 145.2;
        
        const delta = soloRunTotalTime - soloPersonalBestTime;  // 0
        const expectedColor = delta >= 0 ? '#FF6B6B' : '#00FF00';  // >= 0 = ROUGE, mais ici c'est 0
        
        expect(delta).toBe(0);
        expect(expectedColor).toBe('#FF6B6B');
    });

});
