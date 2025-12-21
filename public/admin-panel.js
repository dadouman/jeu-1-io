// admin-panel.js - Écran de configuration du mode personnalisé

let adminPanelOpen = false;
let customModeConfig = null;

// Charger la config personnalisée depuis le localStorage au démarrage
function loadCustomModeConfig() {
    const saved = localStorage.getItem('customModeConfig');
    if (saved) {
        try {
            customModeConfig = JSON.parse(saved);
            console.log('✅ Mode personnalisé chargé:', customModeConfig);

            // Migration légère: s'assurer que les 5 upgrades existent (dont la boussole)
            if (customModeConfig && Array.isArray(customModeConfig.shopItems)) {
                const hasCompass = customModeConfig.shopItems.some(i => i && i.id === 'compass');
                if (!hasCompass) {
                    // Déduire un multiplicateur de prix si possible (dash base=5)
                    const dash = customModeConfig.shopItems.find(i => i && i.id === 'dash');
                    const mult = dash && Number.isFinite(Number(dash.price)) ? (Number(dash.price) / 5) : 1;
                    const compassPrice = Math.max(1, Math.round(4 * mult));
                    customModeConfig.shopItems.push({
                        id: 'compass',
                        name: 'Boussole',
                        price: compassPrice,
                        description: 'Indique la gemme la plus proche',
                        type: 'feature'
                    });
                    // Persist pour éviter de refaire la migration à chaque chargement
                    localStorage.setItem('customModeConfig', JSON.stringify(customModeConfig));
                }
            }
        } catch (e) {
            console.warn('⚠️ Erreur lors du chargement du mode personnalisé');
            customModeConfig = null;
        }
    }
}

// Sauvegarder la config personnalisée
function saveCustomModeConfig(config) {
    localStorage.setItem('customModeConfig', JSON.stringify(config));
    customModeConfig = config;
    console.log('✅ Mode personnalisé sauvegardé:', config);
}

