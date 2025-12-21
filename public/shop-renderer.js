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
 * Retourne les zones cliquables des lots pour la boutique d'enchères dégressives.
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {object|null} auction - { gridSize, lots }
 * @returns {Array} Array de {id, rect: {x,y,width,height}}
 */
function getDutchAuctionClickAreas(canvasWidth, canvasHeight, auction) {
    const shopWidth = 600;
    const shopHeight = 440;
    const shopX = (canvasWidth - shopWidth) / 2;
    const shopY = (canvasHeight - shopHeight) / 2;

    const gridSize = Math.max(1, Math.min(6, Math.floor(Number(auction?.gridSize || 3))));
    const lots = Array.isArray(auction?.lots) ? auction.lots : [];

    const gridPaddingX = 40;
    const gridPaddingY = 110;
    const gridX = shopX + gridPaddingX;
    const gridY = shopY + gridPaddingY;
    const gridW = shopWidth - gridPaddingX * 2;
    const gridH = shopHeight - gridPaddingY - 70;

    const cellGap = 12;
    const cellW = Math.floor((gridW - (cellGap * (gridSize - 1))) / gridSize);
    const cellH = Math.floor((gridH - (cellGap * (gridSize - 1))) / gridSize);

    const areas = [];
    for (let i = 0; i < Math.min(lots.length, gridSize * gridSize); i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = gridX + col * (cellW + cellGap);
        const y = gridY + row * (cellH + cellGap);
        areas.push({
            id: lots[i].lotId,
            rect: { x, y, width: cellW, height: cellH }
        });
    }
    return areas;
}

function getAuctionItemVisuals(itemId) {
    const map = {
        dash: { emoji: '⚡', color: '#FF6B6B', label: 'Dash' },
        checkpoint: { emoji: '🚩', color: '#00D4FF', label: 'Checkpoint' },
        compass: { emoji: '🧭', color: '#2ECC71', label: 'Boussole' },
        rope: { emoji: '🪢', color: '#9B59B6', label: 'Corde' },
        speedBoost: { emoji: '💨', color: '#FFD700', label: 'Vitesse+' }
    };
    return map[itemId] || { emoji: '🎁', color: '#CCCCCC', label: itemId || 'Item' };
}

