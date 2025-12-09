// Public/shop-renderer.js
// Rendu du système de shop

/**
 * Affiche l'interface du shop
 */
function renderShop(ctx, canvas, level, playerGems, shopTimeRemaining, purchasedFeatures = {}) {
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
    
    // Gems disponibles
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`💎 ${playerGems}`, shopX + shopWidth - 20, shopY + 40);
    
    // Items du shop
    const itemList = [
        { id: 'dash', name: 'Dash', emoji: '⚡', price: 5, color: '#FF6B6B' },
        { id: 'checkpoint', name: 'Checkpoint', emoji: '🚩', price: 3, color: '#00D4FF' },
        { id: 'rope', name: 'Rope', emoji: '🪢', price: 1, color: '#9B59B6' },
        { id: 'speedBoost', name: 'Speed+', emoji: '💨', price: 2, color: '#FFD700', isStackable: true }
    ];
    
    renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems, purchasedFeatures);
    
    // Instructions
    ctx.fillStyle = "#888";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Cliquez sur un item pour acheter | Appuyez sur Entrée pour quitter", canvas.width / 2, shopY + shopHeight - 25);
}

/**
 * Affiche les items du shop sous forme de carré (comme le HUD features)
 */
function renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems, purchasedFeatures = {}) {
    const BOX_SIZE = 90;
    const BOX_SPACING = 130;
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
    for (const itemId in shopAnimations.purchaseAnimations) {
        const anim = shopAnimations.purchaseAnimations[itemId];
        if (now - anim.startTime > 800) { // Animation de 800ms
            delete shopAnimations.purchaseAnimations[itemId];
        }
    }
    
    itemList.forEach((item, index) => {
        const x = CENTER_X + (index * BOX_SPACING);
        const y = ITEMS_Y;
        
        // Vérifier si l'item a déjà été acheté
        const isAlreadyPurchased = item.id !== 'speedBoost' && purchasedFeatures[item.id] === true;
        
        // Pour speedBoost, on peut l'acheter plusieurs fois
        const canBuy = playerGems >= item.price && (!isAlreadyPurchased);
        const isHovered = shopAnimations.hoveredItemId === item.id && canBuy;
        const isPurchasing = shopAnimations.purchaseAnimations[item.id];
        
        // === COULEUR CADRE ET FOND ===
        let boxColor = item.color;
        let alpha = 0.2;
        let strokeWidth = 2;
        
        if (isAlreadyPurchased) {
            // Item acheté: cadenas doré
            boxColor = '#FFD700';
            alpha = 0.15;
            strokeWidth = 2;
        } else if (!canBuy) {
            // Pas assez de gems: gris
            boxColor = '#888888';
            alpha = 0.1;
            strokeWidth = 1;
        }
        
        // === BOÎTE DE FOND ===
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        ctx.fillStyle = hexToRgba(boxColor, alpha);
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isHovered ? 3 : strokeWidth;
        
        drawRoundRect(x, y, BOX_SIZE, BOX_SIZE, 8);
        ctx.fill();
        ctx.stroke();
        
        // === EMOJI ===
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (isAlreadyPurchased) {
            // Emoji en couleur pour items achetés
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = 0.8;
        } else if (canBuy) {
            ctx.fillStyle = item.color;
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = '#666666';
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillText(item.emoji, x + BOX_SIZE / 2, y + BOX_SIZE / 2 - 15);
        ctx.globalAlpha = 1.0;
        
        // === AFFICHAGE DU PRIX EN BAS ===
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (isAlreadyPurchased) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('✓ DÉVERROUILLÉ', x + BOX_SIZE / 2, y + BOX_SIZE - 8);
        } else {
            ctx.fillStyle = canBuy ? item.color : '#888888';
            ctx.fillText(`${item.price}💎`, x + BOX_SIZE / 2, y + BOX_SIZE - 8);
        }
        
        // === CADENAS (si item acheté) ===
        if (isAlreadyPurchased) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.font = "32px Arial";
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText('🔓', x + BOX_SIZE / 2, y + BOX_SIZE / 2 + 5);
            ctx.restore();
        }
        
        // === CADENAS FERMÉ (si pas assez de gems) ===
        if (!canBuy && !isAlreadyPurchased) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.font = "32px Arial";
            ctx.fillStyle = '#FF6B6B';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText('🔒', x + BOX_SIZE / 2, y + BOX_SIZE / 2 + 5);
            ctx.restore();
        }
        
        // === COMPTEUR VITESSE (si speedBoost acheté) ===
        if (item.isStackable && purchasedFeatures.speedBoost > 0) {
            ctx.font = "bold 14px Arial";
            ctx.fillStyle = item.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`x${purchasedFeatures.speedBoost}`, x + BOX_SIZE / 2, y + 25);
        }
        
        // === ANIMATION D'ACHAT (mais PAS pour speedBoost achats répétés) ===
        if (isPurchasing) {
            // Ne montrer "BRAVO" que si c'est un premier achat ou speedBoost
            const showBravoAnimation = !isAlreadyPurchased || item.isStackable;
            
            if (showBravoAnimation) {
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
        }
    });
}
