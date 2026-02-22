// public/lobbies-browser.js - Navigateur de lobbies

console.log('✅ lobbies-browser.js chargé');

let lobbiesBrowserVisible = false;
let activeLobies = [];

/**
 * Affiche le navigateur de lobbies
 */
function showLobbiesBrowser() {
    console.log('🎮 Affichage du navigateur de lobbies');
    lobbiesBrowserVisible = true;
    
    // Demander la liste des lobbies au serveur
    if (typeof socket !== 'undefined' && socket) {
        console.log('📡 Envoi de getActiveLobies au serveur');
        socket.emit('getActiveLobies');
    } else {
        console.error('❌ Socket non défini');
    }
}

/**
 * Masque le navigateur de lobbies
 */
function hideLobbiesBrowser() {
    console.log('🎮 Masquage du navigateur de lobbies');
    lobbiesBrowserVisible = false;
    activeLobies = [];
}

/**
 * Met à jour la liste des lobbies
 */
function updateActiveLobies(lobies) {
    console.log('📊 Mise à jour des lobbies:', lobies);
    activeLobies = lobies || [];
}

/**
 * Affiche l'interface du navigateur de lobbies
 */
function renderLobbiesBrowser(ctx, canvas) {
    if (!lobbiesBrowserVisible) return;

    const margin = 40;
    const width = canvas.width - 2 * margin;
    const height = canvas.height - 2 * margin;

    // Fond semi-transparent
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cadre blanc
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(margin, margin, width, height);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, width, height);

    // Titre
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📊 Lobbies en Cours', margin + 20, margin + 50);

    // Bouton fermer (X en haut à droite)
    const closeSize = 40;
    const closeX = margin + width - closeSize - 10;
    const closeY = margin + 10;
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(closeX, closeY, closeSize, closeSize);
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 2;
    ctx.strokeRect(closeX, closeY, closeSize, closeSize);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeX + closeSize / 2, closeY + 25);

    // Sauvegarder la zone du bouton fermer
    window.closeLobbiesBrowserArea = { x: closeX, y: closeY, width: closeSize, height: closeSize };

    // Afficher les lobbies
    let startY = margin + 100;
    const cardHeight = 80;
    const cardMargin = 15;

    if (activeLobies.length === 0) {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = 'italic 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Aucun lobby en cours...', margin + 20, startY + 40);
        return;
    }

    activeLobies.forEach((lobby, index) => {
        const y = startY + index * (cardHeight + cardMargin);

        // Carte du lobby
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(margin + 10, y, width - 20, cardHeight);
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin + 10, y, width - 20, cardHeight);

        // Mode
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(lobby.modeDisplay || lobby.mode, margin + 20, y + 30);

        // Détails
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        const detailsText = `👥 ${lobby.players} joueur${lobby.players > 1 ? 's' : ''} | 🎯 Niveau ${lobby.level} | ⏱️ ${lobby.uptime}s`;
        ctx.fillText(detailsText, margin + 20, y + 55);

        // Bouton rejoindre
        const btnWidth = 120;
        const btnHeight = 40;
        const btnX = margin + width - btnWidth - 20;
        const btnY = y + (cardHeight - btnHeight) / 2;

        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Rejoindre', btnX + btnWidth / 2, btnY + 28);

        // Zone cliquable pour le bouton rejoindre
        if (!lobby._clickArea) {
            lobby._clickArea = { x: btnX, y: btnY, width: btnWidth, height: btnHeight, mode: lobby.mode };
        }
    });
}

/**
 * Gère les clics sur l'interface du navigateur
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
    for (let lobby of activeLobies) {
        if (lobby._clickArea) {
            const btn = lobby._clickArea;
            if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                mouseY >= btn.y && mouseY <= btn.y + btn.height) {
                joinLobby(lobby.mode);
                return true;
            }
        }
    }

    return false;
}

/**
 * Rejoint un lobby existant
 */
function joinLobby(mode) {
    console.log(`🎮 Tentative de rejoindre le lobby: ${mode}`);
    hideLobbiesBrowser();

    if (typeof socket !== 'undefined' && socket) {
        socket.emit('joinExistingLobby', { mode });
    }
}

/**
 * Initialise les événements socket pour les lobbies
 */
function initLobbiesBrowserSocketEvents() {
    console.log('🔍 Initialisation des événements socket lobbies');

    if (typeof socket === 'undefined' || !socket) {
        console.log('⏳ Socket non défini, réessai...');
        setTimeout(initLobbiesBrowserSocketEvents, 500);
        return;
    }

    // Réception des lobbies du serveur
    socket.on('activeLobiesUpdate', (data) => {
        console.log('📊 Reçu lobbies du serveur:', data);
        updateActiveLobies(data.lobbies || []);
    });

    // Confirmation de rejoindre
    socket.on('joinedLobby', (data) => {
        if (data.success) {
            console.log(`✅ Lobby rejoint: ${data.mode}`);
            hideLobbiesBrowser();
        }
    });

    console.log('✅ Événements socket lobbies initialisés');
}

// Initialiser les événements socket dès que possible
if (typeof window !== 'undefined') {
    setTimeout(() => {
        console.log('📌 Tentative d\'initialisation des événements socket lobbies');
        initLobbiesBrowserSocketEvents();
    }, 100);

    window.addEventListener('load', () => {
        console.log('📌 Load event, ré-initialisation des événements socket lobbies');
        initLobbiesBrowserSocketEvents();
    });
}
