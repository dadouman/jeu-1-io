/**
 * countdown-renderer.js
 * Affiche un compte à rebours cinéma classique remplissant le cercle de vision
 */

/**
 * Affiche le compte à rebours au démarrage du niveau en solo
 * Style vieux cinéma: cercles concentriques qui rétrécissent avec le numéro
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} countdownStartTime - Timestamp du début du countdown
 * @param {boolean} countdownActive - Est-ce que le countdown est actif
 */
function renderCountdown(ctx, canvas, countdownStartTime, countdownActive) {
    if (!countdownActive || !countdownStartTime) return;
    
    const elapsed = Date.now() - countdownStartTime;
    const totalDuration = 3000; // 3 secondes totales
    
    if (elapsed >= totalDuration) {
        return; // Countdown terminé
    }
    
    // Calculer le nombre à afficher (3, 2, 1)
    let displayNumber = 3;
    let progress = elapsed / 1000; // Progress en secondes (0 à 3)
    
    if (progress < 1) {
        displayNumber = 3;
    } else if (progress < 2) {
        displayNumber = 2;
    } else {
        displayNumber = 1;
    }
    
    // Calculer le pourcentage d'apparition/disparition de chaque nombre
    const segmentDuration = totalDuration / 3; // ~1000ms par nombre
    const segmentProgress = (elapsed % segmentDuration) / segmentDuration; // 0 à 1 pour chaque segment
    
    // Animation: cercles concentriques rétrécissants
    // Au début: grand cercle qui englobe tout
    // À la fin du segment: petit cercle concentré sur le nombre
    const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
    const minRadius = 80;
    const currentRadius = maxRadius - (maxRadius - minRadius) * segmentProgress;
    
    ctx.save();
    
    // Affichage centré
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // === CERCLE REMPLISSANT (vieux cinéma) ===
    // Fond noir transparent qui disparaît
    ctx.fillStyle = `rgba(0, 0, 0, ${0.9 - segmentProgress * 0.4})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // === CONTOUR DU CERCLE (style vintage) ===
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - segmentProgress * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // === LIGNES RADIANTES (style vieux projecteur) ===
    const lineCount = 8;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 - segmentProgress * 0.2})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * (currentRadius * 0.6);
        const startY = centerY + Math.sin(angle) * (currentRadius * 0.6);
        const endX = centerX + Math.cos(angle) * currentRadius;
        const endY = centerY + Math.sin(angle) * currentRadius;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // === GRAND NUMÉRO ===
    // Le numéro devient plus visible à mesure que le cercle rétrécit
    const fontSize = 200 + (segmentProgress * 100); // 200px → 300px
    const opacity = Math.max(0.3, 1 - (segmentProgress * 0.2)); // Reste visible
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayNumber, centerX, centerY);
    
    // === OMBRE DU NUMÉRO (style cinéma) ===
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillText(displayNumber, centerX + 4, centerY + 4);
    
    ctx.restore();
}
