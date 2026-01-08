// public/profiler.js
// Client-side performance profiler pour Canvas rendering, memory, et game performance

class CanvasProfiler {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memory: [],
            gcCount: 0,
            lastGCTime: 0
        };
        
        this.config = {
            sampleSize: 60,      // Garder 60 derniers frames
            logInterval: 5000,   // Log stats toutes les 5sec
            enableLogging: false // Activer avec localStorage
        };

        this.currentFrameStart = 0;
        this.frameCount = 0;
        this.lastLogTime = 0;

        // Vérifier si logging activé
        this.config.enableLogging = localStorage.getItem('PROFILER_ENABLED') === 'true';
    }

    /**
     * Appeler en début de frame
     */
    frameStart() {
        this.currentFrameStart = performance.now();
    }

    /**
     * Appeler en fin de frame
     */
    frameEnd() {
        const frameTime = performance.now() - this.currentFrameStart;
        this.frameCount++;

        // Garder seulement les N derniers frames
        if (this.metrics.frameTime.length >= this.config.sampleSize) {
            this.metrics.frameTime.shift();
            this.metrics.fps.shift();
        }

        this.metrics.frameTime.push(frameTime);
        const fps = frameTime > 0 ? Math.round(1000 / frameTime) : 60;
        this.metrics.fps.push(fps);

        // Logger toutes les 5 secondes
        if (performance.now() - this.lastLogTime > this.config.logInterval) {
            this.logStats();
            this.lastLogTime = performance.now();
        }
    }

    /**
     * Track memory usage (client-side)
     */
    trackMemory() {
        if (performance.memory) {
            if (this.metrics.memory.length >= this.config.sampleSize) {
                this.metrics.memory.shift();
            }
            
            this.metrics.memory.push({
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Calculer les statistiques
     */
    getStats() {
        const fps = this.metrics.fps;
        const frameTime = this.metrics.frameTime;

        if (fps.length === 0) {
            return { avgFps: 0, minFps: 0, maxFps: 0, avgFrameTime: 0 };
        }

        const avgFps = Math.round(fps.reduce((a, b) => a + b, 0) / fps.length);
        const minFps = Math.min(...fps);
        const maxFps = Math.max(...fps);
        const avgFrameTime = (frameTime.reduce((a, b) => a + b, 0) / frameTime.length).toFixed(2);

        let memory = null;
        if (this.metrics.memory.length > 0) {
            const latest = this.metrics.memory[this.metrics.memory.length - 1];
            memory = {
                usedMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2),
                totalMB: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2),
                limitMB: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
            };
        }

        return {
            avgFps,
            minFps,
            maxFps,
            avgFrameTime,
            frameCount: this.frameCount,
            memory
        };
    }

    /**
     * Logger les stats à la console
     */
    logStats() {
        if (!this.config.enableLogging) return;

        const stats = this.getStats();
        console.log(
            `📊 PROFILER | FPS: ${stats.avgFps} (${stats.minFps}-${stats.maxFps}) | ` +
            `FrameTime: ${stats.avgFrameTime}ms | ` +
            (stats.memory ? `Memory: ${stats.memory.usedMB}/${stats.memory.totalMB}MB` : 'N/A')
        );
    }

    /**
     * Envoyer les stats au serveur pour logging
     */
    sendStatsToServer(socket) {
        if (!socket) return;

        const stats = this.getStats();
        socket.emit('profilerMetrics', {
            client: stats,
            timestamp: Date.now()
        });
    }

    /**
     * Activer/désactiver logging
     */
    setLogging(enabled) {
        this.config.enableLogging = enabled;
        if (enabled) {
            localStorage.setItem('PROFILER_ENABLED', 'true');
            console.log('✅ Canvas profiler logging ACTIVÉ');
        } else {
            localStorage.removeItem('PROFILER_ENABLED');
            console.log('❌ Canvas profiler logging DÉSACTIVÉ');
        }
    }

    /**
     * Réinitialiser les metrics
     */
    reset() {
        this.metrics.fps = [];
        this.metrics.frameTime = [];
        this.frameCount = 0;
    }
}

// Exporter l'instance singleton
const canvasProfiler = new CanvasProfiler();

// Pour activation via console: window.canvasProfiler.setLogging(true)
if (typeof window !== 'undefined') {
    window.canvasProfiler = canvasProfiler;
}
