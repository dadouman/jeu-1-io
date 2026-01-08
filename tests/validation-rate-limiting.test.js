// tests/validation-rate-limiting.test.js
// Tests pour la validation JSON Schema et le rate limiting

const { validateSocketData } = require('../server/validation/validator');
const { RateLimiter } = require('../server/validation/rate-limiter');

describe('JSON Schema Validation', () => {
    describe('selectGameMode validation', () => {
        test('should accept valid game mode', () => {
            const result = validateSocketData({ mode: 'solo' }, 'selectGameMode');
            expect(result.valid).toBe(true);
        });

        test('should reject invalid game mode', () => {
            const result = validateSocketData({ mode: 'invalid' }, 'selectGameMode');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should reject missing required mode', () => {
            const result = validateSocketData({}, 'selectGameMode');
            expect(result.valid).toBe(false);
        });

        test('should reject additional properties', () => {
            const result = validateSocketData({ mode: 'solo', extra: 'field' }, 'selectGameMode');
            expect(result.valid).toBe(false);
        });
    });

    describe('movement validation', () => {
        test('should accept valid movement input', () => {
            const result = validateSocketData({ left: true, right: false, up: true, down: false }, 'movement');
            expect(result.valid).toBe(true);
        });

        test('should accept partial movement input', () => {
            const result = validateSocketData({ left: true }, 'movement');
            expect(result.valid).toBe(true);
        });

        test('should reject non-boolean values', () => {
            const result = validateSocketData({ left: 'true' }, 'movement');
            expect(result.valid).toBe(false);
        });

        test('should reject additional properties', () => {
            const result = validateSocketData({ left: true, extra: 'field' }, 'movement');
            expect(result.valid).toBe(false);
        });
    });

    describe('shopPurchase validation', () => {
        test('should accept valid item purchase', () => {
            const result = validateSocketData({ itemId: 'dash' }, 'shopPurchase');
            expect(result.valid).toBe(true);
        });

        test('should reject empty itemId', () => {
            const result = validateSocketData({ itemId: '' }, 'shopPurchase');
            expect(result.valid).toBe(false);
        });

        test('should reject missing itemId', () => {
            const result = validateSocketData({}, 'shopPurchase');
            expect(result.valid).toBe(false);
        });

        test('should reject very long itemId', () => {
            const result = validateSocketData({ itemId: 'x'.repeat(100) }, 'shopPurchase');
            expect(result.valid).toBe(false);
        });
    });

    describe('saveSoloResults validation', () => {
        test('should accept valid solo results', () => {
            const result = validateSocketData({
                totalTime: 120,
                splitTimes: [10, 15, 20],
                playerSkin: 'Player1',
                mode: 'solo',
                finalLevel: 10
            }, 'saveSoloResults');
            expect(result.valid).toBe(true);
        });

        test('should reject negative totalTime', () => {
            const result = validateSocketData({
                totalTime: -10,
                splitTimes: [],
                playerSkin: 'Player1',
                mode: 'solo',
                finalLevel: 10
            }, 'saveSoloResults');
            expect(result.valid).toBe(false);
        });

        test('should reject split time below minimum (< 0.5s)', () => {
            const result = validateSocketData({
                totalTime: 120,
                splitTimes: [0.2, 15, 20], // 0.2 < 0.5
                playerSkin: 'Player1',
                mode: 'solo',
                finalLevel: 10
            }, 'saveSoloResults');
            expect(result.valid).toBe(false);
        });

        test('should reject too many split times', () => {
            const result = validateSocketData({
                totalTime: 120,
                splitTimes: Array(25).fill(5), // More than maxItems: 20
                playerSkin: 'Player1',
                mode: 'solo',
                finalLevel: 10
            }, 'saveSoloResults');
            expect(result.valid).toBe(false);
        });

        test('should reject finalLevel exceeding maximum', () => {
            const result = validateSocketData({
                totalTime: 120,
                splitTimes: [],
                playerSkin: 'Player1',
                mode: 'solo',
                finalLevel: 25 // > 20
            }, 'saveSoloResults');
            expect(result.valid).toBe(false);
        });
    });

    describe('voteRestart validation', () => {
        test('should accept valid vote', () => {
            const result = validateSocketData({ vote: true }, 'voteRestart');
            expect(result.valid).toBe(true);
        });

        test('should accept false vote', () => {
            const result = validateSocketData({ vote: false }, 'voteRestart');
            expect(result.valid).toBe(true);
        });

        test('should reject non-boolean vote', () => {
            const result = validateSocketData({ vote: 'true' }, 'voteRestart');
            expect(result.valid).toBe(false);
        });
    });
});

