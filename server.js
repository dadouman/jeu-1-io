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
const { initializePlayer, initializePlayerForMode, resetPlayerForNewLevel, addScore, skins } = require('./utils/player');
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
// Structure de lobbies multi-modes
let lobbies = {
    classic: {
        players: {},
        currentLevel: 1,
        levelStartTime: Date.now(),
        map: generateMaze(15, 15),
        coin: getRandomEmptyPosition(generateMaze(15, 15)),
        currentRecord: { score: 0, skin: "❓" },
        restartVote: {
            isActive: false,
            votes: {},
            startTime: null,
            VOTE_TIMEOUT: 60000
        }
    },
    infinite: {
        players: {},
        currentLevel: 1,
        levelStartTime: Date.now(),
        map: generateMaze(15, 15),
        coin: getRandomEmptyPosition(generateMaze(15, 15)),
        currentRecord: { score: 0, skin: "❓" },
        restartVote: {
            isActive: false,
            votes: {},
            startTime: null,
            VOTE_TIMEOUT: 60000
        }
    }
};

// Solo sessions - chaque joueur a sa propre session solo
// { playerId: { currentLevel, map, coin, startTime, checkpoints: [], totalTime } }
let soloSessions = {};

// Tracker le mode de chaque joueur
let playerModes = {}; // { playerId: 'classic', 'infinite', ou 'solo' }

// --- FONCTIONS UTILITAIRES ---
function getLobby(mode) {
    return lobbies[mode];
}

function getPlayerLobby(playerId) {
    const mode = playerModes[playerId];
    return mode ? lobbies[mode] : null;
}

function emitToLobby(mode, eventName, data) {
    const lobby = lobbies[mode];
    if (!lobby) return;
    
    Object.keys(lobby.players).forEach(playerId => {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit(eventName, data);
        }
    });
}

// Tous les données de jeu sont maintenant dans lobbies[mode]

function startRestartVote(initiatorId, mode) {
    const lobby = getLobby(mode);
    if (!lobby) return { success: false, message: "Lobby invalide" };
    
    if (lobby.restartVote.isActive) {
        return { success: false, message: "Un vote est déjà en cours" };
    }
    
    lobby.restartVote.isActive = true;
    lobby.restartVote.votes = {};
    lobby.restartVote.startTime = Date.now();
    
    const playerCount = Object.keys(lobby.players).length;
    console.log(`\n🗳️ ════════════════════════════════════\n   VOTE POUR REDÉMARRER LANCÉ (${mode})\n   ${playerCount} joueur(s) connecté(s)\n   Tapez O pour OUI, N ou rien pour NON\n════════════════════════════════════\n`);
    
    emitToLobby(mode, 'restartVoteStarted', {
        initiator: lobby.players[initiatorId]?.skin || "❓",
        playerCount: playerCount,
        timeout: lobby.restartVote.VOTE_TIMEOUT
    });
    
    return { success: true };
}

function submitRestartVote(playerId, voteValue, mode) {
    const lobby = getLobby(mode);
    if (!lobby) return { success: false, message: "Lobby invalide" };
    
    if (!lobby.restartVote.isActive) {
        return { success: false, message: "Aucun vote en cours" };
    }
    
    const player = lobby.players[playerId];
    lobby.restartVote.votes[playerId] = voteValue;
    
    console.log(`   ${player.skin} a voté: ${voteValue ? "✅ OUI" : "❌ NON"}`);
    
    return { success: true, voteRegistered: voteValue };
}

function checkRestartVote(mode) {
    const lobby = getLobby(mode);
    if (!lobby) return false;
    
    if (!lobby.restartVote.isActive) return false;
    
    const now = Date.now();
    const elapsed = now - lobby.restartVote.startTime;
    const totalPlayers = Object.keys(lobby.players).length;
    const yesVotes = Object.values(lobby.restartVote.votes).filter(v => v === true).length;
    const requiredYes = Math.ceil(totalPlayers / 2);
    
    if (yesVotes >= requiredYes) {
        finishRestartVote(mode);
        return true;
    }
    
    if (elapsed > lobby.restartVote.VOTE_TIMEOUT) {
        finishRestartVote(mode);
        return false;
    }
    
    return false;
}

