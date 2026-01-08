// server/profiling/db-profiler.js
// Server-side profiler pour MongoDB queries et performance

const mongoQueryMap = {};

class DBProfiler {
    constructor() {
        this.queries = [];
        this.config = {
            sampleSize: 100,
            logInterval: 30000,  // Log toutes les 30sec
            enableLogging: process.env.DB_PROFILER_ENABLED === 'true',
            slowQueryThreshold: 100 // Queries > 100ms sont slow
        };

        this.stats = {
            totalQueries: 0,
            totalTime: 0,
            slowQueries: 0,
            lastLog: Date.now()
        };

        this.slowQueryLog = [];
    }

    /**
     * Track une query MongoDB
     * @param {string} operation - Ex: 'find', 'updateOne', 'save'
     * @param {string} collection - Ex: 'SoloRun'
     * @param {number} duration - Temps en ms
     */
    trackQuery(operation, collection, duration) {
        const query = {
            operation,
            collection,
            duration,
            timestamp: Date.now()
        };

        // Ajouter à la liste des requêtes
        if (this.queries.length >= this.config.sampleSize) {
            this.queries.shift();
        }
        this.queries.push(query);

        // Mettre à jour les stats
        this.stats.totalQueries++;
        this.stats.totalTime += duration;

        // Tracker les slow queries
        if (duration > this.config.slowQueryThreshold) {
            this.stats.slowQueries++;
            
            if (this.slowQueryLog.length >= 50) {
                this.slowQueryLog.shift();
            }
            this.slowQueryLog.push(query);

            if (this.config.enableLogging) {
                console.warn(
                    `⚠️ [DB SLOW] ${operation} on ${collection}: ${duration.toFixed(2)}ms`
                );
            }
        }

        // Logger toutes les 30 secondes
        if (Date.now() - this.stats.lastLog > this.config.logInterval) {
            this.logStats();
            this.stats.lastLog = Date.now();
        }
    }

    /**
     * Calculer les statistiques
     */
    getStats() {
        if (this.queries.length === 0) {
            return {
                totalQueries: 0,
                avgQueryTime: 0,
                minQueryTime: 0,
                maxQueryTime: 0,
                slowQueries: 0,
                slowQueryPercentage: 0
            };
        }

        const durations = this.queries.map(q => q.duration);
        const avgTime = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minTime = Math.min(...durations);
        const maxTime = Math.max(...durations);

        return {
            totalQueries: this.stats.totalQueries,
            avgQueryTime: avgTime.toFixed(2),
            minQueryTime: minTime.toFixed(2),
            maxQueryTime: maxTime.toFixed(2),
            slowQueries: this.stats.slowQueries,
            slowQueryPercentage: ((this.stats.slowQueries / this.stats.totalQueries) * 100).toFixed(1),
            recentQueries: this.queries.slice(-10)
        };
    }

    /**
     * Logger les stats
     */
    logStats() {
        if (!this.config.enableLogging) return;

        const stats = this.getStats();
        console.log(
            `📊 DB PROFILER | Queries: ${stats.totalQueries} | ` +
            `Avg: ${stats.avgQueryTime}ms | ` +
            `Slow: ${stats.slowQueries} (${stats.slowQueryPercentage}%)`
        );

        if (this.slowQueryLog.length > 0) {
            console.log('🐢 Slowest queries (last 5):');
            this.slowQueryLog
                .slice(-5)
                .reverse()
                .forEach(q => {
                    console.log(`  - ${q.operation} on ${q.collection}: ${q.duration.toFixed(2)}ms`);
                });
        }
    }

    /**
     * Détecter les N+1 queries
     */
    detectNPlusOne() {
        const groupedByCollection = {};

        for (const query of this.queries) {
            if (!groupedByCollection[query.collection]) {
                groupedByCollection[query.collection] = [];
            }
            groupedByCollection[query.collection].push(query);
        }

        const suspiciousPatterns = [];

        for (const collection in groupedByCollection) {
            const queries = groupedByCollection[collection];
            const findCount = queries.filter(q => q.operation === 'find').length;
            
            // Si plus de 10 finds en 30 secondes, peut être N+1
            if (findCount > 10) {
                suspiciousPatterns.push({
                    collection,
                    findCount,
                    severity: findCount > 20 ? 'HIGH' : 'MEDIUM'
                });
            }
        }

        return suspiciousPatterns;
    }

    /**
     * Activer/désactiver logging
     */
    setLogging(enabled) {
        this.config.enableLogging = enabled;
        if (enabled) {
            console.log('✅ DB profiler logging ACTIVÉ');
        } else {
            console.log('❌ DB profiler logging DÉSACTIVÉ');
        }
    }

    /**
     * Réinitialiser les stats
     */
    reset() {
        this.queries = [];
        this.stats = {
            totalQueries: 0,
            totalTime: 0,
            slowQueries: 0,
            lastLog: Date.now()
        };
        this.slowQueryLog = [];
    }
}

// Exporter l'instance singleton
const dbProfiler = new DBProfiler();

module.exports = {
    DBProfiler,
    dbProfiler,
    // Middleware pour auto-track les requêtes Mongoose
    createQueryTracker: (dbProfiler) => {
        return (schema) => {
            // Track find queries
            schema.pre('find', function () {
                this._profileStart = Date.now();
            });
            schema.post('find', function () {
                if (this._profileStart) {
                    const duration = Date.now() - this._profileStart;
                    dbProfiler.trackQuery('find', this.model.collection.name, duration);
                }
            });

            // Track findOne queries
            schema.pre('findOne', function () {
                this._profileStart = Date.now();
            });
            schema.post('findOne', function () {
                if (this._profileStart) {
                    const duration = Date.now() - this._profileStart;
                    dbProfiler.trackQuery('findOne', this.model.collection.name, duration);
                }
            });

            // Track save
            schema.pre('save', function () {
                this._profileStart = Date.now();
            });
            schema.post('save', function () {
                if (this._profileStart) {
                    const duration = Date.now() - this._profileStart;
                    dbProfiler.trackQuery('save', this.collection.name, duration);
                }
            });

            // Track updateOne
            schema.pre('updateOne', function () {
                this._profileStart = Date.now();
            });
            schema.post('updateOne', function () {
                if (this._profileStart) {
                    const duration = Date.now() - this._profileStart;
                    dbProfiler.trackQuery('updateOne', this.model.collection.name, duration);
                }
            });
        };
    }
};
