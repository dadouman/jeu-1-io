// server/game-loops/lobby-loop.js
// Boucle de jeu pour modes classique et infini

const { generateMaze, getRandomEmptyPosition } = require('../../utils/map');
const { resetPlayerForNewLevel, addScore } = require('../../utils/player');
const { calculateGemsForLevel, addGems } = require('../../utils/gems');
const { isShopLevel } = require('../../utils/shop');
const { getGameModeConfig } = require('../../config/gameModes');

function processLobbyGameLoop(lobbies, io, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    TRANSITION_DURATION, 
    SHOP_DURATION 
}) {
    // --- TRAITEMENT DES LOBBIES CLASSIQUE, INFINI ET PERSONNALISÉ ---
    for (const mode of ['classic', 'infinite', 'custom']) {
        const lobby = lobbies[mode];
        if (!lobby) continue; // Ignorer si le lobby n'existe pas
        
        let recordChanged = false;
        let levelChanged = false;
        
        // Récupérer les limites du mode depuis la configuration
        let maxLevels;
        if (mode === 'custom' && lobby.customConfig) {
            maxLevels = lobby.customConfig.maxLevels;
        } else {
            const modeConfig = getGameModeConfig(mode);
            maxLevels = modeConfig && modeConfig.maxLevels ? modeConfig.maxLevels : Infinity;
        }

        for (const id in lobby.players) {
            const p = lobby.players[id];
            const dist = Math.hypot(p.x - lobby.coin.x, p.y - lobby.coin.y);
            
            // --- COLLISION AVEC LA PIÈCE ---
            if (dist < 30) {
                addScore(p, 1);
                
                // SYSTÈME DE GEMS : À chaque niveau, on gagne des gems
                const gemsEarned = calculateGemsForLevel(lobby.currentLevel);
                addGems(p, gemsEarned);
                
                // Afficher les stats de progression
                const isShopAfterThisLevel = isShopLevel(lobby.currentLevel);
                console.log(`✨ [PROGRESSION ${mode}] ${p.skin} Niveau ${lobby.currentLevel} complété en ${(Date.now() / 1000).toFixed(0)}s | +${gemsEarned}💎 (Total: ${p.gems}💎)${isShopAfterThisLevel ? ' | 🏪 Magasin après ce niveau!' : ''}`);
                
                // 1. ON AUGMENTE LE NIVEAU
                console.log(`🔢 [PRE-INCREMENT] Mode: ${mode}, currentLevel AVANT: ${lobby.currentLevel}`);
                lobby.currentLevel++;
                console.log(`🔢 [POST-INCREMENT] Mode: ${mode}, currentLevel APRÈS: ${lobby.currentLevel}`);
                levelChanged = true;

                // 2. VÉRIFIER SI LE JEU EST TERMINÉ (Selon le mode)
                if (maxLevels !== Infinity && lobby.currentLevel > maxLevels) {
                    emitToLobby(mode, 'gameFinished', { finalLevel: maxLevels, mode: mode }, io, lobbies);
                    lobby.currentLevel = maxLevels; // Rester au max level
                    break;
                }

                // 3. ON AGRANDIT LE LABYRINTHE SELON LE MODE
                const mazeSize = calculateMazeSize(lobby.currentLevel, mode, lobby);
                lobby.map = generateMaze(mazeSize.width, mazeSize.height);
                
                // 3. ON DÉPLACE LA PIÈCE
                lobby.coin = getRandomEmptyPosition(lobby.map);

                // 4. ON TÉLÉPORTE TOUS LES JOUEURS (Sécurité anti-mur)
                for (let pid in lobby.players) {
                    const safePos = getRandomEmptyPosition(lobby.map);
                    resetPlayerForNewLevel(lobby.players[pid], safePos);
                }

                // Gestion Record
                if (p.score > lobby.currentRecord.score) {
                    lobby.currentRecord.score = p.score;
                    lobby.currentRecord.skin = p.skin;
                    recordChanged = true;
                }
                
                break; 
            }
        }

        // SI LE NIVEAU A CHANGÉ
        if (levelChanged) {
            console.log(`📢 [ÉMISSION] Mode: ${mode}, Émission levelUpdate avec level: ${lobby.currentLevel}`);
            emitToLobby(mode, 'mapData', lobby.map, io, lobbies);
            emitToLobby(mode, 'levelUpdate', lobby.currentLevel, io, lobbies);
            
            // VÉRIFIER SI LE NIVEAU QU'ON VIENT DE COMPLÉTER est un niveau de MAGASIN
            const completedLevel = lobby.currentLevel - 1;
            const isShopLvl = isShopLevel(completedLevel);
            console.log(`🏪 [CHECK SHOP] Mode: ${mode}, Niveau complété: ${completedLevel}, isShopLevel: ${isShopLvl}`);
            if (isShopLvl) {
                console.log(`🏪 [SHOP TRIGGER] Mode: ${mode}, MAGASIN VA S'OUVRIR après le niveau ${completedLevel}`);
                emitToLobby(mode, 'shopOpen', { items: getShopItemsForMode(mode), level: completedLevel }, io, lobbies);
                console.log(`\n🏪 ════════════════════════════════════\n   MAGASIN OUVERT [${mode}] - Après Niveau ${completedLevel}\n   Les joueurs ont 15 secondes pour acheter!\n════════════════════════════════════\n`);
            } else {
                // Afficher la vraie taille depuis la configuration
                const mazeSize = calculateMazeSize(lobby.currentLevel, mode, lobby);
                console.log(`🌍 [NIVEAU ${lobby.currentLevel} ${mode}] Labyrinthe ${mazeSize.width}x${mazeSize.height} généré`);
            }
        }

        // SI LE RECORD A CHANGÉ
        if (recordChanged) {
            emitToLobby(mode, 'highScoreUpdate', lobby.currentRecord, io, lobbies);
            if (mongoURI) {
                HighScoreModel.updateOne({}, { score: lobby.currentRecord.score, skin: lobby.currentRecord.skin }).exec();
            }
        }

        emitToLobby(mode, 'state', { players: lobby.players, coin: lobby.coin }, io, lobbies);
    }
}

module.exports = { processLobbyGameLoop };