function finishRestartVote(mode) {
    const lobby = getLobby(mode);
    if (!lobby) return false;
    
    if (!lobby.restartVote.isActive) return false;
    
    const totalPlayers = Object.keys(lobby.players).length;
    const yesVotes = Object.values(lobby.restartVote.votes).filter(v => v === true).length;
    const requiredYes = Math.ceil(totalPlayers / 2);
    const shouldRestart = yesVotes >= requiredYes;
    
    const result = {
        shouldRestart,
        yesVotes,
        requiredYes,
        totalPlayers,
        totalVotesReceived: Object.keys(lobby.restartVote.votes).length
    };
    
    console.log(`\n📊 RÉSULTAT DU VOTE (${mode}): ${yesVotes}/${requiredYes} votes pour redémarrer`);
    
    // Réinitialiser le vote
    lobby.restartVote.isActive = false;
    lobby.restartVote.votes = {};
    lobby.restartVote.startTime = null;
    
    emitToLobby(mode, 'restartVoteFinished', result);
    
    return shouldRestart;
}

function restartGame(mode) {
    const lobby = getLobby(mode);
    if (!lobby) return;
    
    console.log(`\n🔄 ════════════════════════════════════\n   REDÉMARRAGE DU JEU (${mode})\n════════════════════════════════════\n`);
    
    // Réinitialiser les variables du jeu
    lobby.currentLevel = 1;
    lobby.map = generateMaze(15, 15);
    lobby.coin = getRandomEmptyPosition(lobby.map);
    
    // Réinitialiser tous les joueurs de la lobby
    const playerIds = Object.keys(lobby.players);
    for (let i = 0; i < playerIds.length; i++) {
        const id = playerIds[i];
        const startPos = getRandomEmptyPosition(lobby.map);
        lobby.players[id] = initializePlayer(startPos, i);
    }
    
    // Notifier tous les clients de la lobby
    emitToLobby(mode, 'returnToModeSelection');
    
    // Notifier tous les clients - Retourner à la sélection de mode
    io.emit('returnToModeSelection');
}

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

// --- FONCTION POUR CALCULER LA TAILLE DU LABYRINTHE SELON LE MODE ---
function calculateMazeSize(level, mode = 'classic') {
    const baseSize = 15;
    const sizeIncrement = 2;
    
    if (mode === 'classic') {
        // 40 niveaux: 20 montée, 20 descente
        if (level <= 20) {
            // Phase montante: 15x15 -> 55x55
            const size = baseSize + (level - 1) * sizeIncrement;
            return { width: size, height: size };
        } else {
            // Phase descendante: 55x55 -> 15x15
            const descendLevel = level - 20;
            const size = baseSize + (20 - descendLevel) * sizeIncrement;
            return { width: size, height: size };
        }
    } else if (mode === 'infinite') {
        // Mode infini: continue à grandir
        const size = baseSize + (level - 1) * sizeIncrement;
        return { width: size, height: size };
    }
}

// --- FONCTION POUR OBTENIR LES ITEMS DU SHOP SELON LE MODE ---
function getShopItemsForMode(mode = 'classic') {
    const allItems = getShopItems();
    
    if (mode === 'infinite') {
        // En mode infini, seulement le speedBoost est à acheter
        return {
            speedBoost: allItems.speedBoost
        };
    }
    
    // Mode classique: tous les items disponibles
    return allItems;
}

