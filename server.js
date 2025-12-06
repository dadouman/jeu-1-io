try {
    require('dotenv').config();
} catch (e) {
    console.log("On est sur Render (ou dotenv manquant), on utilise les variables d'environnement directes.");
}
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');

// Configuration Socket.io pour Render
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// IMPORTANT : On importe la NOUVELLE fonction 'generateMaze'
const { generateMaze, getRandomEmptyPosition } = require('./utils/map');
const { checkWallCollision } = require('./utils/collisions');
const { initializePlayer, resetPlayerForNewLevel, addScore, skins } = require('./utils/player');
const { calculateGemsForLevel, addGems } = require('./utils/gems');
const { isShopLevel, getShopItems, purchaseItem } = require('./utils/shop');

app.use(express.static('public'));

// --- CONNEXION MONGODB ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.warn("⚠️ Pas de MONGO_URI. Le HighScore ne sera pas sauvegardé.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connecté à MongoDB !'))
        .catch(err => console.error('❌ Erreur Mongo :', err));
}

// Modèle HighScore
const HighScoreSchema = new mongoose.Schema({ score: Number, skin: String });
const HighScoreModel = mongoose.model('HighScore', HighScoreSchema);

// --- INITIALISATION DU JEU ---
let players = {};

// VARIABLES DU ROGUE-LIKE
let currentLevel = 1;
let map = generateMaze(15, 15); 
let coin = getRandomEmptyPosition(map);

let currentRecord = { score: 0, skin: "❓" };

// Chargement du record
async function loadHighScore() {
    if (!mongoURI) return;
    try {
        let doc = await HighScoreModel.findOne();
        if (doc) {
            currentRecord = { score: doc.score, skin: doc.skin };
            console.log(`🏆 Record chargé : ${doc.score}`);
        } else {
            const newRecord = new HighScoreModel({ score: 0, skin: "❓" });
            await newRecord.save();
        }
    } catch (err) { console.error(err); }
}
loadHighScore();

// --- FONCTION DE DASH ---
function performDash(player, playerId) {
    // Déterminer la direction du dash
    let dashDx = 0;
    let dashDy = 0;
    
    // Déterminer la direction basée sur les inputs actuels (on peut utiliser la dernière direction connue)
    // Pour simplifier, on utilise les mouvements : si aucun mouvement, on dash devant soi (dernière direction)
    let direction = player.lastDirection || 'right'; // Par défaut vers la droite
    
    if (direction === 'up') dashDy = -1;
    if (direction === 'down') dashDy = 1;
    if (direction === 'left') dashDx = -1;
    if (direction === 'right') dashDx = 1;

    const dashDistance = 15; // Nombre de pixels par pas de dash
    let currentX = player.x;
    let currentY = player.y;
    let stepsCount = 0;
    const maxSteps = 20; // Distance max du dash

    // Avancer jusqu'à collision ou distance max
    while (stepsCount < maxSteps) {
        const nextX = currentX + dashDx * dashDistance;
        const nextY = currentY + dashDy * dashDistance;

        if (checkWallCollision(nextX, nextY, map)) {
            break; // Collision, on arrête
        }

        currentX = nextX;
        currentY = nextY;
        stepsCount++;
    }

    player.x = currentX;
    player.y = currentY;
}

