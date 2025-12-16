// pause-menu.js - Gestion de la pause et des toggles d'options (manette)

function resetInputsAndActions() {
    // Stoppe les déplacements/compétences actifs
    inputs = { up: false, down: false, left: false, right: false };
    inputsMomentum = { up: 0, down: 0, left: 0, right: 0 };
    actions = { setCheckpoint: false, teleportCheckpoint: false, dash: false };
    if (typeof socket !== 'undefined' && socket) {
        socket.emit('movement', inputs);
    }
}

function togglePause(source = 'unknown') {
    isPaused = !isPaused;
    pauseMenuVisible = isPaused;
    lastPauseToggleSource = source;
    if (isPaused) {
        resetInputsAndActions();
    } else {
        gamepadStatusMessage = '';
    }
    return isPaused;
}

function showGamepadStatusMessage(message) {
    gamepadStatusMessage = message;
    gamepadStatusMessageTime = Date.now();
}

function toggleGamepadSupport(source = 'unknown') {
    gamepadEnabled = !gamepadEnabled;
    const baseLabel = gamepadEnabled ? 'Manette activée' : 'Manette désactivée';
    const details = activeGamepadName ? ` (${activeGamepadName})` : '';
    showGamepadStatusMessage(`${baseLabel}${details}`);
    lastPauseToggleSource = source;
    return gamepadEnabled;
}
