/**
 * cinema-effect-renderer.js
 * Effet cinéma old school: grain, scratches, jitter, countdown
 */

/**
 * Génère et applique l'effet cinéma complet
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} timeLeft - Temps restant en ms (ou null si pas de countdown)
 * @param {string} displayNumber - Numéro à afficher ('3', '2', '1', ou null)
 */
function drawCinemaEffect(ctx, canvas, timeLeft, displayNumber) {
    ctx.save();
    
    // === 1. GRAIN (Bruit/Noise) ===
    drawFilmGrain(ctx, canvas);
    
    // === 2. SCRATCHES (Rayures de pellicule) ===
    drawFilmScratches(ctx, canvas, timeLeft);
    
    // === 3. JITTER (Tremblement) ===
    // Appliquer le jitter via un petit décalage aléatoire
    const jitterX = (Math.random() - 0.5) * 2; // -1 à 1 pixel
    const jitterY = (Math.random() - 0.5) * 2;
    ctx.translate(jitterX, jitterY);
    
    // === 4. COUNTDOWN NUMBER ===
    if (displayNumber !== null) {
        drawCountdownNumber(ctx, canvas, displayNumber, timeLeft);
    }
    
    // === 5. RADAR/CIRCLE EFFECT ===
    drawRadarCircle(ctx, canvas, timeLeft);
    
    // === 6. VIGNETTE (Bordure sombre) ===
    drawVignette(ctx, canvas);
    
    ctx.restore();
}

/**
 * Dessine le bruit/grain de pellicule
 */
function drawFilmGrain(ctx, canvas) {
    // Créer une texture de grain semi-transparent
    const grainIntensity = 30; // Intensité du grain (0-255)
    const alpha = 0.15; // Opacité du grain
    
    // Créer un canvas temporaire pour le grain
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = canvas.width;
    grainCanvas.height = canvas.height;
    const grainCtx = grainCanvas.getContext('2d');
    
    // Remplir avec du bruit aléatoire
    const imageData = grainCtx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * grainIntensity;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = Math.random() * 255 * alpha; // Alpha variable
    }
    
    grainCtx.putImageData(imageData, 0, 0);
    
    // Dessiner le grain sur le canvas principal
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(grainCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Dessine les rayures de pellicule aléatoires
 */
function drawFilmScratches(ctx, canvas, timeLeft) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Nombre de rayures qui augmente avec le temps
    const scratchCount = 3 + Math.floor(Math.sin(timeLeft / 500) * 2);
    
    for (let i = 0; i < scratchCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = Math.random() * 50 + 20;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + length);
        ctx.stroke();
    }
    
    // Rayures noires pour le contraste
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 1; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = Math.random() * 40 + 15;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + length);
        ctx.stroke();
    }
}

/**
 * Dessine le grand numéro du countdown
 */
function drawCountdownNumber(ctx, canvas, displayNumber, timeLeft) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calcul du segment actuel et du progrès
    const totalMs = 3000;
    const elapsedMs = totalMs - timeLeft;
    const segmentDuration = 1000; // 1 seconde par numéro
    const segmentProgress = (elapsedMs % segmentDuration) / segmentDuration;
    
    // Animation: le numéro grandit
    const scale = 0.8 + segmentProgress * 0.4; // 0.8 à 1.2
    const fontSize = 300 * scale;
    
    // Opacité: plein au début, fade à la fin
    const opacity = Math.max(0.3, 1 - segmentProgress * 0.5);
    
    // Couleur blanc ivoire avec effet sepia
    ctx.fillStyle = `rgba(230, 220, 210, ${opacity})`;
    ctx.font = `bold ${Math.floor(fontSize)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ombre (effet vintage)
    ctx.fillStyle = `rgba(50, 30, 20, ${opacity * 0.5})`;
    ctx.fillText(displayNumber, centerX + 5, centerY + 5);
    
    // Texte principal
    ctx.fillStyle = `rgba(230, 220, 210, ${opacity})`;
    ctx.fillText(displayNumber, centerX, centerY);
}

/**
 * Dessine le cercle radar qui se vide
 */
function drawRadarCircle(ctx, canvas, timeLeft) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const totalMs = 3000;
    const elapsedMs = totalMs - timeLeft;
    const progress = Math.min(1, elapsedMs / totalMs); // 0 à 1
    
    // Rayon du cercle
    const maxRadius = 250;
    const currentRadius = maxRadius * (1 - progress); // Rétrécit
    
    // Cercle principal
    ctx.strokeStyle = `rgba(200, 180, 160, ${0.5 - progress * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cercles concentriques
    ctx.strokeStyle = `rgba(150, 130, 110, ${0.3 - progress * 0.2})`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const radius = currentRadius * (1 - i * 0.2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Lignes radiantes (style projecteur)
    ctx.strokeStyle = `rgba(180, 160, 140, ${0.4 - progress * 0.3})`;
    ctx.lineWidth = 2;
    const lineCount = 12;
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const startRadius = currentRadius * 0.4;
        const endRadius = currentRadius;
        
        const startX = centerX + Math.cos(angle) * startRadius;
        const startY = centerY + Math.sin(angle) * startRadius;
        const endX = centerX + Math.cos(angle) * endRadius;
        const endY = centerY + Math.sin(angle) * endRadius;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

/**
 * Dessine une vignette (bordure sombre progressive)
 */
function drawVignette(ctx, canvas) {
    // Gradient radial pour l'effet vignette
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxDistance);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Applique un filtre sepia pour l'effet vintage
 * (Utilise les filtres CSS si supportés)
 */
function applySepiaFilter(ctx) {
    // Note: ctx.filter n'est pas parfaitement supporté sur tous les navigateurs
    // Fallback: on utilise des overlays manuels
    try {
        ctx.filter = 'sepia(30%) saturate(0.8)';
    } catch (e) {
        // Fallback: pas de filtre disponible
    }
}