// --- GESTION JOUEURS ---
io.on('connection', (socket) => {
    console.log('Joueur connecté : ' + socket.id);
    
    // Init immédiat
    socket.emit('init', socket.id);
    socket.emit('mapData', map);
    socket.emit('levelUpdate', currentLevel);
    socket.emit('highScoreUpdate', currentRecord);

    const startPos = getRandomEmptyPosition(map);
    const playerIndex = Object.keys(players).length;
    players[socket.id] = initializePlayer(startPos, playerIndex);

    socket.on('disconnect', () => { delete players[socket.id]; });

    socket.on('movement', (input) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 5 + (player.purchasedFeatures.speedBoost ? 2 : 0); // Vitesse de base + boost optionnel
        let nextX = player.x;
        let nextY = player.y;

        // Calculer les mouvements en X et Y séparément
        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= speed;
        if (input.right) moveX += speed;
        if (input.up) moveY -= speed;
        if (input.down) moveY += speed;

        // Essayer le mouvement diagonal complet d'abord
        nextX = player.x + moveX;
        nextY = player.y + moveY;

        if (!checkWallCollision(nextX, nextY, map)) {
            // Mouvement diagonal possible
            player.x = nextX;
            player.y = nextY;
        } else if (moveX !== 0 && moveY !== 0) {
            // Si le diagonal échoue, essayer X seul
            if (!checkWallCollision(player.x + moveX, player.y, map)) {
                player.x += moveX;
            }
            // Puis essayer Y seul
            else if (!checkWallCollision(player.x, player.y + moveY, map)) {
                player.y += moveY;
            }
            // Si les deux échouent, pas de mouvement
        } else if (moveX !== 0) {
            // Mouvement horizontal uniquement
            if (!checkWallCollision(player.x + moveX, player.y, map)) {
                player.x += moveX;
            }
        } else if (moveY !== 0) {
            // Mouvement vertical uniquement
            if (!checkWallCollision(player.x, player.y + moveY, map)) {
                player.y += moveY;
            }
        }

        // Tracker la dernière direction pour le dash
        if (input.left) player.lastDirection = 'left';
        if (input.right) player.lastDirection = 'right';
        if (input.up) player.lastDirection = 'up';
        if (input.down) player.lastDirection = 'down';

        // Ajouter la position à la trace du joueur
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 2000) {
            player.trail.shift(); // Supprimer la plus ancienne position
        }
    });

    // Gestion des checkpoints
    socket.on('checkpoint', (actions) => {
        const player = players[socket.id];
        if (!player) return;

        // Appui sur Espace : créer ou déplacer le checkpoint
        if (actions.setCheckpoint) {
            if (!player.purchasedFeatures.checkpoint) {
                socket.emit('error', { message: '🚩 Checkpoint non acheté ! Rendez-vous au magasin (niveau 5, 10, 15...)' });
            } else {
                player.checkpoint = {
                    x: player.x,
                    y: player.y
                };
                socket.emit('checkpointUpdate', player.checkpoint);
            }
        }

        // Appui sur R : téléporter au checkpoint
        if (actions.teleportCheckpoint && player.checkpoint) {
            if (!player.purchasedFeatures.checkpoint) {
                socket.emit('error', { message: '🚩 Checkpoint non acheté !' });
            } else {
                player.x = player.checkpoint.x;
                player.y = player.checkpoint.y;
            }
        }

        // Appui sur Shift : Dash
        if (actions.dash) {
            if (!player.purchasedFeatures.dash) {
                socket.emit('error', { message: '⚡ Dash non acheté ! Rendez-vous au magasin' });
            } else {
                performDash(player, socket.id);
            }
        }
    });

    // --- SYSTÈME DE SHOP ---
    socket.on('shopPurchase', (data) => {
        const player = players[socket.id];
        const { itemId } = data;

        if (!player) return;

        const result = purchaseItem(player, itemId);
        
        if (result.success) {
            const player = players[socket.id];
            console.log(`💎 [SHOP] ${player.skin} a acheté "${result.item.name}" pour ${result.item.price}💎 | ${result.gemsLeft}💎 restants`);
            socket.emit('shopPurchaseSuccess', { itemId, item: result.item, gemsLeft: result.gemsLeft });
        } else {
            socket.emit('shopPurchaseFailed', { 
                reason: result.message,
                required: result.gemsRequired,
                current: result.gemsAvailable
            });
        }
    });
});

// --- BOUCLE DE JEU ---
setInterval(() => {
    let recordChanged = false;
    let levelChanged = false;

    for (const id in players) {
        const p = players[id];
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        
        // --- COLLISION AVEC LA PIÈCE ---
        if (dist < 30) {
            addScore(p, 1);
            
            // SYSTÈME DE GEMS : À chaque niveau, on gagne des gems
            const gemsEarned = calculateGemsForLevel(currentLevel);
            addGems(p, gemsEarned);
            
            // Afficher les stats de progression
            const isShopLevelNext = isShopLevel(currentLevel + 1);
            console.log(`✨ [PROGRESSION] ${p.skin} Niveau ${currentLevel} complété en ${(Date.now() / 1000).toFixed(0)}s | +${gemsEarned}💎 (Total: ${p.gems}💎)${isShopLevelNext ? ' | 🏪 Magasin au prochain niveau!' : ''}`);
            
            // 1. ON AUGMENTE LE NIVEAU
            currentLevel++;
            levelChanged = true;

            // 2. ON AGRANDIT LE LABYRINTHE
            // Taille de base 15 + (2 cases par niveau)
            const newSize = 15 + (currentLevel * 2);
            map = generateMaze(newSize, newSize); // Génération du nouveau labyrinthe
            
            // 3. ON DÉPLACE LA PIÈCE
            coin = getRandomEmptyPosition(map);

            // 4. ON TÉLÉPORTE TOUS LES JOUEURS (Sécurité anti-mur)
            for (let pid in players) {
                const safePos = getRandomEmptyPosition(map);
                resetPlayerForNewLevel(players[pid], safePos);
            }

            // Gestion Record
            if (p.score > currentRecord.score) {
                currentRecord.score = p.score;
                currentRecord.skin = p.skin;
                recordChanged = true;
            }
            
            // Si on a trouvé la pièce, on arrête la boucle des joueurs ici 
            // pour éviter que 2 joueurs la prennent en même temps
            break; 
        }
    }

    // SI LE NIVEAU A CHANGÉ
    if (levelChanged) {
        io.emit('mapData', map); // On envoie la nouvelle carte
        io.emit('levelUpdate', currentLevel); // On prévient du niveau
        
        // VÉRIFIER SI C'EST UN NIVEAU DE MAGASIN
        if (isShopLevel(currentLevel)) {
            io.emit('shopOpen', { items: getShopItems(), level: currentLevel });
            console.log(`\n🏪 ════════════════════════════════════\n   MAGASIN OUVERT - Niveau ${currentLevel}\n   Les joueurs ont 15 secondes pour acheter!\n════════════════════════════════════\n`);
        } else {
            const mazeSize = 15 + (currentLevel * 2);
            console.log(`🌍 [NIVEAU ${currentLevel}] Labyrinthe ${mazeSize}x${mazeSize} généré`);
        }
    }

    // SI LE RECORD A CHANGÉ
    if (recordChanged) {
        io.emit('highScoreUpdate', currentRecord);
        if (mongoURI) {
            HighScoreModel.updateOne({}, { score: currentRecord.score, skin: currentRecord.skin }).exec();
        }
    }

    io.emit('state', { players, coin });

}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});