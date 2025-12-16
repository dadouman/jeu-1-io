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
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (pauseMenuVisible && typeof handlePauseMenuClick === 'function') {
        const handled = handlePauseMenuClick(mouseX, mouseY);
        if (handled) return;
    }

    console.log(`🖱️ Click détecté | isShopOpen=${isShopOpen}`);
    if (!isShopOpen) return;
    
    console.log(`🖱️ Position: (${mouseX}, ${mouseY}) | Gems: ${playerGems}`);
    
    // === VÉRIFIER LE BOUTON CONTINUER ===
    if (typeof getShopContinueButtonArea === 'function') {
        const continueButton = getShopContinueButtonArea(canvas.width, canvas.height);
        if (mouseX >= continueButton.x && mouseX <= continueButton.x + continueButton.width &&
            mouseY >= continueButton.y && mouseY <= continueButton.y + continueButton.height) {
            console.log(`✅ Bouton Continuer cliqué!`);
            // Marquer le joueur comme prêt et envoyer l'événement
            isPlayerReadyToContinue = true;
            socket.emit('playerReadyToContinueShop');
            return;
        }
    }
    
    // Obtenir les zones cliquables du shop
    const clickAreas = getShopClickAreas(canvas.width, canvas.height);
    console.log(`📦 Zones cliquables:`, clickAreas);
    
    // Items par défaut si shopItems est vide
    const defaultShopItems = {
        dash: { id: 'dash', name: 'Dash', price: 5 },
        checkpoint: { id: 'checkpoint', name: 'Checkpoint', price: 3 },
        compass: { id: 'compass', name: 'Boussole', price: 4 },
        rope: { id: 'rope', name: 'Rope', price: 1 },
        speedBoost: { id: 'speedBoost', name: 'Speed+', price: 2, stackable: true }
    };
    
    // Utiliser shopItems du serveur ou les valeurs par défaut
    const effectiveShopItems = (shopItems && Object.keys(shopItems).length > 0) ? shopItems : defaultShopItems;
    
    // Vérifier si un item a été cliqué
    for (const area of clickAreas) {
        const { x, y, width, height } = area.rect;
        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
            const item = effectiveShopItems[area.id];
            if (item) {
                // Vérifier si le joueur a assez de gems
                const hasEnoughGems = playerGems >= item.price;
                
                // Vérifier si l'item est déjà acheté (non-stackable)
                const isAlreadyPurchased = (item.id !== 'speedBoost' && !item.stackable && purchasedFeatures[item.id] === true);
                
                console.log(`🎯 Item cliqué: ${area.id} | Assez de gems: ${hasEnoughGems} | Déjà acheté: ${isAlreadyPurchased}`);
                
                // Ne pas acheter si pas assez d'argent ou si déjà acheté
                if (hasEnoughGems && !isAlreadyPurchased) {
                    console.log(`📤 Envoi shopPurchase: ${area.id}`);
                    socket.emit('shopPurchase', { itemId: area.id });
                    // Déclencher l'animation d'achat
                    shopAnimations.purchaseAnimations[area.id] = {
                        startTime: Date.now()
                    };
                } else {
                    console.log(`❌ Achat refusé: gems=${playerGems}, price=${item.price}, purchased=${purchasedFeatures[area.id]}`);
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
