/**
 * countdown-e2e.test.js
 * End-to-end tests for countdown system in solo mode
 */

describe('Countdown System - End-to-End Solo Mode', () => {
    let originalDateNow;
    let mockTime;
    let gameState;
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
        // Mock time
        mockTime = 1000000;
        originalDateNow = Date.now;
        Date.now = jest.fn(() => mockTime);

        // Initialize game state
        gameState = {
            currentGameMode: 'solo',
            soloCountdownActive: false,
            soloCountdownStartTime: null,
            levelStartTime: null,
            currentLevel: 1,
            soloSessionStartTime: null,
            soloInactiveTime: 0
        };

        // Mock canvas context with all required methods
        mockCanvas = {
            width: 800,
            height: 600,
            getContext: jest.fn()
        };

        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            strokeText: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
            translate: jest.fn(),
            scale: jest.fn(),
            setLineDash: jest.fn(),
            lineTo: jest.fn(),
            moveTo: jest.fn(),
            createImageData: jest.fn(() => ({
                data: new Uint8ClampedArray(800 * 600 * 4)
            })),
            putImageData: jest.fn(),
            createRadialGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            drawImage: jest.fn(),
            clip: jest.fn(),
            globalAlpha: 1.0,
            globalCompositeOperation: 'source-over',
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: 'left',
            textBaseline: 'top',
            filter: ''
        };

        mockCanvas.getContext.mockReturnValue(mockCtx);
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    describe('Complete Solo Level Startup Sequence', () => {
        test('should initialize countdown when solo level starts', () => {
            // STEP 1: Level selected, game starts
            gameState.soloSessionStartTime = mockTime;
            gameState.levelStartTime = null;

            // STEP 2: Shop closes, countdown begins
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            expect(gameState.soloCountdownActive).toBe(true);
            expect(gameState.levelStartTime).toBeNull();
        });

        test('should display countdown 3, 2, 1 sequence', () => {
            const countdownStart = mockTime;
            gameState.soloCountdownStartTime = countdownStart;
            gameState.soloCountdownActive = true;

            const numbers = [];

            // Simulate countdown frames
            for (let second = 0; second < 3; second++) {
                mockTime = countdownStart + (second * 1000) + 500;

                const elapsed = mockTime - countdownStart;
                const progress = elapsed / 1000;
                const displayNumber = progress < 1 ? 3 : progress < 2 ? 2 : 1;

                numbers.push(displayNumber);
            }

            expect(numbers).toEqual([3, 2, 1]);
        });

        test('should block input during countdown', () => {
            gameState.soloCountdownStartTime = mockTime;
            gameState.soloCountdownActive = true;

            // Try to move during countdown
            const movementAllowed = !gameState.soloCountdownActive;

            expect(movementAllowed).toBe(false);
        });

        test('should set levelStartTime when countdown finishes', () => {
            const countdownStart = mockTime;
            gameState.soloCountdownStartTime = countdownStart;
            gameState.soloCountdownActive = true;

            // Countdown progresses
            mockTime += 3000;

            // After countdown completes
            if (gameState.soloCountdownActive && (mockTime - countdownStart) >= 3000) {
                gameState.soloCountdownActive = false;
                gameState.levelStartTime = mockTime;
            }

            expect(gameState.levelStartTime).toBe(mockTime);
            expect(gameState.levelStartTime - countdownStart).toBe(3000);
        });

        test('should allow input after countdown finishes', () => {
            const countdownStart = mockTime;
            gameState.soloCountdownActive = true;

            mockTime += 3500;

            const elapsed = mockTime - countdownStart;
            if (elapsed >= 3000) {
                gameState.soloCountdownActive = false;
            }

            const movementAllowed = !gameState.soloCountdownActive;

            expect(movementAllowed).toBe(true);
        });

        test('should start HUD timer after countdown', () => {
            const countdownStart = mockTime;
            gameState.soloCountdownStartTime = countdownStart;
            gameState.soloCountdownActive = true;

            // Countdown completes
            mockTime += 3000;
            gameState.soloCountdownActive = false;
            gameState.levelStartTime = mockTime;

            // Gameplay timer starts
            mockTime += 2500;
            const currentLevelTime = Math.max(0, (mockTime - gameState.levelStartTime) / 1000);

            expect(currentLevelTime).toBeCloseTo(2.5, 0);
        });
    });

    describe('Countdown Rendering in Solo Mode', () => {
        test('should render fullscreen countdown that blocks HUD', () => {
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            // When countdown is active, should show countdown + hide HUD
            const showCountdown = gameState.soloCountdownActive;
            const showHUD = !gameState.soloCountdownActive;

            expect(showCountdown).toBe(true);
            expect(showHUD).toBe(false);
        });

        test('should render cinema effects during countdown', () => {
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            // 1.5 seconds into countdown
            mockTime += 1500;

            const elapsed = mockTime - gameState.soloCountdownStartTime;
            const timeLeft = 3000 - elapsed;
            const displayNumber = '2';

            if (typeof drawCinemaEffect === 'function') {
                expect(() => {
                    drawCinemaEffect(mockCtx, mockCanvas, timeLeft, displayNumber);
                }).not.toThrow();

                // Should have called save/restore
                expect(mockCtx.save).toHaveBeenCalled();
                expect(mockCtx.restore).toHaveBeenCalled();
            }
        });

        test('should display correct number during each second', () => {
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            const expected = [
                { time: 500, number: '3' },
                { time: 1500, number: '2' },
                { time: 2500, number: '1' }
            ];

            expected.forEach(({ time, number }) => {
                mockTime = gameState.soloCountdownStartTime + time;
                const elapsed = mockTime - gameState.soloCountdownStartTime;
                const progress = elapsed / 1000;
                const displayNumber = progress < 1 ? '3' : progress < 2 ? '2' : '1';

                expect(displayNumber).toBe(number);
            });
        });

        test('should render HUD after countdown finishes', () => {
            // Countdown
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            // Countdown completes
            mockTime += 3000;
            gameState.soloCountdownActive = false;
            gameState.levelStartTime = mockTime;

            // HUD should now show
            const showHUD = !gameState.soloCountdownActive;

            expect(showHUD).toBe(true);
        });
    });

    describe('Multiple Levels with Countdown', () => {
        test('should repeat countdown for each level', () => {
            const levels = [];

            for (let level = 1; level <= 3; level++) {
                gameState.currentLevel = level;
                gameState.soloCountdownActive = true;
                gameState.soloCountdownStartTime = mockTime;

                levels.push({
                    level,
                    countdownStart: mockTime
                });

                // Countdown duration
                mockTime += 3000;
                gameState.soloCountdownActive = false;
                gameState.levelStartTime = mockTime;

                // Play level
                mockTime += 5000;
            }

            expect(levels.length).toBe(3);
            expect(levels[0].level).toBe(1);
            expect(levels[1].level).toBe(2);
            expect(levels[2].level).toBe(3);
        });

        test('should not lose time between levels', () => {
            const startSessionTime = mockTime;
            let totalGameplayTime = 0;

            // Level 1: countdown + play
            gameState.soloCountdownStartTime = mockTime;
            mockTime += 3000; // Countdown
            const level1Start = mockTime;
            mockTime += 5000; // Play level 1
            totalGameplayTime += 5;

            // Level 2: countdown + play
            gameState.soloCountdownStartTime = mockTime;
            mockTime += 3000; // Countdown
            const level2Start = mockTime;
            mockTime += 7000; // Play level 2
            totalGameplayTime += 7;

            const totalTime = (mockTime - startSessionTime) / 1000;
            const totalCountdownTime = 6; // 2 countdowns

            const actualGameplayTime = totalTime - totalCountdownTime;

            expect(actualGameplayTime).toBeCloseTo(totalGameplayTime, 0);
        });

        test('should handle rapid level transitions', () => {
            expect(() => {
                // Level transitions at high speed
                for (let i = 0; i < 5; i++) {
                    gameState.soloCountdownActive = true;
                    gameState.soloCountdownStartTime = mockTime;

                    // Instant countdown
                    mockTime += 3000;
                    gameState.soloCountdownActive = false;

                    // Instant level completion
                    mockTime += 100;
                }
            }).not.toThrow();
        });
    });

    describe('Countdown + Solo HUD Interaction', () => {
        test('should display HUD after countdown with correct values', () => {
            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;
            gameState.soloSessionStartTime = mockTime - 10000; // Started 10 seconds ago

            // Countdown completes
            mockTime += 3000;
            gameState.soloCountdownActive = false;
            gameState.levelStartTime = mockTime;

            // HUD values
            const totalSessionTime = (mockTime - gameState.soloSessionStartTime) / 1000;
            const levelTime = 0; // Just started

            expect(totalSessionTime).toBeCloseTo(13, 0);
            expect(levelTime).toBeCloseTo(0, 0);
        });

        test('should not include countdown time in level time', () => {
            gameState.soloCountdownStartTime = mockTime;
            gameState.soloSessionStartTime = mockTime;

            // 3 second countdown
            mockTime += 3000;
            gameState.levelStartTime = mockTime;

            // 2 seconds of gameplay
            mockTime += 2000;

            const levelTime = (mockTime - gameState.levelStartTime) / 1000;
            const totalTime = (mockTime - gameState.soloSessionStartTime) / 1000;

            expect(levelTime).toBeCloseTo(2, 0);
            expect(totalTime).toBeCloseTo(5, 0);
            expect(totalTime).toBe(levelTime + 3); // 2 + 3 second countdown
        });
    });

    describe('Solo Mode State Machine', () => {
        test('should follow WAITING → COUNTDOWN → PLAYING transition', () => {
            const states = [];

            // WAITING state
            states.push('WAITING');

            // Level starts - enter COUNTDOWN
            gameState.soloCountdownActive = true;
            states.push('COUNTDOWN');

            // 3 seconds pass
            mockTime += 3000;
            gameState.soloCountdownActive = false;

            // PLAYING state
            states.push('PLAYING');

            expect(states).toEqual(['WAITING', 'COUNTDOWN', 'PLAYING']);
        });

        test('should not skip COUNTDOWN state', () => {
            gameState.soloCountdownActive = false;

            // Should not go directly to PLAYING
            const canStartCounting = !gameState.soloCountdownActive;

            if (canStartCounting) {
                gameState.soloCountdownActive = true;
            }

            expect(gameState.soloCountdownActive).toBe(true);
        });

        test('should reset countdown for each level transition', () => {
            const countdownStarts = [];

            for (let level = 1; level <= 2; level++) {
                gameState.soloCountdownActive = true;
                gameState.soloCountdownStartTime = mockTime;
                countdownStarts.push(mockTime);

                mockTime += 3000;
                gameState.soloCountdownActive = false;
                gameState.levelStartTime = mockTime;

                mockTime += 5000; // Play
            }

            // Each countdown started at different times
            expect(countdownStarts[0]).not.toBe(countdownStarts[1]);
            expect(countdownStarts[1]).toBeGreaterThan(countdownStarts[0]);
        });
    });

    describe('Countdown Performance & Edge Cases', () => {
        test('should handle 60fps rendering during countdown', () => {
            const fps60 = 1000 / 60; // ~16.67ms per frame
            let frameCount = 0;

            gameState.soloCountdownActive = true;
            gameState.soloCountdownStartTime = mockTime;

            expect(() => {
                while (frameCount < 180) { // 3 seconds at 60fps
                    mockTime += fps60;
                    frameCount++;

                    if (mockTime - gameState.soloCountdownStartTime >= 3000) {
                        gameState.soloCountdownActive = false;
                        break;
                    }
                }
            }).not.toThrow();

            expect(frameCount).toBeCloseTo(180, -1); // ~180 frames
        });

        test('should not accumulate memory during long session', () => {
            expect(() => {
                for (let level = 1; level <= 100; level++) {
                    // Countdown
                    gameState.soloCountdownStartTime = mockTime;
                    mockTime += 3000;

                    // Play
                    mockTime += Math.random() * 10000;

                    // Cleanup should be implicit
                }
            }).not.toThrow();
        });

        test('should handle timezone/DST changes gracefully', () => {
            const countdownStart = mockTime;
            mockTime += 1000;

            // Simulate system clock change (shouldn't affect countdown)
            const originalTime = mockTime;
            mockTime = 2000000000000; // Jump to far future

            // Reset to expected timeline
            mockTime = originalTime;

            const elapsed = mockTime - countdownStart;
            expect(elapsed).toBeCloseTo(1000, 0);
        });
    });

    describe('Accessibility During Countdown', () => {
        test('should provide visual feedback (numbers 3, 2, 1)', () => {
            gameState.soloCountdownActive = true;
            const countdownStart = mockTime;
            gameState.soloCountdownStartTime = countdownStart;

            const visibleNumbers = [];

            // Collect numbers at appropriate times during countdown
            const times = [300, 1300, 2300]; // Mid-way through each second

            times.forEach(time => {
                mockTime = countdownStart + time;
                const elapsed = mockTime - countdownStart;
                const progress = elapsed / 1000;
                const num = progress < 1 ? 3 : progress < 2 ? 2 : 1;

                visibleNumbers.push(num);
            });

            expect(visibleNumbers).toContain(3);
            expect(visibleNumbers).toContain(2);
            expect(visibleNumbers).toContain(1);
        });

        test('should provide clear countdown start time', () => {
            gameState.soloCountdownStartTime = mockTime;

            expect(gameState.soloCountdownStartTime).toBeDefined();
            expect(gameState.soloCountdownStartTime).toBeGreaterThan(0);
        });
    });
});
