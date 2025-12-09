/**
 * countdown-renderer.js
 * Affiche un compte à rebours cinéma classique avec effets film vintage
 */

/**
 * Affiche le compte à rebours au démarrage du niveau en solo
 * Style vieux cinéma: grain, rayures, cercles rétrécissants + numéro
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
    
    // Calculer le temps restant
    const timeLeftMs = totalDuration - elapsed;
    
    // Fond noir pour masquer complètement le jeu
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Appeler la fonction des effets cinéma avec les effets complets
    if (typeof drawCinemaEffect === 'function') {
        drawCinemaEffect(ctx, canvas, timeLeftMs, String(displayNumber));
    }
    
    ctx.restore();
}
