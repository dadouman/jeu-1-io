/**
 * countdown-renderer.js
 * CINEMA-STYLE COUNTDOWN - Old cinema leader aesthetic with vintage effects
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
 * Render old-style cinema countdown with vintage aesthetic
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

    // === DRAW VINTAGE CINEMA EFFECTS ===
    // Film grain effect
    drawFilmGrain(ctx, canvas, overlayAlpha);

    // === DRAW RADAR CIRCLES (FIXED SIZE - NO SHRINK) ===
    drawCountdownRadarCircles(ctx, centerX, centerY, overlayAlpha);

    // === DRAW RADAR SWEEP (rotating line) ===
    drawCountdownRadarSweep(ctx, centerX, centerY, elapsedMs, overlayAlpha);

    // === DRAW VINTAGE COUNTDOWN NUMBER (LARGE, CENTERED) ===
    drawCountdownNumber(ctx, centerX, centerY, displayNumber, overlayAlpha, elapsedMs);

    // === RESTORE CONTEXT ===
    ctx.restore();
}

/**
 * Draw film grain effect for vintage cinema feel
 */
function drawFilmGrain(ctx, canvas, overlayAlpha) {
    const intensity = overlayAlpha * 0.15; // Grain visibility depends on overlay opacity
    
    // Create noise pattern
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255 * intensity;
        data[i] += noise;     // R
        data[i + 1] += noise; // G
        data[i + 2] += noise; // B
        // data[i + 3] stays as is (alpha)
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw radar circles at FIXED SIZE (no shrinking)
 */
function drawCountdownRadarCircles(ctx, centerX, centerY, overlayAlpha) {
    const radius = 150;
    
    // Gradient for vintage look
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 3);
    
    ctx.strokeStyle = `rgba(255, 150, 50, ${0.5 * overlayAlpha})`;
    ctx.lineWidth = 2;

    // Draw 5 concentric circles for retro film leader look
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius * i) / 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Add corner circles (classic film leader)
    const cornerDist = 80;
    const corners = [
        [centerX - cornerDist, centerY - cornerDist],
        [centerX + cornerDist, centerY - cornerDist],
        [centerX - cornerDist, centerY + cornerDist],
        [centerX + cornerDist, centerY + cornerDist]
    ];
    
    ctx.strokeStyle = `rgba(255, 150, 50, ${0.3 * overlayAlpha})`;
    ctx.lineWidth = 1;
    
    corners.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.stroke();
    });
}

/**
 * Draw rotating radar sweep line
 */
function drawCountdownRadarSweep(ctx, centerX, centerY, elapsedMs, overlayAlpha) {
    const sweepRadius = 200;
    const sweepAnglePerSecond = 360; // degrees per second
    const totalAngle = (elapsedMs / 1000) * sweepAnglePerSecond;
    const normalizedAngle = totalAngle % 360;

    // Convert to radians
    const angle = normalizedAngle * (Math.PI / 180);

    // Draw the main sweep line with glow
    ctx.strokeStyle = `rgba(255, 150, 50, ${0.6 * overlayAlpha})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(angle - Math.PI / 2) * sweepRadius,
        centerY + Math.sin(angle - Math.PI / 2) * sweepRadius
    );
    ctx.stroke();
    
    // Add glow around sweep
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.2 * overlayAlpha})`;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(angle - Math.PI / 2) * sweepRadius,
        centerY + Math.sin(angle - Math.PI / 2) * sweepRadius
    );
    ctx.stroke();
}

/**
 * Draw the large countdown number with vintage cinema styling
 */
function drawCountdownNumber(ctx, centerX, centerY, number, overlayAlpha, elapsedMs) {
    // Jitter effect for vintage feel (slight random movement)
    const jitterX = (Math.random() - 0.5) * 4;
    const jitterY = (Math.random() - 0.5) * 4;
    
    const displayX = centerX + jitterX;
    const displayY = centerY + jitterY;
    
    // Scale animation: number appears and slightly grows
    const phaseElapsed = (elapsedMs % 1000);
    const scaleAnimation = 0.9 + (phaseElapsed / 1000) * 0.1; // 0.9 → 1.0
    
    // Color based on phase - vintage film colors
    let textColor;
    let strokeColor;
    
    switch (number) {
        case '3': 
            textColor = `rgba(255, 100, 100, ${0.95})`; // Red
            strokeColor = `rgba(200, 50, 50, 1)`;
            break;
        case '2': 
            textColor = `rgba(255, 180, 50, ${0.95})`; // Orange
            strokeColor = `rgba(200, 120, 20, 1)`;
            break;
        case '1': 
            textColor = `rgba(100, 200, 100, ${0.95})`; // Green
            strokeColor = `rgba(50, 150, 50, 1)`;
            break;
        case 'GO': 
            textColor = `rgba(100, 150, 255, ${0.95})`; // Blue
            strokeColor = `rgba(50, 100, 200, 1)`;
            break;
        default: 
            textColor = 'rgba(255, 255, 255, 1)';
            strokeColor = 'rgba(100, 100, 100, 1)';
    }
    
    ctx.save();
    
    // Apply scale and translation for animation
    ctx.translate(displayX, displayY);
    ctx.scale(scaleAnimation, scaleAnimation);
    ctx.translate(-displayX, -displayY);
    
    // Draw multiple strokes for bold vintage look
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = 'bold 280px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(number, displayX, displayY);
    
    // Draw colored stroke
    ctx.lineWidth = 6;
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(number, displayX, displayY);
    
    // Draw main number with fill
    ctx.fillStyle = textColor;
    ctx.fillText(number, displayX, displayY);
    
    // Draw highlight for 3D effect
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (1 - overlayAlpha)})`;
    ctx.font = 'bold 280px "Arial Black", Arial, sans-serif';
    ctx.fillText(number, displayX - 3, displayY - 3);
    
    ctx.restore();
}
