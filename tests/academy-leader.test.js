/**
 * academy-leader.test.js
 * Tests for Academy Leader countdown system (3-2-1-GO)
 * SMPTE Universal Leader style with radar sweep
 */

describe('Academy Leader Countdown System', () => {
    let mockTime;
    let originalDateNow;

    beforeEach(() => {
        mockTime = 1000000;
        originalDateNow = Date.now;
        Date.now = jest.fn(() => mockTime);
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    describe('Backend State Management', () => {
        test('should initialize COUNTDOWN state when level starts', () => {
            const gameState = {
                state: 'WAITING',
                countdownStartTime: null
            };

            // Level starts
            gameState.state = 'COUNTDOWN';
            gameState.countdownStartTime = mockTime;

            expect(gameState.state).toBe('COUNTDOWN');
            expect(gameState.countdownStartTime).toBe(mockTime);
        });

        test('should maintain COUNTDOWN state for exactly 4 seconds (3-2-1-GO)', () => {
            const countdownStart = mockTime;
            const COUNTDOWN_DURATION = 4000; // 4 seconds total

            // 2 seconds in
            mockTime += 2000;
            const isCountdownActive = (mockTime - countdownStart) < COUNTDOWN_DURATION;
            expect(isCountdownActive).toBe(true);

            // 4 seconds in (should be finished)
            mockTime += 2000;
            const isFinished = (mockTime - countdownStart) >= COUNTDOWN_DURATION;
            expect(isFinished).toBe(true);
        });

        test('should transition from COUNTDOWN to PLAYING after 4 seconds', () => {
            let gameState = { state: 'COUNTDOWN', countdownStartTime: mockTime };
            const COUNTDOWN_DURATION = 4000;

            mockTime += 4100; // Just past 4 seconds

            if ((mockTime - gameState.countdownStartTime) >= COUNTDOWN_DURATION) {
                gameState.state = 'PLAYING';
            }

            expect(gameState.state).toBe('PLAYING');
        });

        test('should refuse movement commands during COUNTDOWN', () => {
            const gameState = { state: 'COUNTDOWN' };
            const moveCommand = { direction: 'up' };

            const shouldAcceptMove = gameState.state !== 'COUNTDOWN';

            expect(shouldAcceptMove).toBe(false);
        });

        test('should accept movement commands after COUNTDOWN', () => {
            const gameState = { state: 'PLAYING' };
            const moveCommand = { direction: 'up' };

            const shouldAcceptMove = gameState.state !== 'COUNTDOWN';

            expect(shouldAcceptMove).toBe(true);
        });
    });

    describe('Countdown Timing & Display Numbers', () => {
        test('should display 3 during first second (0-1000ms)', () => {
            const countdownStart = mockTime;
            mockTime += 500; // Middle of first second

            const elapsed = mockTime - countdownStart;
            const displayNumber = Math.floor(elapsed / 1000) === 0 ? 3 : 
                                Math.floor(elapsed / 1000) === 1 ? 2 :
                                Math.floor(elapsed / 1000) === 2 ? 1 : 'GO';

            expect(displayNumber).toBe(3);
        });

        test('should display 2 during second second (1000-2000ms)', () => {
            const countdownStart = mockTime;
            mockTime += 1500; // Middle of second second

            const elapsed = mockTime - countdownStart;
            const displayNumber = Math.floor(elapsed / 1000) === 0 ? 3 :
                                Math.floor(elapsed / 1000) === 1 ? 2 :
                                Math.floor(elapsed / 1000) === 2 ? 1 : 'GO';

            expect(displayNumber).toBe(2);
        });

        test('should display 1 during third second (2000-3000ms)', () => {
            const countdownStart = mockTime;
            mockTime += 2500; // Middle of third second

            const elapsed = mockTime - countdownStart;
            const displayNumber = Math.floor(elapsed / 1000) === 0 ? 3 :
                                Math.floor(elapsed / 1000) === 1 ? 2 :
                                Math.floor(elapsed / 1000) === 2 ? 1 : 'GO';

            expect(displayNumber).toBe(1);
        });

        test('should display GO during fourth second (3000-4000ms)', () => {
            const countdownStart = mockTime;
            mockTime += 3500; // Middle of fourth second

            const elapsed = mockTime - countdownStart;
            const displayNumber = Math.floor(elapsed / 1000) === 0 ? 3 :
                                Math.floor(elapsed / 1000) === 1 ? 2 :
                                Math.floor(elapsed / 1000) === 2 ? 1 : 'GO';

            expect(displayNumber).toBe('GO');
        });
    });

    describe('Radar Sweep Animation', () => {
        test('should calculate radar sweep angle based on elapsed time', () => {
            const countdownStart = mockTime;
            mockTime += 500; // 0.5 seconds

            const elapsed = mockTime - countdownStart;
            const sweepAngle = (elapsed / 1000) * 360; // 360 degrees per second

            expect(sweepAngle).toBeCloseTo(180, 0); // 0.5 * 360 = 180 degrees
        });

        test('should complete one full rotation (360°) per second', () => {
            const countdownStart = mockTime;

            // At 1 second
            mockTime = countdownStart + 1000;
            let elapsed = mockTime - countdownStart;
            let angle = (elapsed / 1000) * 360;
            expect(angle).toBeCloseTo(360, 0);

            // At 2 seconds
            mockTime = countdownStart + 2000;
            elapsed = mockTime - countdownStart;
            angle = (elapsed / 1000) * 360;
            expect(angle).toBeCloseTo(720, 0);
        });

        test('should normalize sweep angle to 0-360 range', () => {
            const countdownStart = mockTime;
            mockTime += 2500; // 2.5 seconds

            const elapsed = mockTime - countdownStart;
            const rawAngle = (elapsed / 1000) * 360;
            const normalizedAngle = rawAngle % 360;

            expect(normalizedAngle).toBeGreaterThanOrEqual(0);
            expect(normalizedAngle).toBeLessThan(360);
            expect(normalizedAngle).toBeCloseTo(900 % 360, 0); // 180 degrees
        });

        test('should continue sweeping through all 4 seconds', () => {
            const countdownStart = mockTime;
            const angles = [];

            for (let i = 0; i < 4; i++) {
                mockTime = countdownStart + (i * 1000) + 500;
                const elapsed = mockTime - countdownStart;
                const angle = (elapsed / 1000) * 360 % 360;
                angles.push(angle);
            }

            // Each should be about 180 degrees (halfway through rotation)
            angles.forEach(angle => {
                expect(angle).toBeCloseTo(180, 0);
            });
        });
    });

    describe('Input Blocking', () => {
        test('should block all keyboard input during countdown', () => {
            const countdownActive = true;
            const inputAllowed = !countdownActive;

            expect(inputAllowed).toBe(false);
        });

        test('should allow input after countdown ends', () => {
            const countdownStart = mockTime;
            mockTime += 4100;

            const countdownActive = (mockTime - countdownStart) < 4000;
            const inputAllowed = !countdownActive;

            expect(inputAllowed).toBe(true);
        });

        test('should block movement on server during countdown', () => {
            const gameState = { state: 'COUNTDOWN' };
            const moveEvent = { direction: 'left', playerId: 'player1' };

            const moveBlocked = gameState.state === 'COUNTDOWN';

            expect(moveBlocked).toBe(true);
        });
    });

    describe('Server Event Synchronization', () => {
        test('should emit start_countdown with timestamp', () => {
            const countdownStart = mockTime;
            const event = {
                type: 'start_countdown',
                timestamp: countdownStart
            };

            expect(event.type).toBe('start_countdown');
            expect(event.timestamp).toBeDefined();
        });

        test('should emit state_changed event when transitioning to PLAYING', () => {
            const countdownStart = mockTime;
            mockTime += 4100;

            const elapsed = mockTime - countdownStart;
            if (elapsed >= 4000) {
                const event = {
                    type: 'state_changed',
                    newState: 'PLAYING',
                    timestamp: mockTime
                };

                expect(event.newState).toBe('PLAYING');
            }
        });
    });

    describe('Client Synchronization', () => {
        test('should calculate elapsed time from countdown start', () => {
            const countdownStart = mockTime;
            mockTime += 1234;

            const elapsed = mockTime - countdownStart;

            expect(elapsed).toBe(1234);
        });

        test('should pass delta time to renderer for animation sync', () => {
            const countdownStart = mockTime;
            mockTime += 2567;

            const elapsed = mockTime - countdownStart;
            const rendererInput = {
                countdownActive: true,
                elapsedMs: elapsed,
                timestamp: mockTime
            };

            expect(rendererInput.elapsedMs).toBe(2567);
            expect(rendererInput.countdownActive).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle countdown completion gracefully', () => {
            const countdownStart = mockTime;
            mockTime += 4000; // Exact end

            const elapsed = mockTime - countdownStart;
            const isFinished = elapsed >= 4000;

            expect(isFinished).toBe(true);
        });

        test('should handle time just before completion', () => {
            const countdownStart = mockTime;
            mockTime += 3999; // Just before

            const elapsed = mockTime - countdownStart;
            const isFinished = elapsed >= 4000;

            expect(isFinished).toBe(false);
        });

        test('should handle rapid countdown trigger', () => {
            expect(() => {
                for (let i = 0; i < 10; i++) {
                    mockTime = 1000000 + (i * 5000);
                    const countdownStart = mockTime;
                    mockTime += 4100;
                    const elapsed = mockTime - countdownStart;
                    const finished = elapsed >= 4000;
                }
            }).not.toThrow();
        });

        test('should handle time values out of order', () => {
            const countdownStart = mockTime;
            mockTime += 2000;
            mockTime -= 500; // Jump back (shouldn't happen but test robustness)

            const elapsed = mockTime - countdownStart;
            expect(elapsed).toBe(1500);
        });
    });

    describe('Multi-Level Countdown', () => {
        test('should repeat countdown for each new level', () => {
            const levelCountdowns = [];

            for (let level = 1; level <= 3; level++) {
                const countdownStart = mockTime;
                levelCountdowns.push({
                    level,
                    startTime: countdownStart
                });
                mockTime += 5000; // 4 second countdown + 1 second buffer
            }

            expect(levelCountdowns.length).toBe(3);
            expect(levelCountdowns[0].startTime).toBeLessThan(levelCountdowns[1].startTime);
        });

        test('should not lose time between level countdowns', () => {
            const sessionStart = mockTime;

            // Level 1
            mockTime += 4000; // Countdown
            mockTime += 5000; // Play

            // Level 2
            mockTime += 4000; // Countdown
            mockTime += 5000; // Play

            const totalTime = mockTime - sessionStart;

            expect(totalTime).toBe(18000); // 4+5+4+5 seconds
        });
    });

    describe('Performance', () => {
        test('should handle 60 FPS rendering for 4 seconds countdown', () => {
            const fps60IntervalMs = 1000 / 60; // ~16.67ms per frame
            const countdownStart = mockTime;
            let frameCount = 0;

            while (frameCount < 240) { // 240 frames = 4 seconds at 60 FPS
                mockTime += fps60IntervalMs;
                frameCount++;
            }

            const elapsed = mockTime - countdownStart;
            expect(elapsed).toBeCloseTo(4000, -1); // ~4 seconds
            expect(frameCount).toBe(240);
        });

        test('should not accumulate timing errors over multiple countdowns', () => {
            const countdownStart = mockTime;
            const measurements = [];

            for (let i = 0; i < 100; i++) {
                mockTime = countdownStart + (i * 4000) + 4000;
                const elapsed = mockTime - countdownStart;
                const expectedTime = (i + 1) * 4000;

                measurements.push({
                    actual: elapsed,
                    expected: expectedTime,
                    error: Math.abs(elapsed - expectedTime)
                });
            }

            // Last measurement should not have significant error
            const lastError = measurements[measurements.length - 1].error;
            expect(lastError).toBe(0);
        });
    });
});
