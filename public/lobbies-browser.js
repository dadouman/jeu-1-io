// public/lobbies-browser.js - Affichage des lobbies en cours

let activeLobies = [];
let lobbiesBrowserVisible = false;

/**
 * Affiche le navigateur de lobbies
 */
function showLobbiesBrowser() {
    lobbiesBrowserVisible = true;
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
    }
    
    // Demander la liste des lobbies au serveur
    if (socket) {
        socket.emit('getActiveLobies');
    }
}

/**
 * Cache le navigateur de lobbies
 */
function hideLobbiesBrowser() {
    lobbiesBrowserVisible = false;
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'none';
    }
}

/**
 * Met à jour la liste des lobbies reçue du serveur
 */
function updateActiveLobies(lobies) {
    activeLobies = lobies || [];
    console.log(`📊 Lobbies actifs: ${activeLobies.length}`);
}

/**
 * Rend les lobbies à l'écran
 */
function renderLobbiesBrowser(ctx, canvas) {
    if (!lobbiesBrowserVisible) return;

    // Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Zone d'affichage
    const margin = 40;
    const width = canvas.width - margin * 2;
    const height = canvas.height - margin * 2;
    
    // Titre
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🎮 LOBBIES EN COURS", margin + 20, margin + 40);

    // Bouton fermer
    ctx.fillStyle = "#E74C3C";
    ctx.fillRect(canvas.width - 100, margin, 80, 40);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Fermer", canvas.width - 60, margin + 28);

    // Liste des lobbies
    const startY = margin + 100;
    const cardHeight = 80;
    const cardMargin = 10;
    
    if (activeLobies.length === 0) {
        ctx.fillStyle = "#AAAAAA";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Aucun lobby en cours...", margin + 20, startY + 40);
    } else {
        activeLobies.forEach((lobby, index) => {
            const y = startY + index * (cardHeight + cardMargin);
            
            // Carte du lobby
            ctx.fillStyle = "#2a2a3e";
            ctx.fillRect(margin, y, width, cardHeight);
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.strokeRect(margin, y, width, cardHeight);

            // Info du lobby
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "left";
            ctx.fillText(lobby.modeDisplay, margin + 15, y + 25);

            // Détails
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "14px Arial";
            const detailsText = `👥 ${lobby.players} joueur${lobby.players > 1 ? 's' : ''} | 🎯 Niveau ${lobby.level} | ⏱️ ${lobby.uptime}s`;
            ctx.fillText(detailsText, margin + 15, y + 50);

            // Bouton rejoindre
            const btnWidth = 120;
            const btnHeight = 40;
            const btnX = margin + width - btnWidth - 10;
            const btnY = y + (cardHeight - btnHeight) / 2;
            
            ctx.fillStyle = "#2ECC71";
            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            ctx.strokeStyle = "#27AE60";
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
            
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Rejoindre", btnX + btnWidth / 2, btnY + 28);

            // Zone cliquable
            if (!lobby._clickArea) {
                lobby._clickArea = {
                    x: btnX,
                    y: btnY,
                    width: btnWidth,
                    height: btnHeight,
                    mode: lobby.mode,
                    index: index
                };
            }
        });
    }

    // Zone cliquable du bouton fermer
    if (!window.closeLobbiesBrowserArea) {
        window.closeLobbiesBrowserArea = {
            x: canvas.width - 100,
            y: margin,
            width: 80,
            height: 40
        };
    }
}

/**
 * Gère les clics sur l'interface des lobbies
 */
function handleLobbiesBrowserClick(mouseX, mouseY) {
    if (!lobbiesBrowserVisible) return false;

    // Bouton fermer
    if (window.closeLobbiesBrowserArea) {
        const btn = window.closeLobbiesBrowserArea;
        if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
            mouseY >= btn.y && mouseY <= btn.y + btn.height) {
            hideLobbiesBrowser();
            return true;
        }
    }

    // Boutons rejoindre
    activeLobies.forEach((lobby) => {
        if (lobby._clickArea) {
            const btn = lobby._clickArea;
            if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                mouseY >= btn.y && mouseY <= btn.y + btn.height) {
                joinLobby(lobby.mode);
                return true;
            }
        }
    });

    return false;
}

/**
 * Rejoint un lobby existant
 */
function joinLobby(mode) {
    if (lobbiesRebooting) {
        console.log('⏳ Clics bloqués: les lobbies se redémarrent...');
        return;
    }

    if (socket) {
        socket.emit('joinExistingLobby', { mode });
        console.log(`🎮 Tentative de rejoindre le lobby: ${mode}`);
    }
}

// === SOCKET EVENTS ===
if (typeof socket !== 'undefined' && socket) {
    // Réception de la liste des lobbies
    socket.on('activeLobiesUpdate', (data) => {
        updateActiveLobies(data.lobbies || []);
    });

    // Confirmation de rejoindre un lobby
    socket.on('joinedLobby', (data) => {
        if (data.success) {
            console.log(`✅ Lobby rejoint: ${data.mode}`);
            hideLobbiesBrowser();
            // Le mode du jeu sera défini par le serveur
            selectedMode = data.mode;
            currentGameMode = data.mode.replace('Auction', '');
        }
    });

    // Erreur lors de la rejoindre d'un lobby
    socket.on('error', (data) => {
        if (data.message && data.message.includes('lobby')) {
            console.error('❌ Erreur:', data.message);
        }
    });
}
