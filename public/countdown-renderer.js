/**
 * countdown-renderer.js
 * NEW COUNTDOWN LOGIC - 4 PHASES with stepped transparency and game visibility
 * 
 * PHASE 1: 0-1000ms - AFFICHE "3" (opaque, jeu 0% visible)
 * PHASE 2: 1000-2000ms - AFFICHE "2" (alpha=0.8, jeu 20% visible)
 * PHASE 3: 2000-3000ms - AFFICHE "1" (alpha=0.6, jeu 40% visible)
 * PHASE 4: 3000-3500ms - AFFICHE "GO" (alpha=0.4, jeu 60% visible)
 * APRÈS: 3500ms+ - COUNTDOWN TERMINÉ
 * 
 * À 3000ms: ✅ Timer démarre (levelStartTime = Date.now())
 * À 3000ms: ✅ Inputs débloqués (inputsBlocked = false)
 * À 3500ms: ✅ Countdown disparu (soloStartCountdownActive = false)
 */

/**
 * Render the multi-phase countdown with stepped transparency
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} elapsedMs - Milliseconds elapsed since countdown start
 * @param {boolean} countdownActive - Is countdown currently active
 */
function renderCountdownMultiPhase(ctx, canvas, elapsedMs, countdownActive) {
    if (!countdownActive || elapsedMs >= 3500) {
        return; // Countdown finished at 3500ms
    }

    // === CENTER POSITION ===
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // === DETERMINE PHASE AND VALUES ===
    // Phase 0: 0-1000ms → "3"
    // Phase 1: 1000-2000ms → "2"
    // Phase 2: 2000-3000ms → "1"
    // Phase 3: 3000-3500ms → "GO"
    
    const phase = Math.floor(elapsedMs / 1000);
    let displayNumber;
    let overlayAlpha;

    if (elapsedMs < 1000) {
        displayNumber = '3';
        overlayAlpha = 1.0;  // Opaque noir (jeu 0% visible)
    } else if (elapsedMs < 2000) {
        displayNumber = '2';
        overlayAlpha = 0.8;  // Noir moins opaque (jeu 20% visible)
    } else if (elapsedMs < 3000) {
        displayNumber = '1';
        overlayAlpha = 0.6;  // Noir transparent (jeu 40% visible)
    } else {
        displayNumber = 'GO';
        overlayAlpha = 0.4;  // Noir très transparent (jeu 60% visible)
    }

    // === SAVE CONTEXT ===
    ctx.save();

    // === DRAW DARK OVERLAY (stepped alpha) ===
    // Black overlay with stepped transparency (not smooth fade)
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === DRAW RADAR CIRCLES (shrinking) ===
    drawCountdownRadarCircles(ctx, centerX, centerY, elapsedMs, overlayAlpha);

    // === DRAW RADAR SWEEP (rotating line) ===
    drawCountdownRadarSweep(ctx, centerX, centerY, elapsedMs, overlayAlpha);

    // === DRAW CROSSHAIR ===
    drawCountdownCrosshair(ctx, centerX, centerY, overlayAlpha);

    // === DRAW COUNTDOWN NUMBER (LARGE, CENTERED) ===
    drawCountdownNumber(ctx, centerX, centerY, displayNumber, overlayAlpha);

    // === RESTORE CONTEXT ===
    ctx.restore();
}

/**
 * Draw radar circles that shrink progressively
 */
function drawCountdownRadarCircles(ctx, centerX, centerY, elapsedMs, overlayAlpha) {
    const radius = 150;
    const shrinkFactor = Math.min(1, (3500 - elapsedMs) / 3500); // Shrink to 0 at 3500ms
    const mainRadius = radius * shrinkFactor;

    ctx.strokeStyle = `rgba(255, 200, 100, ${0.6 * overlayAlpha})`;
    ctx.lineWidth = 2;

    // Draw 3 concentric circles
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (mainRadius * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/**
 * Draw rotating radar sweep line
 */
function drawCountdownRadarSweep(ctx, centerX, centerY, elapsedMs, overlayAlpha) {
    const sweepRadius = 150;
    const sweepAnglePerSecond = 360; // degrees per second
    const totalAngle = (elapsedMs / 1000) * sweepAnglePerSecond;
    const normalizedAngle = totalAngle % 360;

    // Convert to radians
    const angle = normalizedAngle * (Math.PI / 180);

    // Draw the sweep line
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.8 * overlayAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(angle - Math.PI / 2) * sweepRadius,
        centerY + Math.sin(angle - Math.PI / 2) * sweepRadius
    );
    ctx.stroke();
}

/**
 * Draw crosshair at center
 */
function drawCountdownCrosshair(ctx, centerX, centerY, overlayAlpha) {
    const crosshairSize = 40;
    
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.7 * overlayAlpha})`;
    ctx.lineWidth = 2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - crosshairSize, centerY);
    ctx.lineTo(centerX + crosshairSize, centerY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crosshairSize);
    ctx.lineTo(centerX, centerY + crosshairSize);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.stroke();
}

/**
 * Draw the large countdown number
 */
function drawCountdownNumber(ctx, centerX, centerY, number, overlayAlpha) {
    // Color based on phase
    let textColor;
    const alpha = (1 - overlayAlpha) * 0.5 + 0.5; // Inverse alpha for visibility

    switch (number) {
        case '3': 
            textColor = `rgba(255, 107, 107, ${Math.min(1, alpha + 0.3)})`; // Red
            break;
        case '2': 
            textColor = `rgba(255, 215, 0, ${Math.min(1, alpha + 0.3)})`; // Gold
            break;
        case '1': 
            textColor = `rgba(0, 255, 0, ${Math.min(1, alpha + 0.3)})`; // Green
            break;
        case 'GO': 
            textColor = `rgba(0, 255, 255, ${Math.min(1, alpha + 0.3)})`; // Cyan
            break;
        default: 
            textColor = 'rgba(255, 255, 255, 1)';
    }

    // Draw shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow offset
    ctx.fillText(number, centerX + 4, centerY + 4);

    // Main number
    ctx.fillStyle = textColor;
    ctx.fillText(number, centerX, centerY);

    // Add glow effect
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(number, centerX, centerY);
}
