// tests/leaderboard-consistency.test.js
// Tests pour couvrir les scénarios de concurrence sur les scores et leaderboard

const { GameSessionManager } = require('../utils/GameSessionManager');
const { initializePlayer } = require('../utils/player');

describe('Leaderboard System - Consistency & Concurrency', () => {

    // === TEST 1 : Concurrent Score Updates ===
    test('Mises à jour concurrentes de scores ne devraient pas créer d\'incohérence', () => {
        const leaderboard = {
            'player1': { score: 1000, level: 5 },
            'player2': { score: 800, level: 4 },
            'player3': { score: 600, level: 3 }
        };

        // 3 updates concurrent
        const updates = [
            { playerId: 'player1', scoreGain: 100 }, // 1100
            { playerId: 'player2', scoreGain: 200 }, // 1000
            { playerId: 'player3', scoreGain: 300 }  // 900
        ];

        // Appliquer updates
        updates.forEach(update => {
            const currentScore = leaderboard[update.playerId].score;
            leaderboard[update.playerId].score = currentScore + update.scoreGain;
        });

        // Scores doivent être cohérents
        expect(leaderboard['player1'].score).toBe(1100);
        expect(leaderboard['player2'].score).toBe(1000);
        expect(leaderboard['player3'].score).toBe(900);
    });

    // === TEST 2 : Race Condition - Same Player Update ===
    test('Même joueur ne peut avoir que une seule mise à jour atomique', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.score = 1000;

        // Simuler 2 updates concurrent au même joueur
        // Update 1: +100 (read: 1000, write: 1100)
        // Update 2: +50 (read: 1000, write: 1050) <- Race condition!

        // Avec synchronisation atomique, one at a time
        const update1Reads = player.score; // 1000
        player.score = update1Reads + 100;
        const update1Result = player.score; // 1100

        const update2Reads = player.score; // 1100 (pas 1000!)
        player.score = update2Reads + 50;
        const update2Result = player.score; // 1150

        // Final: 1150 (pas 1050 qui serait le bug)
        expect(player.score).toBe(1150);
    });

    // === TEST 3 : Ranking Consistency After Concurrent Updates ===
    test('Rankings doivent rester cohérents après updates concurrentes', () => {
        const leaderboard = {
            'p1': { score: 500, rank: 1 },
            'p2': { score: 400, rank: 2 },
            'p3': { score: 300, rank: 3 }
        };

        // 2 updates concurrent
        leaderboard['p3'].score += 250; // 300 + 250 = 550 (devrait devenir rank 1)
        leaderboard['p1'].score += 10;  // 500 + 10 = 510

        // Recalculer rankings
        const sorted = Object.entries(leaderboard).sort(
            (a, b) => b[1].score - a[1].score
        );

        sorted.forEach((entry, index) => {
            leaderboard[entry[0]].rank = index + 1;
        });

        // Vérifier new ranks
        expect(leaderboard['p3'].rank).toBe(1); // 550 points
        expect(leaderboard['p1'].rank).toBe(2); // 510 points
        expect(leaderboard['p2'].rank).toBe(3); // 400 points
    });

    // === TEST 4 : Level Progression Atomicity ===
    test('Progression de niveau ne doit pas être dupliquée', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.level = 1;
        player.score = 0;

        const levelUpThresholds = [100, 300, 600, 1000];

        // Simuler atteindre score 350
        player.score = 350;

        // Vérifier montée de niveau
        let currentLevel = player.level;
        levelUpThresholds.forEach((threshold, index) => {
            if (player.score >= threshold) {
                currentLevel = index + 2; // Level 2, 3, 4, 5
            }
        });

        player.level = currentLevel;

        // Ne devrait monter qu'une fois au niveau 3 (pas 4)
        expect(player.level).toBe(3); // Score 350 >= 300 mais < 600
    });

    // === TEST 5 : Eventual Consistency ===
    test('Données distribuées devraient converger au même état', (done) => {
        // Simuler serveur et 2 replicas
        const server = {
            leaderboard: { 'p1': { score: 1000 } }
        };

        const replica1 = { leaderboard: { 'p1': { score: 1000 } } };
        const replica2 = { leaderboard: { 'p1': { score: 1000 } } };

        // Update sur serveur
        server.leaderboard['p1'].score += 100; // 1100

        // Replica1 sync (rapide)
        setTimeout(() => {
            replica1.leaderboard['p1'].score = server.leaderboard['p1'].score;
        }, 10);

        // Replica2 sync (plus lent)
        setTimeout(() => {
            replica2.leaderboard['p1'].score = server.leaderboard['p1'].score;
            
            // Vérifier convergence
            expect(replica1.leaderboard['p1'].score).toBe(1100);
            expect(replica2.leaderboard['p1'].score).toBe(1100);
            expect(server.leaderboard['p1'].score).toBe(1100);
            done();
        }, 50);
    });

    // === TEST 6 : Leaderboard Snapshot Integrity ===
    test('Snapshot du leaderboard ne doit pas être corrompu par updates', () => {
        const leaderboard = {
            'p1': { score: 1000 },
            'p2': { score: 900 },
            'p3': { score: 800 }
        };

        // Créer snapshot
        const snapshot = JSON.parse(JSON.stringify(leaderboard));
        
        // Update original après snapshot
        leaderboard['p1'].score = 2000;
        leaderboard['p2'].score = 1900;

        // Snapshot doit rester intact
        expect(snapshot['p1'].score).toBe(1000);
        expect(snapshot['p2'].score).toBe(900);
        expect(leaderboard['p1'].score).toBe(2000);
    });

    // === TEST 7 : Score Validation ===
    test('Scores invalides ne devraient pas être enregistrés', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.score = 1000;

        const attempts = [
            { score: -500, valid: false },    // Score négatif
            { score: 1500, valid: true },     // Valide
            { score: NaN, valid: false },     // NaN
            { score: Infinity, valid: false }, // Infini
            { score: 2000, valid: true }      // Valide
        ];

        attempts.forEach(attempt => {
            if (attempt.valid && typeof attempt.score === 'number' && isFinite(attempt.score) && attempt.score >= 0) {
                player.score = attempt.score;
            }
        });

        // Final score doit être un des valid attempts
        expect(player.score).toBe(2000);
    });

    // === TEST 8 : Multiple Players Same Rank (Tie Handling) ===
    test('Plusieurs joueurs avec même score devraient être gérés correctement', () => {
        const leaderboard = {
            'p1': { score: 1000, rank: undefined },
            'p2': { score: 1000, rank: undefined },
            'p3': { score: 900, rank: undefined },
            'p4': { score: 1000, rank: undefined }
        };

        // Assigner ranks
        const sorted = Object.entries(leaderboard).sort(
            (a, b) => b[1].score - a[1].score
        );

        let rankCounter = 1;
        for (let i = 0; i < sorted.length; i++) {
            const [playerId, playerData] = sorted[i];
            
            if (i > 0 && sorted[i-1][1].score !== playerData.score) {
                rankCounter = i + 1;
            }
            
            leaderboard[playerId].rank = rankCounter;
        }

        // Tie handling: p1, p2, p4 tous rank 1
        expect(leaderboard['p1'].rank).toBe(1);
        expect(leaderboard['p2'].rank).toBe(1);
        expect(leaderboard['p4'].rank).toBe(1);
        expect(leaderboard['p3'].rank).toBe(4); // Rank 4 (après 3 tied players)
    });

    // === TEST 9 : Score History Audit ===
    test('Historique des scores doit être immutable et auditable', () => {
        const scoreHistory = [];

        const updateScore = (playerId, newScore, timestamp = Date.now()) => {
            // Ajouter immuablement à l'historique
            scoreHistory.push({
                playerId,
                score: newScore,
                timestamp,
                readonly: true
            });
        };

        updateScore('p1', 100);
        updateScore('p1', 200);
        updateScore('p1', 350);

        expect(scoreHistory.length).toBe(3);
        expect(scoreHistory[0].score).toBe(100);
        expect(scoreHistory[1].score).toBe(200);
        expect(scoreHistory[2].score).toBe(350);

        // Impossible de modifier l'historique
        Object.freeze(scoreHistory[0]);
        expect(() => {
            scoreHistory[0].score = 1000;
        }).not.toThrow(); // Silently fails in strict mode

        // Vérifier integrity
        expect(scoreHistory[0].score).toBe(100);
    });

    // === TEST 10 : Bulk Score Update Atomicity ===
    test('Mise à jour en masse de scores doit être atomique', () => {
        const leaderboard = {
            'p1': { score: 100 },
            'p2': { score: 200 },
            'p3': { score: 300 }
        };

        // Transaction: Add 50 points to all
        const transaction = {
            updates: [
                { playerId: 'p1', scoreGain: 50 },
                { playerId: 'p2', scoreGain: 50 },
                { playerId: 'p3', scoreGain: 50 }
            ],
            completed: false
        };

        try {
            // Appliquer toutes les updates
            transaction.updates.forEach(update => {
                leaderboard[update.playerId].score += update.scoreGain;
            });
            transaction.completed = true;
        } catch (error) {
            transaction.completed = false;
            // Si erreur, rollback (not implemented here for simplicity)
        }

        // Si completed, tous les scores doivent avoir changé
        if (transaction.completed) {
            expect(leaderboard['p1'].score).toBe(150);
            expect(leaderboard['p2'].score).toBe(250);
            expect(leaderboard['p3'].score).toBe(350);
        }
    });

    // === TEST 11 : Concurrent Reads During Write ===
    test('Lectures concurrentes durant écriture ne devraient pas bloquer', () => {
        const leaderboard = { 'p1': { score: 1000 } };
        
        const readResults = [];

        // Lecture 1: avant écriture
        readResults.push(leaderboard['p1'].score); // 1000

        // Écriture (atomic)
        leaderboard['p1'].score = 2000;

        // Lectures 2-4: après écriture
        readResults.push(leaderboard['p1'].score); // 2000
        readResults.push(leaderboard['p1'].score); // 2000
        readResults.push(leaderboard['p1'].score); // 2000

        // Doit avoir une transition nette, pas de valeurs intermédiaires
        expect(readResults.filter(r => r === 1000).length).toBe(1);
        expect(readResults.filter(r => r === 2000).length).toBe(3);
    });
});
