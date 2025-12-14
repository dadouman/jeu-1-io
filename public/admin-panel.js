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
            createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier);
        });
    } else {
        // Sans socket, créer et sauvegarder directement
        createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier);
    }
}

// Fonction utilitaire pour créer et sauvegarder la configuration
function createAndSaveCustomConfig(numLevels, startSize, increment, peakLevel, decrement, sizes, shopFrequency, itemPriceMultiplier) {
    // Calculer les niveaux de shop selon la fréquence
    const shopLevels = [];
    for (let i = shopFrequency; i <= numLevels; i += shopFrequency) {
        shopLevels.push(i);
    }
    
    // Créer les items du shop avec les prix ajustés
    const baseShopItems = [
        { id: 'dash', name: 'Dash', basePrice: 5, description: 'Accélération rapide', type: 'feature' },
        { id: 'checkpoint', name: 'Checkpoint', basePrice: 3, description: 'Sauvegarde ta position', type: 'feature' },
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
            duration: 15000
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
        voting: { enabled: true, voteDuration: 10000 }
    };
    
    saveCustomModeConfig(config);
    
    // Mettre à jour l'affichage du mode personnalisé
    updateCustomModeDisplay();
    
    alert(`✅ Mode personnalisé créé!\n🏪 Shop tous les ${shopFrequency} niveaux (${shopLevels.join(', ')})\n💎 Multiplicateur de prix: x${itemPriceMultiplier.toFixed(1)}\n\nSélectionnez "Personnalisé" dans le menu.`);
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
