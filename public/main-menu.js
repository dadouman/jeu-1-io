// main-menu.js - Menu principal avec options manette et split-screen

var mainMenuVisible = true; // Afficher le menu principal au démarrage (var pour accès global)
var mainMenuOptions = {
    startGame: false,
    gamepadEnabled: false,
    splitScreenEnabled: false
};

// Zones cliquables du menu principal
var mainMenuClickAreas = null;

// Navigation à la manette
var mainMenuSelectedIndex = 0; // 0 = manette, 1 = split-screen, 2 = commencer (var pour accès global)
var mainMenuGamepadYInputDebounce = 0; // Évite les inputs répétés

/**
 * Affiche le menu principal
 */
function showMainMenu() {
    mainMenuVisible = true;
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'none';
    }
}

/**
 * Masque le menu principal et affiche le mode selector
 */
function hideMainMenu() {
    mainMenuVisible = false;
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
    }
}

/**
 * Bascule la manette depuis le menu principal
 */
function toggleGamepadFromMainMenu() {
    mainMenuOptions.gamepadEnabled = !mainMenuOptions.gamepadEnabled;
    if (mainMenuOptions.gamepadEnabled) {
        gamepadEnabled = true;
        showGamepadStatusMessage('Manette activée');
    } else {
        gamepadEnabled = false;
        showGamepadStatusMessage('Manette désactivée');
    }
}

/**
 * Bascule le split-screen depuis le menu principal
 */
function toggleSplitScreenFromMainMenu() {
    mainMenuOptions.splitScreenEnabled = !mainMenuOptions.splitScreenEnabled;
    if (mainMenuOptions.splitScreenEnabled) {
        const enabled = toggleSplitScreen();
        if (enabled && typeof attachSecondaryStateListener === 'function') {
            attachSecondaryStateListener();
        }
    } else {
        if (splitScreenEnabled) {
            toggleSplitScreen();
        }
    }
}

/**
 * Lance le jeu depuis le menu principal
 */
function startGameFromMainMenu() {
    hideMainMenu();
}

/**
 * Gère les clics sur le menu principal
 */
function handleMainMenuClick(mouseX, mouseY) {
    if (!mainMenuVisible || !mainMenuClickAreas) return false;

    const isInside = (rect) => rect && mouseX >= rect.x && mouseX <= rect.x + rect.width && mouseY >= rect.y && mouseY <= rect.y + rect.height;

    if (isInside(mainMenuClickAreas.gamepad)) {
        toggleGamepadFromMainMenu();
        return true;
    }

    if (isInside(mainMenuClickAreas.split)) {
        toggleSplitScreenFromMainMenu();
        return true;
    }

    if (isInside(mainMenuClickAreas.start)) {
        startGameFromMainMenu();
        return true;
    }

    return false;
}

/**
 * Affiche le menu principal sur le canvas
 */
