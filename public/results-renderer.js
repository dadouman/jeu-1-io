// Public/results-renderer.js
// Rendu de l'écran de résultats solo

/**
 * Affiche l'écran de résultats solo
 */
function renderSoloResults(ctx, canvas, soloTotalTime, soloPersonalBestTime, soloSplitTimes) {
    // Fond semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre
    ctx.fillStyle = "#FF00FF";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏁 SOLO TERMINÉ!", canvas.width / 2, 40);
    
    // Temps total
    ctx.fillStyle = "#00FF00";
    ctx.font = "bold 50px Arial";
    ctx.fillText(`⏱️ ${soloTotalTime.toFixed(2)}s`, canvas.width / 2, 110);
    
    // Rang du leaderboard
    if (window.soloPlayerRank) {
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 24px Arial";
        ctx.fillText(`🏆 Classement: #${window.soloPlayerRank}`, canvas.width / 2, 160);
    }
    
    // Meilleur temps personnel
    if (soloPersonalBestTime) {
        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 18px Arial";
        ctx.fillText(`🎯 Meilleur personnel: ${soloPersonalBestTime.toFixed(2)}s`, canvas.width / 2, 195);
    }
    
    // Section gauche - Niveaux
    renderSoloSplitTimes(ctx, canvas, soloSplitTimes);
    
    // Section droite - Leaderboard
    renderSoloLeaderboard(ctx, canvas);
    
    // Boutons
    renderResultsButtons(ctx, canvas);
}

/**
 * Affiche les temps de split pour chaque niveau
 */
function renderSoloSplitTimes(ctx, canvas, soloSplitTimes) {
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("📊 Niveaux:", 40, 220);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Arial";
    
    const checkpointStart = 250;
    const checkpointSpacing = 20;
    
    for (let i = 0; i < soloSplitTimes.length; i++) {
        const level = i + 1;
        const time = soloSplitTimes[i];
        
        // Récupérer le meilleur checkpoint personnel
        let personalBestCheckpoint = null;
        if (window.soloLeaderboard && window.soloLeaderboard.length > 0) {
            const personalBestEntry = window.soloLeaderboard.find(entry => 
                Math.abs(entry.totalTime - window.soloPersonalBestTime) < 0.1
            );
            if (personalBestEntry?.splitTimes?.[i]) {
                personalBestCheckpoint = personalBestEntry.splitTimes[i];
            }
        }
        
        // Calculer le delta
        let deltaText = "";
        if (personalBestCheckpoint) {
            const delta = time - personalBestCheckpoint;
            deltaText = ` ${delta < 0 ? "−" : "+"}${Math.abs(delta).toFixed(1)}s`;
        }
        
        const text = `L${level}: ${time.toFixed(1)}s${deltaText}`;
        ctx.fillStyle = personalBestCheckpoint && (time - personalBestCheckpoint) < 0 ? "#00FF00" : "#FFFFFF";
        
        if (i < 10) {
            ctx.fillText(text, 40, checkpointStart + i * checkpointSpacing);
        } else {
            ctx.fillText(text, canvas.width / 2 - 30, checkpointStart + (i - 10) * checkpointSpacing);
        }
    }
}

/**
 * Affiche le leaderboard top 5
 */
function renderSoloLeaderboard(ctx, canvas) {
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🎯 Top 5 Leaderboard:", canvas.width / 2 + 50, 220);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    
    const leaderboardStart = 250;
    const leaderboardSpacing = 20;
    
    if (!window.soloLeaderboard?.length) return;
    
    for (let i = 0; i < Math.min(5, window.soloLeaderboard.length); i++) {
        const entry = window.soloLeaderboard[i];
        const medal = ['🥇', '🥈', '🥉'][i] || (i + 1);
        const text = `${medal} ${entry.totalTime.toFixed(2)}s`;
        
        // Highlight le joueur actuel
        if (window.soloPlayerRank === i + 1) {
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(canvas.width / 2 + 40, leaderboardStart + i * leaderboardSpacing - 12, 280, 16);
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        
        ctx.fillText(text, canvas.width / 2 + 50, leaderboardStart + i * leaderboardSpacing);
    }
}

/**
 * Affiche les boutons de résultats (Rejouer / Menu)
 */
function renderResultsButtons(ctx, canvas) {
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    
    // Bouton REPLAY
    ctx.fillStyle = "rgba(0, 200, 0, 0.6)";
    ctx.fillRect(canvas.width / 2 - 220, canvas.height - 70, 160, 50);
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 220, canvas.height - 70, 160, 50);
    ctx.fillStyle = "#00FF00";
    ctx.fillText("🔄 REJOUER", canvas.width / 2 - 140, canvas.height - 45);
    window.replayButtonRect = { x: canvas.width / 2 - 220, y: canvas.height - 70, w: 160, h: 50 };
    
    // Bouton MENU
    ctx.fillStyle = "rgba(100, 100, 255, 0.6)";
    ctx.fillRect(canvas.width / 2 + 60, canvas.height - 70, 160, 50);
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 + 60, canvas.height - 70, 160, 50);
    ctx.fillStyle = "#00FFFF";
    ctx.fillText("📍 MENU", canvas.width / 2 + 140, canvas.height - 45);
    window.menuButtonRect = { x: canvas.width / 2 + 60, y: canvas.height - 70, w: 160, h: 50 };
}