function renderDutchAuctionShop(ctx, canvas, level, playerGems, shopTimeRemaining, shopUi) {
    const auction = shopUi?.auction || null;
    const lots = Array.isArray(auction?.lots) ? auction.lots : [];
    const gridSize = Math.max(1, Math.min(6, Math.floor(Number(auction?.gridSize || 3))));

    // Overlay semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shopWidth = 600;
    const shopHeight = 440;
    const shopX = (canvas.width - shopWidth) / 2;
    const shopY = (canvas.height - shopHeight) / 2;

    ctx.fillStyle = "#222";
    ctx.fillRect(shopX, shopY, shopWidth, shopHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);

    // Titre
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    const shopNumber = Math.floor(level / 5);
    ctx.fillText(`🏪 ENCHÈRES ${shopNumber}`, canvas.width / 2, shopY + 38);

    // Timer shop (enchères: pas de limite => ∞)
    const hasCountdown = typeof shopTimeRemaining === 'number' && Number.isFinite(shopTimeRemaining);
    const timerLabel = hasCountdown ? ("⏱️ " + shopTimeRemaining + "s") : "⏱️ ∞";
    ctx.fillStyle = hasCountdown && shopTimeRemaining <= 5 ? "#FF0000" : "#FFD700";
    ctx.font = "bold 18px Arial";
    ctx.fillText(timerLabel, canvas.width / 2, shopY + 62);

    // Gems
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`💎 ${playerGems}`, shopX + shopWidth - 20, shopY + 48);

    // Prochain tick (approx côté client)
    const tickMs = Math.max(250, Math.min(10000, Number(auction?.tickMs || 2000)));
    const anchor = Number.isFinite(shopUi?.auctionTickAnchor) ? shopUi.auctionTickAnchor : null;
    let nextPriceSeconds = null;
    if (anchor) {
        const elapsed = Date.now() - anchor;
        const remainingMs = Math.max(0, tickMs - (elapsed % tickMs));
        nextPriceSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    }

    ctx.fillStyle = "#CCCCCC";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    const tickLabel = nextPriceSeconds === null
        ? `Prochain prix: toutes les ${Math.round(tickMs / 1000)}s`
        : `Prochain prix dans : ${nextPriceSeconds}s`;
    ctx.fillText(tickLabel, shopX + 20, shopY + 78);

    // Grille
    const gridPaddingX = 40;
    const gridPaddingY = 110;
    const gridX = shopX + gridPaddingX;
    const gridY = shopY + gridPaddingY;
    const gridW = shopWidth - gridPaddingX * 2;
    const gridH = shopHeight - gridPaddingY - 70;

    const cellGap = 12;
    const cellW = Math.floor((gridW - (cellGap * (gridSize - 1))) / gridSize);
    const cellH = Math.floor((gridH - (cellGap * (gridSize - 1))) / gridSize);

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

    if (lots.length === 0) {
        ctx.fillStyle = '#999999';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Aucun lot disponible', shopX + shopWidth / 2, gridY + gridH / 2);
    }

    for (let i = 0; i < Math.min(lots.length, gridSize * gridSize); i++) {
        const lot = lots[i];
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = gridX + col * (cellW + cellGap);
        const y = gridY + row * (cellH + cellGap);

        const visuals = getAuctionItemVisuals(lot.itemId);
        const canBuy = !lot.sold && (playerGems >= (lot.currentPrice || 0));
        const isHovered = shopUi?.animations?.hoveredItemId === lot.lotId;

        ctx.fillStyle = canBuy ? 'rgba(255, 215, 0, 0.10)' : 'rgba(100, 100, 100, 0.20)';
        ctx.strokeStyle = isHovered ? '#FFD700' : '#666666';
        ctx.lineWidth = isHovered ? 3 : 1;
        drawRoundRect(x, y, cellW, cellH, 10);
        ctx.fill();
        ctx.stroke();

        // Emoji
        ctx.font = '34px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = visuals.color;
        ctx.globalAlpha = lot.sold ? 0.35 : 1.0;
        ctx.fillText(visuals.emoji, x + cellW / 2, y + 30);
        ctx.globalAlpha = 1.0;

        // Nom
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#FFFFFF';
        const displayName = (lot.name || visuals.label || '').toString();
        ctx.fillText(displayName.slice(0, 18), x + cellW / 2, y + 62);

        // Prix
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = lot.sold ? '#888888' : (canBuy ? '#FFD700' : '#CCCCCC');
        const price = Number.isFinite(Number(lot.currentPrice)) ? Number(lot.currentPrice) : '?';
        ctx.fillText(`Prix: ${price} 💎`, x + cellW / 2, y + 88);

        // Bouton acheter (visuel uniquement, la zone cliquable est la carte)
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = lot.sold ? '#777777' : (canBuy ? '#00FF00' : '#AAAAAA');
        ctx.fillText(lot.sold ? 'VENDU' : 'ACHETER', x + cellW / 2, y + cellH - 16);
    }

    // Instruction + bouton continuer (réutilise l'existant)
    ctx.fillStyle = "#888";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Cliquez sur un lot pour acheter (le premier l'obtient)", canvas.width / 2, shopY + shopHeight - 50);

    // Bouton Continuer (copié du shop classique)
    const continueButtonWidth = 150;
    const continueButtonHeight = 40;
    const continueButtonX = canvas.width / 2 - continueButtonWidth / 2;
    const continueButtonY = shopY + shopHeight - 35;

    const effectiveIsReady = !!shopUi?.isPlayerReadyToContinue;
    const effectiveReadyCount = Number.isFinite(shopUi?.readyCount) ? shopUi.readyCount : 0;
    const effectiveTotalPlayers = Number.isFinite(shopUi?.totalPlayers) ? shopUi.totalPlayers : 0;

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(continueButtonX, continueButtonY, continueButtonWidth, continueButtonHeight);
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.strokeRect(continueButtonX, continueButtonY, continueButtonWidth, continueButtonHeight);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let buttonText = 'Continuer';
    if (effectiveIsReady) {
        buttonText = `${effectiveReadyCount}/${effectiveTotalPlayers} ont terminé`;
    }
    ctx.fillText(buttonText, canvas.width / 2, continueButtonY + continueButtonHeight / 2);
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

    const effectiveShopType = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object' && typeof arguments[5].shopType === 'string')
        ? arguments[5].shopType
        : (typeof shopType !== 'undefined' ? shopType : 'classic');

    if (effectiveShopType === 'dutchAuction') {
        const shopUi = (arguments.length >= 6 && arguments[5] && typeof arguments[5] === 'object') ? arguments[5] : {};
        renderDutchAuctionShop(ctx, canvas, level, playerGems, shopTimeRemaining, {
            ...shopUi,
            animations: effectiveAnimations,
            isPlayerReadyToContinue: effectiveIsReady,
            readyCount: effectiveReadyCount,
            totalPlayers: effectiveTotalPlayers
        });
        return;
    }

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
