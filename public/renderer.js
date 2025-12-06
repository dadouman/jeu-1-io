// public/renderer.js

const TILE_SIZE = 40;

/**
 * Trie les joueurs par score (décroissant)
 * En cas d'égalité, le joueur qui a trouvé la gem en dernier est devant (l'ordre d'arrivée)
 */
function getRanking(players) {
    const playersList = Object.entries(players).map(([id, player]) => ({
        id,
        skin: player.skin,
        score: player.score || 0
    }));
    
    // Trier par score décroissant, l'ordre d'insertion dans l'objet gère l'égalité
    return playersList.sort((a, b) => b.score - a.score);
}

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime) {
    
    // 1. Fond noir
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- SÉCURITÉ (Sans les logs moches) ---
    // Si il manque des données, on affiche juste un texte de chargement propre
    if (!map || map.length === 0 || !players || !myId || !players[myId]) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Chargement du jeu...", canvas.width / 2, canvas.height / 2);
        return; // On arrête là et on attend la prochaine frame
    }
    // ----------------------------------------

    const myPlayer = players[myId];

    // Sécurité pour le record (si Mongo est lent)
    let safeRecord = highScore || { score: 0, skin: "❓" };

    ctx.save(); // Sauvegarde Caméra

    // 2. Brouillard (Masque rond)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 180, 0, Math.PI * 2);
    ctx.clip();

    // 3. Sol
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Caméra (Centrée sur le joueur)
    const camX = canvas.width / 2 - myPlayer.x;
    const camY = canvas.height / 2 - myPlayer.y;
    ctx.translate(camX, camY);
    
    // 4.5 Zoom progressif (miniaturisation progressive du monde)
    // Le zoom se fait autour du joueur (centre de l'écran)
    ctx.translate(myPlayer.x, myPlayer.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-myPlayer.x, -myPlayer.y);

    // 5. Map
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === 1) {
                // Mur
                ctx.fillStyle = "#555";
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                // Bordure du mur
                ctx.strokeStyle = "#333";
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 5.5 Traces des joueurs (les corder qui suivent leur parcours)
    if (trails) {
        for (let playerId in trails) {
            const trail = trails[playerId];
            if (trail.positions && trail.positions.length > 1) {
                ctx.strokeStyle = trail.color;
                ctx.globalAlpha = 0.5; // Semi-transparent
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                
                // Dessiner une ligne qui relie tous les points de la trace
                ctx.beginPath();
                ctx.moveTo(trail.positions[0].x + TILE_SIZE/2, trail.positions[0].y + TILE_SIZE/2);
                for (let i = 1; i < trail.positions.length; i++) {
                    ctx.lineTo(trail.positions[i].x + TILE_SIZE/2, trail.positions[i].y + TILE_SIZE/2);
                }
                ctx.stroke();
                ctx.globalAlpha = 1.0; // Réinitialiser l'opacité
            }
        }
    }

    // 6. Pièce
    if (coin) {
        ctx.font = "30px Arial";
        ctx.textAlign = "center"; // Important pour centrer l'emoji
        ctx.textBaseline = "middle"; // Important pour centrer l'emoji
        // On dessine au centre de la case (+ demi-taille)
        ctx.fillText("💎", coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2);
    }

    // 6.5 Checkpoint (s'il existe)
    if (checkpoint) {
        // Aura d'animation autour du checkpoint
        ctx.fillStyle = "rgba(255, 100, 200, 0.3)";
        ctx.beginPath();
        ctx.arc(checkpoint.x + TILE_SIZE/2, checkpoint.y + TILE_SIZE/2, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Dessin du checkpoint
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🚩", checkpoint.x + TILE_SIZE/2, checkpoint.y + TILE_SIZE/2);
    }

    // 7. Joueurs
    ctx.globalAlpha = 1.0; // Opacité complète pour les joueurs (réinitialisation)
    for (let id in players) {
        const p = players[id];
        
        // Dessin du Skin
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.skin, p.x + TILE_SIZE/2, p.y + TILE_SIZE/2);
        
        // Dessin du Score (petit au dessus)
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(p.score, p.x + TILE_SIZE/2, p.y - 10);
    }

    ctx.restore(); // Fin Caméra
    ctx.globalAlpha = 1.0; // Réinitialiser l'opacité après restore

    // 8. Interface (UI) - Dessinée par dessus le brouillard
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Score : " + myPlayer.score, 20, 40);

    // Affichage du Niveau
    ctx.fillStyle = "#aaa"; // Gris clair
    ctx.font = "16px Arial";
    ctx.fillText("Niveau " + (level || 1), 20, 65); // Juste en dessous du score
    
    // Affichage des Gems
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "18px Arial";
    ctx.fillText("💎 Gems : " + (playerGems || 0), 20, 90);

    // Affichage des contrôles - varient selon les features achetées
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "14px Arial";
    let controlsText = "Flèches: Bouger ";
    if (purchasedFeatures && purchasedFeatures.checkpoint) {
        controlsText += "| Espace: Checkpoint | R: Téléporter ";
    } else {
        controlsText += "| Espace: Checkpoint ❌ ";
    }
    if (purchasedFeatures && purchasedFeatures.dash) {
        controlsText += "| Shift: Dash";
    } else {
        controlsText += "| Shift: Dash ❌";
    }
    ctx.fillText(controlsText, 20, canvas.height - 20);

    // --- AFFICHAGE DU SHOP ---
    if (isShopOpen) {
        // Overlay semi-transparent
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Cadre du shop
        const shopWidth = 500;
        const shopHeight = 350;
        const shopX = (canvas.width - shopWidth) / 2;
        const shopY = (canvas.height - shopHeight) / 2;
        
        ctx.fillStyle = "#222";
        ctx.fillRect(shopX, shopY, shopWidth, shopHeight);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);
        
        // Titre du shop
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🏪 MAGASIN - Niveau " + level, canvas.width / 2, shopY + 40);
        
        // Affichage du timer
        ctx.fillStyle = shopTimeRemaining <= 5 ? "#FF0000" : "#FFD700";
        ctx.font = "bold 20px Arial";
        ctx.fillText("⏱️ " + shopTimeRemaining + "s", canvas.width / 2, shopY + 65);
        
        // Items du shop
        const itemList = [
            { id: 'dash', name: 'Dash ⚡', price: 5 },
            { id: 'checkpoint', name: 'Checkpoint 🚩', price: 3 },
            { id: 'rope', name: 'Corde 🪢', price: 1 },
            { id: 'speedBoost', name: 'Vitesse+ 💨', price: 2 }
        ];
        
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        itemList.forEach((item, index) => {
            const yPos = shopY + 100 + (index * 45);
            const color = playerGems >= item.price ? "#00FF00" : "#888";
            ctx.fillStyle = color;
            ctx.fillText(`${index + 1}. ${item.name} - ${item.price} gems`, shopX + 30, yPos);
        });
        
        // Instructions
        ctx.fillStyle = "#888";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Appuyez sur 1, 2, 3 ou 4 pour acheter", canvas.width / 2, shopY + shopHeight - 30);
    }

    // --- ÉCRAN DE TRANSITION ---
    if (isInTransition && transitionProgress < 1.0) {
        // Fond semi-transparent noir
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 + transitionProgress * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Message de transition
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const message = `${levelUpPlayerSkin} Gem récupérée en ${levelUpTime.toFixed(1)}s`;
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 80);
        
        // --- PODIUM ---
        const ranking = getRanking(players);
        const podiumX = canvas.width / 2;
        const podiumY = canvas.height / 2 + 20;
        
        // Positions des podiums (1er au centre, 2e à gauche, 3e à droite)
        const podiumPositions = [
            { x: podiumX, y: podiumY, medal: "🥇", height: 120 }, // 1er
            { x: podiumX - 150, y: podiumY + 30, medal: "🥈", height: 80 }, // 2e
            { x: podiumX + 150, y: podiumY + 30, medal: "🥉", height: 50 }  // 3e
        ];
        
        ranking.slice(0, 3).forEach((player, index) => {
            const pos = podiumPositions[index];
            
            // Piédestal
            ctx.fillStyle = index === 0 ? "#FFD700" : (index === 1 ? "#C0C0C0" : "#CD7F32");
            ctx.fillRect(pos.x - 40, pos.y, 80, pos.height);
            
            // Bordure
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - 40, pos.y, 80, pos.height);
            
            // Numéro de position
            ctx.fillStyle = "white";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(pos.medal, pos.x, pos.y - 30);
            
            // Skin du joueur
            ctx.font = "48px Arial";
            ctx.fillText(player.skin, pos.x, pos.y + pos.height / 2 - 20);
            
            // Score
            ctx.font = "bold 16px Arial";
            ctx.fillText(`${player.score}`, pos.x, pos.y + pos.height + 25);
        });
        
        // --- MA POSITION (si je ne suis pas dans les 3 premiers) ---
        const myRank = ranking.findIndex(p => p.id === myId);
        if (myRank > 2) {
            ctx.fillStyle = "#CCCCCC";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Vous êtes ${myRank + 1}e : ${ranking[myRank].skin} (${ranking[myRank].score} points)`, canvas.width / 2, podiumY + 150);
        }
        
        // Barre de chargement (agrandissement du niveau)
        const barWidth = 300;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 100;
        
        // Fond de la barre
        ctx.fillStyle = "#444";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barre de progression
        const progress = transitionProgress;
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Bordure
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Texte de la barre
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Niveau ${level}`, canvas.width / 2, barY + barHeight + 25);
    }

    // 9. Record
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right"; // On aligne à droite pour que ce soit propre
    ctx.fillText(`🏆 Record : ${safeRecord.score} ${safeRecord.skin}`, canvas.width - 20, 40);
}