// public/renderer.js

const TILE_SIZE = 40;

// La fonction qui dessine tout
function renderGame(ctx, canvas, map, players, coin, myId, highScore) {
    
    // --- BOUCLIER ANTI-BUG ---
    if (!players || !map || !coin) return;
    if (map.length === 0) return;
    if (!myId) return;
    const myPlayer = players[myId];
    if (!myPlayer) return;
    // -------------------------

    // 1. Fond noir
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // Sauvegarde Caméra

    // 2. Brouillard
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
                ctx.fillStyle = "#555";
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#333";
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 6. Pièce
    ctx.font = "30px Arial";
    ctx.fillText("💎", coin.x, coin.y + 30);

    // 7. Joueurs
    for (let id in players) {
        const p = players[id];
        ctx.font = "30px Arial";
        ctx.fillText(p.skin, p.x, p.y + 30);
        
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(p.score, p.x + 10, p.y);
    }

    ctx.restore(); // Fin Caméra

    // 8. Interface (UI)
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score : " + myPlayer.score, 20, 40);

    // 9. Record
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    const recordText = highScore ? `${highScore.score} ${highScore.skin}` : "0";
    ctx.fillText(`🏆 Record : ${recordText}`, canvas.width - 250, 40);
}