// Créer les éléments HTML du panneau admin
function createAdminPanel() {
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.innerHTML = `
        <div class="admin-panel-header">
            <h2>⚙️ Paramètres du Mode Personnalisé</h2>
            <button class="close-btn" onclick="closeAdminPanel()">✕</button>
        </div>
        
        <div class="admin-panel-content">
            <div class="form-group">
                <label for="numLevels">📊 Nombre de niveaux:</label>
                <input type="number" id="numLevels" min="1" max="100" value="10" placeholder="10">
            </div>
            
            <div class="form-group">
                <label for="startSize">📐 Taille de départ du labyrinthe:</label>
                <input type="number" id="startSize" min="5" max="50" value="15" placeholder="15">
            </div>
            
            <div class="form-group">
                <label for="increment">⬆️ Incrément de taille par niveau:</label>
                <input type="number" id="increment" min="0" max="10" value="2" placeholder="2">
            </div>
            
            <div class="form-group">
                <label for="peakLevel">🏔️ Niveau pivot (augmentation jusqu'à ce niveau):</label>
                <input type="number" id="peakLevel" min="1" max="100" value="5" placeholder="5">
                <small style="color: #888;">Laissez vide pour pas de décroissance</small>
            </div>
            
            <div class="form-group">
                <label for="decrement">⬇️ Décroissance par niveau (après le pivot):</label>
                <input type="number" id="decrement" min="0" max="10" value="2" placeholder="2">
            </div>
            
            <hr style="border: none; border-top: 1px solid #444; margin: 20px 0;">
            
            <div class="form-group">
                <label for="shopFrequency">🏪 Fréquence d'apparition du shop:</label>
                <input type="number" id="shopFrequency" min="1" max="20" value="5" placeholder="5">
                <small style="color: #888;">Le shop apparaît tous les N niveaux</small>
            </div>
            
            <div class="form-group">
                <label for="itemPriceMultiplier">💎 Multiplicateur de prix des items:</label>
                <input type="number" id="itemPriceMultiplier" min="0.1" max="5" step="0.1" value="1" placeholder="1">
                <small style="color: #888;">1 = prix normal, 2 = 2x plus cher, 0.5 = 2x moins cher</small>
            </div>

            <div class="form-group">
                <label for="shopType">🛒 Type de shop:</label>
                <select id="shopType" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
                    <option value="classic">🏪 Classique</option>
                    <option value="dutchAuction">⏱️ Enchères dégressives</option>
                </select>
                <small style="color: #888;">Classique = liste d'items, Enchères = lots avec prix qui baisse</small>
            </div>

            <div id="auctionSettingsGroup" style="display: none; padding: 10px; background: rgba(255,255,255,0.04); border-radius: 6px; border: 1px solid #444;">
                <div class="form-group">
                    <label for="auctionGridSize">🧱 Taille de grille (NxN):</label>
                    <input type="number" id="auctionGridSize" min="1" max="6" value="3" placeholder="3">
                    <small style="color: #888;">1 à 6 (ex: 3 = 9 lots)</small>
                </div>

                <div class="form-group">
                    <label for="auctionTickSeconds">⏲️ Baisse de prix toutes les (secondes):</label>
                    <input type="number" id="auctionTickSeconds" min="0.25" max="10" step="0.25" value="2" placeholder="2">
                    <small style="color: #888;">Entre 0.25s et 10s</small>
                </div>

                <div class="form-group">
                    <label for="auctionDecrement">📉 Décroissance (prix -X à chaque tick):</label>
                    <input type="number" id="auctionDecrement" min="1" max="9999" value="1" placeholder="1">
                </div>

                <div class="form-group">
                    <label for="auctionStartPriceMultiplier">🚀 Prix de départ (multiplicateur):</label>
                    <input type="number" id="auctionStartPriceMultiplier" min="0.1" max="10" step="0.1" value="2" placeholder="2">
                    <small style="color: #888;">Prix départ = prix item × multiplicateur</small>
                </div>

                <div class="form-group">
                    <label for="auctionMinPriceMultiplier">🧱 Prix minimum (multiplicateur):</label>
                    <input type="number" id="auctionMinPriceMultiplier" min="0" max="5" step="0.05" value="0.5" placeholder="0.5">
                    <small style="color: #888;">Prix min = prix item × multiplicateur (plancher)</small>
                </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid #444; margin: 20px 0;">
            
            <div class="form-group">
                <label for="mazeAlgorithm">🧩 Algorithme de génération du labyrinthe:</label>
                <select id="mazeAlgorithm" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
                    <option value="backtracker">🔀 Recursive Backtracker (classique)</option>
                    <option value="prim">🌳 Prim's Algorithm (organique)</option>
                </select>
                <small style="color: #888;">Backtracker = longs couloirs, Prim = ramifications naturelles</small>
            </div>
            
            <div class="form-group" id="densityGroup" style="display: none;">
                <label for="mazeDensity">📊 Densité des murs (Prim uniquement):</label>
                <input type="range" id="mazeDensity" min="0" max="100" value="50" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                    <span>Ouvert (0%)</span>
                    <span id="densityValue">50%</span>
                    <span>Fermé (100%)</span>
                </div>
                <small style="color: #888;">0% = beaucoup de passages, 100% = labyrinthe parfait</small>
            </div>
            
            <div class="preview-section">
                <h3>📋 Aperçu:</h3>
                <div id="preview-output" class="preview-output">
                    <p>Les tailles seront affichées ici...</p>
                </div>
            </div>
            
            <div class="button-group">
                <button class="btn-primary" onclick="applyCustomMode()">✅ APPLIQUER</button>
                <button class="btn-secondary" onclick="closeAdminPanel()">❌ ANNULER</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// Générer l'aperçu des tailles
function generatePreview() {
    const numLevels = parseInt(document.getElementById('numLevels').value) || 10;
    const startSize = parseInt(document.getElementById('startSize').value) || 15;
    const increment = parseInt(document.getElementById('increment').value) || 2;
    const peakLevel = parseInt(document.getElementById('peakLevel').value) || numLevels;
    const decrement = parseInt(document.getElementById('decrement').value) || increment;
    
    const sizes = [];
    for (let i = 1; i <= numLevels; i++) {
        if (i <= peakLevel) {
            sizes.push(startSize + (i - 1) * increment);
        } else {
            const peakSize = startSize + (peakLevel - 1) * increment;
            sizes.push(peakSize - (i - peakLevel) * decrement);
        }
    }
    
    const output = document.getElementById('preview-output');
    output.innerHTML = `
        <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
            <strong>Progression des tailles:</strong><br>
            <span style="font-family: monospace; color: #FFD700;">
                ${sizes.map((s, i) => `<span style="background: ${i < peakLevel ? '#00AA00' : '#AA0000'}; padding: 2px 5px; margin: 2px; border-radius: 3px;">Nv${i+1}: ${s}x${s}</span>`).join(' ')}
            </span>
        </div>
    `;
}

// Appliquer la configuration
function applyCustomMode() {
    const numLevels = parseInt(document.getElementById('numLevels').value);
    const startSize = parseInt(document.getElementById('startSize').value);
    const increment = parseInt(document.getElementById('increment').value);
    const peakLevel = document.getElementById('peakLevel').value ? parseInt(document.getElementById('peakLevel').value) : null;
    const decrement = parseInt(document.getElementById('decrement').value) || increment;
    const shopFrequency = parseInt(document.getElementById('shopFrequency').value) || 5;
    const itemPriceMultiplier = parseFloat(document.getElementById('itemPriceMultiplier').value) || 1;
    const shopType = (document.getElementById('shopType') && document.getElementById('shopType').value) ? document.getElementById('shopType').value : 'classic';
    const auctionGridSize = parseInt(document.getElementById('auctionGridSize')?.value) || 3;
    const auctionTickSeconds = parseFloat(document.getElementById('auctionTickSeconds')?.value) || 2;
    const auctionDecrement = parseInt(document.getElementById('auctionDecrement')?.value) || 1;
    const auctionStartPriceMultiplier = parseFloat(document.getElementById('auctionStartPriceMultiplier')?.value) || 2;
    const auctionMinPriceMultiplier = parseFloat(document.getElementById('auctionMinPriceMultiplier')?.value) || 0.5;
    const mazeAlgorithm = document.getElementById('mazeAlgorithm').value || 'backtracker';
    const mazeDensity = parseInt(document.getElementById('mazeDensity').value) / 100 || 0.5;
    
    // Valider les entrées
    if (!numLevels || numLevels < 1 || numLevels > 100) {
        alert('❌ Le nombre de niveaux doit être entre 1 et 100');
        return;
    }
    if (!startSize || startSize < 5 || startSize > 50) {
        alert('❌ La taille de départ doit être entre 5 et 50');
        return;
    }
    if (increment < 0 || increment > 10) {
        alert('❌ L\'incrément doit être entre 0 et 10');
        return;
    }
    if (decrement < 0 || decrement > 10) {
        alert('❌ La décroissance doit être entre 0 et 10');
        return;
    }
    if (peakLevel && (peakLevel < 1 || peakLevel > numLevels)) {
        alert('❌ Le niveau pivot doit être entre 1 et ' + numLevels);
        return;
    }
    if (shopFrequency < 1 || shopFrequency > 20) {
        alert('❌ La fréquence du shop doit être entre 1 et 20');
        return;
    }
    if (itemPriceMultiplier < 0.1 || itemPriceMultiplier > 5) {
        alert('❌ Le multiplicateur de prix doit être entre 0.1 et 5');
        return;
    }

    if (shopType !== 'classic' && shopType !== 'dutchAuction') {
        alert('❌ Type de shop invalide');
        return;
    }

    if (shopType === 'dutchAuction') {
        if (auctionGridSize < 1 || auctionGridSize > 6) {
            alert('❌ La taille de grille doit être entre 1 et 6');
            return;
        }
        if (auctionTickSeconds < 0.25 || auctionTickSeconds > 10) {
            alert('❌ Le tick des enchères doit être entre 0.25s et 10s');
            return;
        }
        if (auctionDecrement < 1 || auctionDecrement > 9999) {
            alert('❌ La décroissance doit être entre 1 et 9999');
            return;
        }
        if (auctionStartPriceMultiplier < 0.1 || auctionStartPriceMultiplier > 10) {
            alert('❌ Le multiplicateur de prix de départ doit être entre 0.1 et 10');
            return;
        }
        if (auctionMinPriceMultiplier < 0 || auctionMinPriceMultiplier > 5) {
            alert('❌ Le multiplicateur de prix minimum doit être entre 0 et 5');
            return;
        }
    }
    
    // Générer les tailles et vérifier qu'aucune n'est négative ou trop petite
    const sizes = [];
    for (let i = 1; i <= numLevels; i++) {
        let size;
        if (!peakLevel || i <= peakLevel) {
            size = startSize + (i - 1) * increment;
        } else {
            const peakSize = startSize + (peakLevel - 1) * increment;
            size = peakSize - (i - peakLevel) * decrement;
        }
        
        // Vérifier que la taille est positive et réaliste
        if (size < 5) {
            alert(`❌ La taille au niveau ${i} serait ${size}x${size}, ce qui est trop petit (minimum 5x5)`);
            return;
        }
        if (size > 200) {
            alert(`❌ La taille au niveau ${i} serait ${size}x${size}, ce qui est trop grand (maximum 200x200)`);
            return;
        }
        sizes.push(size);
    }
    
    // Vérifier s'il y a des joueurs connectés au mode custom
    if (socket) {
        socket.emit('checkCustomModeConnections', {}, (playersCount) => {
            if (playersCount > 0) {
                alert(`⛔ Impossible de modifier le mode personnalisé!\n\n${playersCount} joueur(s) connecté(s) au mode custom.\n\nAttendez que tous les joueurs quittent le mode custom.`);
                return;
            }
            
            // Créer et sauvegarder la configuration
            const auctionConfig = (shopType === 'dutchAuction') ? {
                gridSize: auctionGridSize,
                tickMs: Math.round(auctionTickSeconds * 1000),
                decrement: auctionDecrement,
                startPriceMultiplier: auctionStartPriceMultiplier,
                minPriceMultiplier: auctionMinPriceMultiplier
            } : null;
            createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier, shopType, auctionConfig, mazeAlgorithm, mazeDensity);
        });
    } else {
        // Sans socket, créer et sauvegarder directement
        const auctionConfig = (shopType === 'dutchAuction') ? {
            gridSize: auctionGridSize,
            tickMs: Math.round(auctionTickSeconds * 1000),
            decrement: auctionDecrement,
            startPriceMultiplier: auctionStartPriceMultiplier,
            minPriceMultiplier: auctionMinPriceMultiplier
        } : null;
        createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier, shopType, auctionConfig, mazeAlgorithm, mazeDensity);
    }
}

// Fonction utilitaire pour créer et sauvegarder la configuration
function createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier, shopType = 'classic', auctionConfig = null, mazeAlgorithm = 'backtracker', mazeDensity = 0.5) {
    // Calculer les niveaux de shop selon la fréquence
    const shopLevels = [];
    for (let i = shopFrequency; i <= numLevels; i += shopFrequency) {
        shopLevels.push(i);
    }
    
    // Créer les items du shop avec les prix ajustés
    const baseShopItems = [
        { id: 'dash', name: 'Dash', basePrice: 5, description: 'Accélération rapide', type: 'feature' },
        { id: 'checkpoint', name: 'Checkpoint', basePrice: 3, description: 'Sauvegarde ta position', type: 'feature' },
        { id: 'compass', name: 'Boussole', basePrice: 4, description: 'Indique la gemme la plus proche', type: 'feature' },
        { id: 'rope', name: 'Rope', basePrice: 1, description: 'Trace une corde derrière toi', type: 'feature' },
        { id: 'speedBoost', name: 'Vitesse +1', basePrice: 2, description: 'Augmente ta vitesse', type: 'speedBoost', stackable: true }
    ];
    
    const shopItems = baseShopItems.map(item => ({
        ...item,
        price: Math.max(1, Math.round(item.basePrice * itemPriceMultiplier))
    }));
    
    const config = {
        name: 'Personnalisé',
        description: `${numLevels} niveaux (${startSize}→${sizes[Math.floor(sizes.length/2)]}${peakLevel ? '→' + sizes[sizes.length-1] : ''})`,
        maxPlayers: 8,
        maxLevels: numLevels,
        levelConfig: {
            sizes: sizes
        },
        shop: {
            enabled: true,
            levels: shopLevels,
            duration: 15000,
            type: shopType
        },
        shopItems: shopItems,
        gemsPerLevel: {
            baseValue: 10,
            linearIncrement: 5,
            peakLevel: null,
            calculateGems: (level) => 10 + (level - 1) * 5
        },
        startingFeatures: { dash: false, checkpoint: false, rope: false, speedBoost: 0 },
        movement: { baseSpeed: 3, speedBoostIncrement: 1, wallCollisionDistance: 30 },
        transitionDuration: 5000,
        voting: { enabled: true, voteDuration: 10000 },
        mazeGeneration: {
            algorithm: mazeAlgorithm,  // 'backtracker' ou 'prim'
            density: mazeDensity       // 0.0 à 1.0 (uniquement pour prim)
        }
    };

    if (shopType === 'dutchAuction' && auctionConfig) {
        config.shop.auction = auctionConfig;
    }
    
    saveCustomModeConfig(config);
    
    // Mettre à jour l'affichage du mode personnalisé
    updateCustomModeDisplay();
    
    const shopTypeLabel = shopType === 'dutchAuction' ? 'Enchères dégressives' : 'Classique';
    alert(`✅ Mode personnalisé créé!\n🏪 Shop tous les ${shopFrequency} niveaux (${shopLevels.join(', ')})\n🛒 Type de shop: ${shopTypeLabel}\n💎 Multiplicateur de prix: x${itemPriceMultiplier.toFixed(1)}\n\nSélectionnez "Personnalisé" dans le menu.`);
    closeAdminPanel();
}

// Mettre à jour l'affichage du mode personnalisé dans le menu
function updateCustomModeDisplay() {
    if (customModeConfig) {
        const card = document.getElementById('customModeCard');
        if (card) {
            card.style.display = 'block';
            card.style.opacity = '1';
            document.getElementById('customModeName').textContent = customModeConfig.description;
            document.getElementById('customModeDesc').innerHTML = `
                <strong>${customModeConfig.maxLevels} niveaux</strong><br>
                Tailles: ${customModeConfig.levelConfig.sizes[0]}→${customModeConfig.levelConfig.sizes[Math.floor(customModeConfig.levelConfig.sizes.length/2)]}${customModeConfig.levelConfig.sizes[customModeConfig.levelConfig.sizes.length-1] !== customModeConfig.levelConfig.sizes[0] ? '→'+customModeConfig.levelConfig.sizes[customModeConfig.levelConfig.sizes.length-1] : ''}
            `;
        }
    }
}

// Ouvrir le panneau admin
function openAdminPanel() {
    if (!adminPanelOpen) {
        if (!document.getElementById('admin-panel')) {
            createAdminPanel();
        }
        document.getElementById('admin-panel').style.display = 'flex';
        adminPanelOpen = true;
        
        // Charger les valeurs sauvegardées si disponibles
        if (customModeConfig && customModeConfig.levelConfig && customModeConfig.levelConfig.sizes) {
            const sizes = customModeConfig.levelConfig.sizes;
            document.getElementById('numLevels').value = sizes.length;
            document.getElementById('startSize').value = sizes[0];
            if (sizes.length > 1) {
                const increment = sizes[1] - sizes[0];
                document.getElementById('increment').value = increment;
            }
        }
        
        generatePreview();
        
        // Ajouter les event listeners
        document.getElementById('numLevels').addEventListener('input', generatePreview);
        document.getElementById('startSize').addEventListener('input', generatePreview);
        document.getElementById('increment').addEventListener('input', generatePreview);
        document.getElementById('peakLevel').addEventListener('input', generatePreview);
        document.getElementById('decrement').addEventListener('input', generatePreview);

        // Event listener pour afficher/masquer les options d'enchères
        const shopTypeSelect = document.getElementById('shopType');
        if (shopTypeSelect) {
            shopTypeSelect.addEventListener('change', function() {
                const auctionGroup = document.getElementById('auctionSettingsGroup');
                if (!auctionGroup) return;
                auctionGroup.style.display = this.value === 'dutchAuction' ? 'block' : 'none';
            });
        }
        
        // Event listener pour afficher/masquer les options de densité
        document.getElementById('mazeAlgorithm').addEventListener('change', function() {
            const densityGroup = document.getElementById('densityGroup');
            densityGroup.style.display = this.value === 'prim' ? 'block' : 'none';
        });
        
        // Event listener pour mettre à jour l'affichage de la densité
        document.getElementById('mazeDensity').addEventListener('input', function() {
            document.getElementById('densityValue').textContent = this.value + '%';
        });
        
        // Charger les valeurs de l'algorithme si disponibles
        if (customModeConfig && customModeConfig.mazeGeneration) {
            document.getElementById('mazeAlgorithm').value = customModeConfig.mazeGeneration.algorithm || 'backtracker';
            document.getElementById('mazeDensity').value = (customModeConfig.mazeGeneration.density || 0.5) * 100;
            document.getElementById('densityValue').textContent = Math.round((customModeConfig.mazeGeneration.density || 0.5) * 100) + '%';
            if (customModeConfig.mazeGeneration.algorithm === 'prim') {
                document.getElementById('densityGroup').style.display = 'block';
            }
        }

        // Charger les valeurs shop si disponibles
        if (customModeConfig && customModeConfig.shop) {
            const shopType = customModeConfig.shop.type || 'classic';
            const shopTypeSelect2 = document.getElementById('shopType');
            if (shopTypeSelect2) {
                shopTypeSelect2.value = shopType;
            }

            const auctionGroup2 = document.getElementById('auctionSettingsGroup');
            if (auctionGroup2) {
                auctionGroup2.style.display = shopType === 'dutchAuction' ? 'block' : 'none';
            }

            if (shopType === 'dutchAuction' && customModeConfig.shop.auction) {
                const a = customModeConfig.shop.auction;
                if (document.getElementById('auctionGridSize')) document.getElementById('auctionGridSize').value = a.gridSize ?? 3;
                if (document.getElementById('auctionTickSeconds')) document.getElementById('auctionTickSeconds').value = a.tickMs ? (a.tickMs / 1000) : 2;
                if (document.getElementById('auctionDecrement')) document.getElementById('auctionDecrement').value = a.decrement ?? 1;
                if (document.getElementById('auctionStartPriceMultiplier')) document.getElementById('auctionStartPriceMultiplier').value = a.startPriceMultiplier ?? 2;
                if (document.getElementById('auctionMinPriceMultiplier')) document.getElementById('auctionMinPriceMultiplier').value = a.minPriceMultiplier ?? 0.5;
            }

            // (Optionnel) Essayer de déduire la fréquence depuis les niveaux de shop
            if (Array.isArray(customModeConfig.shop.levels) && customModeConfig.shop.levels.length > 0) {
                let inferredFrequency = customModeConfig.shop.levels[0];
                if (customModeConfig.shop.levels.length >= 2) {
                    inferredFrequency = Math.max(1, customModeConfig.shop.levels[1] - customModeConfig.shop.levels[0]);
                }
                const freqInput = document.getElementById('shopFrequency');
                if (freqInput) freqInput.value = inferredFrequency;
            }
        }
    }
}

// Fermer le panneau admin
function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.style.display = 'none';
        adminPanelOpen = false;
    }
}

// Capturer la touche "@" (Shift+2 sur AZERTY, normalement)
document.addEventListener('keydown', (event) => {
    // "@" : généralement Shift+2 sur AZERTY ou Shift+' sur QWERTY
    if ((event.shiftKey && event.key === '@') || (event.key === '@')) {
        event.preventDefault();
        openAdminPanel();
    }
});

// Charger la config au démarrage
loadCustomModeConfig();

// Mettre à jour l'affichage si le mode personnalisé existe
window.addEventListener('DOMContentLoaded', () => {
    updateCustomModeDisplay();
});
