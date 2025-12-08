/**
 * players-renderer.js
 * Handles rendering of player skins and scores
 */

const TILE_SIZE = 40;

/**
 * Rend tous les joueurs (sauf en solo)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {object} players 
 * @param {string} currentGameMode 
 */
function renderPlayers(ctx, players, currentGameMode) {
    if (currentGameMode === 'solo') return; // Solo players rendus différemment
    
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
}

/**
 * Rend le joueur solo au centre de l'écran (opaque, hors brouillard)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {object} myPlayer 
 * @param {string} currentGameMode 
 */
function renderSoloPlayer(ctx, canvas, myPlayer, currentGameMode) {
    if (currentGameMode !== 'solo' || !myPlayer) return;
    
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(myPlayer.skin, canvas.width / 2, canvas.height / 2);
}
