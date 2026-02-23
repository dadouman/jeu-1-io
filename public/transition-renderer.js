// Public/transition-renderer.js
// Rendu des écrans de transition et vote

/**
 * Récupère le nombre max de niveaux selon le mode actuel
 * @returns {number} - Le nombre max de niveaux
 */
function getMaxLevelsForCurrentMode() {
    // Essayer d'utiliser selectedMode d'abord (défini dans mode-selector.js)
    if (typeof selectedMode !== 'undefined' && selectedMode) {
        const mode = selectedMode;
        if (mode === 'custom' && typeof customModeConfig !== 'undefined' && customModeConfig) {
            return customModeConfig.maxLevels || 10;
        } else if (mode === 'classic') {
            return 10;  // Classic: 10 niveaux
        } else if (mode === 'infinite') {
            return 100; // Afficher jusqu'à 100 pour l'infini
        } else if (mode === 'solo') {
            return 10;  // Solo: 10 niveaux
        }
    }
    
    // Sinon, essayer d'utiliser currentGameMode (défini dans game-state.js)
    if (typeof currentGameMode !== 'undefined' && currentGameMode) {
        if (currentGameMode === 'custom') {
            if (typeof customModeConfig !== 'undefined' && customModeConfig) {
                return customModeConfig.maxLevels || 10;
            }
        } else if (currentGameMode === 'classic') {
            return 10;
        } else if (currentGameMode === 'infinite') {
            return 100;
        } else if (currentGameMode === 'solo') {
            return 10;
        }
    }
    
    // Valeur par défaut
    return 10;
}

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
    
    // Barre de chargement et chronologie
    const maxLevels = getMaxLevelsForCurrentMode();
    renderProgressBar(ctx, canvas, level, transitionProgress, maxLevels);
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
 * Affiche la barre de progression de transition avec chronologie
 */
function renderProgressBar(ctx, canvas, level, transitionProgress, maxLevels = 10) {
    const completedLevel = Math.max(0, level - 1); // Le niveau qu'on vient de finir (min 0)
    const progressBarX = canvas.width / 2 - 250;
    const progressBarY = canvas.height - 120;
    const progressBarWidth = 500;
    const progressBarHeight = 40;
    
    // === AFFICHER LE NIVEAU COMPLÉTÉ ===
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    if (completedLevel === 0) {
        // Premier niveau
        ctx.fillText(`Niveau 1 en cours...`, canvas.width / 2, progressBarY - 20);
    } else {
        ctx.fillText(`Niveau ${completedLevel} complété !`, canvas.width / 2, progressBarY - 20);
    }
    
    // === CHRONOLOGIE AVEC POINTS (TIMELINE) ===
    const timelineY = progressBarY + 70;
    const timelineX = progressBarX + 20;
    const timelineWidth = progressBarWidth - 40;
    const dotRadius = 6;
    
    // Éviter division par zéro
    const numDots = Math.max(2, maxLevels);
    const dotSpacing = numDots > 1 ? timelineWidth / (numDots - 1) : 0;
    
    // Récupérer les niveaux de shop selon le mode ET le type de boutique
    const shopLevels = [];
    const hasShopInMode = true; // Par défaut les boutiques sont activées
    try {
        // Déterminer le shopType actuel
        const currentShopType = (typeof currentShopMode !== 'undefined') ? currentShopMode : 'classic';
        
        // Déterminer les niveaux de shop selon le mode
        if (typeof currentGameMode !== 'undefined' && currentGameMode === 'solo') {
            // Mode solo: toujours boutiques aux niveaux 5 et 10
            shopLevels.push(5, 10);
        } else if (typeof currentGameMode !== 'undefined' && currentGameMode === 'classic') {
            // Mode classic: boutiques aux niveaux 5 et 10
            shopLevels.push(5, 10);
        } else if (typeof currentGameMode !== 'undefined' && currentGameMode === 'classicPrim') {
            // Mode classicPrim (Organique): boutiques aux niveaux 5 et 10
            shopLevels.push(5, 10);
        } else if (typeof currentGameMode !== 'undefined' && currentGameMode === 'infinite') {
            // Mode infini: PAS DE SHOP (boutiques désactivées)
            // shopLevels reste vide
        } else if (typeof customModeConfig !== 'undefined' && customModeConfig && customModeConfig.shop && customModeConfig.shop.levels) {
            // Mode custom: utiliser les niveaux configurés
            shopLevels.push(...customModeConfig.shop.levels);
        }
    } catch (e) {
        // Ignorer les erreurs si les variables ne sont pas définies
    }
    
    // Ligne horizontale de la chronologie
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timelineX, timelineY);
    ctx.lineTo(timelineX + timelineWidth, timelineY);
    ctx.stroke();
    
    // Dessiner les points pour chaque niveau
    for (let i = 1; i <= numDots; i++) {
        const dotX = timelineX + (i - 1) * dotSpacing;
        const isCompleted = i <= completedLevel;
        const isShopLevel = shopLevels.includes(i);
        
        // Couleur du point
        if (isCompleted) {
            if (isShopLevel) {
                ctx.fillStyle = "#FFD700"; // Or pour les shops complétés
            } else {
                ctx.fillStyle = "#00FF00"; // Vert pour les niveaux normaux complétés
            }
        } else {
            if (isShopLevel) {
                ctx.fillStyle = "#FF8800"; // Orange pour les shops futurs
            } else {
                ctx.fillStyle = "#444444"; // Gris pour les niveaux futurs
            }
        }
        
        // Cercle du point
        ctx.beginPath();
        ctx.arc(dotX, timelineY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = isCompleted ? "#FFD700" : "#888";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Afficher le numéro du niveau (tous les niveaux si <= 10, sinon tous les 3)
        const showLabel = numDots <= 10 || i % 3 === 1;
        if (showLabel) {
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(i, dotX, timelineY + 20);
        }
        
        // Symbole pour les shops
        if (isShopLevel) {
            // Déterminer l'icône selon le type de boutique
            const currentShopType = (typeof currentShopMode !== 'undefined') ? currentShopMode : 'classic';
            const shopIcon = currentShopType === 'auction' ? '🏆' : '🛍️'; // Coupe pour enchères, panier pour classique
            
            ctx.fillStyle = "#FFD700";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(shopIcon, dotX, timelineY - 15);
        }
    }
    
    // === LIGNE D'ARRIVÉE ===
    const finishLineX = timelineX + timelineWidth + 20;
    ctx.fillStyle = "#FF6B6B";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏁", finishLineX, timelineY);
    
    // === BARRE DE PROGRESSION ANIMÉE (Transition visuelle) ===
    const barX = (canvas.width - 300) / 2;
    const barY = progressBarY - 60;
    const barWidth = 300;
    const barHeight = 30;
    
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
    
    // Texte de progression
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(transitionProgress * 100)}%`, canvas.width / 2, barY + barHeight / 2);
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
