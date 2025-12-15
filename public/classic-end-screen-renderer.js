/**
 * classic-end-screen-renderer.js
 * Affiche l'écran de fin du mode classique/infini avec un podium, les scores, et le record
 */

/**
 * Affiche l'écran de fin avec un podium général des points
 * @param {CanvasRenderingContext2D} ctx - Context du canvas
 * @param {HTMLCanvasElement} canvas - Element canvas
 * @param {Array} players - Liste des joueurs avec leurs scores [{ skin, score, id }, ...]
 * @param {Object} record - Record du lobby { score, skin }
 * @param {number} finalLevel - Le dernier niveau atteint
 * @param {string} mode - Mode de jeu ('classic' ou 'infinite')
 */
function renderClassicEndScreen(ctx, canvas, players, record, finalLevel, mode) {
    // === FOND SEMI-TRANSPARENT ===
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === TITRE PRINCIPAL ===
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🏁 VICTOIRE!', canvas.width / 2, 30);

    // === SOUS-TITRE AVEC NIVEAU FINAL ===
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Niveau ${finalLevel} atteint!`, canvas.width / 2, 90);

    // === TRIER LES JOUEURS PAR SCORE (du plus haut au plus bas) ===
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // === AFFICHAGE DU PODIUM (Top 3) ===
    const podiumY = 160;
    const podiumSpacing = 180;
    const centerX = canvas.width / 2;

    // Positions du podium: 1er (au milieu-haut), 2e (gauche-bas), 3e (droite-bas)
    const podiumPositions = [
        { x: centerX, y: podiumY, place: 1, medal: '🥇', height: 280 },      // Ler place (centre, plus haut)
        { x: centerX - podiumSpacing, y: podiumY + 60, place: 2, medal: '🥈', height: 220 }, // 2e place (gauche, plus bas)
        { x: centerX + podiumSpacing, y: podiumY + 60, place: 3, medal: '🥉', height: 220 }  // 3e place (droite, plus bas)
    ];

    // Dessiner le podium pour chaque place
    podiumPositions.forEach((pos, idx) => {
        if (idx >= sortedPlayers.length) return; // Pas assez de joueurs
        
        const player = sortedPlayers[idx];

        // === SOCLE DU PODIUM ===
        ctx.fillStyle = getPlaceColor(pos.place);
        ctx.fillRect(pos.x - 60, pos.y + pos.height, 120, 80);
        
        // Bordure
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - 60, pos.y + pos.height, 120, 80);

        // === EMOJI/SKIN DU JOUEUR (GRAND) ===
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.skin || '😊', pos.x, pos.y + 40);

        // === MÉDAILLE ===
        ctx.font = 'bold 60px Arial';
        ctx.fillText(pos.medal, pos.x, pos.y - 30);

        // === PLACE ET SCORE SUR LE SOCLE ===
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(`Place ${pos.place}`, pos.x, pos.y + pos.height + 20);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`${player.score}💎`, pos.x, pos.y + pos.height + 55);
    });

    // === CLASSEMENT COMPLET (Si plus de 3 joueurs) ===
    if (sortedPlayers.length > 3) {
        const classementY = podiumY + 360;
        const classementX = canvas.width / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Classement complet:', classementX, classementY);

        // Afficher les joueurs 4 à 10
        ctx.font = '18px Arial';
        sortedPlayers.slice(3, 10).forEach((player, idx) => {
            const place = idx + 4;
            const yPos = classementY + 40 + (idx * 30);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText(`${place}. ${player.skin} - ${player.score}💎`, classementX - 200, yPos);
        });
    }

    // === RECORD DU LOBBY ===
    const recordY = canvas.height - 80;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(20, recordY, canvas.width - 40, 70);
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, recordY, canvas.width - 40, 70);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🏆 Record du lobby:', 40, recordY + 10);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${record.skin} - ${record.score}💎`, 40, recordY + 35);
}

/**
 * Retourne la couleur pour une place donnée au podium
 * @param {number} place - 1, 2, ou 3
 * @returns {string} Couleur en format hex ou rgba
 */
function getPlaceColor(place) {
    switch (place) {
        case 1: return 'rgba(255, 215, 0, 0.4)';    // Or
        case 2: return 'rgba(192, 192, 192, 0.4)';  // Argent
        case 3: return 'rgba(205, 127, 50, 0.4)';   // Bronze
        default: return 'rgba(100, 100, 100, 0.4)';
    }
}

/**
 * Affiche le meilleur joueur en haut à droite (dans le HUD temps réel)
 * @param {CanvasRenderingContext2D} ctx - Context du canvas
 * @param {HTMLCanvasElement} canvas - Element canvas
 * @param {Object} bestPlayer - Meilleur joueur { skin, score }
 */
function renderBestPlayerBadge(ctx, canvas, bestPlayer) {
    if (!bestPlayer || !bestPlayer.skin) return;

    const badgeX = canvas.width - 180;
    const badgeY = 20;
    const badgeWidth = 160;
    const badgeHeight = 60;

    // === FOND DE LA BADGE ===
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Bordure
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

    // === LABEL "MEILLEUR" ===
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('👑 Meilleur:', badgeX + 10, badgeY + 5);

    // === SKIN DU MEILLEUR JOUEUR ===
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bestPlayer.skin, badgeX + 45, badgeY + 35);

    // === SCORE ===
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${bestPlayer.score}💎`, badgeX + 85, badgeY + 10);
}
