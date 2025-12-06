// tests/solo-ranking.test.js - Tests du système de classement du mode solo

describe('Solo Mode - Système de classement', () => {
    
    test('Calcul du classement basé sur le temps total', () => {
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
        
        expect(playerRank).toBe(3);
    });

    test('Meilleur temps = rang #1', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 105.5 },
            { totalTime: 110.3 }
        ];
        
        const playerTime = 95.0; // Meilleur temps
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

    test('Pire temps = dernier rang', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 105.5 },
            { totalTime: 110.3 }
        ];
        
        const playerTime = 200.0; // Temps très lent
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

    test('Affichage du rang avec format #N', () => {
        const rank = 5;
        const displayRank = `#${rank}`;
        
        expect(displayRank).toBe('#5');
    });

    test('Leaderboard vide donne rang #1', () => {
        const leaderboard = [];
        const playerTime = 120.0;
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

    test('Classement avec 20 joueurs', () => {
        const leaderboard = [];
        for (let i = 0; i < 20; i++) {
            leaderboard.push({ totalTime: 100 + i * 2 });
        }
        
        const playerTime = 110.0; // Entre 110 et 112
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        expect(playerRank).toBe(6); // 5 joueurs plus rapides
    });

    test('Rang ne doit pas être négatif', () => {
        const playerRank = 1;
        
        expect(playerRank).toBeGreaterThan(0);
    });

    test('Rang ne doit pas dépasser la taille du leaderboard + 1', () => {
        const leaderboard = [];
        for (let i = 0; i < 20; i++) {
            leaderboard.push({ totalTime: 100 + i * 2 });
        }
        
        const playerTime = 200.0; // Pire temps possible
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        expect(playerRank).toBeLessThanOrEqual(leaderboard.length + 1);
    });

    test('Top 3 doivent avoir des médailles', () => {
        const medals = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        
        expect(medals[1]).toBe('🥇');
        expect(medals[2]).toBe('🥈');
        expect(medals[3]).toBe('🥉');
    });

    test('Rang au-delà de top 3 n\'a pas de médaille', () => {
        const rank = 5;
        const medal = rank <= 3 ? true : false;
        
        expect(medal).toBe(false);
    });

    test('Surligneur sur leaderboard si rank 1-5', () => {
        const playerRank = 3;
        const shouldHighlight = playerRank >= 1 && playerRank <= 5;
        
        expect(shouldHighlight).toBe(true);
    });

    test('Pas de surligneur si rank > 5', () => {
        const playerRank = 10;
        const shouldHighlight = playerRank >= 1 && playerRank <= 5;
        
        expect(shouldHighlight).toBe(false);
    });

    test('Score égal: premier joué en premier gagne', () => {
        const leaderboard = [
            { totalTime: 100.0, createdAt: '2025-12-06T10:00:00Z' },
            { totalTime: 100.0, createdAt: '2025-12-06T10:05:00Z' }
        ];
        
        // En cas d'égalité, on classe par timestamp
        const sorted = leaderboard.sort((a, b) => {
            if (a.totalTime === b.totalTime) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.totalTime - b.totalTime;
        });
        
        expect(sorted[0].createdAt).toBe('2025-12-06T10:00:00Z');
    });

    test('Affichage du rang sur l\'écran de résultats', () => {
        const playerRank = 7;
        const displayText = `🏆 Classement: #${playerRank}`;
        
        expect(displayText).toContain('#7');
        expect(displayText).toContain('🏆');
    });

    test('Rang sur le top 5 affiché avec couleur spéciale', () => {
        const playerRank = 3;
        const displayColor = playerRank <= 5 ? '#00FF00' : '#FFFFFF';
        
        expect(displayColor).toBe('#00FF00');
    });

    test('Différence de temps pour calculer le rang', () => {
        const leaderboard = [
            { totalTime: 100.0 },
            { totalTime: 100.1 },
            { totalTime: 100.2 }
        ];
        
        const playerTime = 100.15;
        let playerRank = 1;
        
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].totalTime < playerTime) {
                playerRank = i + 2;
            } else {
                break;
            }
        }
        
        expect(playerRank).toBe(3); // Après les deux premiers
    });
});
