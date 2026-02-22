// client.js - Point d'entrée principal

// Configuration du canvas (var pour accès global depuis game-loop.js)
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

// Ajuster le canvas à la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- GESTION DES CLICS SOURIS POUR LE MENU ET LE SHOP ---
canvas.addEventListener('click', (event) => {
    // Vérifier si le click est sur un élément HTML (boutons, etc)
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector && modeSelector.style.display === 'flex') {
        // Vérifier si le click est sur le modeSelector
        const rect = modeSelector.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        if (clickX >= rect.left && clickX <= rect.right &&
            clickY >= rect.top && clickY <= rect.bottom) {
            // Le click est sur le modeSelector, laisser les event HTML se dérouler
            return;
        }
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Priorité 0: Navigateur de lobbies
    if (window.lobbiesBrowserVisible && typeof handleLobbiesBrowserClick === 'function') {
        const handled = handleLobbiesBrowserClick(mouseX, mouseY);
        if (handled) {
            console.log('✅ Clic sur le navigateur de lobbies traité');
            return;
        }
    }

    // Priorité 1: Menu principal
    if (mainMenuVisible && typeof handleMainMenuClick === 'function') {
        const handled = handleMainMenuClick(mouseX, mouseY);
        if (handled) return;
    }

    if (pauseMenuVisible && typeof handlePauseMenuClick === 'function') {
        const handled = handlePauseMenuClick(mouseX, mouseY);
        if (handled) return;
    }

    // Déterminer quel écran (P1/P2) est ciblé en split-screen
    const isSplit = splitScreenEnabled && socketSecondary && myPlayerIdSecondary;
    const halfW = isSplit ? canvas.width / 2 : canvas.width;
    const side = isSplit && mouseX >= halfW ? 'secondary' : 'primary';
    activeShopSide = side;

    const isOpen = side === 'secondary' ? isShopOpenP2 : isShopOpen;
    if (!isOpen) return;

    const localX = side === 'secondary' ? (mouseX - halfW) : mouseX;
    const localY = mouseY;
    const localGems = side === 'secondary' ? playerGemsP2 : playerGems;
    const localFeatures = side === 'secondary' ? purchasedFeaturesP2 : purchasedFeatures;
    const localShopItems = (side === 'secondary' ? shopItemsP2 : shopItems) || {};
    const localAnimations = side === 'secondary' ? shopAnimationsP2 : shopAnimations;
    const localShopType = side === 'secondary' ? shopTypeP2 : shopType;
    const localAuction = side === 'secondary' ? dutchAuctionStateP2 : dutchAuctionState;
    const targetSocket = side === 'secondary' ? socketSecondary : socket;
    const localIsReadyRef = side === 'secondary' ? 'P2' : 'P1';

    console.log(`🖱️ Click détecté | ${localIsReadyRef} shopOpen=${isOpen}`);
    console.log(`🖱️ Position(${localIsReadyRef}): (${localX}, ${localY}) | Gems: ${localGems}`);
    
    // === VÉRIFIER LE BOUTON CONTINUER ===
    if (typeof getShopContinueButtonArea === 'function') {
        const continueButton = getShopContinueButtonArea(halfW, canvas.height);
        if (localX >= continueButton.x && localX <= continueButton.x + continueButton.width &&
            localY >= continueButton.y && localY <= continueButton.y + continueButton.height) {
            console.log(`✅ Bouton Continuer cliqué! (${localIsReadyRef})`);

            // Marquer le joueur comme prêt et envoyer l'événement (multi)
            if (side === 'secondary') {
                isPlayerReadyToContinueP2 = true;
            } else {
                isPlayerReadyToContinue = true;
            }

            if (targetSocket) {
                targetSocket.emit('playerReadyToContinueShop');
            }
            return;
        }
    }
    
    // Obtenir les zones cliquables du shop
    const clickAreas = (localShopType === 'dutchAuction' && typeof getDutchAuctionClickAreas === 'function')
        ? getDutchAuctionClickAreas(halfW, canvas.height, localAuction)
        : getShopClickAreas(halfW, canvas.height);
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
    const effectiveShopItems = (localShopItems && Object.keys(localShopItems).length > 0) ? localShopItems : defaultShopItems;
    
    // Vérifier si un item / lot a été cliqué
    for (const area of clickAreas) {
        const { x, y, width, height } = area.rect;
        if (localX >= x && localX <= x + width && localY >= y && localY <= y + height) {
            if (localShopType === 'dutchAuction') {
                const lotId = area.id;
                // Trouver le lot (pour vérifier sold + prix)
                const lots = Array.isArray(localAuction?.lots) ? localAuction.lots : [];
                const lot = lots.find(l => l.lotId === lotId);
                if (!lot) {
                    console.log(`❌ Lot introuvable: ${lotId}`);
                    break;
                }

                const lotPrice = Number(lot.currentPrice || 0);
                const hasEnoughGems = localGems >= lotPrice;
                const isSold = !!lot.sold;
                console.log(`🎯 Lot cliqué: ${lotId} | Prix=${lotPrice} | Assez de gems: ${hasEnoughGems} | Vendu: ${isSold}`);

                if (!isSold && hasEnoughGems) {
                    console.log(`📤 Envoi dutchAuctionPurchase: ${lotId}`);
                    if (targetSocket) {
                        targetSocket.emit('dutchAuctionPurchase', { lotId });
                    }
                    localAnimations.purchaseAnimations[lotId] = { startTime: Date.now() };
                } else {
                    console.log(`❌ Achat refusé(${localIsReadyRef}): sold=${isSold}, gems=${localGems}, price=${lotPrice}`);
                }
            } else {
                const item = effectiveShopItems[area.id];
                if (item) {
                    // Vérifier si le joueur a assez de gems
                    const hasEnoughGems = localGems >= item.price;
                    
                    // Vérifier si l'item est déjà acheté (non-stackable)
                    const isAlreadyPurchased = (item.id !== 'speedBoost' && !item.stackable && localFeatures[item.id] === true);
                    
                    console.log(`🎯 Item cliqué: ${area.id} | Assez de gems: ${hasEnoughGems} | Déjà acheté: ${isAlreadyPurchased}`);
                    
                    // Ne pas acheter si pas assez d'argent ou si déjà acheté
                    if (hasEnoughGems && !isAlreadyPurchased) {
                        console.log(`📤 Envoi shopPurchase: ${area.id}`);
                        if (targetSocket) {
                            targetSocket.emit('shopPurchase', { itemId: area.id });
                        }
                        // Déclencher l'animation d'achat
                        localAnimations.purchaseAnimations[area.id] = {
                            startTime: Date.now()
                        };
                    } else {
                        console.log(`❌ Achat refusé(${localIsReadyRef}): gems=${localGems}, price=${item.price}, purchased=${localFeatures[area.id]}`);
                    }
                }
            }
            break;
        }
    }
});

