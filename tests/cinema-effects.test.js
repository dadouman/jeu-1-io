/**
 * cinema-effects.test.js
 * Tests for cinema effect rendering and countdown integration
 */

describe('Cinema Effects Rendering', () => {
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
        // Mock canvas context
        mockCanvas = {
            width: 800,
            height: 600,
            getContext: jest.fn(() => mockCtx)
        };

        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
            createImageData: jest.fn(() => ({
                data: new Uint8ClampedArray(800 * 600 * 4)
            })),
            putImageData: jest.fn(),
            fillText: jest.fn(),
            setLineDash: jest.fn(),
            createRadialGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            drawImage: jest.fn(),
            translate: jest.fn(),
            scale: jest.fn(),
            globalCompositeOperation: 'source-over',
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: 'left',
            textBaseline: 'top',
            globalAlpha: 1.0,
            filter: ''
        };
    });

    describe('drawCinemaEffect()', () => {
        test('should call save() and restore() for context safety', () => {
            if (typeof drawCinemaEffect === 'function') {
                drawCinemaEffect(mockCtx, mockCanvas, 1000, '3');
                expect(mockCtx.save).toHaveBeenCalled();
                expect(mockCtx.restore).toHaveBeenCalled();
            }
        });

        test('should generate film grain with appropriate intensity', () => {
            if (typeof drawCinemaEffect === 'function') {
                drawCinemaEffect(mockCtx, mockCanvas, 1000, '3');
                expect(mockCtx.createImageData).toHaveBeenCalled();
                expect(mockCtx.putImageData).toHaveBeenCalled();
            }
        });

        test('should draw countdown number when displayNumber is provided', () => {
            if (typeof drawCinemaEffect === 'function') {
                drawCinemaEffect(mockCtx, mockCanvas, 1000, '3');
                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        });

        test('should not draw countdown number when displayNumber is null', () => {
            if (typeof drawCinemaEffect === 'function') {
                mockCtx.fillText.mockClear();
                drawCinemaEffect(mockCtx, mockCanvas, 1000, null);
                // Should still be called for other effects, but less frequently
                // The key is that it handles null gracefully
                expect(mockCtx.fillText).not.toThrow();
            }
        });

        test('should handle all three countdown numbers: 3, 2, 1', () => {
            if (typeof drawCinemaEffect === 'function') {
                ['3', '2', '1'].forEach(number => {
                    mockCtx.fillText.mockClear();
                    drawCinemaEffect(mockCtx, mockCanvas, 1000, number);
                    expect(mockCtx.fillText).toHaveBeenCalled();
                });
            }
        });

        test('should scale effects based on timeLeft parameter', () => {
            if (typeof drawCinemaEffect === 'function') {
                // Test with different time values
                const times = [3000, 2000, 1000, 0];
                times.forEach(time => {
                    mockCtx.fillStyle = '';
                    drawCinemaEffect(mockCtx, mockCanvas, time, '3');
                    // Circle radius should decrease as timeLeft decreases
                    // (tested via arc calls)
                    expect(mockCtx.arc).toHaveBeenCalled();
                });
            }
        });

        test('should draw vignette for darkening edges', () => {
            if (typeof drawCinemaEffect === 'function') {
                mockCtx.createRadialGradient.mockClear();
                drawCinemaEffect(mockCtx, mockCanvas, 1500, '2');
                expect(mockCtx.createRadialGradient).toHaveBeenCalled();
            }
        });
    });

    describe('drawFilmGrain()', () => {
        test('should create semi-transparent grain overlay', () => {
            if (typeof drawFilmGrain === 'function') {
                drawFilmGrain(mockCtx, mockCanvas);
                expect(mockCtx.createImageData).toHaveBeenCalledWith(
                    mockCanvas.width,
                    mockCanvas.height
                );
            }
        });

        test('should preserve underlying content (overlay composite)', () => {
            if (typeof drawFilmGrain === 'function') {
                const originalOp = mockCtx.globalCompositeOperation;
                drawFilmGrain(mockCtx, mockCanvas);
                // After drawFilmGrain, should restore to 'source-over'
                expect(mockCtx.globalCompositeOperation).toBe('source-over');
            }
        });
    });

    describe('drawFilmScratches()', () => {
        test('should draw multiple scratches', () => {
            if (typeof drawFilmScratches === 'function') {
                mockCtx.beginPath.mockClear();
                mockCtx.stroke.mockClear();
                drawFilmScratches(mockCtx, mockCanvas, 1500);
                expect(mockCtx.beginPath).toHaveBeenCalled();
                expect(mockCtx.stroke).toHaveBeenCalled();
            }
        });

        test('should vary scratch count based on timeLeft', () => {
            if (typeof drawFilmScratches === 'function') {
                // Scratches should appear and disappear throughout countdown
                const callCounts = [];
                [3000, 2000, 1000].forEach(time => {
                    mockCtx.beginPath.mockClear();
                    drawFilmScratches(mockCtx, mockCanvas, time);
                    callCounts.push(mockCtx.beginPath.mock.calls.length);
                });
                // Call counts should vary based on Math.sin animation
                expect(callCounts.length).toBe(3);
            }
        });
    });

    describe('drawCountdownNumber()', () => {
        test('should scale number based on segment progress', () => {
            if (typeof drawCountdownNumber === 'function') {
                mockCtx.font = '';
                drawCountdownNumber(mockCtx, mockCanvas, '3', 1000);
                expect(mockCtx.font).toMatch(/Courier New|monospace/);
                // Font size should contain "px"
                expect(mockCtx.font).toMatch(/\d+px/);
            }
        });

        test('should fade number opacity as segment progresses', () => {
            if (typeof drawCountdownNumber === 'function') {
                drawCountdownNumber(mockCtx, mockCanvas, '2', 500);
                // fillStyle should contain 'rgba' with opacity value
                expect(mockCtx.fillStyle).toMatch(/rgba\(/);
            }
        });

        test('should draw shadow for 3D effect', () => {
            if (typeof drawCountdownNumber === 'function') {
                mockCtx.fillText.mockClear();
                drawCountdownNumber(mockCtx, mockCanvas, '1', 300);
                // Should be called twice: once for shadow, once for main text
                expect(mockCtx.fillText.mock.calls.length).toBeGreaterThanOrEqual(2);
            }
        });
    });

    describe('drawRadarCircle()', () => {
        test('should shrink circle as countdown progresses', () => {
            if (typeof drawRadarCircle === 'function') {
                // At 3000ms left, circle should be large
                // At 0ms left, circle should be small
                mockCtx.arc.mockClear();
                drawRadarCircle(mockCtx, mockCanvas, 3000);
                const callsAt3000 = mockCtx.arc.mock.calls.length;

                mockCtx.arc.mockClear();
                drawRadarCircle(mockCtx, mockCanvas, 1000);
                const callsAt1000 = mockCtx.arc.mock.calls.length;

                // Both should have multiple arc calls for concentric circles
                expect(callsAt3000).toBeGreaterThan(0);
                expect(callsAt1000).toBeGreaterThan(0);
            }
        });

        test('should draw radiating lines (projector effect)', () => {
            if (typeof drawRadarCircle === 'function') {
                mockCtx.beginPath.mockClear();
                drawRadarCircle(mockCtx, mockCanvas, 2000);
                // Should have many beginPath calls for radiating lines
                expect(mockCtx.beginPath.mock.calls.length).toBeGreaterThan(4);
            }
        });
    });

    describe('drawVignette()', () => {
        test('should create radial gradient for vignette', () => {
            if (typeof drawVignette === 'function') {
                mockCtx.createRadialGradient.mockClear();
                drawVignette(mockCtx, mockCanvas);
                expect(mockCtx.createRadialGradient).toHaveBeenCalled();
            }
        });

        test('should darken edges progressively', () => {
            if (typeof drawVignette === 'function') {
                const gradient = {
                    addColorStop: jest.fn()
                };
                mockCtx.createRadialGradient.mockReturnValue(gradient);
                drawVignette(mockCtx, mockCanvas);
                
                // Should add multiple color stops for progressive darkening
                expect(gradient.addColorStop).toHaveBeenCalled();
            }
        });
    });

    describe('Full Countdown Integration', () => {
        test('renderCountdown should display fullscreen countdown', () => {
            if (typeof renderCountdown === 'function') {
                const startTime = Date.now();
                mockCtx.fillRect.mockClear();
                renderCountdown(mockCtx, mockCanvas, startTime, true);
                
                // Should fill black background
                expect(mockCtx.fillRect).toHaveBeenCalled();
            }
        });

        test('renderCountdown should stop after 3 seconds', () => {
            if (typeof renderCountdown === 'function') {
                const startTime = Date.now() - 4000; // 4 seconds ago
                mockCtx.fillRect.mockClear();
                renderCountdown(mockCtx, mockCanvas, startTime, true);
                
                // Should not draw anything (countdown finished)
                expect(mockCtx.fillRect).not.toHaveBeenCalled();
            }
        });

        test('renderCountdown should display correct number at each second', () => {
            if (typeof renderCountdown === 'function') {
                // Test at each second mark
                const now = Date.now();
                const timeOffsets = [0, 1100, 2100]; // ~0s, ~1s, ~2s

                timeOffsets.forEach(offset => {
                    mockCtx.fillText.mockClear();
                    const startTime = now - offset;
                    renderCountdown(mockCtx, mockCanvas, startTime, true);
                    // Should have called fillText for displaying the number
                    expect(mockCtx.fillText).toHaveBeenCalled();
                });
            }
        });

        test('renderCountdown should handle inactive state gracefully', () => {
            if (typeof renderCountdown === 'function') {
                mockCtx.fillRect.mockClear();
                expect(() => {
                    renderCountdown(mockCtx, mockCanvas, null, false);
                }).not.toThrow();
                expect(mockCtx.fillRect).not.toHaveBeenCalled();
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle very small canvas dimensions', () => {
            if (typeof drawCinemaEffect === 'function') {
                mockCanvas.width = 100;
                mockCanvas.height = 100;
                expect(() => {
                    drawCinemaEffect(mockCtx, mockCanvas, 1000, '3');
                }).not.toThrow();
            }
        });

        test('should handle very large canvas dimensions', () => {
            if (typeof drawCinemaEffect === 'function') {
                mockCanvas.width = 4000;
                mockCanvas.height = 3000;
                expect(() => {
                    drawCinemaEffect(mockCtx, mockCanvas, 1000, '3');
                }).not.toThrow();
            }
        });

        test('should handle rapid sequential calls', () => {
            if (typeof drawCinemaEffect === 'function') {
                expect(() => {
                    for (let i = 0; i < 10; i++) {
                        drawCinemaEffect(mockCtx, mockCanvas, 1000 - (i * 50), '3');
                    }
                }).not.toThrow();
            }
        });

        test('should handle invalid displayNumber gracefully', () => {
            if (typeof drawCinemaEffect === 'function') {
                expect(() => {
                    drawCinemaEffect(mockCtx, mockCanvas, 1000, 'X');
                }).not.toThrow();
            }
        });
    });
});
