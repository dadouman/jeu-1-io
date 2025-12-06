// 1. Configuration forcée en WebSocket (Meilleur pour Render)
const socket = io({
    transports: ['websocket'],
    upgrade: false
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuster le canvas à la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// VARIABLES DU JEU
let map = [];
let inputs = { up: false, down: false, left: false, right: false };
let inputsMomentum = { up: 0, down: 0, left: 0, right: 0 }; // Inertie pour les touches
const MOMENTUM_DECAY = 0.85; // 85% de l'inertie persiste par frame
let currentHighScore = null;
let myPlayerId = null; // <--- LA VARIABLE QUI VA NOUS SAUVER

let level = 1;
let levelStartTime = null; // Ne pas initialiser tout de suite
let lastLevel = 0; // Pour détecter les changements de niveau

// VARIABLES CHECKPOINT
let checkpoint = null;
let actions = { setCheckpoint: false, teleportCheckpoint: false, dash: false };

// VARIABLES TRACES
let trails = {}; // Traces de tous les joueurs { playerId: { color, positions } }

// VARIABLES SHOP
let isShopOpen = false;
let shopItems = {};
let playerGems = 0;
let purchasedFeatures = {};
let shopTimerStart = null;
const SHOP_DURATION = 15000; // 15 secondes en millisecondes

// VARIABLES TRANSITION
let isInTransition = false;
let transitionStartTime = null;
const TRANSITION_DURATION = 3000; // 3 secondes
let levelUpPlayerSkin = null; // Skin du joueur qui a gagné
let levelUpTime = 0; // Temps mis pour gagner
let currentPlayers = {}; // Cache des joueurs pour la transition

// --- RÉCEPTION DE L'ID (Le Correctif) ---
// Quand le serveur dit qu'on change de niveau
socket.on('levelUpdate', (newLevel) => {
    // Détecter si c'est vraiment un changement de niveau
    if (newLevel !== lastLevel && lastLevel !== 0) {
        // Niveau a changé ! Déclencher la transition
        isInTransition = true;
        transitionStartTime = Date.now();
        levelUpTime = (Date.now() - levelStartTime) / 1000; // Temps en secondes (AVANT de réinitialiser)
        levelUpPlayerSkin = myPlayerId ? (currentPlayers[myPlayerId]?.skin || "❓") : "❓";
        
        // Log de jeu
        const playerData = currentPlayers[myPlayerId];
        if (playerData) {
            console.log(`%c${levelUpPlayerSkin} Niveau ${lastLevel} complété en ${levelUpTime.toFixed(1)}s | ${playerData.gems}💎 | Score: ${playerData.score}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        }
    } else if (newLevel === 1 && lastLevel === 0) {
        // Premier niveau : initialiser le chronomètre maintenant
        levelStartTime = Date.now();
    }
    
    level = newLevel;
    lastLevel = newLevel;
    
    // Si c'est une vraie transition (pas le premier niveau), attendre 3s
    if (lastLevel > 1) {
        levelStartTime = Date.now() + TRANSITION_DURATION; // Démarrer le chrono APRÈS la transition
    }
    
    checkpoint = null; // Réinitialiser le checkpoint au changement de niveau
    trails = {}; // Réinitialiser les traces au changement de niveau
});

// MODIFIE AUSSI 'mapData' POUR NE PAS JUSTE CONSOLER
socket.on('mapData', (data) => {
    map = data; // Mise à jour immédiate de la carte locale
});

socket.on('init', (id) => {
    myPlayerId = id; // On le stocke manuellement
});

socket.on('connect', () => {
    // Si on n'a pas encore reçu l'init, on prend celui-là au cas où
    if (!myPlayerId) myPlayerId = socket.id;
});

// Réception de la map
socket.on('mapData', (data) => {
    map = data;
});

// Réception du record
socket.on('highScoreUpdate', (data) => {
    currentHighScore = data;
});

// Réception du checkpoint
socket.on('checkpointUpdate', (data) => {
    checkpoint = data;
});

// --- ÉVÉNEMENTS SHOP ---
socket.on('shopOpen', (data) => {
    isShopOpen = true;
    shopItems = data.items;
    shopTimerStart = Date.now(); // Démarrer le timer
    console.log(`%c🏪 SHOP OUVERT - Niveau ${data.level} | Appuyez sur 1,2,3,4 pour acheter`, 'color: #FFD700; font-weight: bold; font-size: 12px');
});

socket.on('shopPurchaseSuccess', (data) => {
    purchasedFeatures[data.itemId] = true;
    playerGems = data.gemsLeft;
    console.log(`%c✅ ${data.item.name} acheté! | ${data.gemsLeft}💎 restants`, 'color: #00FF00; font-weight: bold');
});

socket.on('shopPurchaseFailed', (data) => {
    console.log(`%c❌ ${data.reason} | Vous avez ${data.current}/${data.required} 💎`, 'color: #FF6B6B; font-weight: bold');
});

// Événement d'erreur général
socket.on('error', (data) => {
    console.log(`%c⚠️ ${data.message}`, 'color: #FFA500; font-weight: bold');
});

// Gestion Clavier
document.addEventListener('keydown', (e) => {
    if(e.code === 'ArrowUp') { inputs.up = true; inputsMomentum.up = 1; }
    if(e.code === 'ArrowDown') { inputs.down = true; inputsMomentum.down = 1; }
    if(e.code === 'ArrowLeft') { inputs.left = true; inputsMomentum.left = 1; }
    if(e.code === 'ArrowRight') { inputs.right = true; inputsMomentum.right = 1; }
    
    // Checkpoint avec Espace
    if(e.code === 'Space') {
        actions.setCheckpoint = true;
        e.preventDefault(); // Empêche le scroll de la page
    }
    
    // Téléportation avec R
    if(e.code === 'KeyR') {
        actions.teleportCheckpoint = true;
        e.preventDefault();
    }
    
    // Dash avec Shift
    if(e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        actions.dash = true;
        e.preventDefault();
    }
    
    // --- SHOP : Achats avec touches numériques ---
    if (isShopOpen && e.key.match(/^[1-4]$/)) {
        const itemOrder = ['dash', 'checkpoint', 'rope', 'speedBoost'];
        const itemId = itemOrder[parseInt(e.key) - 1];
        if (itemId && shopItems[itemId]) {
            socket.emit('shopPurchase', { itemId });
            e.preventDefault();
        }
    }
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'ArrowUp') inputs.up = false;
    if(e.code === 'ArrowDown') inputs.down = false;
    if(e.code === 'ArrowLeft') inputs.left = false;
    if(e.code === 'ArrowRight') inputs.right = false;
    
    // Réinitialiser les actions (une seule fois par appui)
    if(e.code === 'Space') actions.setCheckpoint = false;
    if(e.code === 'KeyR') actions.teleportCheckpoint = false;
    if(e.code === 'ShiftLeft' || e.code === 'ShiftRight') actions.dash = false;
});

// Envoi des mouvements
setInterval(() => {
    // Appliquer l'inertie : si la touche est pressée, momentum = 1, sinon décay progressif
    if (!inputs.up) inputsMomentum.up *= MOMENTUM_DECAY;
    if (!inputs.down) inputsMomentum.down *= MOMENTUM_DECAY;
    if (!inputs.left) inputsMomentum.left *= MOMENTUM_DECAY;
    if (!inputs.right) inputsMomentum.right *= MOMENTUM_DECAY;

    // Envoyer les inputs avec inertie appliquée (si momentum > 0.1, on considère que c'est actif)
    const inputsWithMomentum = {
        up: inputs.up || inputsMomentum.up > 0.1,
        down: inputs.down || inputsMomentum.down > 0.1,
        left: inputs.left || inputsMomentum.left > 0.1,
        right: inputs.right || inputsMomentum.right > 0.1
    };

    socket.emit('movement', inputsWithMomentum);
    // Envoi des actions (checkpoint et dash)
    if (actions.setCheckpoint || actions.teleportCheckpoint || actions.dash) {
        socket.emit('checkpoint', actions);
    }
}, 1000 / 60);

// BOUCLE DE DESSIN
socket.on('state', (gameState) => {
    // C'est ici que la magie opère :
    // On utilise notre ID manuel (s'il existe), sinon l'ID natif
    const finalId = myPlayerId || socket.id;

    // Sauvegarder les joueurs pour la transition
    if (gameState.players) {
        currentPlayers = gameState.players;
    }

    // Récupérer les traces de tous les joueurs
    if (gameState.players) {
        for (let playerId in gameState.players) {
            const player = gameState.players[playerId];
            
            // Récupérer gems et purchasedFeatures du joueur actuel
            if (playerId === finalId) {
                playerGems = player.gems || 0;
                purchasedFeatures = player.purchasedFeatures || {};
            }
            
            // Afficher la trace SEULEMENT si la feature "rope" est achetée
            if (player.trail && player.color && player.purchasedFeatures && player.purchasedFeatures.rope) {
                trails[playerId] = {
                    color: player.color,
                    positions: player.trail
                };
            } else {
                // Sinon, supprimer la trace de ce joueur
                delete trails[playerId];
            }
        }
    }

    // Récupérer le checkpoint du joueur actuel depuis le serveur
    if (gameState.players && gameState.players[finalId] && gameState.players[finalId].checkpoint) {
        checkpoint = gameState.players[finalId].checkpoint;
    }

    // --- FERMETURE AUTOMATIQUE DU MAGASIN APRÈS 15 SECONDES ---
    if (isShopOpen && shopTimerStart) {
        const elapsed = Date.now() - shopTimerStart;
        if (elapsed >= SHOP_DURATION) {
            isShopOpen = false;
            shopTimerStart = null;
        }
    }

    // --- FERMETURE AUTOMATIQUE DE LA TRANSITION APRÈS 3 SECONDES ---
    if (isInTransition && transitionStartTime) {
        const transitionElapsed = Date.now() - transitionStartTime;
        if (transitionElapsed >= TRANSITION_DURATION) {
            isInTransition = false;
            transitionStartTime = null;
        }
    }

    if (typeof renderGame === "function") {
        const shopTimeRemaining = isShopOpen && shopTimerStart ? Math.max(0, Math.ceil((SHOP_DURATION - (Date.now() - shopTimerStart)) / 1000)) : 0;
        
        // Calculer le zoom progressif (1.0 = pas de zoom, 0.95 = 5% plus petit)
        // Formule : 1.0 - (level - 1) * 0.02, mais limité entre 0.7 et 1.0
        const zoomLevel = Math.max(0.7, Math.min(1.0, 1.0 - (level - 1) * 0.02));
        
        // Calculer la progression de transition
        const transitionProgress = isInTransition && transitionStartTime ? (Date.now() - transitionStartTime) / TRANSITION_DURATION : 0;
        
        renderGame(ctx, canvas, map, gameState.players, gameState.coin, finalId, currentHighScore, level, checkpoint, trails, isShopOpen, playerGems, purchasedFeatures, shopTimeRemaining, zoomLevel, isInTransition, transitionProgress, levelUpPlayerSkin, levelUpTime);
    }
});