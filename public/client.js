// client.js - Point d'entrée principal

// Configuration du canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuster le canvas à la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- GESTION DES CLICS SOURIS POUR LE SHOP ---
canvas.addEventListener('click', (event) => {
    if (!isShopOpen) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Obtenir les zones cliquables du shop
    const clickAreas = getShopClickAreas(canvas.width, canvas.height);
    
    // Vérifier si un item a été cliqué
    for (const area of clickAreas) {
        const { x, y, width, height } = area.rect;
        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
            if (shopItems[area.id]) {
                const item = shopItems[area.id];
                
                // Vérifier si le joueur a assez de gems
                const hasEnoughGems = playerGems >= item.price;
                
                // Vérifier si l'item est déjà acheté (non-stackable)
                const isAlreadyPurchased = (item.id !== 'speedBoost' && purchasedFeatures[item.id] === true);
                
                // Ne pas acheter si pas assez d'argent ou si déjà acheté
                if (hasEnoughGems && !isAlreadyPurchased) {
                    socket.emit('shopPurchase', { itemId: area.id });
                    // Déclencher l'animation d'achat
                    shopAnimations.purchaseAnimations[area.id] = {
                        startTime: Date.now()
                    };
                }
            }
            break;
        }
    }
});

// --- GESTION DU HOVER POUR LE SHOP ---
canvas.addEventListener('mousemove', (event) => {
    if (!isShopOpen) {
        shopAnimations.hoveredItemId = null;
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const clickAreas = getShopClickAreas(canvas.width, canvas.height);
    
    shopAnimations.hoveredItemId = null;
    for (const area of clickAreas) {
        const { x, y, width, height } = area.rect;
        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
            shopAnimations.hoveredItemId = area.id;
            break;
        }
    }
});

// --- RÉINITIALISER LE HOVER QUAND LA SOURIS QUITTE LE CANVAS ---
canvas.addEventListener('mouseleave', () => {
    shopAnimations.hoveredItemId = null;
});

// Les modules sont chargés dans l'ordre suivant via les balises <script> dans index.html:
// 1. game-state.js - Variables d'état globales
// 2. socket-events.js - Événements Socket.io
// 3. keyboard-input.js - Gestion des entrées clavier
// 4. renderer.js - Fonction de rendu
// 5. game-loop.js - Boucle de rendu principale

console.log('%c✅ Client initialisé - Modules chargés', 'color: #00FF00; font-weight: bold');