// --- GESTION DU HOVER POUR LE SHOP ---
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Déterminer le viewport actif
    const isSplit = splitScreenEnabled && socketSecondary && myPlayerIdSecondary;
    const halfW = isSplit ? canvas.width / 2 : canvas.width;
    const side = isSplit && mouseX >= halfW ? 'secondary' : 'primary';
    activeShopSide = side;

    const isOpen = side === 'secondary' ? isShopOpenP2 : isShopOpen;
    const localAnimations = side === 'secondary' ? shopAnimationsP2 : shopAnimations;
    const localShopType = side === 'secondary' ? shopTypeP2 : shopType;
    const localAuction = side === 'secondary' ? dutchAuctionStateP2 : dutchAuctionState;

    if (!isOpen) {
        localAnimations.hoveredItemId = null;
        return;
    }

    const localX = side === 'secondary' ? (mouseX - halfW) : mouseX;
    const localY = mouseY;
    
    const clickAreas = (localShopType === 'dutchAuction' && typeof getDutchAuctionClickAreas === 'function')
        ? getDutchAuctionClickAreas(halfW, canvas.height, localAuction)
        : getShopClickAreas(halfW, canvas.height);
    
    localAnimations.hoveredItemId = null;
    for (const area of clickAreas) {
        const { x, y, width, height } = area.rect;
        if (localX >= x && localX <= x + width && localY >= y && localY <= y + height) {
            localAnimations.hoveredItemId = area.id;
            break;
        }
    }
});

// --- RÉINITIALISER LE HOVER QUAND LA SOURIS QUITTE LE CANVAS ---
canvas.addEventListener('mouseleave', () => {
    shopAnimations.hoveredItemId = null;
});

// === INITIALISATION DU MENU PRINCIPAL ===
// S'assurer que le mode selector est caché et le menu principal est visible au démarrage
(function initMainMenu() {
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.style.display = 'none';
    }
    mainMenuVisible = true;
    console.log('%c🎮 Menu principal initialisé', 'color: #FFD700; font-weight: bold');
})();

// Les modules sont chargés dans l'ordre suivant via les balises <script> dans index.html:
// 1. game-state.js - Variables d'état globales
// 2. socket-events.js - Événements Socket.io
// 3. keyboard-input.js - Gestion des entrées clavier
// 4. renderer.js - Fonction de rendu
// 5. game-loop.js - Boucle de rendu principale

console.log('%c✅ Client initialisé - Modules chargés', 'color: #00FF00; font-weight: bold');

// --- ÉCOUTE DE L'ÉVÉNEMENT `kicked` ---
socket.on('kicked', (data) => {
    alert(data.message || 'Vous avez été expulsé du lobby.');
    window.location.reload(); // Recharger la page pour revenir au menu principal
});

// --- ÉCOUTE DE LA TOUCHE `#` ---
window.addEventListener('keydown', (event) => {
    if (event.key === '#') {
        console.log('Touche # détectée, arrêt des lobbys.');
        // ✅ BLOQUER IMMÉDIATEMENT sans attendre le serveur
        lobbiesRebooting = true;
        console.log('🔴 lobbiesRebooting SET TO TRUE (immédiat)');
        socket.emit('forceStopLobbies');
    }
});
