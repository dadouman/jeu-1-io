// Public/shop-renderer.js
// Rendu du système de shop

/**
 * Affiche l'interface du shop
 */
function renderShop(ctx, canvas, level, playerGems, shopTimeRemaining) {
    // Overlay semi-transparent
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dimensions du shop
    const shopWidth = 500;
    const shopHeight = 350;
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
    
    // Items du shop
    const itemList = [
        { id: 'dash', name: 'Dash ⚡', price: 5 },
        { id: 'checkpoint', name: 'Checkpoint 🚩', price: 3 },
        { id: 'rope', name: 'Corde 🪢', price: 1 },
        { id: 'speedBoost', name: 'Vitesse+ 💨', price: 2 }
    ];
    
    renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems);
    
    // Instructions
    ctx.fillStyle = "#888";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Appuyez sur 1, 2, 3 ou 4 OU cliquez sur un item pour acheter", canvas.width / 2, shopY + shopHeight - 50);
    ctx.fillText("Appuyez sur Entrée pour quitter le shop", canvas.width / 2, shopY + shopHeight - 25);
}

/**
 * Affiche les items du shop
 */
function renderShopItems(ctx, shopX, shopY, shopWidth, shopHeight, itemList, playerGems) {
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    
    itemList.forEach((item, index) => {
        const yPos = shopY + 100 + (index * 45);
        const canBuy = playerGems >= item.price;
        const color = canBuy ? "#00FF00" : "#888";
        
        // Boîte cliquable
        ctx.fillStyle = canBuy ? "rgba(0, 255, 0, 0.1)" : "rgba(136, 136, 136, 0.05)";
        ctx.fillRect(shopX + 20, yPos - 20, shopWidth - 40, 40);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(shopX + 20, yPos - 20, shopWidth - 40, 40);
        
        // Texte
        ctx.fillStyle = color;
        ctx.fillText(`${index + 1}. ${item.name} - ${item.price} gems`, shopX + 30, yPos);
    });
}
