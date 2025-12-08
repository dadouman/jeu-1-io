/**
 * map-renderer.js
 * Handles rendering of the game map (tiles, shadows, trails)
 */

const TILE_SIZE = 40;

/**
 * Rend la map avec ombres subtiles
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} map - 2D array représentant la map
 */
function renderMap(ctx, map) {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === 1) {
                // Mur - couleur principale
                ctx.fillStyle = "#3a3a3a";
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Ombres subtiles pour créer une profondeur sans bordures
                const hasTopWall = y > 0 && map[y - 1][x] === 1;
                const hasLeftWall = x > 0 && map[y][x - 1] === 1;
                const hasBottomWall = y < map.length - 1 && map[y + 1][x] === 1;
                const hasRightWall = x < map[0].length - 1 && map[y][x + 1] === 1;
                
                // Ombre en haut-gauche (bord exposé)
                if (!hasTopWall || !hasLeftWall) {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 2);
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, 2, TILE_SIZE);
                }
                
                // Highlight en bas-droite (bord intérieur)
                if (!hasBottomWall || !hasRightWall) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 2, TILE_SIZE, 2);
                    ctx.fillRect(x * TILE_SIZE + TILE_SIZE - 2, y * TILE_SIZE, 2, TILE_SIZE);
                }
            }
        }
    }
}

/**
 * Rend les traces des joueurs
 * @param {CanvasRenderingContext2D} ctx 
 * @param {object} trails - Map des trails par playerId
 */
function renderTrails(ctx, trails) {
    if (!trails || Object.keys(trails).length === 0) return;
    
    for (let playerId in trails) {
        const trail = trails[playerId];
        if (trail.positions && trail.positions.length > 1) {
            const savedGlobalAlpha = ctx.globalAlpha;
            ctx.strokeStyle = trail.color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            
            ctx.beginPath();
            ctx.moveTo(trail.positions[0].x + TILE_SIZE/2, trail.positions[0].y + TILE_SIZE/2);
            for (let i = 1; i < trail.positions.length; i++) {
                ctx.lineTo(trail.positions[i].x + TILE_SIZE/2, trail.positions[i].y + TILE_SIZE/2);
            }
            ctx.stroke();
            ctx.globalAlpha = savedGlobalAlpha;
        }
    }
}

/**
 * Rend la gem
 * @param {CanvasRenderingContext2D} ctx 
 * @param {object} coin - Position de la gem {x, y}
 */
function renderCoin(ctx, coin) {
    if (!coin) return;
    
    ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
    ctx.beginPath();
    ctx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, 16, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💎", coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2);
}

/**
 * Rend le checkpoint
 * @param {CanvasRenderingContext2D} ctx 
 * @param {object} checkpoint - Position du checkpoint {x, y}
 */
function renderCheckpoint(ctx, checkpoint) {
    if (!checkpoint) return;
    
    ctx.fillStyle = "rgba(255, 100, 200, 0.3)";
    ctx.beginPath();
    ctx.arc(checkpoint.x + TILE_SIZE/2, checkpoint.y + TILE_SIZE/2, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚩", checkpoint.x + TILE_SIZE/2, checkpoint.y + TILE_SIZE/2);
}
