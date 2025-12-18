// pause-menu.js - Gestion de la pause et des toggles d'options (manette)

let returnToModeVoteActive = false;
let returnToModeVoteTime = null;
const RETURN_TO_MODE_VOTE_TIMEOUT = 30000; // 30 secondes pour voter

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

/**
 * Propose un vote pour retourner au menu de sélection du mode
 */
function proposeReturnToModeVote() {
    if (currentGameMode === 'solo') {
        // Solo: retour direct sans vote
        returnToModeVote(true);
        return;
    }

    // Multijoueur: démarrer le vote
    socket.emit('proposeReturnToMode', {});
    returnToModeVoteActive = true;
    returnToModeVoteTime = Date.now();
}

/**
 * Vote pour retourner au mode (oui/non)
 */
function returnToModeVote(vote = true) {
    if (!returnToModeVoteActive) return;
    
    socket.emit('voteReturnToMode', { vote });
    returnToModeVoteActive = false;
}

/**
 * Annuler le vote pour retourner au mode
 */
function cancelReturnToModeVote() {
    returnToModeVoteActive = false;
    returnToModeVoteTime = null;
}

function handlePauseMenuClick(mouseX, mouseY) {
    if (!pauseMenuVisible || !pauseMenuClickAreas) return false;

    const isInside = (rect) => rect && mouseX >= rect.x && mouseX <= rect.x + rect.width && mouseY >= rect.y && mouseY <= rect.y + rect.height;

    if (isInside(pauseMenuClickAreas.gamepad)) {
        toggleGamepadSupport('mouse-click');
        return true;
    }

    if (isInside(pauseMenuClickAreas.split)) {
        const enabled = toggleSplitScreen();
        if (enabled && typeof attachSecondaryStateListener === 'function') {
            attachSecondaryStateListener();
        }
        return true;
    }

    if (isInside(pauseMenuClickAreas.returnToMode)) {
        proposeReturnToModeVote();
        return true;
    }

    return false;
}
