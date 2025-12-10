/**
 * academy-leader-renderer.js
 * SMPTE Universal Leader / Academy Leader countdown renderer
 * Classic cinema countdown (3-2-1-GO) with radar sweep animation
 */

/**
 * Renders the Academy Leader countdown sequence
 * Features: Fills vision circle exactly, reveals game underneath with transparency
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} elapsedMs - Milliseconds elapsed since countdown start
 * @param {boolean} countdownActive - Is countdown currently active
 */
function renderAcademyLeader(ctx, canvas, elapsedMs, countdownActive) {
    if (!countdownActive || elapsedMs >= 4000) {
        return; // Countdown finished
    }

    // === VISION CIRCLE (same as game vision: 180px radius) ===
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const visionRadius = 180; // Match game vision radius exactly
    
    // === CALCULATE TRANSPARENCY PROGRESSION (STEPPED with radar sweep) ===
    // Transparency changes when radar needle completes each quadrant (90° increments)
    // 0-1s (0-90°): alpha = 1.0
    // 1-2s (90-180°): alpha = 0.8
    // 2-3s (180-270°): alpha = 0.6
    // 3-4s (270-360°): alpha = 0.4
    
    const totalAngle = (elapsedMs / 1000) * 360; // 360° per second
    const normalizedAngle = totalAngle % 360;
    const quadrant = Math.floor(normalizedAngle / 90); // 0, 1, 2, or 3
    
    let alphaDecay;
    switch(quadrant) {
        case 0: alphaDecay = 1.0; break;
        case 1: alphaDecay = 0.8; break;
        case 2: alphaDecay = 0.6; break;
        case 3: alphaDecay = 0.4; break;
        default: alphaDecay = 0.4;
    }
    
    // === SAVE CONTEXT ===
    ctx.save();
    
    // === CLIP TO VISION CIRCLE ===
    ctx.beginPath();
    ctx.arc(centerX, centerY, visionRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // === COUNTDOWN BACKGROUND (with decreasing opacity) ===
    ctx.fillStyle = `rgba(10, 10, 10, ${alphaDecay})`; // Very dark, fading
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // === GEOMETRY FOR COUNTDOWN GRAPHICS ===
    const maxRadius = visionRadius * 0.85; // Fit inside vision circle
    const outerRadius = maxRadius;
    const middleRadius = maxRadius * 0.65;
    const innerRadius = maxRadius * 0.35;

    // === CONCENTRIC CIRCLES (with decreasing opacity) ===
    ctx.globalAlpha = alphaDecay;
    drawConcentricCircles(ctx, centerX, centerY, outerRadius, middleRadius, innerRadius);

    // === CROSSHAIR ===
    drawCrosshair(ctx, canvas, centerX, centerY, outerRadius);

    // === RADAR SWEEP ===
    drawRadarSweep(ctx, centerX, centerY, outerRadius, elapsedMs);

    // === COUNTDOWN NUMBER (LARGE, PROMINENT) ===
    const displayNumber = getCountdownNumber(elapsedMs);
    drawCountdownNumber(ctx, centerX, centerY, displayNumber, outerRadius);

    // === VINTAGE FILM EFFECTS (with decreasing opacity) ===
    applyFilmGrain(ctx, canvas);
    applyScratches(ctx, canvas);
    applyDust(ctx, canvas);
    applyJitter(ctx, canvas);
    applyFlicker(ctx, canvas, elapsedMs);
    
    // === RESTORE CONTEXT ===
    ctx.restore();
}

/**
 * Draw concentric circles (authentic cinema target)
 * 3 circles: outer, middle, inner
 */
function drawConcentricCircles(ctx, centerX, centerY, outerRadius, middleRadius, innerRadius) {
    // Outer circle - thick white
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Middle circle - medium white
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, middleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle - thin white
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot - solid white
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw crosshair (+ shape through center, cinema style)
 */
function drawCrosshair(ctx, canvas, centerX, centerY, maxRadius) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;

    // Vertical line (extends beyond circles)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius * 1.3);
    ctx.lineTo(centerX, centerY + maxRadius * 1.3);
    ctx.stroke();

    // Horizontal line (extends beyond circles)
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius * 1.3, centerY);
    ctx.lineTo(centerX + maxRadius * 1.3, centerY);
    ctx.stroke();
}

