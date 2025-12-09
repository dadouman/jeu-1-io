/**
 * academy-leader-renderer.js
 * SMPTE Universal Leader / Academy Leader countdown renderer
 * Classic cinema countdown (3-2-1-GO) with radar sweep animation
 */

/**
 * Renders the Academy Leader countdown sequence
 * Features: Radar sweep, concentric circles, crosshair, vintage film effects
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} elapsedMs - Milliseconds elapsed since countdown start
 * @param {boolean} countdownActive - Is countdown currently active
 */
function renderAcademyLeader(ctx, canvas, elapsedMs, countdownActive) {
    if (!countdownActive || elapsedMs >= 4000) {
        return; // Countdown finished
    }

    // === BACKGROUND ===
    ctx.fillStyle = '#1a1a1a'; // Dark gray/black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === GEOMETRY ===
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 150;
    const innerRadius = 80;

    // === CONCENTRIC CIRCLES ===
    drawConcentricCircles(ctx, centerX, centerY, outerRadius, innerRadius);

    // === CROSSHAIR ===
    drawCrosshair(ctx, canvas, centerX, centerY);

    // === RADAR SWEEP ===
    drawRadarSweep(ctx, centerX, centerY, outerRadius, elapsedMs);

    // === COUNTDOWN NUMBER ===
    const displayNumber = getCountdownNumber(elapsedMs);
    drawCountdownNumber(ctx, centerX, centerY, displayNumber);

    // === VINTAGE FILM EFFECTS ===
    applyFilmGrain(ctx, canvas);
    applyScratches(ctx, canvas);
    applyDust(ctx, canvas);
    applyJitter(ctx, canvas);
    applyFlicker(ctx, canvas, elapsedMs);
}

/**
 * Draw concentric circles (target/bullseye)
 */
function drawConcentricCircles(ctx, centerX, centerY, outerRadius, innerRadius) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;

    // Outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw crosshair (+ shape through center)
 */
function drawCrosshair(ctx, canvas, centerX, centerY) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
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
 * Draw the large countdown number/text
 */
function drawCountdownNumber(ctx, centerX, centerY, number) {
    // Large monospace font
    const fontSize = 200;
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(number, centerX + 3, centerY + 3);

    // Main text (white)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(number, centerX, centerY);

    // Outline for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText(number, centerX, centerY);
}

/**
 * Apply film grain (noise overlay)
 */
function applyFilmGrain(ctx, canvas) {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    const grainIntensity = 25;
    const grainAlpha = 0.08;

    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * grainIntensity;
        data[i] = noise;       // R
        data[i + 1] = noise;   // G
        data[i + 2] = noise;   // B
        data[i + 3] = Math.random() * 255 * grainAlpha; // Alpha
    }

    // Only apply to small patches (performance optimization)
    if (Math.random() > 0.7) {
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
