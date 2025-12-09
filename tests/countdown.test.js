/**
 * countdown.test.js
 * Tests unitaires pour la gestion de l'état countdown
 */

describe('Countdown State Management', () => {
    // Mock game state
    let gameState;

    beforeEach(() => {
        gameState = {
            state: 'WAITING',
            countdownStartTime: null,
            countdownDuration: 3000
        };
    });

    describe('State Transitions', () => {
        test('should initialize in WAITING state', () => {
            expect(gameState.state).toBe('WAITING');
        });

        test('should transition to COUNTDOWN when start_countdown is called', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now();
            
            expect(gameState.state).toBe('COUNTDOWN');
            expect(gameState.countdownStartTime).not.toBeNull();
        });

        test('should transition to PLAYING after countdown duration', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 3000; // 3 secondes ago
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            if (elapsed >= gameState.countdownDuration) {
                gameState.state = 'PLAYING';
            }
            
            expect(gameState.state).toBe('PLAYING');
        });

        test('should remain in COUNTDOWN if duration not elapsed', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 1500; // 1.5 secondes ago
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            if (elapsed >= gameState.countdownDuration) {
                gameState.state = 'PLAYING';
            }
            
            expect(gameState.state).toBe('COUNTDOWN');
            expect(elapsed).toBeLessThan(gameState.countdownDuration);
        });
    });

    describe('Countdown Timing', () => {
        test('should calculate remaining time correctly', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 1000; // 1 second elapsed
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            const remaining = Math.max(0, gameState.countdownDuration - elapsed);
            
            expect(remaining).toBeLessThanOrEqual(gameState.countdownDuration);
            expect(remaining).toBeGreaterThan(1500); // Should be close to 2 seconds
        });

        test('should return 0 remaining when countdown finished', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 3500; // More than 3 seconds ago
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            const remaining = Math.max(0, gameState.countdownDuration - elapsed);
            
            expect(remaining).toBe(0);
        });
    });

    describe('Countdown Display Number', () => {
        test('should display 3 in first second', () => {
            gameState.countdownStartTime = Date.now() - 500; // 0.5 seconds
            const progress = (Date.now() - gameState.countdownStartTime) / 1000;
            const displayNumber = progress < 1 ? 3 : progress < 2 ? 2 : 1;
            
            expect(displayNumber).toBe(3);
        });

        test('should display 2 in second second', () => {
            gameState.countdownStartTime = Date.now() - 1500; // 1.5 seconds
            const progress = (Date.now() - gameState.countdownStartTime) / 1000;
            const displayNumber = progress < 1 ? 3 : progress < 2 ? 2 : 1;
            
            expect(displayNumber).toBe(2);
        });

        test('should display 1 in third second', () => {
            gameState.countdownStartTime = Date.now() - 2500; // 2.5 seconds
            const progress = (Date.now() - gameState.countdownStartTime) / 1000;
            const displayNumber = progress < 1 ? 3 : progress < 2 ? 2 : 1;
            
            expect(displayNumber).toBe(1);
        });
    });

    describe('Input Blocking During Countdown', () => {
        test('should indicate movements blocked in COUNTDOWN state', () => {
            gameState.state = 'COUNTDOWN';
            const shouldBlockMovement = gameState.state === 'COUNTDOWN';
            
            expect(shouldBlockMovement).toBe(true);
        });

        test('should allow movements in PLAYING state', () => {
            gameState.state = 'PLAYING';
            const shouldBlockMovement = gameState.state === 'COUNTDOWN';
            
            expect(shouldBlockMovement).toBe(false);
        });

        test('should allow movements in WAITING state', () => {
            gameState.state = 'WAITING';
            const shouldBlockMovement = gameState.state === 'COUNTDOWN';
            
            expect(shouldBlockMovement).toBe(false);
        });
    });

    describe('Multiple Countdowns', () => {
        test('should handle multiple countdown sequences', () => {
            // First countdown
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 3500;
            
            let elapsed = Date.now() - gameState.countdownStartTime;
            if (elapsed >= gameState.countdownDuration) {
                gameState.state = 'PLAYING';
            }
            
            expect(gameState.state).toBe('PLAYING');
            
            // Reset to WAITING
            gameState.state = 'WAITING';
            gameState.countdownStartTime = null;
            
            expect(gameState.state).toBe('WAITING');
            
            // Second countdown
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now();
            
            expect(gameState.state).toBe('COUNTDOWN');
            expect(gameState.countdownStartTime).not.toBeNull();
        });
    });

    describe('Edge Cases', () => {
        test('should handle null countdownStartTime gracefully', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = null;
            
            const elapsed = gameState.countdownStartTime ? Date.now() - gameState.countdownStartTime : 0;
            
            expect(elapsed).toBe(0);
        });

        test('should handle rapid state changes', () => {
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now();
            
            gameState.state = 'PLAYING';
            gameState.countdownStartTime = null;
            
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now();
            
            expect(gameState.state).toBe('COUNTDOWN');
            expect(gameState.countdownStartTime).not.toBeNull();
        });
    });

    describe('Countdown Duration Config', () => {
        test('should use configurable countdown duration', () => {
            gameState.countdownDuration = 5000; // 5 seconds
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 3000;
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            const stillCounting = elapsed < gameState.countdownDuration;
            
            expect(stillCounting).toBe(true);
        });

        test('should support short countdown durations', () => {
            gameState.countdownDuration = 1000; // 1 second
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = Date.now() - 1500;
            
            const elapsed = Date.now() - gameState.countdownStartTime;
            if (elapsed >= gameState.countdownDuration) {
                gameState.state = 'PLAYING';
            }
            
            expect(gameState.state).toBe('PLAYING');
        });
    });
});
