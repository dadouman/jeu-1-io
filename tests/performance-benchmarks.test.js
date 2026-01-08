// tests/performance-benchmarks.test.js
// Tests de performance et benchmarks pour identifier les hotspots

const { generateMaze } = require('../utils/map');
const { checkWallCollision } = require('../utils/collisions');
const { dbProfiler } = require('../server/profiling/db-profiler');
const { gameLoopProfiler } = require('../server/profiling/game-loop-profiler');

describe('Performance Benchmarks', () => {
    beforeEach(() => {
        dbProfiler.reset();
        gameLoopProfiler.reset();
    });

    describe('Map Generation Performance', () => {
        test('should generate 15x15 maze in < 50ms', () => {
            const start = performance.now();
            const maze = generateMaze(15, 15);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(50);
            expect(maze.length).toBe(15);
            expect(maze[0].length).toBe(15);
        });

        test('should generate 20x20 maze in < 100ms', () => {
            const start = performance.now();
            const maze = generateMaze(20, 20);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100);
        });

        test('should generate 30x30 maze in < 200ms', () => {
            const start = performance.now();
            const maze = generateMaze(30, 30);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(200);
        });

        test('should not leak memory during repeated generation', () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Generate 100 mazes
            for (let i = 0; i < 100; i++) {
                generateMaze(15, 15);
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

            // Should not grow more than 50MB
            expect(memoryGrowth).toBeLessThan(50);
        });
    });

    describe('Collision Detection Performance', () => {
        let maze;

        beforeEach(() => {
            maze = generateMaze(20, 20);
        });

        test('should check wall collision efficiently', () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                checkWallCollision(100 + i % 20, 100 + i % 20, maze);
            }
            const duration = performance.now() - start;

            // 1000 collision checks should be < 5ms (even with Jest overhead)
            expect(duration).toBeLessThan(5);
        });

        test('should handle collision checks for multiple players efficiently', () => {
            const players = Array(10).fill(null).map((_, i) => ({
                x: 50 + i * 10,
                y: 50 + i * 10
            }));

            const start = performance.now();
            for (let frame = 0; frame < 60; frame++) {
                for (const player of players) {
                    checkWallCollision(player.x, player.y, maze);
                }
            }
            const duration = performance.now() - start;

            // 60 frames * 10 players = 600 checks
            // Should be < 5ms total
            expect(duration).toBeLessThan(5);
        });
    });

    describe('Database Profiler Accuracy', () => {
        test('should track query durations accurately', () => {
            // Simuler des queries
            const queryDurations = [10, 15, 20, 25, 30];

            for (const duration of queryDurations) {
                dbProfiler.trackQuery('find', 'testCollection', duration);
            }

            const stats = dbProfiler.getStats();

            expect(stats.totalQueries).toBe(5);
            expect(parseFloat(stats.avgQueryTime)).toBeCloseTo(20, 0);
            expect(parseInt(stats.minQueryTime)).toBe(10);
            expect(parseInt(stats.maxQueryTime)).toBe(30);
        });

        test('should identify slow queries', () => {
            // Slow query threshold is 100ms
            dbProfiler.trackQuery('find', 'collection1', 50);
            dbProfiler.trackQuery('find', 'collection1', 150); // Slow
            dbProfiler.trackQuery('find', 'collection1', 80);
            dbProfiler.trackQuery('find', 'collection1', 120); // Slow

            const stats = dbProfiler.getStats();

            expect(stats.slowQueries).toBe(2);
            expect(stats.slowQueryPercentage).toBe('50.0');
        });

        test('should detect N+1 query patterns', () => {
            // Simulate N+1 pattern
            for (let i = 0; i < 25; i++) {
                dbProfiler.trackQuery('find', 'users', 5);
            }

            const patterns = dbProfiler.detectNPlusOne();

            expect(patterns.length).toBeGreaterThan(0);
            expect(patterns[0].collection).toBe('users');
            expect(patterns[0].findCount).toBe(25);
            expect(patterns[0].severity).toBe('HIGH');
        });
    });

    describe('Game Loop Profiler Accuracy', () => {
        test('should track loop segments correctly', () => {
            for (let i = 0; i < 10; i++) {
                gameLoopProfiler.trackSegment('collisionCheck', 5 + Math.random() * 2);
                gameLoopProfiler.trackSegment('spawnLogic', 2 + Math.random() * 1);
                gameLoopProfiler.trackSegment('stateUpdate', 1 + Math.random());
                gameLoopProfiler.trackFullLoop(10);
            }

            const stats = gameLoopProfiler.getStats();

            expect(stats.loopIterations).toBe(10);
            expect(stats.collisionChecks).toBe(10);
            expect(stats.spawnChecks).toBe(10);
            expect(stats.stateUpdates).toBe(10);
        });

        test('should identify bottlenecks', () => {
            // Simulate slow game loop
            for (let i = 0; i < 20; i++) {
                gameLoopProfiler.trackFullLoop(20); // > 16.67ms target
            }

            const bottlenecks = gameLoopProfiler.identifyBottlenecks();

            expect(bottlenecks.length).toBeGreaterThan(0);
            expect(bottlenecks[0].severity).toBe('CRITICAL');
        });
    });

    describe('Memory Usage Tracking', () => {
        test('should track memory without significant overhead', () => {
            const startMem = process.memoryUsage().heapUsed;

            // Perform some operations
            for (let i = 0; i < 1000; i++) {
                gameLoopProfiler.trackSegment('collision', 5);
                dbProfiler.trackQuery('find', 'test', 10);
            }

            const endMem = process.memoryUsage().heapUsed;
            const overhead = (endMem - startMem) / 1024 / 1024; // MB

            // Profiling overhead should be < 10MB
            expect(overhead).toBeLessThan(10);
        });
    });

    describe('Real-world Scenarios', () => {
        test('should handle 60 fps game loop with 10 players', () => {
            const maze = generateMaze(20, 20);
            const players = Array(10).fill(null).map((_, i) => ({
                x: 50 + i * 15,
                y: 50 + i * 15
            }));

            const frameStart = performance.now();

            // Simulate 60 frames
            for (let frame = 0; frame < 60; frame++) {
                const loopStart = performance.now();

                // Collision checks
                const collisionStart = performance.now();
                for (const player of players) {
                    checkWallCollision(player.x + frame, player.y + frame, maze);
                }
                gameLoopProfiler.trackSegment('collisionCheck', 
                    performance.now() - collisionStart);

                // Spawn logic
                const spawnStart = performance.now();
                // Simulate spawn check every 10 frames
                if (frame % 10 === 0) {
                    for (let i = 0; i < 5; i++) {
                        generateMaze(10, 10);
                    }
                }
                gameLoopProfiler.trackSegment('spawnLogic',
                    performance.now() - spawnStart);

                // State update
                const stateStart = performance.now();
                // Simulate database operations
                for (let i = 0; i < 2; i++) {
                    dbProfiler.trackQuery('updateOne', 'players', 5);
                }
                gameLoopProfiler.trackSegment('stateUpdate',
                    performance.now() - stateStart);

                const loopTime = performance.now() - loopStart;
                gameLoopProfiler.trackFullLoop(loopTime);
            }

            const totalTime = performance.now() - frameStart;
            const avgTimePerFrame = totalTime / 60;

            console.log(`Total time: ${totalTime.toFixed(2)}ms for 60 frames`);
            console.log(`Average per frame: ${avgTimePerFrame.toFixed(2)}ms`);

            // Average should be < 20ms per frame (60fps)
            expect(avgTimePerFrame).toBeLessThan(20);

            const stats = gameLoopProfiler.getStats();
            console.log('Game Loop Stats:', stats);
        });
    });
});
