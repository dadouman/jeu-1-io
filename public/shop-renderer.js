/**
 * Retourne la zone cliquable du bouton "Continuer"
 * @param {number} canvasWidth 
 * @param {number} canvasHeight 
 * @returns {object} {x, y, width, height}
 */
function getShopContinueButtonArea(canvasWidth, canvasHeight) {
    const shopWidth = 600;
    const shopHeight = 400;
    const shopX = (canvasWidth - shopWidth) / 2;
    const shopY = (canvasHeight - shopHeight) / 2;
    
    const continueButtonWidth = 150;
    const continueButtonHeight = 40;
    const continueButtonX = canvasWidth / 2 - continueButtonWidth / 2;
    const continueButtonY = shopY + shopHeight - 35;
    
    return {
        x: continueButtonX,
        y: continueButtonY,
        width: continueButtonWidth,
        height: continueButtonHeight
    };
}

/**
 * Affiche l'interface du shop
 */
function renderShop(ctx, canvas, level, playerGems, shopTimeRemaining) {
    // shopUi (split-screen): { items, animations, isPlayerReadyToContinue, readyCount, totalPlayers }
    const effectiveShopItems = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object')
        ? (arguments[5].items || {})
        : (typeof shopItems !== 'undefined' ? shopItems : {});

    const effectiveAnimations = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object')
        ? (arguments[5].animations || { hoveredItemId: null, purchaseAnimations: {} })
        : (typeof shopAnimations !== 'undefined' ? shopAnimations : { hoveredItemId: null, purchaseAnimations: {} });

    const effectiveIsReady = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object' && typeof arguments[5].isPlayerReadyToContinue === 'boolean')
        ? arguments[5].isPlayerReadyToContinue
        : (typeof isPlayerReadyToContinue !== 'undefined' ? isPlayerReadyToContinue : false);

    const effectiveReadyCount = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object' && typeof arguments[5].readyCount === 'number')
        ? arguments[5].readyCount
        : (typeof shopReadyCount !== 'undefined' ? shopReadyCount : 0);

    const effectiveTotalPlayers = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object' && typeof arguments[5].totalPlayers === 'number')
        ? arguments[5].totalPlayers
        : (typeof shopTotalPlayers !== 'undefined' ? shopTotalPlayers : 0);

    // Overlay semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dimensions du shop
    const shopWidth = 600;
    const shopHeight = 400;
    const shopX = (canvas.width - shopWidth) / 2;
    const shopY = (canvas.height - shopHeight) / 2;
    
    // Cadre du shop
    ctx.fillStyle = "#222";
    ctx.fillRect(shopX, shopY, shopWidth, shopHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);
    
    // Titre du shop
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    const shopNumber = Math.floor(level / 5);
    ctx.fillText("🏪 SHOP " + shopNumber, canvas.width / 2, shopY + 40);
    
    // Timer
    ctx.fillStyle = shopTimeRemaining <= 5 ? "#FF0000" : "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.fillText("⏱️ " + shopTimeRemaining + "s", canvas.width / 2, shopY + 65);
    
    // Gems disponibles (plus gros)
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`💎 ${playerGems}`, shopX + shopWidth - 20, shopY + 50);
    
    // Items du shop - utiliser shopItems du serveur si disponible, sinon fallback sur les valeurs par défaut
    const defaultItems = [
        { id: 'dash', name: 'Dash', emoji: '⚡', price: 5, color: '#FF6B6B' },
        { id: 'checkpoint', name: 'Checkpoint', emoji: '🚩', price: 3, color: '#00D4FF' },
        { id: 'compass', name: 'Boussole', emoji: '🧭', price: 4, color: '#2ECC71' },
        { id: 'rope', name: 'Rope', emoji: '🪢', price: 1, color: '#9B59B6' },
        { id: 'speedBoost', name: 'Speed+', emoji: '💨', price: 2, color: '#FFD700', isStackable: true }
    ];
    
    // Utiliser les items du serveur si disponibles
    let itemList = defaultItems;
    if (effectiveShopItems && Object.keys(effectiveShopItems).length > 0) {
        itemList = defaultItems.map(defaultItem => {
            const serverItem = effectiveShopItems[defaultItem.id];
            if (serverItem) {
                return {
                    ...defaultItem,
                    price: serverItem.price || defaultItem.price,
                    name: serverItem.name || defaultItem.name
                };
            }
            return defaultItem;
        });
    }
    
    renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems, effectiveAnimations);
    
    // Instructions et bouton continuer
    ctx.fillStyle = "#888";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Cliquez sur un item pour acheter | Appuyez sur 1,2,3,4,5 pour acheter", canvas.width / 2, shopY + shopHeight - 50);
    
    // Bouton "Continuer" pour fermer le shop
    const continueButtonWidth = 150;
    const continueButtonHeight = 40;
    const continueButtonX = canvas.width / 2 - continueButtonWidth / 2;
    const continueButtonY = shopY + shopHeight - 35;
    
    // Fond du bouton
    const isContinueButtonSelected = shopGamepadNavigationEnabled && shopContinueButtonSelected;
    ctx.fillStyle = isContinueButtonSelected ? '#FF6B6B' : '#FFD700';
    ctx.fillRect(continueButtonX, continueButtonY, continueButtonWidth, continueButtonHeight);
    
    // Bordure du bouton (plus épais si sélectionné)
    ctx.strokeStyle = isContinueButtonSelected ? '#FF0000' : '#FFA500';
    ctx.lineWidth = isContinueButtonSelected ? 3 : 2;
    ctx.strokeRect(continueButtonX, continueButtonY, continueButtonWidth, continueButtonHeight);
    
    // Texte du bouton
    ctx.fillStyle = isContinueButtonSelected ? '#FFF' : '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Si le joueur est prêt, afficher "x/y ont terminé"
    let buttonText = 'Continuer';
    if (effectiveIsReady) {
        buttonText = `${effectiveReadyCount}/${effectiveTotalPlayers} ont terminé`;
    }
    ctx.fillText(buttonText, canvas.width / 2, continueButtonY + continueButtonHeight / 2);
}

