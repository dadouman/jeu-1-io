// public/renderer.js

const TILE_SIZE = 40;

function renderGame(ctx, canvas, map, players, coin, myId, highScore) {
    
    // 1. Fond noir
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- DIAGNOSTIC À L'ÉCRAN (Plus besoin de F12) ---
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    let yLog = 30;

    // Affiche l'état des variables vitales
    ctx.fillText(`État du jeu :`, 20, yLog); yLog += 25;
    ctx.fillText(`- Mon ID : ${myId ? myId : "EN ATTENTE..."}`, 20, yLog); yLog += 25;
    ctx.fillText(`- Map chargée : ${map && map.length > 0 ? "OUI (" + map.length + ")" : "NON"}`, 20, yLog); yLog += 25;
    ctx.fillText(`- Joueurs connus : ${players ? Object.keys(players).length : "AUCUN"}`, 20, yLog); yLog += 25;
    
    if (!players || !map || map.length === 0 || !myId || !players[myId]) {
        ctx.fillStyle = "yellow";
        ctx.fillText("⚠️ EN ATTENTE DE DONNÉES DU SERVEUR...", 20, yLog + 20);
        return; // On arrête là tant qu'on n'a pas tout
    }
    // -------------------------

    const myPlayer = players[myId];

    // GESTION DU RECORD MANQUANT (Pour éviter l'écran noir si MongoDB est lent)
    // Si highScore est vide, on invente un faux record à 0
    let safeRecord = highScore || { score: 0, skin: "❓" };

    ctx.save(); // Sauvegarde Caméra

    // 2. Brouillard
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 180, 0, Math.PI * 2);
    ctx.clip();

    // 3. Sol
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Caméra
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
    if (coin) { // Sécurité si la pièce n'est pas encore là
        ctx.font = "30px Arial";
        ctx.fillText("💎", coin.x, coin.y + 30);
    }

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

    // 9. Record (Utilise la version sécurisée 'safeRecord')
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`🏆 Record : ${safeRecord.score} ${safeRecord.skin}`, canvas.width - 250, 40);
}