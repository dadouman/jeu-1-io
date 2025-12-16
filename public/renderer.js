// public/renderer.js

/**
 * Retourne les zones cliquables des items du shop
 * @param {number} canvasWidth 
 * @param {number} canvasHeight 
 * @returns {Array} Array de {id, rect: {x, y, width, height}}
 */
function getShopClickAreas(canvasWidth, canvasHeight) {
    const shopWidth = 600;
    const shopHeight = 400;
    const shopX = (canvasWidth - shopWidth) / 2;
    const shopY = (canvasHeight - shopHeight) / 2;
    
    const itemList = [
        { id: 'dash', name: 'Dash ⚡', price: 5 },
        { id: 'checkpoint', name: 'Checkpoint 🚩', price: 3 },
        { id: 'compass', name: 'Boussole 🧭', price: 4 },
        { id: 'rope', name: 'Corde 🪢', price: 1 },
        { id: 'speedBoost', name: 'Vitesse+ 💨', price: 2 }
    ];
    
    const BOX_SIZE = 90;
    const BOX_SPACING = 110;
    const ITEMS_Y = shopY + 130;
    const TOTAL_WIDTH = (itemList.length * BOX_SPACING) - BOX_SPACING + BOX_SIZE;
    const CENTER_X = shopX + (shopWidth - TOTAL_WIDTH) / 2;
    
    return itemList.map((item, index) => {
        const x = CENTER_X + (index * BOX_SPACING);
        const y = ITEMS_Y;
        return {
            id: item.id,
            rect: {
                x: x,
                y: y,
                width: BOX_SIZE,
                height: BOX_SIZE
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

function renderCompassIndicator(ctx, player, target) {
    if (!player || !target) return;
    const playerCenterX = player.x + TILE_SIZE / 2;
    const playerCenterY = player.y + TILE_SIZE / 2;
    const targetCenterX = target.x + TILE_SIZE / 2;
    const targetCenterY = target.y + TILE_SIZE / 2;
    const dx = targetCenterX - playerCenterX;
    const dy = targetCenterY - playerCenterY;
    if (dx === 0 && dy === 0) return;

    const angle = Math.atan2(dy, dx);
    const offset = TILE_SIZE * 0.7;
    const arrowLength = TILE_SIZE * 0.9;
    const baseX = playerCenterX + Math.cos(angle) * offset;
    const baseY = playerCenterY + Math.sin(angle) * offset;
    const tipX = playerCenterX + Math.cos(angle) * (offset + arrowLength);
    const tipY = playerCenterY + Math.sin(angle) * (offset + arrowLength);

    const wingAngle = Math.PI / 6;
    const wingLength = 14;
    const leftX = tipX - Math.cos(angle - wingAngle) * wingLength;
    const leftY = tipY - Math.sin(angle - wingAngle) * wingLength;
    const rightX = tipX - Math.cos(angle + wingAngle) * wingLength;
    const rightY = tipY - Math.sin(angle + wingAngle) * wingLength;

    ctx.save();
    ctx.strokeStyle = '#2ECC71';
    ctx.fillStyle = '#2ECC71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playerCenterX, playerCenterY);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime = 0, isFirstLevel = false, playerCountStart = 0, isVoteActive = false, voteTimeRemaining = 0, voteResult = null, soloRunTotalTime = 0, soloDeltaTime = null, soloDeltaReference = null, soloPersonalBestTime = null, soloLeaderboardBest = null, isSoloGameFinished = false, soloCurrentLevelTime = 0, currentGameMode = null, soloStartCountdownActive = false, soloStartCountdownElapsed = 0) {
    
    // INITIALISER LE CONTEXTE POUR ÊTRE SÛR
    ctx.globalAlpha = 1.0;
    
    // 1. Fond noir
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === AFFICHER LE COUNTDOWN MULTI-PHASE (SUR LE JEU) ===
    // Le jeu est rendu en dessous, le countdown est un overlay transparent
    if (soloStartCountdownActive && typeof renderCountdownMultiPhase === 'function') {
        // Rendre le jeu d'abord (COMPLÈTEMENT)
        // Puis overlay le countdown par-dessus (voir fin de function)
    }

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

    ctx.save(); // Sauvegarde Caméra + Clipping

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

    // 5. Map rendering
    if (typeof renderMap === 'function') {
        renderMap(ctx, map);
    }

    // 5.5 Trails rendering
    if (typeof renderTrails === 'function') {
        renderTrails(ctx, trails);
    }

    // 6. Coin (Gem) rendering
    if (typeof renderCoin === 'function') {
        renderCoin(ctx, coin);
    }

    // 6.5 Checkpoint rendering
    if (typeof renderCheckpoint === 'function') {
        renderCheckpoint(ctx, checkpoint);
    }

    // 7. Players rendering
    if (typeof renderPlayers === 'function') {
        renderPlayers(ctx, players, currentGameMode);
    }

    if (purchasedFeatures && purchasedFeatures.compass && myPlayer) {
        renderCompassIndicator(ctx, myPlayer, coin);
    }

    ctx.restore(); // Fin Caméra + Fin clipping

    // === AFFICHAGE DU JOUEUR OPAQUE AU CENTRE (SOLO UNIQUEMENT) ===
    // En mode solo, le joueur est rendu séparément au centre de l'écran (hors brouillard)
    // En mode classic/infinite, les joueurs sont déjà rendus par renderPlayers()
    if (currentGameMode === 'solo') {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (myPlayer && myPlayer.skin) {
            ctx.fillText(myPlayer.skin, canvas.width / 2, canvas.height / 2);
        } else {
            // Fallback si pas de skin
            ctx.fillText("😊", canvas.width / 2, canvas.height / 2);
        }
        
        ctx.restore();
    }

    // === AFFICHAGE HUD DES FEATURES (Au-dessus du brouillard) ===
    // Doit être APRÈS ctx.restore() pour éviter le clipping
    renderFeaturesHUD(ctx, canvas, purchasedFeatures);
    
    // === AFFICHAGE DU MEILLEUR JOUEUR (Badge en haut à droite) ===
    // Affiché en mode classique/infini/custom, sauf pendant la fin du jeu (géré par renderClassicEndScreen)
    if ((currentGameMode === 'classic' || currentGameMode === 'infinite' || currentGameMode === 'custom') && 
        !isClassicGameFinished && 
        Object.keys(players).length > 0 &&
        typeof renderBestPlayerBadge === 'function') {
        const sortedPlayers = Object.values(players)
            .filter(p => p && p.skin)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        
        if (sortedPlayers.length > 0) {
            const bestPlayer = {
                skin: sortedPlayers[0].skin,
                score: sortedPlayers[0].score || 0
            };
            renderBestPlayerBadge(ctx, canvas, bestPlayer);
        }
    }
    
    // --- AFFICHAGE DU SHOP ---
    if (isShopOpen && typeof renderShop === 'function') {
        renderShop(ctx, canvas, level, playerGems, shopTimeRemaining);
    }

    // --- AFFICHAGE DU HUD SOLO (temps total, delta, niveau) ---
    if (currentGameMode === 'solo' && typeof renderSoloHUD === 'function' && !isShopOpen && !isSoloGameFinished) {
        const preferences = {
            showPersonal: soloShowPersonalDelta || false,
            personalBestSplits: soloPersonalBestSplits || {},
            bestSplits: soloBestSplits || {}
        };
        renderSoloHUD(ctx, canvas, soloRunTotalTime, level, soloCurrentLevelTime, isSoloGameFinished, soloSplitTimes, preferences, soloMaxLevel || 10);
        
        // --- AFFICHAGE DU DELTA TEMPORAIRE (après prise de gem) ---
        if (typeof renderSoloGemDelta === 'function' && soloLastGemTime && soloLastGemLevel) {
            renderSoloGemDelta(ctx, canvas, soloLastGemTime, soloLastGemLevel, levelUpTime, preferences);
        }
    }

    // --- ÉCRAN DE FIN CLASSIQUE/INFINI ---
    if (isClassicGameFinished && finalClassicData && typeof renderClassicEndScreen === 'function') {
        renderClassicEndScreen(ctx, canvas, finalClassicData.players, finalClassicData.record, finalClassicData.finalLevel, finalClassicData.mode);
        return; // Ne pas afficher le reste du jeu
    }

    // --- ÉCRAN DE RÉSULTATS SOLO ---
    if (isSoloGameFinished && typeof renderSoloResults === 'function') {
        renderSoloResults(ctx, canvas, soloTotalTime, soloPersonalBestTime, soloSplitTimes);
        return; // Ne pas afficher le reste du jeu
    }

    // --- ÉCRAN DE TRANSITION ---
    if (isInTransition && transitionProgress < 1.0 && soloRunTotalTime === 0 && typeof renderTransition === 'function') {
        renderTransition(ctx, canvas, level, isFirstLevel, playerCountStart, levelUpPlayerSkin, levelUpTime, players, myId, transitionProgress);
    }

    // --- AFFICHAGE DU VOTE EN BAS ---
    if (isVoteActive && typeof renderVoting === 'function') {
        renderVoting(ctx, canvas, voteTimeRemaining);
    }

    // --- AFFICHAGE DU RÉSULTAT DU VOTE ---
    if (voteResult && typeof renderVoteResult === 'function') {
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

    // === AFFICHER LE COUNTDOWN OVERLAY (À LA FIN, DESSUS LE JEU) ===
    if (soloStartCountdownActive && typeof renderCountdownMultiPhase === 'function') {
        renderCountdownMultiPhase(ctx, canvas, soloStartCountdownElapsed, soloStartCountdownActive);
    }
}

/**
 * Affiche le HUD des features en haut du canvas
 * Montre toutes les features disponibles avec un indicateur de déverrouillage
 * Pour la vitesse, affiche le nombre de fois débloquées si > 0
 */
function renderFeaturesHUD(ctx, canvas, purchasedFeatures) {
    // Sécurité: si purchasedFeatures est undefined, on le crée
    if (!purchasedFeatures) {
        purchasedFeatures = {};
    }

    const FEATURES = [
        { id: 'dash', emoji: '⚡', label: 'Dash', color: '#FF6B6B' },
        { id: 'checkpoint', emoji: '🚩', label: 'Check', color: '#00D4FF' },
        { id: 'rope', emoji: '🪢', label: 'Rope', color: '#9B59B6' },
        { id: 'speedBoost', emoji: '💨', label: 'Speed', color: '#FFD700', isStackable: true }
    ];

    const BOX_SIZE = 50;
    const BOX_SPACING = 70;
    const FOG_RADIUS = 180;
    const TOP_Y = (canvas.height / 2) - FOG_RADIUS - BOX_SIZE - 10; // Juste au-dessus du cercle de brouillard

    // Centré horizontalement
    const TOTAL_WIDTH = (FEATURES.length * BOX_SPACING) - BOX_SPACING + BOX_SIZE;
    const CENTER_X = (canvas.width - TOTAL_WIDTH) / 2;

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
        const x = CENTER_X + (index * BOX_SPACING);
        const y = TOP_Y;

        // Déterminer si la feature est déverrouillée
        let isUnlocked = false;
        if (feature.id === 'speedBoost') {
            isUnlocked = purchasedFeatures[feature.id] && purchasedFeatures[feature.id] > 0;
        } else {
            isUnlocked = purchasedFeatures[feature.id] === true;
        }

        // === BOÎTE DE FOND ===
        if (isUnlocked) {
            // Unlocked: fond semi-opaque coloré
            // Convertir hex en rgba avec transparence
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            ctx.fillStyle = hexToRgba(feature.color, 0.2);
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
        ctx.globalAlpha = isUnlocked ? 1.0 : 0.5; // Emoji semi-transparent si verrouillé
        ctx.fillText(feature.emoji, x + BOX_SIZE / 2, y + BOX_SIZE / 2 - 5);
        ctx.globalAlpha = 1.0; // Reset avant le texte

        // === TEXTE EN BAS DE LA BOÎTE ===
        ctx.font = "bold 10px Arial";
        ctx.fillStyle = isUnlocked ? feature.color : '#888888';
        ctx.fillText(feature.label, x + BOX_SIZE / 2, y + BOX_SIZE - 8);

        // === INDICATEUR DE DÉVERROUILLAGE (CADENAS DEVANT) ===
        if (!isUnlocked) {
            // Afficher le cadenas devant l'emoji avec transparence
            ctx.save();
            ctx.globalAlpha = 0.7; // Transparence pour le cadenas
            ctx.font = "32px Arial";
            ctx.fillStyle = '#FF6B6B';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText('🔒', x + BOX_SIZE / 2, y + BOX_SIZE / 2);
            ctx.restore();
        } else if (feature.isStackable && purchasedFeatures[feature.id] && typeof purchasedFeatures[feature.id] === 'number' && purchasedFeatures[feature.id] > 0) {
            // Pour la vitesse: afficher le nombre de fois débloquées (doit être un nombre > 0)
            // Affichage très visible et grand
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = feature.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`x${Math.floor(purchasedFeatures[feature.id])}`, x + BOX_SIZE / 2, y + BOX_SIZE - 18);
        }
    });
}