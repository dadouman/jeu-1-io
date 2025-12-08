// Public/transition-renderer.js
// Rendu des écrans de transition et vote

/**
 * Affiche l'écran de transition entre les niveaux
 */
function renderTransition(ctx, canvas, level, isFirstLevel, playerCountStart, levelUpPlayerSkin, levelUpTime, players, myId, transitionProgress) {
    // Fond semi-transparent
    ctx.fillStyle = `rgba(0, 0, 0, ${0.7 + transitionProgress * 0.3})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (isFirstLevel) {
        renderFirstLevelTransition(ctx, canvas, playerCountStart);
    } else {
        renderNormalTransition(ctx, canvas, levelUpPlayerSkin, levelUpTime, players, myId);
    }
    
    // Barre de chargement
    renderProgressBar(ctx, canvas, level, transitionProgress);
}

/**
 * Affiche la transition du premier niveau
 */
function renderFirstLevelTransition(ctx, canvas, playerCountStart) {
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎮 BIENVENUE", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#00FF00";
    const playerText = `${playerCountStart} 👥 Joueur${playerCountStart > 1 ? 's' : ''} Connecté${playerCountStart > 1 ? 's' : ''}`;
    ctx.fillText(playerText, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = "italic 24px Arial";
    ctx.fillStyle = "#AAAAAA";
    ctx.fillText("C'est parti pour le Niveau 1 !", canvas.width / 2, canvas.height / 2 + 80);
}

/**
 * Affiche la transition normale avec podium
 */
function renderNormalTransition(ctx, canvas, levelUpPlayerSkin, levelUpTime, players, myId) {
    // Message de transition
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${levelUpPlayerSkin} Gem récupérée en ${levelUpTime.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 - 80);
    
    // Podium
    renderPodium(ctx, canvas, players, myId);
}

/**
 * Affiche le podium avec les 3 premiers joueurs
 */
function renderPodium(ctx, canvas, players, myId) {
    const ranking = getRanking(players);
    const podiumX = canvas.width / 2;
    const podiumY = canvas.height / 2 + 20;
    
    const podiumPositions = [
        { x: podiumX, y: podiumY, medal: "🥇", height: 120 },
        { x: podiumX - 150, y: podiumY + 30, medal: "🥈", height: 80 },
        { x: podiumX + 150, y: podiumY + 30, medal: "🥉", height: 50 }
    ];
    
    ranking.slice(0, 3).forEach((player, index) => {
        const pos = podiumPositions[index];
        const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
        
        // Piédestal
        ctx.fillStyle = colors[index];
        ctx.fillRect(pos.x - 40, pos.y, 80, pos.height);
        
        // Bordure
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - 40, pos.y, 80, pos.height);
        
        // Médaille
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(pos.medal, pos.x, pos.y - 30);
        
        // Skin
        ctx.font = "48px Arial";
        ctx.fillText(player.skin, pos.x, pos.y + pos.height / 2 - 20);
        
        // Score
        ctx.font = "bold 16px Arial";
        ctx.fillText(`${player.score}`, pos.x, pos.y + pos.height + 25);
    });
    
    // Ma position (si hors du top 3)
    const myRank = ranking.findIndex(p => p.id === myId);
    if (myRank > 2) {
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        const podiumY = canvas.height / 2 + 20;
        ctx.fillText(`Vous êtes ${myRank + 1}e : ${ranking[myRank].skin} (${ranking[myRank].score} points)`, canvas.width / 2, podiumY + 150);
    }
}

/**
 * Affiche la barre de progression de transition
 */
function renderProgressBar(ctx, canvas, level, transitionProgress) {
    const barWidth = 300;
    const barHeight = 30;
    const barX = (canvas.width - barWidth) / 2;
    const barY = canvas.height - 100;
    
    // Fond
    ctx.fillStyle = "#444";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Barre de progression
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(barX, barY, barWidth * transitionProgress, barHeight);
    
    // Bordure
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Texte
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Niveau ${level}`, canvas.width / 2, barY + barHeight + 25);
}

/**
 * Affiche l'interface de vote
 */
function renderVoting(ctx, canvas, voteTimeRemaining) {
    // Fond semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    // Bordure
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, canvas.height - 80, canvas.width, 80);
    
    // Texte du vote
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🗳️ VOTE POUR REDÉMARRER EN COURS", canvas.width / 2, canvas.height - 55);
    
    // Temps restant
    ctx.fillStyle = voteTimeRemaining <= 10 ? "#FF4444" : "#00FF00";
    ctx.font = "bold 18px Arial";
    const timeText = `⏱️ ${voteTimeRemaining}s restant${voteTimeRemaining > 1 ? 's' : ''}`;
    ctx.fillText(timeText, canvas.width / 2, canvas.height - 25);
    
    // Instructions
    ctx.fillStyle = "#AAAAAA";
    ctx.font = "14px Arial";
    ctx.fillText("Appuyez sur O (OUI) ou N (NON)", canvas.width / 2, canvas.height - 5);
}

/**
 * Affiche le résultat du vote
 */
function renderVoteResult(ctx, canvas, voteResult) {
    if (voteResult === 'success') {
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("✅ VOTE ACCEPTÉ - REDÉMARRAGE EN COURS", canvas.width / 2, canvas.height - 20);
    } else if (voteResult === 'failed') {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("❌ VOTE REJETÉ", canvas.width / 2, canvas.height - 20);
    }
}
