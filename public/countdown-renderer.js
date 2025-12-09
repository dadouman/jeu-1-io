/**
 * countdown-renderer.js
 * Affiche un compte à rebours "3 2 1 GO!" en mode F1
 */

/**
 * Affiche le compte à rebours au démarrage du niveau en solo
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} countdownStartTime - Timestamp du début du countdown
 * @param {boolean} countdownActive - Est-ce que le countdown est actif
 */
function renderCountdown(ctx, canvas, countdownStartTime, countdownActive) {
    if (!countdownActive || !countdownStartTime) return;
    
    const elapsed = Date.now() - countdownStartTime;
    const totalDuration = 3000; // 3 secondes
    
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
    
    // Animation de pulsation: petit au début, grand au milieu, disparaît à la fin
    const scale = 0.5 + Math.sin(segmentProgress * Math.PI) * 0.5; // 0.5 à 1.5
    const fontSize = 150 * scale;
    
    // Couleur: du blanc au rouge (comme F1)
    const opacity = Math.max(0, 1 - segmentProgress * 0.5);
    const redIntensity = Math.floor(255 * segmentProgress);
    ctx.fillStyle = `rgba(255, ${255 - redIntensity}, ${255 - redIntensity}, ${opacity})`;
    
    // Affichage centré
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayNumber, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}