/**
 * Affiche les items du shop sous forme de carré (comme le HUD features)
 */
function renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems, animations = null) {
    const effectiveAnimations = animations || (typeof shopAnimations !== 'undefined' ? shopAnimations : { hoveredItemId: null, purchaseAnimations: {} });
    const BOX_SIZE = 90;
    const BOX_SPACING = 110;
    const ITEMS_Y = shopY + 130;
    
    // Centrer les items horizontalement
    const TOTAL_WIDTH = (itemList.length * BOX_SPACING) - BOX_SPACING + BOX_SIZE;
    const CENTER_X = shopX + (shopWidth - TOTAL_WIDTH) / 2;
    
    // Helper: Dessiner un rectangle arrondi
    const drawRoundRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };
    
    // Mettre à jour les animations (nettoyer celles qui ont terminé)
    const now = Date.now();
    for (const itemId in effectiveAnimations.purchaseAnimations) {
        const anim = effectiveAnimations.purchaseAnimations[itemId];
        if (now - anim.startTime > 800) { // Animation de 800ms
            delete effectiveAnimations.purchaseAnimations[itemId];
        }
    }
    
    itemList.forEach((item, index) => {
        const x = CENTER_X + (index * BOX_SPACING);
        const y = ITEMS_Y;
        
        const canBuy = playerGems >= item.price;
        const isHovered = effectiveAnimations.hoveredItemId === item.id;
        const isGamepadSelected = shopGamepadNavigationEnabled && shopSelectedItemIndex === index && !shopContinueButtonSelected;
        const isPurchasing = effectiveAnimations.purchaseAnimations[item.id];
        
        // === BOÎTE DE FOND ===
        if (canBuy) {
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            ctx.fillStyle = isHovered || isGamepadSelected ? hexToRgba(item.color, 0.4) : hexToRgba(item.color, 0.2);
            ctx.strokeStyle = item.color;
            ctx.lineWidth = isHovered || isGamepadSelected ? 3 : 2;
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
        }
        
        drawRoundRect(x, y, BOX_SIZE, BOX_SIZE, 8);
        ctx.fill();
        ctx.stroke();
        
        // === INDICATEUR DE SÉLECTION MANETTE ===
        if (isGamepadSelected) {
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            drawRoundRect(x - 5, y - 5, BOX_SIZE + 10, BOX_SIZE + 10, 10);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // === EMOJI ===
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = canBuy ? item.color : '#666666';
        ctx.globalAlpha = canBuy ? 1.0 : 0.5;
        ctx.fillText(item.emoji, x + BOX_SIZE / 2, y + BOX_SIZE / 2 - 10);
        ctx.globalAlpha = 1.0;
        
        // === PRIX ===
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = canBuy ? item.color : '#888888';
        ctx.fillText(`${item.price}💎`, x + BOX_SIZE / 2, y + BOX_SIZE - 12);
        
        // === CADENAS FERMÉ (si not canBuy et not hovered) ===
        if (!canBuy && !isHovered && !isGamepadSelected) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.font = "32px Arial";
            ctx.fillStyle = '#FF6B6B';
            ctx.fillText('🔒', x + BOX_SIZE / 2, y + BOX_SIZE / 2);
            ctx.restore();
        }
        
        // === CADENAS DÉVERROUILLÉ (si not canBuy mais hovered/gamepad) ===
        if (!canBuy && (isHovered || isGamepadSelected)) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.font = "48px Arial"; // Plus gros que le cadenas fermé
            ctx.fillStyle = '#FFD700';
            ctx.fillText('🔓', x + BOX_SIZE / 2, y + BOX_SIZE / 2);
            ctx.restore();
        }
        
        // === COMPTEUR VITESSE (si speedBoost acheté) ===
        if (item.isStackable && purchasedFeatures.speedBoost > 0) {
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = item.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`x${purchasedFeatures.speedBoost}`, x + BOX_SIZE / 2, y + BOX_SIZE - 30);
            
            // Icone "+" pour indiquer qu'on peut augmenter
            if (canBuy) {
                ctx.font = "bold 20px Arial";
                ctx.fillText('+', x + BOX_SIZE / 2, y + BOX_SIZE / 2);
            }
        }
        
        // === ANIMATION D'ACHAT (Confetti effect) ===
        if (isPurchasing) {
            const progress = (now - isPurchasing.startTime) / 800;
            const alpha = Math.max(0, 1 - progress);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = "bold 32px Arial";
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Texte qui monte et disparaît
            const offsetY = progress * 60;
            ctx.fillText('✨ BRAVO! ✨', x + BOX_SIZE / 2, y + BOX_SIZE / 2 - offsetY);
            
            ctx.restore();
        }
    });
}
