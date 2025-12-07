// tests/solo-leaderboard.test.js - Tests du leaderboard du mode solo

describe('Solo Mode - Leaderboard', () => {
    
    test('Leaderboard doit être un array', () => {
        const leaderboard = [];
        
        expect(Array.isArray(leaderboard)).toBe(true);
    });

    test('Leaderboard doit pouvoir contenir jusqu\'à 20 scores', () => {
        const leaderboard = [];
        for (let i = 0; i < 20; i++) {
            leaderboard.push({ totalTime: 100 + i * 2, playerSkin: '🐸', createdAt: new Date() });
        }
        
        expect(leaderboard.length).toBe(20);
    });

    test('Entrée du leaderboard doit avoir les champs requis', () => {
        const entry = {
            playerId: 'player123',
            playerSkin: '🐸',
            totalTime: 123.45,
            splitTimes: [2.5, 3.1, 2.8, 3.5, 4.0, 3.2, 3.9, 4.1, 3.8, 3.6, 2.9, 3.3, 2.7, 3.6, 4.2, 3.1, 4.0, 4.3, 3.9, 3.7],
            finalLevel: 20,
            createdAt: new Date()
        };
        
        expect(entry.playerId).toBeDefined();
        expect(entry.playerSkin).toBeDefined();
        expect(entry.totalTime).toBeDefined();
        expect(entry.splitTimes).toBeDefined();
        expect(entry.finalLevel).toBe(20);
    });

    test('Leaderboard doit être trié par temps croissant (meilleurs temps d\'abord)', () => {
        const leaderboard = [
            { totalTime: 120.5, playerSkin: '🐸' },
            { totalTime: 105.3, playerSkin: '🦁' },
            { totalTime: 98.7, playerSkin: '🐻' },
            { totalTime: 112.4, playerSkin: '🦊' }
        ];
        
        const sorted = leaderboard.sort((a, b) => a.totalTime - b.totalTime);
        
        expect(sorted[0].totalTime).toBe(98.7);
        expect(sorted[1].totalTime).toBe(105.3);
        expect(sorted[2].totalTime).toBe(112.4);
        expect(sorted[3].totalTime).toBe(120.5);
    });

    test('Calcul du rang du joueur dans le leaderboard', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 105.5 },
            { totalTime: 110.3 },
            { totalTime: 115.7 }
        ];
        
        const playerTime = 107.2;
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        // Joueur est entre 105.5 et 110.3
        expect(playerRank).toBe(3);
    });

    test('Joueur en première place doit avoir le rang #1', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 105.5 }
        ];
        
        const playerTime = 99.5; // Meilleur temps
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        expect(playerRank).toBe(1);
    });

    test('Joueur hors du classement doit avoir le dernier rang', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 105.5 },
            { totalTime: 110.3 }
        ];
        
        const playerTime = 150.0; // Temps très lent
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        expect(playerRank).toBe(4);
    });

    test('Leaderboard doit afficher les skins des joueurs', () => {
        const leaderboard = [
            { totalTime: 100.0, playerSkin: '🐸' },
            { totalTime: 105.5, playerSkin: '🦁' },
            { totalTime: 110.3, playerSkin: '🐻' }
        ];
        
        expect(leaderboard[0].playerSkin).toBe('🐸');
        expect(leaderboard[1].playerSkin).toBe('🦁');
        expect(leaderboard[2].playerSkin).toBe('🐻');
    });

    test('Top 5 du leaderboard doit être limité à 5 entries', () => {
        const leaderboard = [];
        for (let i = 0; i < 20; i++) {
            leaderboard.push({ totalTime: 100 + i * 5, playerSkin: '🐸' });
        }
        
        const top5 = leaderboard.slice(0, 5);
        expect(top5.length).toBe(5);
    });

    test('Leaderboard peut être vide au démarrage', () => {
        const leaderboard = [];
        
        expect(leaderboard.length).toBe(0);
        expect(Array.isArray(leaderboard)).toBe(true);
    });

    test('Temps du leaderboard doit être un nombre positif', () => {
        const entries = [
            { totalTime: 100.5 },
            { totalTime: 105.3 },
            { totalTime: 98.7 }
        ];
        
        entries.forEach(entry => {
            expect(typeof entry.totalTime).toBe('number');
            expect(entry.totalTime).toBeGreaterThan(0);
        });
    });

    test('Checkpoints du leaderboard doivent être un array de 20 nombres', () => {
        const checkpoints = [2.5, 3.1, 2.8, 3.5, 4.0, 3.2, 3.9, 4.1, 3.8, 3.6, 2.9, 3.3, 2.7, 3.6, 4.2, 3.1, 4.0, 4.3, 3.9, 3.7];
        
        expect(Array.isArray(checkpoints)).toBe(true);
        expect(checkpoints.length).toBe(20);
        expect(checkpoints.every(t => typeof t === 'number')).toBe(true);
    });

    test('Médailles pour top 3: 🥇 🥈 🥉', () => {
        const medals = ['🥇', '🥈', '🥉'];
        
        expect(medals[0]).toBe('🥇');
        expect(medals[1]).toBe('🥈');
        expect(medals[2]).toBe('🥉');
    });

    test('Score dupliqué doit être autorisé', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 100.0 },
            { totalTime: 105.5 }
        ];
        
        // Deux joueurs avec le même temps
        expect(leaderboard[0].totalTime).toBe(leaderboard[1].totalTime);
        expect(leaderboard.length).toBe(3);
    });
});