function renderMainMenu(ctx, canvas) {
    // Overlay semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dimensions du menu
    const menuWidth = 600;
    const menuHeight = 500;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Cadre du menu
    ctx.fillStyle = "#222";
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Titre du menu
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎮 MENU PRINCIPAL", canvas.width / 2, menuY + 50);

    // Sous-titre
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px Arial";
    ctx.fillText("Configures ton expérience", canvas.width / 2, menuY + 80);

    // Boutons du menu
    const buttonWidth = 350;
    const buttonHeight = 60;
    const buttonX = menuX + (menuWidth - buttonWidth) / 2;
    const startButtonY = menuY + 120;
    const gamepadButtonY = startButtonY + 85;
    const splitButtonY = gamepadButtonY + 85;
    const startGameButtonY = splitButtonY + 85;

    // Zones cliquables
    mainMenuClickAreas = {
        gamepad: { x: buttonX, y: gamepadButtonY, width: buttonWidth, height: buttonHeight },
        split: { x: buttonX, y: splitButtonY, width: buttonWidth, height: buttonHeight },
        start: { x: buttonX, y: startGameButtonY, width: buttonWidth, height: buttonHeight }
    };

    // Bouton Manette
    const gamepadButtonColor = gamepadEnabled ? "#2ECC71" : "#E74C3C";
    ctx.fillStyle = gamepadButtonColor;
    ctx.fillRect(buttonX, gamepadButtonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, gamepadButtonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎮 Manette: " + (gamepadEnabled ? "✓ ACTIVÉE" : "✗ DÉSACTIVÉE"), canvas.width / 2, gamepadButtonY + 40);

    // Bouton Split-Screen
    const splitButtonColor = splitScreenEnabled ? "#2ECC71" : "#E74C3C";
    ctx.fillStyle = splitButtonColor;
    ctx.fillRect(buttonX, splitButtonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, splitButtonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("👥 Split-Screen: " + (splitScreenEnabled ? "✓ ACTIVÉ" : "✗ DÉSACTIVÉ"), canvas.width / 2, splitButtonY + 40);

    // Bouton Commencer
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(buttonX, startGameButtonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, startGameButtonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("▶ COMMENCER", canvas.width / 2, startGameButtonY + 40);

    // Instructions au clavier
    ctx.fillStyle = "#AAAAAA";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Clic souris pour configurer | Manette: D-Pad/Stick + A pour confirmer", canvas.width / 2, menuY + menuHeight + 20);
}

/**
 * Gère la navigation à la manette sur le mode selector
 */
let modeSelectorIndex = 0; // Index du mode sélectionné (classic=0, classicPrim=1, infinite=2, solo=3, custom=4)
let modeSelectorGamepadYInputDebounce = 0;

function handleModeSelectGamepadNavigation(gamepad) {
    // Déterminer le nombre de modes disponibles
    const modeList = ['classic', 'classicPrim', 'infinite', 'solo'];
    if (customModeConfig) {
        modeList.push('custom');
    }
    const maxModes = modeList.length;

    // Mouvement horizontal pour naviguer entre les modes (left/right)
    const axisX = applyDeadzone(gamepad.axes[0] || 0);
    const dPadLeft = gamepad.buttons[14] && gamepad.buttons[14].pressed;
    const dPadRight = gamepad.buttons[15] && gamepad.buttons[15].pressed;

    // Éviter les inputs répétés
    if (axisX < -0.5 || dPadLeft) {
        if (modeSelectorGamepadYInputDebounce !== -1) {
            if (modeSelectorIndex > 0) {
                modeSelectorIndex--;
                modeSelectorGamepadYInputDebounce = -1;
            }
        }
    } else if (axisX > 0.5 || dPadRight) {
        if (modeSelectorGamepadYInputDebounce !== 1) {
            if (modeSelectorIndex < maxModes - 1) {
                modeSelectorIndex++;
                modeSelectorGamepadYInputDebounce = 1;
            }
        }
    } else {
        modeSelectorGamepadYInputDebounce = 0;
    }

    // Bouton A pour confirmer la sélection
    const aPressed = gamepad.buttons[0] && gamepad.buttons[0].pressed;
    if (aPressed && !modeSelectorGamepadYInputDebounce) {
        selectMode(modeList[modeSelectorIndex]);
        modeSelectorGamepadYInputDebounce = 2;
    } else if (!aPressed) {
        if (modeSelectorGamepadYInputDebounce === 2) {
            modeSelectorGamepadYInputDebounce = 0;
        }
    }
}

/**
 * Gère la navigation à la manette sur le menu principal
 */
function handleMainMenuGamepadNavigation(gamepad) {
    // Mouvement vertical du D-Pad ou du stick gauche
    const axisY = applyDeadzone(gamepad.axes[1] || 0);
    const dPadUp = gamepad.buttons[12] && gamepad.buttons[12].pressed;
    const dPadDown = gamepad.buttons[13] && gamepad.buttons[13].pressed;

    // Éviter les inputs répétés en utilisant un debounce
    if (axisY < -0.5 || dPadUp) {
        if (mainMenuGamepadYInputDebounce !== -1) {
            if (mainMenuSelectedIndex > 0) {
                mainMenuSelectedIndex--;
                mainMenuGamepadYInputDebounce = -1;
            }
        }
    } else if (axisY > 0.5 || dPadDown) {
        if (mainMenuGamepadYInputDebounce !== 1) {
            if (mainMenuSelectedIndex < 2) {
                mainMenuSelectedIndex++;
                mainMenuGamepadYInputDebounce = 1;
            }
        }
    } else {
        mainMenuGamepadYInputDebounce = 0;
    }

    // Bouton A pour confirmer
    const aPressed = gamepad.buttons[0] && gamepad.buttons[0].pressed;
    if (aPressed && !mainMenuGamepadYInputDebounce) {
        if (mainMenuSelectedIndex === 0) {
            toggleGamepadFromMainMenu();
        } else if (mainMenuSelectedIndex === 1) {
            toggleSplitScreenFromMainMenu();
        } else if (mainMenuSelectedIndex === 2) {
            startGameFromMainMenu();
        }
        mainMenuGamepadYInputDebounce = 2; // Bloquer pour éviter les appuis multiples
    } else if (!aPressed) {
        // Débloquer quand le bouton est relâché
        if (mainMenuGamepadYInputDebounce === 2) {
            mainMenuGamepadYInputDebounce = 0;
        }
    }
}