describe('Rate Limiting', () => {
    let limiter;

    beforeEach(() => {
        limiter = new RateLimiter();
    });

    describe('Basic rate limiting', () => {
        test('should allow initial request', () => {
            const result = limiter.checkLimit('player1', 'movement');
            expect(result.allowed).toBe(true);
        });

        test('should allow requests within limit', () => {
            for (let i = 0; i < 30; i++) {
                const result = limiter.checkLimit('player1', 'movement');
                expect(result.allowed).toBe(true);
            }
        });

        test('should block requests exceeding limit', () => {
            // Max 60 movement per second
            for (let i = 0; i < 60; i++) {
                limiter.checkLimit('player1', 'movement');
            }

            const result = limiter.checkLimit('player1', 'movement');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Rate limit exceeded');
        });

        test('should reset after time window expires', (done) => {
            // Fill up the limit
            for (let i = 0; i < 60; i++) {
                limiter.checkLimit('player1', 'movement');
            }

            // Should be blocked
            let result = limiter.checkLimit('player1', 'movement');
            expect(result.allowed).toBe(false);

            // Wait for window to expire (movement is 1000ms window)
            setTimeout(() => {
                result = limiter.checkLimit('player1', 'movement');
                expect(result.allowed).toBe(true);
                done();
            }, 1100);
        });
    });

    describe('Different limits per event', () => {
        test('movement should have higher limit than shop', () => {
            const movementLimit = limiter.limits['movement'];
            const shopLimit = limiter.limits['shopPurchase'];

            expect(movementLimit.maxReq).toBeGreaterThan(shopLimit.maxReq);
        });

        test('different events should have independent counters', () => {
            // Fill movement limit
            for (let i = 0; i < 60; i++) {
                limiter.checkLimit('player1', 'movement');
            }

            // shopPurchase should still work (different counter)
            const result = limiter.checkLimit('player1', 'shopPurchase');
            expect(result.allowed).toBe(true);
        });
    });

    describe('Per-player isolation', () => {
        test('different players should have independent limits', () => {
            // Fill player1's movement limit
            for (let i = 0; i < 60; i++) {
                limiter.checkLimit('player1', 'movement');
            }

            // player2 should still be able to move
            for (let i = 0; i < 30; i++) {
                const result = limiter.checkLimit('player2', 'movement');
                expect(result.allowed).toBe(true);
            }
        });
    });

    describe('Cleanup', () => {
        test('should clean up idle players', () => {
            limiter.checkLimit('player1', 'movement');
            expect(Object.keys(limiter.limiters)).toContain('player1');

            limiter.resetPlayer('player1');
            expect(Object.keys(limiter.limiters)).not.toContain('player1');
        });
    });

    describe('Return information', () => {
        test('should return reset time when blocked', () => {
            // Fill up the limit
            for (let i = 0; i < 60; i++) {
                limiter.checkLimit('player1', 'movement');
            }

            const result = limiter.checkLimit('player1', 'movement');
            expect(result.resetIn).toBeGreaterThan(0);
            expect(result.resetIn).toBeLessThanOrEqual(1000);
        });
    });
});

describe('Anti-Cheat Scenarios', () => {
    let limiter;

    beforeEach(() => {
        limiter = new RateLimiter();
    });

    test('should detect spam movement (bot)', () => {
        // Bot trying to spam 200 movements/sec
        const movements = Array(200).fill(null);
        const blocked = movements.filter((_) => {
            const result = limiter.checkLimit('bot', 'movement');
            return !result.allowed;
        });

        expect(blocked.length).toBeGreaterThan(0);
    });

    test('should detect rapid shop purchases (duping attempt)', () => {
        const purchases = Array(20).fill(null);
        const blocked = purchases.filter((_) => {
            const result = limiter.checkLimit('cheater', 'shopPurchase');
            return !result.allowed;
        });

        expect(blocked.length).toBeGreaterThan(0);
    });

    test('should detect rapid mode switching', () => {
        const switches = Array(10).fill(null);
        const blocked = switches.filter((_) => {
            const result = limiter.checkLimit('switcher', 'selectGameMode');
            return !result.allowed;
        });

        expect(blocked.length).toBeGreaterThan(0);
    });

    test('validation should catch tampered stats', () => {
        // Attacker tries to claim impossible run time
        const result = validateSocketData({
            totalTime: -100, // Negative time!
            splitTimes: [0.1], // Below minimum
            playerSkin: 'x'.repeat(100), // Too long
            mode: 'solo',
            finalLevel: 50 // Above maximum
        }, 'saveSoloResults');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
});
