// keyboard-input.js - Gestion des entrées clavier et envoi des mouvements

// --- GESTION DES CLICS SOURIS ---
document.addEventListener('click', (e) => {
    // Bouton REJOUER
    if (window.replayButtonRect) {
        const rect = window.replayButtonRect;
        if (e.clientX >= rect.x && e.clientX <= rect.x + rect.w &&
            e.clientY >= rect.y && e.clientY <= rect.y + rect.h) {
            // Réinitialiser l'état solo
            isSoloGameFinished = false;
            soloTotalTime = 0;
            soloSplitTimes = [];
            socket.emit('selectGameMode', { mode: 'solo' });
            window.replayButtonRect = null;
            return;
        }
    }
    
    // Bouton MENU
    if (window.menuButtonRect) {
        const rect = window.menuButtonRect;
        if (e.clientX >= rect.x && e.clientX <= rect.x + rect.w &&
            e.clientY >= rect.y && e.clientY <= rect.y + rect.h) {
            // Retour au menu principal
            location.reload();
            return;
        }
    }
});

document.addEventListener('keydown', (e) => {
    // ⚠️ BLOQUER TOUS LES INPUTS JUSQU'À 3000ms DU COUNTDOWN
    if (inputsBlocked) {
        return; // Complètement bloquer
    }

    // ⚠️ IGNORER LES TOUCHES SI LA MODAL DE BUG EST OUVERTE
    if (window.bugReporter && window.bugReporter.isOpen) {
        return; // Laisser la modal avoir tous les inputs
    }

    if(e.code === 'ArrowUp') { inputs.up = true; inputsMomentum.up = 1; }
    if(e.code === 'ArrowDown') { inputs.down = true; inputsMomentum.down = 1; }
    if(e.code === 'ArrowLeft') { inputs.left = true; inputsMomentum.left = 1; }
    if(e.code === 'ArrowRight') { inputs.right = true; inputsMomentum.right = 1; }
    
    // Checkpoint avec Espace
    if(e.code === 'Space') {
        actions.setCheckpoint = true;
        e.preventDefault();
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
    
    // --- SYSTÈME DE VOTE POUR REDÉMARRER ---
    // P : Proposer un redémarrage
    if(e.code === 'KeyP') {
        socket.emit('proposeRestart');
        e.preventDefault();
    }
    
    // O : Voter oui
    if(e.code === 'KeyO') {
        socket.emit('voteRestart', { vote: true });
        e.preventDefault();
    }
    
    // N : Voter non
    if(e.code === 'KeyN') {
        socket.emit('voteRestart', { vote: false });
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
    
    // --- SHOP : Quitter le shop avec Entrée ---
    if (isShopOpen && e.code === 'Enter') {
        socket.emit('validateShop');
        e.preventDefault();
    }
    
    // --- SOLO MODE : Toggle delta time (T) ---
    if(e.code === 'KeyT') {
        if (currentGameMode === 'solo') {
            soloShowPersonalDelta = !soloShowPersonalDelta;
            console.log(`%c🔄 Solo Delta mode: ${soloShowPersonalDelta ? '🎯 Personnel' : '🌍 Mondial'}`, 'color: #00FFFF; font-weight: bold; font-size: 14px');
        } else if (currentGameMode === 'classic') {
            classicShowPersonalDelta = !classicShowPersonalDelta;
            console.log(`%c🔄 Classic Record mode: ${classicShowPersonalDelta ? '🎯 Personnel' : '🌍 Mondial'}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
        }
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    // ⚠️ IGNORER LES TOUCHES SI LA MODAL DE BUG EST OUVERTE
    if (window.bugReporter && window.bugReporter.isOpen) {
        return;
    }

    if(e.code === 'ArrowUp') inputs.up = false;
    if(e.code === 'ArrowDown') inputs.down = false;
    if(e.code === 'ArrowLeft') inputs.left = false;
    if(e.code === 'ArrowRight') inputs.right = false;
    
    if(e.code === 'Space') actions.setCheckpoint = false;
    if(e.code === 'KeyR') actions.teleportCheckpoint = false;
    if(e.code === 'ShiftLeft' || e.code === 'ShiftRight') actions.dash = false;
});

// --- BOUCLE D'ENVOI DES MOUVEMENTS (60 FPS) ---
setInterval(() => {
    // Appliquer l'inertie
    if (!inputs.up) inputsMomentum.up *= MOMENTUM_DECAY;
    if (!inputs.down) inputsMomentum.down *= MOMENTUM_DECAY;
    if (!inputs.left) inputsMomentum.left *= MOMENTUM_DECAY;
    if (!inputs.right) inputsMomentum.right *= MOMENTUM_DECAY;

    // Envoyer les inputs avec inertie
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
