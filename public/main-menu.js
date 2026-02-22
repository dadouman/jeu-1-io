// main-menu.js - Menu principal avec options manette et split-screen

var mainMenuVisible = true; // Afficher le menu principal au démarrage (var pour accès global)
var mainMenuGameStarting = false; // Bouton COMMENCER cliqué
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
    mainMenuGameStarting = false; // Réinitialiser quand on revient au menu
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
    mainMenuGameStarting = true; // Marquer comme commencé
    hideMainMenu();
    
    // Sécurité: réinitialiser après 10 secondes au cas où quelque chose se passe mal
    setTimeout(() => {
        if (mainMenuGameStarting) {
            console.log('⚠️ Timeout: Réinitialisation du flag mainMenuGameStarting');
            mainMenuGameStarting = false;
        }
    }, 10000);
}

/**
 * Gère les clics sur le menu principal
 */
function handleMainMenuClick(mouseX, mouseY) {
    if (!mainMenuVisible || !mainMenuClickAreas) return false;

    // Bloquer TOUS les clics si les lobbies se redémarrent
    if (lobbiesRebooting) {
        console.log('⏳ Clics bloqués: les lobbies se redémarrent...');
        return false;
    }

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
    // Déterminer la zone à afficher (en split-screen, affiche le menu sur chaque écran)
    const viewWidth = splitScreenEnabled ? canvas.width / 2 : canvas.width;
    const viewHeight = canvas.height;
    const offsetX = splitScreenEnabled ? canvas.width / 2 : 0;

    // Overlay semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(offsetX, 0, viewWidth, viewHeight);

    // Dimensions du menu (adaptées à la zone disponible)
    const menuWidth = Math.min(550, viewWidth - 40);
    const menuHeight = Math.min(480, viewHeight - 40);
    const menuX = offsetX + (viewWidth - menuWidth) / 2;
    const menuY = (viewHeight - menuHeight) / 2;

    // Cadre du menu
    ctx.fillStyle = "#222";
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Titre du menu (taille adaptée aux petits écrans)
    const titleSize = Math.max(18, Math.min(28, menuWidth / 20));
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("🎮 MENU", offsetX + viewWidth / 2, menuY + Math.max(25, titleSize));

    // Sous-titre (optionnel en petit écran)
    if (viewWidth > 400) {
        const subtitleSize = Math.max(12, Math.min(14, menuWidth / 40));
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${subtitleSize}px Arial`;
        ctx.fillText("Configure ton expérience", offsetX + viewWidth / 2, menuY + Math.max(45, titleSize + 20));
    }

    // Boutons du menu - adapté aux petits écrans
    const buttonWidth = Math.min(300, menuWidth - 40);
    const buttonHeight = Math.max(40, Math.min(50, menuHeight / 8));
    const buttonX = menuX + (menuWidth - buttonWidth) / 2;
    
    // Calculer les espacements adaptatifs
    const availableHeight = menuHeight - 120; // Menu moins titre et marge
    const totalButtonHeight = buttonHeight * 3; // 3 boutons
    const spacing = Math.max(8, (availableHeight - totalButtonHeight) / 4); // Espace adaptatif
    
    const startButtonY = menuY + 50 + spacing;
    const gamepadButtonY = startButtonY + buttonHeight + spacing;
    const splitButtonY = gamepadButtonY + buttonHeight + spacing;
    const startGameButtonY = splitButtonY + buttonHeight + spacing;

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

    const buttonFontSize = Math.max(12, Math.min(16, buttonHeight * 0.6));
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${buttonFontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("🎮 Manette: " + (gamepadEnabled ? "✓" : "✗"), offsetX + viewWidth / 2, gamepadButtonY + buttonHeight / 2 + 5);

    // Bouton Split-Screen
    const splitButtonColor = splitScreenEnabled ? "#2ECC71" : "#E74C3C";
    ctx.fillStyle = splitButtonColor;
    ctx.fillRect(buttonX, splitButtonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, splitButtonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${buttonFontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("👥 Split: " + (splitScreenEnabled ? "✓" : "✗"), offsetX + viewWidth / 2, splitButtonY + buttonHeight / 2 + 5);

    // Bouton Commencer
    const buttonColorStart = (lobbiesRebooting || mainMenuGameStarting) ? "#777777" : "#FFD700";
    const textColorStart = (lobbiesRebooting || mainMenuGameStarting) ? "#CCCCCC" : "#000000";
    ctx.fillStyle = buttonColorStart;
    ctx.fillRect(buttonX, startGameButtonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = (lobbiesRebooting || mainMenuGameStarting) ? "#555555" : "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, startGameButtonY, buttonWidth, buttonHeight);

    ctx.fillStyle = textColorStart;
    ctx.font = `bold ${Math.max(11, buttonFontSize)}px Arial`;
    ctx.textAlign = "center";
    let buttonText = "▶ COMMENCER";
    if (lobbiesRebooting) buttonText = "⏳ REDÉM...";
    if (mainMenuGameStarting) buttonText = "⏳ CHARGE...";
    ctx.fillText(buttonText, offsetX + viewWidth / 2, startGameButtonY + buttonHeight / 2 + 5);

    // Message de redémarrage si lobbies se redémarrent
    if (lobbiesRebooting) {
        ctx.fillStyle = "rgba(255, 100, 100, 0.8)";
        ctx.fillRect(offsetX, 0, viewWidth, viewHeight);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⏳ Redémarrage...", offsetX + viewWidth / 2, viewHeight / 2 - 20);
        
        ctx.fillStyle = "#FFFF00";
        ctx.font = "14px Arial";
        ctx.fillText("Les lobbies se réinitialisent", offsetX + viewWidth / 2, viewHeight / 2 + 20);
        ctx.fillText("Veuillez patienter...", offsetX + viewWidth / 2, viewHeight / 2 + 45);
    }
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
        // Bloquer TOUS les inputs si les lobbies se redémarrent
        if (!lobbiesRebooting) {
            if (mainMenuSelectedIndex === 0) {
                toggleGamepadFromMainMenu();
            } else if (mainMenuSelectedIndex === 1) {
                toggleSplitScreenFromMainMenu();
            } else if (mainMenuSelectedIndex === 2) {
                startGameFromMainMenu();
            }
        } else {
            console.log('⏳ Manette bloquée: les lobbies se redémarrent...');
        }
        mainMenuGamepadYInputDebounce = 2; // Bloquer pour éviter les appuis multiples
    } else if (!aPressed) {
        // Débloquer quand le bouton est relâché
        if (mainMenuGamepadYInputDebounce === 2) {
            mainMenuGamepadYInputDebounce = 0;
        }
    }
}
