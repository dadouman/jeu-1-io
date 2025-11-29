const TILE_SIZE = 40;

function renderGame(ctx, canvas, map, players, coin, myId) {
    const myPlayer = players[myId];
    if (!myPlayer || map.length === 0) return;

    // --- LE MOUCHARD ---
    // Affiche les coordonnées dans la console du navigateur (F12)
    //console.log("Ma position :", Math.floor(myPlayer.x), Math.floor(myPlayer.y));
    // -------------------

    // 1. Nettoyer l'écran (Fond noir total)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // -- DÉBUT TRANSFORMATION --

    // 2. LE BROUILLARD (Effet masque)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 90, 0, Math.PI * 2); // Rayon de 90pxd
    ctx.clip(); // Tout ce qui est dessiné après ne sera visible que DANS le cercle

    // 3. Fond visible (Sol)
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. LA CAMÉRA (On déplace le monde pour centrer le joueur)
    const camX = canvas.width / 2 - myPlayer.x;
    const camY = canvas.height / 2 - myPlayer.y;
    ctx.translate(camX, camY);

    // 5. Dessiner la MAP
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === 1) { // Mur
                ctx.fillStyle = "#555";
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#333";
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 6. Dessiner la PIÈCE
    ctx.font = "30px Arial";
    ctx.fillText("💎", coin.x, coin.y + 30);

    // 7. Dessiner les JOUEURS
    for (let id in players) {
        const p = players[id];
        ctx.font = "30px Arial";
        ctx.fillText(p.skin, p.x, p.y + 30);
        
        // Pseudo score
        //ctx.fillStyle = "white";
        //ctx.font = "12px Arial";
        //ctx.fillText(p.score, p.x + 10, p.y);

        
        // ====================================================
    }

    ctx.restore(); // -- FIN TRANSFORMATION --

    // 8. INTERFACE (UI) - Dessiné par dessus le brouillard
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score : " + myPlayer.score, 20, 40);
}