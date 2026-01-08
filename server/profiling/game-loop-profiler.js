// server/profiling/game-loop-profiler.js
// Profiler pour le game loop, collision checks, et spawn logic

class GameLoopProfiler {
    constructor() {
        this.metrics = {
            loopIterations: 0,
            avgLoopTime: 0,
            collisionChecks: 0,
            spawnChecks: 0,
            stateUpdates: 0
        };

        this.timings = {
            collisionCheck: [],
            spawnLogic: [],
            stateUpdate: [],
            fullLoop: []
        };

        this.config = {
            sampleSize: 100,
            logInterval: 10000,
            enableLogging: process.env.GAME_PROFILER_ENABLED === 'true'
        };

        this.lastLog = Date.now();
    }

    /**
     * Track le temps d'un segment du game loop
     * @param {string} segment - Ex: 'collisionCheck', 'spawnLogic', etc.
     * @param {number} duration - Temps en ms
     */
    trackSegment(segment, duration) {
        if (!this.timings[segment]) {
            this.timings[segment] = [];
        }

        const array = this.timings[segment];
        if (array.length >= this.config.sampleSize) {
            array.shift();
        }
        array.push(duration);

        if (segment === 'collisionCheck') {
            this.metrics.collisionChecks++;
        } else if (segment === 'spawnLogic') {
            this.metrics.spawnChecks++;
        } else if (segment === 'stateUpdate') {
            this.metrics.stateUpdates++;
        }
    }

    /**
     * Track la boucle complète
     */
    trackFullLoop(duration) {
        this.metrics.loopIterations++;

        const array = this.timings.fullLoop;
        if (array.length >= this.config.sampleSize) {
            array.shift();
        }
        array.push(duration);

        if (this.timings.fullLoop.length > 0) {
            this.metrics.avgLoopTime = 
                this.timings.fullLoop.reduce((a, b) => a + b, 0) / this.timings.fullLoop.length;
        }

        // Logger toutes les 10 secondes
        if (Date.now() - this.lastLog > this.config.logInterval) {
            this.logStats();
            this.lastLog = Date.now();
        }
    }

    /**
     * Calculer les stats
     */
    getStats() {
        const stats = {};

        for (const segment in this.timings) {
            const times = this.timings[segment];
            if (times.length === 0) continue;

            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);

            stats[segment] = {
                avg: avg.toFixed(3),
                min: min.toFixed(3),
                max: max.toFixed(3),
                samples: times.length
            };
        }

        return {
            loopIterations: this.metrics.loopIterations,
            collisionChecks: this.metrics.collisionChecks,
            spawnChecks: this.metrics.spawnChecks,
            stateUpdates: this.metrics.stateUpdates,
            avgLoopTime: this.metrics.avgLoopTime.toFixed(3),
            segments: stats
        };
    }

    /**
     * Logger les stats
     */
    logStats() {
        if (!this.config.enableLogging) return;

        const stats = this.getStats();
        console.log(
            `🎮 GAME LOOP | AvgTime: ${stats.avgLoopTime}ms | ` +
            `Collisions: ${stats.collisionChecks} | ` +
            `Spawns: ${stats.spawnChecks}`
        );

        if (stats.segments.fullLoop) {
            console.log(
                `  - Full Loop: ${stats.segments.fullLoop.avg}ms ` +
                `(${stats.segments.fullLoop.min}-${stats.segments.fullLoop.max}ms)`
            );
        }

        if (stats.segments.collisionCheck) {
            console.log(
                `  - Collision Check: ${stats.segments.collisionCheck.avg}ms`
            );
        }
    }

    /**
     * Détecter les bottlenecks
     */
    identifyBottlenecks() {
        const stats = this.getStats();
        const bottlenecks = [];

        // Si game loop dépasse 16.67ms (60 FPS), c'est un problème
        if (parseFloat(stats.avgLoopTime) > 16.67) {
            bottlenecks.push({
                severity: 'CRITICAL',
                message: `Game loop too slow: ${stats.avgLoopTime}ms (target: 16.67ms for 60fps)`
            });
        }

        // Vérifier chaque segment
        for (const segment in stats.segments) {
            const segStats = stats.segments[segment];
            const maxTime = parseFloat(segStats.max);

            if (segment === 'collisionCheck' && maxTime > 10) {
                bottlenecks.push({
                    severity: 'HIGH',
                    message: `Collision checking slow: ${maxTime}ms`
                });
            }

            if (segment === 'spawnLogic' && maxTime > 5) {
                bottlenecks.push({
                    severity: 'MEDIUM',
                    message: `Spawn logic slow: ${maxTime}ms`
                });
            }
        }

        return bottlenecks;
    }

    /**
     * Activer/désactiver logging
     */
    setLogging(enabled) {
        this.config.enableLogging = enabled;
        if (enabled) {
            console.log('✅ Game loop profiler logging ACTIVÉ');
        } else {
            console.log('❌ Game loop profiler logging DÉSACTIVÉ');
        }
    }

    /**
     * Réinitialiser
     */
    reset() {
        this.metrics = {
            loopIterations: 0,
            avgLoopTime: 0,
            collisionChecks: 0,
            spawnChecks: 0,
            stateUpdates: 0
        };
        this.timings = {
            collisionCheck: [],
            spawnLogic: [],
            stateUpdate: [],
            fullLoop: []
        };
    }
}

const gameLoopProfiler = new GameLoopProfiler();

module.exports = {
    GameLoopProfiler,
    gameLoopProfiler
};
