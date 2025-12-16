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
            soloInactiveTime = 0;
            soloStartCountdownActive = false; // Réinitialiser le flag countdown
            inputsBlocked = false; // Débloquer les inputs
            // Déclencher le countdown (sélectionner le mode)
            selectMode('solo');
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
    if (e.code === 'Escape') {
        togglePause('keyboard-escape');
        e.preventDefault();
        return;
    }

    if (pauseMenuVisible) {
        if (e.code === 'Enter') {
            toggleGamepadSupport('keyboard-enter');
            e.preventDefault();
        }
        // Toggle split-screen depuis le menu pause (touche S)
        if (e.code === 'KeyS') {
            toggleSplitScreen();
            e.preventDefault();
        }
        return; // Ne pas traiter d'autres inputs pendant la pause
    }

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

    // Joueur 2 (split-screen) : ZQSD
    if (splitScreenEnabled) {
        if (e.code === 'KeyZ') { inputsP2.up = true; inputsMomentumP2.up = 1; }
        if (e.code === 'KeyS') { inputsP2.down = true; inputsMomentumP2.down = 1; }
        if (e.code === 'KeyQ') { inputsP2.left = true; inputsMomentumP2.left = 1; }
        if (e.code === 'KeyD') { inputsP2.right = true; inputsMomentumP2.right = 1; }
    }
    
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

    // Joueur 2 (split-screen) : actions dédiées
    if (splitScreenEnabled) {
        if (e.code === 'KeyF') { actionsP2.setCheckpoint = true; e.preventDefault(); }
        if (e.code === 'KeyG') { actionsP2.teleportCheckpoint = true; e.preventDefault(); }
        if (e.code === 'KeyC') { actionsP2.dash = true; e.preventDefault(); }
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
    if (isShopOpen && e.key.match(/^[1-5]$/)) {
        const itemOrder = ['dash', 'checkpoint', 'compass', 'rope', 'speedBoost'];
        const itemId = itemOrder[parseInt(e.key) - 1];
        if (itemId && shopItems[itemId]) {
            socket.emit('shopPurchase', { itemId });
            e.preventDefault();
        }
    }
    
    // --- SHOP : Quitter le shop avec Entrée ---
    if (isShopOpen && e.code === 'Enter') {
        socket.emit('validateShop');
        console.log(`%c⌨️ Touche Entrée: fermeture du shop`, 'color: #00FF00; font-weight: bold');
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
    if (pauseMenuVisible) {
        return;
    }

    // ⚠️ IGNORER LES TOUCHES SI LA MODAL DE BUG EST OUVERTE
    if (window.bugReporter && window.bugReporter.isOpen) {
        return;
    }

    if(e.code === 'ArrowUp') inputs.up = false;
    if(e.code === 'ArrowDown') inputs.down = false;
    if(e.code === 'ArrowLeft') inputs.left = false;
    if(e.code === 'ArrowRight') inputs.right = false;

    // Joueur 2 (split-screen) : ZQSD
    if (splitScreenEnabled) {
        if (e.code === 'KeyZ') inputsP2.up = false;
        if (e.code === 'KeyS') inputsP2.down = false;
        if (e.code === 'KeyQ') inputsP2.left = false;
        if (e.code === 'KeyD') inputsP2.right = false;
    }
    
    if(e.code === 'Space') actions.setCheckpoint = false;
    if(e.code === 'KeyR') actions.teleportCheckpoint = false;
    if(e.code === 'ShiftLeft' || e.code === 'ShiftRight') actions.dash = false;

    // Joueur 2 (split-screen)
    if (splitScreenEnabled) {
        if (e.code === 'KeyF') actionsP2.setCheckpoint = false;
        if (e.code === 'KeyG') actionsP2.teleportCheckpoint = false;
        if (e.code === 'KeyC') actionsP2.dash = false;
    }
});

// --- BOUCLE D'ENVOI DES MOUVEMENTS (60 FPS) ---
setInterval(() => {
    if (isPaused) {
        socket.emit('movement', { up: false, down: false, left: false, right: false });
        return;
    }

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

    // === JOUEUR 2 (split-screen) ===
    if (splitScreenEnabled && socketSecondary && myPlayerIdSecondary) {
        if (!inputsP2.up) inputsMomentumP2.up *= MOMENTUM_DECAY;
        if (!inputsP2.down) inputsMomentumP2.down *= MOMENTUM_DECAY;
        if (!inputsP2.left) inputsMomentumP2.left *= MOMENTUM_DECAY;
        if (!inputsP2.right) inputsMomentumP2.right *= MOMENTUM_DECAY;

        const inputsWithMomentumP2 = {
            up: inputsP2.up || inputsMomentumP2.up > 0.1,
            down: inputsP2.down || inputsMomentumP2.down > 0.1,
            left: inputsP2.left || inputsMomentumP2.left > 0.1,
            right: inputsP2.right || inputsMomentumP2.right > 0.1
        };

        socketSecondary.emit('movement', inputsWithMomentumP2);

        if (actionsP2.setCheckpoint || actionsP2.teleportCheckpoint || actionsP2.dash) {
            socketSecondary.emit('checkpoint', actionsP2);
        }
    }
}, 1000 / 60);