// --- FONCTION DE DASH ---
function performDash(player, playerId, gameMap) {
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

        if (checkWallCollision(nextX, nextY, gameMap)) {
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
    
    // Init immédiat - le joueur doit d'abord sélectionner un mode
    socket.emit('init', socket.id);
    socket.emit('modeSelectionRequired', { message: 'Veuillez sélectionner un mode' });

    // --- SÉLECTION DU MODE DE JEU ---
    socket.on('selectGameMode', (data) => {
        const mode = data.mode; // 'classic', 'infinite', ou 'solo'
        
        playerModes[socket.id] = mode;
        
        if (mode === 'solo') {
            // Mode solo: créer une session solo privée
            console.log(`🎮 Joueur ${socket.id} sélectionne le mode: SOLO`);
            
            soloSessions[socket.id] = {
                currentLevel: 1,
                map: generateMaze(15, 15),
                coin: getRandomEmptyPosition(generateMaze(15, 15)),
                startTime: Date.now(), // Temps du début de la session
                levelStartTime: Date.now(), // Temps du début du niveau
                checkpoints: [], // Array de temps pour chaque niveau complété
                totalTime: 0
            };
            
            const session = soloSessions[socket.id];
            socket.emit('mapData', session.map);
            socket.emit('levelUpdate', session.currentLevel);
            socket.emit('gameModSelected', { mode: 'solo' });
            
            console.log(`   Session solo créée pour joueur ${socket.id}`);
        } else {
            // Mode classique ou infini
            if (!lobbies[mode]) {
                socket.emit('error', { message: 'Mode invalide' });
                return;
            }
            
            const lobby = lobbies[mode];
            console.log(`🎮 Joueur ${socket.id} sélectionne le mode: ${mode === 'classic' ? '40 NIVEAUX' : 'INFINI'}`);
            
            // Ajouter le joueur à la lobby
            const playerIndex = Object.keys(lobby.players).length;
            const startPos = getRandomEmptyPosition(lobby.map);
            lobby.players[socket.id] = initializePlayerForMode(startPos, playerIndex, mode);
            
            // Envoyer les données de la lobby au nouvel arrivant
            socket.emit('mapData', lobby.map);
            socket.emit('levelUpdate', lobby.currentLevel);
            socket.emit('highScoreUpdate', lobby.currentRecord);
            socket.emit('gameModSelected', { mode: mode });
            
            // Notifier les autres joueurs de la même lobby
            emitToLobby(mode, 'playersCountUpdate', {
                count: Object.keys(lobby.players).length
            });
            
            console.log(`   ${lobby.players[socket.id].skin} rejoint ${mode} (${Object.keys(lobby.players).length} joueur(s))`);
        }
    });

    socket.on('disconnect', () => { 
        const mode = playerModes[socket.id];
        
        if (mode === 'solo') {
            // Supprime la session solo
            delete soloSessions[socket.id];
            console.log(`🎯 Joueur ${socket.id} déconnecté du mode solo`);
        } else if (mode && lobbies[mode]) {
            const lobby = lobbies[mode];
            delete lobby.players[socket.id];
            console.log(`Joueur ${socket.id} déconnecté de ${mode} (${Object.keys(lobby.players).length} joueur(s) restant(s))`);
            
            // Notifier les autres joueurs
            emitToLobby(mode, 'playersCountUpdate', {
                count: Object.keys(lobby.players).length
            });
        }
        delete playerModes[socket.id];
    });

    socket.on('movement', (input) => {
        const mode = playerModes[socket.id];
        if (!mode || !lobbies[mode]) return;
        
        const lobby = lobbies[mode];
        const player = lobby.players[socket.id];
        if (!player) return;

        const speed = 3 + (player.purchasedFeatures.speedBoost ? 1 : 0);
        let nextX = player.x;
        let nextY = player.y;

        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= speed;
        if (input.right) moveX += speed;
        if (input.up) moveY -= speed;
        if (input.down) moveY += speed;

        if (moveX !== 0 && moveY !== 0) {
            const diagonal = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX = (moveX / diagonal) * speed;
            moveY = (moveY / diagonal) * speed;
        }

        nextX = player.x + moveX;
        nextY = player.y + moveY;

        if (!checkWallCollision(nextX, nextY, lobby.map)) {
            player.x = nextX;
            player.y = nextY;
        } else if (moveX !== 0 && moveY !== 0) {
            if (!checkWallCollision(player.x + moveX, player.y, lobby.map)) {
                player.x += moveX;
            }
            // Puis essayer Y seul
            else if (!checkWallCollision(player.x, player.y + moveY, lobby.map)) {
                player.y += moveY;
            }
            // Si les deux échouent, pas de mouvement
        } else if (moveX !== 0) {
            // Mouvement horizontal uniquement
            if (!checkWallCollision(player.x + moveX, player.y, lobby.map)) {
                player.x += moveX;
            }
        } else if (moveY !== 0) {
            // Mouvement vertical uniquement
            if (!checkWallCollision(player.x, player.y + moveY, lobby.map)) {
                player.y += moveY;
            }
        }

        // Tracker la dernière direction pour le dash
        if (input.left) player.lastDirection = 'left';
        if (input.right) player.lastDirection = 'right';
        if (input.up) player.lastDirection = 'up';
        if (input.down) player.lastDirection = 'down';

        // Optimisation de la trace : ajouter la position SEULEMENT si le joueur a acheté la corde
        // ET ajouter un point tous les 4 pixels pour réduire la charge
        if (player.purchasedFeatures && player.purchasedFeatures.rope) {
            // Vérifier si la position a changé suffisamment depuis le dernier point de trace
            const lastTrailPoint = player.trail[player.trail.length - 1];
            if (!lastTrailPoint || Math.hypot(lastTrailPoint.x - player.x, lastTrailPoint.y - player.y) >= 4) {
                player.trail.push({ x: player.x, y: player.y });
                // Limiter à 500 points au lieu de 2000 pour 20 secondes de trace à 60 FPS
                if (player.trail.length > 500) {
                    player.trail.shift(); // Supprimer la plus ancienne position
                }
            }
        } else {
            // Si la corde n'est pas achetée, vider la trace
            player.trail = [];
        }
    });

    // Gestion des checkpoints
    socket.on('checkpoint', (actions) => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        const lobby = lobbies[mode];
        const player = lobby.players[socket.id];
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
                performDash(player, socket.id, lobby.map);
            }
        }
    });

    // --- SYSTÈME DE VOTE POUR REDÉMARRER ---
    socket.on('proposeRestart', () => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        const lobby = lobbies[mode];
        const player = lobby.players[socket.id];
        if (!player) return;
        
        const result = startRestartVote(socket.id, mode);
        if (result.success) {
            socket.emit('restartVoteProposed', { success: true });
        } else {
            socket.emit('restartVoteProposed', { success: false, message: result.message });
        }
    });

    socket.on('voteRestart', (data) => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        const lobby = lobbies[mode];
        const player = lobby.players[socket.id];
        if (!player) return;
        
        const voteValue = data.vote === true; // true = oui, false = non
        const result = submitRestartVote(socket.id, voteValue, mode);
        
        if (result.success) {
            // Vérifier si le vote est terminé
            const shouldRestart = checkRestartVote(mode);
            if (shouldRestart) {
                restartGame(mode);
            }
        }
    });

    // --- SYSTÈME DE SHOP ---
    socket.on('shopPurchase', (data) => {
        const mode = playerModes[socket.id];
        if (!mode) return;
        
        const lobby = lobbies[mode];
        const player = lobby.players[socket.id];
        const { itemId } = data;

        if (!player) return;

        const result = purchaseItem(player, itemId);
        
        if (result.success) {
            const player = lobby.players[socket.id];
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
    // Traiter chaque lobby indépendamment
    for (const mode of ['classic', 'infinite']) {
        const lobby = lobbies[mode];
        let recordChanged = false;
        let levelChanged = false;

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

                // 2. VÉRIFIER SI LE JEU EST TERMINÉ (Mode classique, 40 niveaux)
                if (mode === 'classic' && lobby.currentLevel > 40) {
                    emitToLobby(mode, 'gameFinished', { finalLevel: 40, mode: 'classic' });
                    lobby.currentLevel = 40; // Rester au niveau 40
                    break;
                }

                // 3. ON AGRANDIT LE LABYRINTHE SELON LE MODE
                const mazeSize = calculateMazeSize(lobby.currentLevel, mode);
                lobby.map = generateMaze(mazeSize.width, mazeSize.height); // Génération du nouveau labyrinthe
                
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
                
                // Si on a trouvé la pièce, on arrête la boucle des joueurs ici 
                // pour éviter que 2 joueurs la prennent en même temps
                break; 
            }
        }

        // SI LE NIVEAU A CHANGÉ
        if (levelChanged) {
            console.log(`📢 [ÉMISSION] Mode: ${mode}, Émission levelUpdate avec level: ${lobby.currentLevel}`);
            emitToLobby(mode, 'mapData', lobby.map); // On envoie la nouvelle carte
            emitToLobby(mode, 'levelUpdate', lobby.currentLevel); // On prévient du niveau
            
            // VÉRIFIER SI LE NIVEAU QU'ON VIENT DE COMPLÉTER est un niveau de MAGASIN
            const completedLevel = lobby.currentLevel - 1;
            const isShopLvl = isShopLevel(completedLevel);
            console.log(`🏪 [CHECK SHOP] Mode: ${mode}, Niveau complété: ${completedLevel}, isShopLevel: ${isShopLvl}`);
            if (isShopLvl) {
                console.log(`🏪 [SHOP TRIGGER] Mode: ${mode}, MAGASIN VA S'OUVRIR après le niveau ${completedLevel}`);
                emitToLobby(mode, 'shopOpen', { items: getShopItemsForMode(mode), level: completedLevel });
                console.log(`\n🏪 ════════════════════════════════════\n   MAGASIN OUVERT [${mode}] - Après Niveau ${completedLevel}\n   Les joueurs ont 15 secondes pour acheter!\n════════════════════════════════════\n`);
            } else {
                const mazeSize = 15 + (lobby.currentLevel * 2);
                console.log(`🌍 [NIVEAU ${lobby.currentLevel} ${mode}] Labyrinthe ${mazeSize}x${mazeSize} généré`);
            }
        }

        // SI LE RECORD A CHANGÉ
        if (recordChanged) {
            emitToLobby(mode, 'highScoreUpdate', lobby.currentRecord);
            if (mongoURI) {
                HighScoreModel.updateOne({}, { score: lobby.currentRecord.score, skin: lobby.currentRecord.skin }).exec();
            }
        }

        emitToLobby(mode, 'state', { players: lobby.players, coin: lobby.coin });
    }
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});