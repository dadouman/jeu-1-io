// public/renderer.js

const TILE_SIZE = 40;

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint) {
    
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

    // Affichage des contrôles Checkpoint
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "14px Arial";
    ctx.fillText("Espace: Créer/Déplacer checkpoint | R: Téléporter", 20, canvas.height - 20);

    // 9. Record
    ctx.fillStyle = "#FFD700"; // Or
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right"; // On aligne à droite pour que ce soit propre
    ctx.fillText(`🏆 Record : ${safeRecord.score} ${safeRecord.skin}`, canvas.width - 20, 40);
}