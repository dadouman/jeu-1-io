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

function renderGame(ctx, canvas, map, players, coin, myId, highScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime, currentLevelTime = 0, isFirstLevel = false, playerCountStart = 0, isVoteActive = false, voteTimeRemaining = 0, voteResult = null, soloRunTotalTime = 0, soloDeltaTime = null, soloDeltaReference = null, soloPersonalBestTime = null, soloLeaderboardBest = null) {
    
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

    // 7. Joueurs - COMMENTÉ EN SOLO pour éviter le double rendu
    // Le joueur est redessiné en opaque après sortie du clip (voir plus bas)
    if (soloRunTotalTime === 0) {  // Uniquement en classique/infini, pas en solo
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

    // ASSURER que globalAlpha est à 1.0 pour l'interface
    ctx.globalAlpha = 1.0;

    // --- UI MINIMALISTE EN SOLO MODE ---
    if (currentGameMode === 'solo') {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        // Affichage du Temps Total (au milieu, EN DESSOUS du cercle de brouillard)
        if (soloRunTotalTime > 0) {
            // Format: MM:SS.mmm
            const totalSeconds = Math.floor(soloRunTotalTime);
            const totalMinutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const milliseconds = Math.round((soloRunTotalTime - totalSeconds) * 1000);
            const timeFormatted = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
            
            // Afficher le temps total EN DESSOUS du cercle
            ctx.fillStyle = "#00FF00"; // Vert
            ctx.font = "bold 32px Arial";
            ctx.fillText(timeFormatted, canvas.width / 2, canvas.height / 2 + 220);
            
            // Affichage du delta avec le world record
            const displayPersonal = soloShowPersonalDelta || !soloLeaderboardBest;
            const bestTime = displayPersonal ? soloPersonalBestTime : soloLeaderboardBest;
            
            if (bestTime) {
                const delta = soloRunTotalTime - bestTime;
                const deltaSeconds = Math.floor(Math.abs(delta));
                const deltaMinutes = Math.floor(deltaSeconds / 60);
                const deltaSecs = deltaSeconds % 60;
                const deltaMilliseconds = Math.round((Math.abs(delta) - deltaSeconds) * 1000);
                const deltaFormatted = `${delta >= 0 ? '+' : '-'}${deltaMinutes.toString().padStart(2, '0')}:${deltaSecs.toString().padStart(2, '0')}.${deltaMilliseconds.toString().padStart(3, '0')}`;
                
                const deltaColor = delta >= 0 ? '#FF6B6B' : '#00FF00'; // Rouge si plus lent, vert si plus rapide
                ctx.fillStyle = deltaColor;
                ctx.font = "bold 24px Arial";
                ctx.fillText(deltaFormatted, canvas.width / 2, canvas.height / 2 + 260);
            }
            
            // Affichage du niveau actuel en dessous
            ctx.fillStyle = "#FFD700"; // Or
            ctx.font = "bold 20px Arial";
            ctx.fillText(`Niveau ${level} / ${soloMaxLevel}`, canvas.width / 2, canvas.height / 2 + 295);
        }
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
        const shopNumber = Math.floor(level / 5); // Shop 1 = niveau 5, Shop 2 = niveau 10, etc.
        ctx.fillText("🏪 SHOP " + shopNumber, canvas.width / 2, shopY + 40);
        
        // Affichage du timer
        ctx.fillStyle = shopTimeRemaining <= 5 ? "#FF0000" : "#FFD700";
        ctx.font = "bold 20px Arial";
        ctx.fillText("⏱️ " + shopTimeRemaining + "s", canvas.width / 2, shopY + 65);
        
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
            const yPos = shopY + 100 + (index * 45);
            const canBuy = playerGems >= item.price;
            const color = canBuy ? "#00FF00" : "#888";
            
            // Dessiner une boîte cliquable pour chaque item
            ctx.fillStyle = canBuy ? "rgba(0, 255, 0, 0.1)" : "rgba(136, 136, 136, 0.05)";
            ctx.fillRect(shopX + 20, yPos - 20, shopWidth - 40, 40);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(shopX + 20, yPos - 20, shopWidth - 40, 40);
            
            ctx.fillStyle = color;
            ctx.fillText(`${index + 1}. ${item.name} - ${item.price} gems`, shopX + 30, yPos);
        });
        
        // Instructions
        ctx.fillStyle = "#888";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Appuyez sur 1, 2, 3 ou 4 OU cliquez sur un item pour acheter", canvas.width / 2, shopY + shopHeight - 30);
    }

    // --- ÉCRAN DE RÉSULTATS SOLO ---
    if (isSoloGameFinished) {
        // Fond semi-transparent noir
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Titre
        ctx.fillStyle = "#FF00FF";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🏁 SOLO TERMINÉ!", canvas.width / 2, 40);
        
        // Temps total - plus grand
        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 50px Arial";
        ctx.fillText(`⏱️ ${soloTotalTime.toFixed(2)}s`, canvas.width / 2, 110);
        
        // Rang du leaderboard
        if (window.soloPlayerRank) {
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 24px Arial";
            ctx.fillText(`🏆 Classement: #${window.soloPlayerRank}`, canvas.width / 2, 160);
        }
        
        // Meilleur temps personnel
        if (soloPersonalBestTime) {
            ctx.fillStyle = "#00FF00";
            ctx.font = "bold 18px Arial";
            ctx.fillText(`🎯 Meilleur personnel: ${soloPersonalBestTime.toFixed(2)}s`, canvas.width / 2, 195);
        }
        
        // SECTION GAUCHE - Checkpoints
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "left";
        ctx.fillText("📊 Niveaux:", 40, 220);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "14px Arial";
        const checkpointStart = 250;
        const checkpointSpacing = 20;
        
        for (let i = 0; i < soloSplitTimes.length; i++) {
            const level = i + 1;
            const time = soloSplitTimes[i];
            
            // Récupérer le temps du checkpoint du record personnel pour la comparaison
            let personalBestCheckpoint = null;
            if (soloPersonalBestTime && window.soloLeaderboard && window.soloLeaderboard.length > 0) {
                // Trouver l'entrée du leaderboard qui correspond au meilleur temps personnel
                const personalBestEntry = window.soloLeaderboard.find(entry => 
                    Math.abs(entry.totalTime - soloPersonalBestTime) < 0.1
                );
                if (personalBestEntry && personalBestEntry.splitTimes && personalBestEntry.splitTimes[i]) {
                    personalBestCheckpoint = personalBestEntry.splitTimes[i];
                }
            }
            
            // Calculer le delta
            let deltaText = "";
            if (personalBestCheckpoint) {
                const delta = time - personalBestCheckpoint;
                const deltaSign = delta < 0 ? "−" : "+";
                const deltaColor = delta < 0 ? "#00FF00" : delta > 0 ? "#FF6666" : "#FFFF00";
                deltaText = ` ${deltaSign}${Math.abs(delta).toFixed(1)}s`;
            }
            
            const text = `L${level}: ${time.toFixed(1)}s${deltaText}`;
            
            // Deux colonnes
            if (i < 10) {
                ctx.fillStyle = personalBestCheckpoint && (time - personalBestCheckpoint) < 0 ? "#00FF00" : "#FFFFFF";
                ctx.fillText(text, 40, checkpointStart + i * checkpointSpacing);
            } else {
                ctx.fillStyle = personalBestCheckpoint && (time - personalBestCheckpoint) < 0 ? "#00FF00" : "#FFFFFF";
                ctx.fillText(text, canvas.width / 2 - 30, checkpointStart + (i - 10) * checkpointSpacing);
            }
        }
        
        ctx.fillStyle = "#FFFFFF"; // Reset la couleur
        
        // SECTION DROITE - Leaderboard
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "left";
        ctx.fillText("🎯 Top 5 Leaderboard:", canvas.width / 2 + 50, 220);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        const leaderboardStart = 250;
        const leaderboardSpacing = 20;
        
        if (window.soloLeaderboard && window.soloLeaderboard.length > 0) {
            for (let i = 0; i < Math.min(5, window.soloLeaderboard.length); i++) {
                const entry = window.soloLeaderboard[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
                const text = `${medal} ${entry.totalTime.toFixed(2)}s`;
                
                // Highlight le joueur actuel
                if (window.soloPlayerRank === i + 1) {
                    ctx.fillStyle = "#00FF00";
                    ctx.fillRect(canvas.width / 2 + 40, leaderboardStart + i * leaderboardSpacing - 12, 280, 16);
                    ctx.fillStyle = "#000000";
                } else {
                    ctx.fillStyle = "#FFFFFF";
                }
                
                ctx.fillText(text, canvas.width / 2 + 50, leaderboardStart + i * leaderboardSpacing);
            }
        }
        
        // Boutons
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        
        // Bouton REPLAY
        ctx.fillStyle = "rgba(0, 200, 0, 0.6)";
        ctx.fillRect(canvas.width / 2 - 220, canvas.height - 70, 160, 50);
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 220, canvas.height - 70, 160, 50);
        ctx.fillStyle = "#00FF00";
        ctx.fillText("🔄 REJOUER", canvas.width / 2 - 140, canvas.height - 45);
        window.replayButtonRect = { x: canvas.width / 2 - 220, y: canvas.height - 70, w: 160, h: 50 };
        
        // Bouton MENU
        ctx.fillStyle = "rgba(100, 100, 255, 0.6)";
        ctx.fillRect(canvas.width / 2 + 60, canvas.height - 70, 160, 50);
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 + 60, canvas.height - 70, 160, 50);
        ctx.fillStyle = "#00FFFF";
        ctx.fillText("📍 MENU", canvas.width / 2 + 140, canvas.height - 45);
        window.menuButtonRect = { x: canvas.width / 2 + 60, y: canvas.height - 70, w: 160, h: 50 };
        
        return; // Ne pas afficher le reste du jeu
    }

    // --- ÉCRAN DE TRANSITION ---
    // EN SOLO: ON CACHE LES TRANSITIONS, ON ENCHAINE DIRECTEMENT
    if (isInTransition && transitionProgress < 1.0 && soloRunTotalTime === 0) {
        // Fond semi-transparent noir
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 + transitionProgress * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // --- TRANSITION SPÉCIALE POUR LE NIVEAU 1 ---
        if (isFirstLevel) {
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 48px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🎮 BIENVENUE", canvas.width / 2, canvas.height / 2 - 60);
            
            ctx.font = "bold 36px Arial";
            ctx.fillStyle = "#00FF00";
            ctx.fillText(`${playerCountStart} 👥 Joueur${playerCountStart > 1 ? 's' : ''} Connecté${playerCountStart > 1 ? 's' : ''}`, canvas.width / 2, canvas.height / 2 + 20);
            
            ctx.font = "italic 24px Arial";
            ctx.fillStyle = "#AAAAAA";
            ctx.fillText("C'est parti pour le Niveau 1 !", canvas.width / 2, canvas.height / 2 + 80);
        } else {
            // --- TRANSITION NORMALE (FIN DE NIVEAU) ---
            // Message de transition
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 36px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const message = `${levelUpPlayerSkin} Gem récupérée en ${levelUpTime.toFixed(1)}s`;
            ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 80);
            
            // --- PODIUM ---
            const ranking = getRanking(players);
            const podiumX = canvas.width / 2;
            const podiumY = canvas.height / 2 + 20;
            
            // Positions des podiums (1er au centre, 2e à gauche, 3e à droite)
            const podiumPositions = [
                { x: podiumX, y: podiumY, medal: "🥇", height: 120 }, // 1er
                { x: podiumX - 150, y: podiumY + 30, medal: "🥈", height: 80 }, // 2e
                { x: podiumX + 150, y: podiumY + 30, medal: "🥉", height: 50 }  // 3e
            ];
            
            ranking.slice(0, 3).forEach((player, index) => {
                const pos = podiumPositions[index];
                
                // Piédestal
                ctx.fillStyle = index === 0 ? "#FFD700" : (index === 1 ? "#C0C0C0" : "#CD7F32");
                ctx.fillRect(pos.x - 40, pos.y, 80, pos.height);
                
                // Bordure
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(pos.x - 40, pos.y, 80, pos.height);
                
                // Numéro de position
                ctx.fillStyle = "white";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "center";
                ctx.fillText(pos.medal, pos.x, pos.y - 30);
                
                // Skin du joueur
                ctx.font = "48px Arial";
                ctx.fillText(player.skin, pos.x, pos.y + pos.height / 2 - 20);
                
                // Score
                ctx.font = "bold 16px Arial";
                ctx.fillText(`${player.score}`, pos.x, pos.y + pos.height + 25);
            });
            
            // --- MA POSITION (si je ne suis pas dans les 3 premiers) ---
            const myRank = ranking.findIndex(p => p.id === myId);
            if (myRank > 2) {
                ctx.fillStyle = "#CCCCCC";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`Vous êtes ${myRank + 1}e : ${ranking[myRank].skin} (${ranking[myRank].score} points)`, canvas.width / 2, podiumY + 150);
            }
        }
        
        // Barre de chargement (agrandissement du niveau)
        const barWidth = 300;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 100;
        
        // Fond de la barre
        ctx.fillStyle = "#444";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barre de progression
        const progress = transitionProgress;
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Bordure
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Texte de la barre
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Niveau ${level}`, canvas.width / 2, barY + barHeight + 25);
    }

    // --- AFFICHAGE DU VOTE EN BAS ---
    if (isVoteActive) {
        // Fond semi-transparent noir
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        
        // Bordure dorée
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, canvas.height - 80, canvas.width, 80);
        
        // Texte du vote
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🗳️ VOTE POUR REDÉMARRER EN COURS", canvas.width / 2, canvas.height - 55);
        
        // Temps restant
        ctx.fillStyle = voteTimeRemaining <= 10 ? "#FF4444" : "#00FF00";
        ctx.font = "bold 18px Arial";
        ctx.fillText(`⏱️ ${voteTimeRemaining}s restant${voteTimeRemaining > 1 ? 's' : ''}`, canvas.width / 2, canvas.height - 25);
        
        // Instructions
        ctx.fillStyle = "#AAAAAA";
        ctx.font = "14px Arial";
        ctx.fillText("Appuyez sur O (OUI) ou N (NON)", canvas.width / 2, canvas.height - 5);
    }

    // --- AFFICHAGE DU RÉSULTAT DU VOTE ---
    if (voteResult) {
        if (voteResult === 'success') {
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
            
            ctx.fillStyle = "#00FF00";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("✅ VOTE ACCEPTÉ - REDÉMARRAGE EN COURS", canvas.width / 2, canvas.height - 20);
        } else if (voteResult === 'failed') {
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
            
            ctx.fillStyle = "#FF0000";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("❌ VOTE REJETÉ", canvas.width / 2, canvas.height - 20);
        }
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