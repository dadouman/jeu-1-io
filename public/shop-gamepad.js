// shop-gamepad.js - Gestion de la navigation du shop à la manette

let shopGamepadNavigationEnabled = false; // Activer la nav gamepad quand le shop est ouvert
let shopSelectedItemIndex = 0; // Index de l'item sélectionné (0-4 pour 5 items)
let shopGamepadXInputDebounce = 0; // Débounce pour les inputs gauche/droite
let shopContinueButtonSelected = false; // Le bouton "Continuer" est-il sélectionné?
let shopItemsCount = 5; // Nombre d'items du shop (varie selon le mode)

/**
 * Réinitialise la navigation du shop
 */
function resetShopGamepadNavigation() {
    shopSelectedItemIndex = 0;
    shopContinueButtonSelected = false;
    shopGamepadXInputDebounce = 0;
    shopGamepadNavigationEnabled = true;
}

/**
 * Gère la navigation à la manette dans le shop
 */
function handleShopGamepadNavigation(gamepad) {
    if (!shopGamepadNavigationEnabled || !isShopOpen) return;

    // Boutique enchères: navigation manette non implémentée (éviter des achats invalides)
    try {
        const activeType = (typeof activeShopSide === 'string' && activeShopSide === 'secondary')
            ? (typeof shopTypeP2 !== 'undefined' ? shopTypeP2 : 'classic')
            : (typeof shopType !== 'undefined' ? shopType : 'classic');
        if (activeType === 'dutchAuction') {
            return;
        }
    } catch (e) {
        // noop
    }

    // Mouvement horizontal pour naviguer entre les items
    const axisX = applyDeadzone(gamepad.axes[0] || 0);
    const dPadLeft = gamepad.buttons[14] && gamepad.buttons[14].pressed;
    const dPadRight = gamepad.buttons[15] && gamepad.buttons[15].pressed;

    // Mouvement vertical pour sélectionner le bouton "Continuer"
    const axisY = applyDeadzone(gamepad.axes[1] || 0);
    const dPadUp = gamepad.buttons[12] && gamepad.buttons[12].pressed;
    const dPadDown = gamepad.buttons[13] && gamepad.buttons[13].pressed;

    // Navigation horizontale entre les items
    if (axisX < -0.5 || dPadLeft) {
        if (shopGamepadXInputDebounce !== -1) {
            if (!shopContinueButtonSelected && shopSelectedItemIndex > 0) {
                shopSelectedItemIndex--;
                shopGamepadXInputDebounce = -1;
            }
        }
    } else if (axisX > 0.5 || dPadRight) {
        if (shopGamepadXInputDebounce !== 1) {
            if (!shopContinueButtonSelected && shopSelectedItemIndex < shopItemsCount - 1) {
                shopSelectedItemIndex++;
                shopGamepadXInputDebounce = 1;
            }
        }
    } else {
        shopGamepadXInputDebounce = 0;
    }

    // Navigation verticale vers le bouton "Continuer"
    if (axisY > 0.5 || dPadDown) {
        shopContinueButtonSelected = true;
    } else if (axisY < -0.5 || dPadUp) {
        shopContinueButtonSelected = false;
    }

    // Bouton A pour valider
    const aPressed = gamepad.buttons[0] && gamepad.buttons[0].pressed;
    const bPressed = gamepad.buttons[1] && gamepad.buttons[1].pressed;

    if (aPressed) {
        if (shopContinueButtonSelected) {
            // Valider et continuer (équivalent à cliquer sur le bouton Continuer)
            isPlayerReadyToContinue = true;
            if (socket) {
                socket.emit('playerReadyToContinueShop');
            }
        } else {
            // Acheter l'item sélectionné
            const itemList = ['dash', 'checkpoint', 'compass', 'rope', 'speedBoost'];
            const itemId = itemList[shopSelectedItemIndex];
            if (itemId && socket) {
                socket.emit('shopPurchase', { itemId });
            }
        }
    }

    // Bouton B pour quitter le shop (si applicable)
    if (bPressed && mode === 'solo') {
        socket.emit('validateShop');
    }
}

/**
 * Met à jour le nombre d'items du shop selon le mode
 */
function updateShopItemsCount(mode) {
    if (mode === 'solo') {
        shopItemsCount = 5; // dash, checkpoint, compass, rope, speedBoost
    } else if (mode === 'infinite') {
        shopItemsCount = 1; // speedBoost seulement
    } else {
        shopItemsCount = 5; // Tous les items
    }
    resetShopGamepadNavigation();
}
