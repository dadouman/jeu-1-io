// public/renderer.js

const TILE_SIZE = 40;

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint, trails, isShopOpen, playerGems) {
    
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

    // Affichage des contrôles Checkpoint
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "14px Arial";
    ctx.fillText("Espace: Créer/Déplacer checkpoint | R: Téléporter | Shift: Dash", 20, canvas.height - 20);

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
            const yPos = shopY + 80 + (index * 50);
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

    // 9. Record
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right"; // On aligne à droite pour que ce soit propre
    ctx.fillText(`🏆 Record : ${safeRecord.score} ${safeRecord.skin}`, canvas.width - 20, 40);
}