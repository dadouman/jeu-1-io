/**
 * solo-hud-renderer.js
 * Renders the Solo mode UI: total time, level delta, level counter
 */

/**
 * Rend le HUD Solo (temps total, delta, niveau)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} soloRunTotalTime 
 * @param {number} level 
 * @param {number} currentLevelTime 
 * @param {boolean} isSoloGameFinished 
 * @param {Array} soloSplitTimes 
 * @param {object} preferences - {showPersonal, personalBestSplits, bestSplits}
 * @param {number} soloMaxLevel 
 */
function renderSoloHUD(ctx, canvas, soloRunTotalTime, level, currentLevelTime, isSoloGameFinished, soloSplitTimes, preferences, soloMaxLevel) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    if (soloRunTotalTime < 0) return;
    
    // LIGNE 1: Temps Total
    const timeFormatted = formatTime(soloRunTotalTime);
    ctx.fillStyle = "#CCCCCC";
    ctx.font = "bold 32px Arial";
    ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 220);
    
    // LIGNE 2: Delta du split actuel
    renderSoloDeltaLine(ctx, canvas, level, currentLevelTime, isSoloGameFinished, soloSplitTimes, preferences);
    
    // LIGNE 3: Niveau actuel en or
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Niveau ${level} / ${soloMaxLevel}`, canvas.width / 2, canvas.height / 2 + 295);
}

/**
 * Rend la ligne 2 du HUD (delta du split actuel)
 * @private
 */
function renderSoloDeltaLine(ctx, canvas, level, currentLevelTime, isSoloGameFinished, soloSplitTimes, preferences) {
    // CAS 1: Run terminée
    if (isSoloGameFinished && soloSplitTimes && soloSplitTimes.length >= level) {
        const currentLevelSplitTime = soloSplitTimes[level - 1];
        const bestLevelTime = getBestLevelTime(level, preferences);
        
        if (bestLevelTime && bestLevelTime > 0) {
            const deltaFormatted = formatDelta(currentLevelSplitTime, bestLevelTime);
            const deltaColor = getDeltaColor(currentLevelSplitTime - bestLevelTime);
            
            ctx.fillStyle = deltaColor;
            ctx.font = "bold 24px Arial";
            ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 + 260);
        } else {
            const timeFormatted = formatTime(currentLevelSplitTime);
            ctx.fillStyle = "#CCCCCC";
            ctx.font = "bold 24px Arial";
            ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 260);
        }
    }
    // CAS 2: Run en cours - niveau > 1
    else if (currentLevelTime > 0 && level > 1) {
        const bestLevelTime = getBestLevelTime(level, preferences);
        
        if (bestLevelTime && bestLevelTime > 0) {
            const deltaFormatted = formatDelta(currentLevelTime, bestLevelTime);
            const deltaColor = getDeltaColor(currentLevelTime - bestLevelTime);
            
            ctx.fillStyle = deltaColor;
            ctx.font = "bold 24px Arial";
            ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 + 260);
        } else {
            const timeFormatted = formatTime(currentLevelTime);
            ctx.fillStyle = "#CCCCCC";
            ctx.font = "bold 24px Arial";
            ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 260);
        }
    }
    // CAS 3: Premier niveau
    else if (currentLevelTime > 0) {
        const timeFormatted = formatTime(currentLevelTime);
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "bold 24px Arial";
        ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 260);
    }
}

/**
 * Rend l'affichage temporaire du delta après avoir pris une gem (1-2s)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} soloLastGemTime - Timestamp du dernier gem
 * @param {number} soloLastGemLevel - Niveau du dernier gem
 * @param {number} levelUpTime - Temps au moment du level-up
 * @param {object} preferences - {showPersonal, personalBestSplits, bestSplits}
 */
function renderSoloGemDelta(ctx, canvas, soloLastGemTime, soloLastGemLevel, levelUpTime, preferences) {
    if (!soloLastGemTime || !soloLastGemLevel) return;
    
    const timeSinceGem = Date.now() - soloLastGemTime;
    const DISPLAY_DURATION = 1500;
    
    if (timeSinceGem >= DISPLAY_DURATION) {
        return; // Pas d'affichage
    }
    
    const bestLevelTime = getBestLevelTime(soloLastGemLevel, preferences);
    
    if (bestLevelTime && bestLevelTime > 0) {
        const deltaFormatted = formatDelta(levelUpTime, bestLevelTime);
        const deltaColor = getDeltaColor(levelUpTime - bestLevelTime);
        
        const fadeAlpha = 1.0 - (timeSinceGem / DISPLAY_DURATION);
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = deltaColor;
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 - 100);
        ctx.globalAlpha = 1.0;
    }
}