/**
 * Draw the radar sweep (rotating arc)
 * 360 degrees per second
 */
function drawRadarSweep(ctx, centerX, centerY, radius, elapsedMs) {
    const sweepAnglePerSecond = 360; // degrees per second
    const totalAngle = (elapsedMs / 1000) * sweepAnglePerSecond;
    const normalizedAngle = totalAngle % 360;

    // Convert to radians
    const startAngle = (normalizedAngle - 30) * (Math.PI / 180); // 30 degree arc
    const endAngle = normalizedAngle * (Math.PI / 180);

    // Gradient for the sweep (white to transparent)
    const gradient = ctx.createLinearGradient(centerX, centerY, centerX + radius * Math.cos(endAngle), centerY + radius * Math.sin(endAngle));
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;

    // Draw filled arc (pie slice)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Bright line at the sweep edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + radius * Math.cos(endAngle),
        centerY + radius * Math.sin(endAngle)
    );
    ctx.stroke();
}

/**
 * Determine which number to display (3, 2, 1, GO)
 */
function getCountdownNumber(elapsedMs) {
    const secondsPassed = Math.floor(elapsedMs / 1000);

    if (secondsPassed === 0) return '3';
    if (secondsPassed === 1) return '2';
    if (secondsPassed === 2) return '1';
    return 'GO';
}

/**
 * Draw the large countdown number/text - Cinema style
 * Number positioned at the CENTER of the countdown circle
 */
function drawCountdownNumber(ctx, centerX, centerY, number, maxRadius) {
    // Position number at center of the countdown circle
    const numberY = centerY;
    
    // Enable smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ===== SHADOW LAYER =====
    ctx.font = `bold 240px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(number, centerX + 5, numberY + 5);

    // ===== MAIN TEXT - BRIGHT WHITE =====
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillText(number, centerX, numberY);

    // ===== OUTLINE FOR CRISP EDGES =====
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(number, centerX, numberY);

    // ===== GLOW EFFECT (subtle) =====
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = `bold 260px 'Courier New', monospace`;
    ctx.fillText(number, centerX, numberY);
}

/**
 * Apply film grain (noise overlay)
 */
function applyFilmGrain(ctx, canvas) {
    // Réduit: appliquer le grain seulement 20% du temps pour éviter les saccades
    if (Math.random() > 0.2) return;
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    const grainIntensity = 15;
    const grainAlpha = 0.05;

    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * grainIntensity;
        data[i] = noise;       // R
        data[i + 1] = noise;   // G
        data[i + 2] = noise;   // B
        data[i + 3] = Math.random() * 255 * grainAlpha; // Alpha
    }

    // Only apply to small patches (performance optimization)
    if (Math.random() > 0.8) {
        const patchX = Math.random() * canvas.width;
        const patchY = Math.random() * canvas.height;
        const patchW = 100;
        const patchH = 100;
        ctx.putImageData(imageData, patchX - patchW/2, patchY - patchH/2);
    }
}

/**
 * Apply scratches (thin vertical lines)
 */
function applyScratches(ctx, canvas) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;

    const scratchCount = Math.floor(Math.random() * 3) + 1; // 1-3 scratches

    for (let i = 0; i < scratchCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = Math.random() * 80 + 20;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + length);
        ctx.stroke();
    }
}

/**
 * Apply dust (random small dots)
 */
function applyDust(ctx, canvas) {
    ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';

    const dustCount = Math.floor(Math.random() * 5) + 1; // 1-5 dust particles

    for (let i = 0; i < dustCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Apply jitter (shake effect)
 */
function applyJitter(ctx, canvas) {
    const jitterAmount = 1.5;
    const jitterX = (Math.random() - 0.5) * jitterAmount;
    const jitterY = (Math.random() - 0.5) * jitterAmount;

    ctx.translate(jitterX, jitterY);
}

/**
 * Apply flicker (brightness variation)
 */
function applyFlicker(ctx, canvas, elapsedMs) {
    const flickerIntensity = Math.sin(elapsedMs / 100) * 0.02; // Subtle flicker
    const flickerValue = 1 + flickerIntensity;

    // Apply brightness overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, -flickerIntensity)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
