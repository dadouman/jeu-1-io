// public/renderer.js

const TILE_SIZE = 40;

/**
 * Retourne les zones cliquables des items du shop
 * @param {number} canvasWidth 
 * @param {number} canvasHeight 
 * @returns {Array} Array de {id, rect: {x, y, width, height}}
 */
function getShopClickAreas(canvasWidth, canvasHeight) {
    const shopWidth = 500;
    const shopHeight = 350;
    const shopX = (canvasWidth - shopWidth) / 2;
    const shopY = (canvasHeight - shopHeight) / 2;
    
    const itemList = [
        { id: 'dash', name: 'Dash ⚡', price: 5 },
        { id: 'checkpoint', name: 'Checkpoint 🚩', price: 3 },
        { id: 'rope', name: 'Corde 🪢', price: 1 },
        { id: 'speedBoost', name: 'Vitesse+ 💨', price: 2 }
    ];
    
    return itemList.map((item, index) => {
        const yPos = shopY + 100 + (index * 45);
        return {
            id: item.id,
            rect: {
                x: shopX + 30,
                y: yPos - 20,
                width: 440,
                height: 40
            }
        };
    });
}

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

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime = 0, isFirstLevel = false, playerCountStart = 0, isVoteActive = false, voteTimeRemaining = 0, voteResult = null, soloRunTotalTime = 0, soloDeltaTime = null, soloDeltaReference = null, soloPersonalBestTime = null, soloLeaderboardBest = null, isSoloGameFinished = false) {
    
    // INITIALISER LE CONTEXTE POUR ÊTRE SÛR
    ctx.globalAlpha = 1.0;
    
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

    // 5. Map - Rendu optimisé avec murs continus sans séparations visuelles
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === 1) {
                // Mur - couleur principale
                ctx.fillStyle = "#3a3a3a";
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Ombres subtiles pour créer une profondeur sans bordures
                // Vérifier les voisins pour déterminer où ajouter les ombres
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

    // 5.5 Traces des joueurs (les corder qui suivent leur parcours)
    if (trails && Object.keys(trails).length > 0) {
        for (let playerId in trails) {
            const trail = trails[playerId];
            if (trail.positions && trail.positions.length > 1) {
                const savedGlobalAlpha = ctx.globalAlpha;
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
                // Restaurer globalAlpha IMMÉDIATEMENT après chaque trail
                ctx.globalAlpha = savedGlobalAlpha;
            }
        }
    }

    // 6. Pièce - Avec texture solide
    if (coin) {
        // Fond coloré pour la gem (texture solide)
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)"; // Or semi-opaque
        ctx.beginPath();
        ctx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure pour plus de définition
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Emoji gem par-dessus
        ctx.font = "26px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
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

    // 7. Joueurs - Afficher les joueurs selon le mode
    if (currentGameMode === 'solo') {
        // En solo: afficher le joueur au centre (après le brouillard)
        // (sera dessiné plus bas pour éviter le double rendu)
    } else {
        // En classique/infini: afficher tous les joueurs
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

    ctx.restore(); // Fin Caméra

    // === AFFICHAGE HUD DES FEATURES (Au-dessus du brouillard) ===
    renderFeaturesHUD(ctx, canvas, purchasedFeatures);

    // ASSURER que globalAlpha est à 1.0 pour l'interface
    ctx.globalAlpha = 1.0;

    // --- UI MINIMALISTE EN SOLO MODE ---
    if (currentGameMode === 'solo') {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        if (soloRunTotalTime >= 0) {
            // === LIGNE 1: Temps Total en couleur neutre (blanc/gris) ===
            const totalSeconds = Math.floor(soloRunTotalTime);
            const totalMinutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const milliseconds = Math.round((soloRunTotalTime - totalSeconds) * 1000);
            const timeFormatted = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
            
            ctx.fillStyle = "#CCCCCC"; // Couleur neutre (gris clair)
            ctx.font = "bold 32px Arial";
            ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 220);
            
            // === LIGNE 2: Delta du split actuel (niveau en cours) ===
            // CAS 1 : Run terminée (splits finalisés disponibles dans soloSplitTimes)
            if (isSoloGameFinished && soloSplitTimes && soloSplitTimes.length >= level) {
                // Les splits finalisés sont disponibles - afficher le temps du niveau avec delta
                // Les splits sont les temps INDIVIDUELS de chaque niveau (pas cumulatifs)
                const currentLevelTime = soloSplitTimes[level - 1];
                
                // Chercher le meilleur temps du NIVEAU
                let bestLevelTime = null;
                if (soloShowPersonalDelta && soloPersonalBestSplits && soloPersonalBestSplits[level]) {
                    bestLevelTime = soloPersonalBestSplits[level];
                } else if (soloBestSplits && soloBestSplits[level]) {
                    bestLevelTime = soloBestSplits[level];
                }
                
                // Afficher avec delta si on a une référence
                if (bestLevelTime && bestLevelTime > 0) {
                    const levelDelta = currentLevelTime - bestLevelTime;
                    const deltaSeconds = Math.floor(Math.abs(levelDelta));
                    const deltaMinutes = Math.floor(deltaSeconds / 60);
                    const deltaSecs = deltaSeconds % 60;
                    const deltaMilliseconds = Math.round((Math.abs(levelDelta) - deltaSeconds) * 1000);
                    const deltaFormatted = `${levelDelta >= 0 ? '+' : '-'}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
                    
                    const deltaColor = levelDelta >= 0 ? '#FF6B6B' : '#00FF00';
                    ctx.fillStyle = deltaColor;
                    ctx.font = "bold 24px Arial";
                    ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 + 260);
                } else {
                    // Pas de meilleur temps, afficher le temps du niveau sans delta
                    const levelSeconds = Math.floor(currentLevelTime);
                    const levelMinutes = Math.floor(levelSeconds / 60);
                    const levelSecs = levelSeconds % 60;
                    const levelMilliseconds = Math.round((currentLevelTime - levelSeconds) * 1000);
                    const levelFormatted = `${levelMinutes.toString().padStart(2, '0')}:${levelSecs.toString().padStart(2, '0')}.${levelMilliseconds.toString().padStart(3, '0')}`;
                    
                    ctx.fillStyle = "#CCCCCC";
                    ctx.font = "bold 24px Arial";
                    ctx.fillText(levelFormatted, canvas.width / 2, canvas.height / 2 + 260);
                }
            }
            // CAS 2 : Run en cours - afficher le temps du niveau actuel avec delta
            else if (currentLevelTime > 0 && level > 1) {
                // Chercher le meilleur temps pour ce niveau dans les splits mondiaux
                // Les splits sont les temps INDIVIDUELS de chaque niveau (pas cumulatifs)
                let bestLevelTime = null;
                
                if (soloBestSplits && soloBestSplits[level]) {
                    bestLevelTime = soloBestSplits[level];
                }
                
                // Afficher le delta du niveau actuel si on a une référence
                if (bestLevelTime && bestLevelTime > 0) {
                    const levelDelta = currentLevelTime - bestLevelTime;
                    const deltaSeconds = Math.floor(Math.abs(levelDelta));
                    const deltaMinutes = Math.floor(deltaSeconds / 60);
                    const deltaSecs = deltaSeconds % 60;
                    const deltaMilliseconds = Math.round((Math.abs(levelDelta) - deltaSeconds) * 1000);
                    const deltaFormatted = `${levelDelta >= 0 ? '+' : '-'}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
                    
                    const deltaColor = levelDelta >= 0 ? '#FF6B6B' : '#00FF00';
                    ctx.fillStyle = deltaColor;
                    ctx.font = "bold 24px Arial";
                    ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 + 260);
                } else {
                    // Pas de référence, afficher juste le temps du niveau actuel
                    const levelSeconds = Math.floor(currentLevelTime);
                    const levelMinutes = Math.floor(levelSeconds / 60);
                    const levelSecs = levelSeconds % 60;
                    const levelMilliseconds = Math.round((currentLevelTime - levelSeconds) * 1000);
                    const levelFormatted = `${levelMinutes.toString().padStart(2, '0')}:${levelSecs.toString().padStart(2, '0')}.${levelMilliseconds.toString().padStart(3, '0')}`;
                    
                    ctx.fillStyle = "#CCCCCC";
                    ctx.font = "bold 24px Arial";
                    ctx.fillText(levelFormatted, canvas.width / 2, canvas.height / 2 + 260);
                }
            }
            // CAS 3 : Premier niveau - pas de delta possible
            else if (currentLevelTime > 0) {
                // Afficher juste le temps du premier niveau
                const levelSeconds = Math.floor(currentLevelTime);
                const levelMinutes = Math.floor(levelSeconds / 60);
                const levelSecs = levelSeconds % 60;
                const levelMilliseconds = Math.round((currentLevelTime - levelSeconds) * 1000);
                const levelFormatted = `${levelMinutes.toString().padStart(2, '0')}:${levelSecs.toString().padStart(2, '0')}.${levelMilliseconds.toString().padStart(3, '0')}`;
                
                ctx.fillStyle = "#CCCCCC";
                ctx.font = "bold 24px Arial";
                ctx.fillText(levelFormatted, canvas.width / 2, canvas.height / 2 + 260);
            }
            
            // === LIGNE 3: Niveau actuel en or ===
            ctx.fillStyle = "#FFD700"; // Or
            ctx.font = "bold 20px Arial";
            ctx.fillText(`Niveau ${level} / ${soloMaxLevel}`, canvas.width / 2, canvas.height / 2 + 295);
        }
        
        // === AFFICHAGE TEMPORAIRE DU DELTA APRÈS AVOIR PRIS UNE GEM (1-2s) ===
        if (currentGameMode === 'solo' && soloLastGemTime && soloLastGemLevel) {
            const timeSinceGem = Date.now() - soloLastGemTime;
            const DISPLAY_DURATION = 1500; // 1.5 secondes
            
            if (timeSinceGem < DISPLAY_DURATION) {
                // Calculer le delta du niveau complété
                const completedLevel = soloLastGemLevel;
                let bestLevelTime = null;
                
                // Chercher le meilleur temps pour ce niveau dans les splits mondiaux
                // Les splits sont les temps INDIVIDUELS de chaque niveau (pas cumulatifs)
                if (soloBestSplits && soloBestSplits[completedLevel]) {
                    bestLevelTime = soloBestSplits[completedLevel];
                }
                
                // Si on a un meilleur temps de référence, afficher le delta
                if (bestLevelTime && bestLevelTime > 0) {
                    // Le temps était enregistré au moment de la gem (levelUpTime)
                    const playerLevelTime = levelUpTime || 0;
                    const levelDelta = playerLevelTime - bestLevelTime;
                    
                    const deltaSeconds = Math.floor(Math.abs(levelDelta));
                    const deltaMinutes = Math.floor(deltaSeconds / 60);
                    const deltaSecs = deltaSeconds % 60;
                    const deltaMilliseconds = Math.round((Math.abs(levelDelta) - deltaSeconds) * 1000);
                    const deltaFormatted = `${levelDelta >= 0 ? '+' : '-'}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
                    
                    // Affichage avec animation de fade-out
                    const fadeAlpha = 1.0 - (timeSinceGem / DISPLAY_DURATION); // Fade from 1 to 0
                    const deltaColor = levelDelta >= 0 ? '#FF6B6B' : '#00FF00';
                    
                    ctx.globalAlpha = fadeAlpha;
                    ctx.fillStyle = deltaColor;
                    ctx.font = "bold 48px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 - 100);
                }
            } else {
                // Réinitialiser après la durée d'affichage
                soloLastGemTime = null;
                soloLastGemLevel = null;
            }
        }
        
        // TOUJOURS réinitialiser globalAlpha à 1.0 après l'affichage du delta
        ctx.globalAlpha = 1.0;
    }
    
    ctx.textAlign = "left";
    
    // Redessiner le joueur EN DEHORS du brouillard pour qu'il soit opaque
    if (currentGameMode === 'solo' && myPlayer) {
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Position du joueur au centre de l'écran
        ctx.fillText(myPlayer.skin, canvas.width / 2, canvas.height / 2);
    }
    
    // --- AFFICHAGE DU SHOP ---
    if (isShopOpen) {
        renderShop(ctx, canvas, level, playerGems, shopTimeRemaining);
    }

    // --- ÉCRAN DE RÉSULTATS SOLO ---
    if (isSoloGameFinished) {
        renderSoloResults(ctx, canvas, soloTotalTime, soloPersonalBestTime, soloSplitTimes);
        return; // Ne pas afficher le reste du jeu
    }

    // --- ÉCRAN DE TRANSITION ---
    if (isInTransition && transitionProgress < 1.0 && soloRunTotalTime === 0) {
        renderTransition(ctx, canvas, level, isFirstLevel, playerCountStart, levelUpPlayerSkin, levelUpTime, players, myId, transitionProgress);
    }

    // --- AFFICHAGE DU VOTE EN BAS ---
    if (isVoteActive) {
        renderVoting(ctx, canvas, voteTimeRemaining);
    }

    // --- AFFICHAGE DU RÉSULTAT DU VOTE ---
    if (voteResult) {
        renderVoteResult(ctx, canvas, voteResult);
    }

    // 9. Record - COMMENTÉ (affichage supprimé pour UI propre)
    // Toute la logique reste intacte pour restauration future
    /*
    if (soloRunTotalTime > 0 || currentGameMode === 'solo') {
        // En solo: afficher le meilleur temps (personnel ou world record)
        const isSoloMode = currentGameMode === 'solo';
        
        if (isSoloMode) {
            // Déterminer quel record afficher
            const displayPersonal = soloShowPersonalDelta || !soloLeaderboardBest;
            const bestTime = displayPersonal ? soloPersonalBestTime : soloLeaderboardBest;
            const recordLabel = displayPersonal ? '🎯 Personal Best' : '🌍 World Record';
            const recordColor = displayPersonal ? '#00FF00' : '#FF0000';
            
            // Ligne 1: Meilleur temps (plus grand)
            ctx.fillStyle = recordColor;
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "right";
            
            if (bestTime) {
                ctx.fillText(`${recordLabel}: ${bestTime.toFixed(2)}s`, canvas.width - 20, 40);
                
                // Ligne 2: Split du niveau actuel (plus petit)
                ctx.fillStyle = recordColor;
                ctx.font = "14px Arial";
                ctx.textAlign = "right";
                
                // Récupérer le split du niveau actuel depuis soloLeaderboard ou soloLeaderboardSplits
                let splitText = `Level ${level}/10`;
                
                // Si on a les splits disponibles
                if (displayPersonal && window.soloLeaderboard && window.soloLeaderboard.length > 0) {
                    const personalRun = window.soloLeaderboard.find(run => 
                        Math.abs(run.totalTime - soloPersonalBestTime) < 0.1
                    );
                    if (personalRun && personalRun.splitTimes && personalRun.splitTimes[level - 1]) {
                        splitText = `L${level}: ${personalRun.splitTimes[level - 1].toFixed(1)}s`;
                    }
                } else if (!displayPersonal && window.soloBestSplits && window.soloBestSplits[level]) {
                    splitText = `L${level}: ${window.soloBestSplits[level].toFixed(1)}s`;
                }
                
                ctx.fillText(splitText, canvas.width - 20, 58);
                
                // Afficher le toggle info
                ctx.fillStyle = "#888";
                ctx.font = "12px Arial";
                ctx.fillText("Press T to toggle", canvas.width - 20, 74);
            } else {
                ctx.fillStyle = "#FFD700";
                ctx.font = "bold 20px Arial";
                ctx.fillText("No record yet", canvas.width - 20, 40);
            }
        }
    } else if (currentGameMode === 'classic') {
        // En CLASSIQUE: afficher le meilleur score (personnel ou world record)
        ctx.textAlign = "right";
        
        // Déterminer quel record afficher
        const displayPersonal = classicShowPersonalDelta || !safeRecord.score;
        const bestScore = displayPersonal ? classicPersonalBestScore : safeRecord.score;
        const recordLabel = displayPersonal ? '🎯 Personal Best' : '🌍 World Record';
        const recordColor = displayPersonal ? '#00FF00' : '#FF0000';
        
        // Ligne 1: Meilleur score (plus grand)
        ctx.fillStyle = recordColor;
        ctx.font = "bold 20px Arial";
        
        if (bestScore) {
            ctx.fillText(`${recordLabel}: ${bestScore}💎`, canvas.width - 20, 40);
            
            // Ligne 2: Gems du niveau actuel (plus petit)
            ctx.fillStyle = recordColor;
            ctx.font = "14px Arial";
            
            // En classique, on gagne 1 gem par niveau
            // Donc pour le niveau N, on a N gems au total si on en a jamais perdu
            const gemsForCurrentLevel = 1; // 1 gem par niveau
            const gemsText = `L${level}: ${gemsForCurrentLevel}💎`;
            
            ctx.fillText(gemsText, canvas.width - 20, 58);
            
            // Afficher le toggle info
            ctx.fillStyle = "#888";
            ctx.font = "12px Arial";
            ctx.fillText("Press T to toggle", canvas.width - 20, 74);
        } else {
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 20px Arial";
            ctx.fillText("No record yet", canvas.width - 20, 40);
        }
    } else if (currentGameMode === 'infinite') {
        // En INFINI: afficher le score record (pas de toggle, juste le meilleur)
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`🏆 Record : ${safeRecord.score} ${safeRecord.skin}`, canvas.width - 20, 40);
    }
    */
}

/**
 * Affiche le HUD des features en haut du canvas
 * Montre toutes les features disponibles avec un indicateur de déverrouillage
 * Pour la vitesse, affiche le nombre de fois débloquées si > 0
 */
function renderFeaturesHUD(ctx, canvas, purchasedFeatures) {
    const FEATURES = [
        { id: 'dash', emoji: '⚡', label: 'Dash', color: '#FF6B6B' },
        { id: 'checkpoint', emoji: '🚩', label: 'Check', color: '#00D4FF' },
        { id: 'rope', emoji: '🪢', label: 'Rope', color: '#9B59B6' },
        { id: 'speedBoost', emoji: '💨', label: 'Speed', color: '#FFD700', isStackable: true }
    ];

    const HUD_TOP = 15;
    const BOX_SIZE = 50;
    const BOX_SPACING = 70;
    const START_X = 20;

    // Helper: Dessiner un rectangle arrondi
    const drawRoundRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    // Iterate through each feature
    FEATURES.forEach((feature, index) => {
        const x = START_X + (index * BOX_SPACING);
        const y = HUD_TOP;

        const isUnlocked = feature.id === 'speedBoost' 
            ? purchasedFeatures[feature.id] > 0 
            : purchasedFeatures[feature.id] === true;

        // === BOÎTE DE FOND ===
        if (isUnlocked) {
            // Unlocked: fond semi-opaque coloré
            ctx.fillStyle = feature.color + '33'; // Couleur avec transparence
            ctx.strokeStyle = feature.color;
            ctx.lineWidth = 2;
        } else {
            // Locked: fond gris et bordure grise
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
        }

        // Dessiner la boîte arrondie
        drawRoundRect(x, y, BOX_SIZE, BOX_SIZE, 5);
        ctx.fill();
        ctx.stroke();

        // === EMOJI DE LA FEATURE ===
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isUnlocked ? feature.color : '#666666';
        ctx.fillText(feature.emoji, x + BOX_SIZE / 2, y + BOX_SIZE / 2 - 5);

        // === TEXTE EN BAS DE LA BOÎTE ===
        ctx.font = "bold 10px Arial";
        ctx.fillStyle = isUnlocked ? feature.color : '#888888';
        ctx.fillText(feature.label, x + BOX_SIZE / 2, y + BOX_SIZE - 8);

        // === INDICATEUR DE DÉVERROUILLAGE ===
        if (!isUnlocked) {
            // Afficher le cadenas aussi gros que l'emoji, au-dessus du cercle
            ctx.font = "28px Arial";
            ctx.fillStyle = '#FF6B6B';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText('🔒', x + BOX_SIZE / 2, y + BOX_SIZE / 2 - 12);
        } else if (feature.isStackable && purchasedFeatures[feature.id] > 0) {
            // Pour la vitesse: afficher le nombre de fois débloquées
            ctx.font = "bold 12px Arial";
            ctx.fillStyle = feature.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`x${purchasedFeatures[feature.id]}`, x + BOX_SIZE / 2, y + BOX_SIZE - 22);
        }
    });
}