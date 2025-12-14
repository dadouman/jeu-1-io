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
    if (peakLevel && (peakLevel < 1 || peakLevel > numLevels)) {
        alert('❌ Le niveau pivot doit être entre 1 et ' + numLevels);
        return;
    }
    
    // Générer les tailles
    const sizes = [];
    for (let i = 1; i <= numLevels; i++) {
        if (!peakLevel || i <= peakLevel) {
            sizes.push(startSize + (i - 1) * increment);
        } else {
            const peakSize = startSize + (peakLevel - 1) * increment;
            sizes.push(peakSize - (i - peakLevel) * decrement);
        }
    }
    
    // Créer la configuration
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
            levels: Array.from({length: Math.floor(numLevels / 5)}, (_, i) => (i + 1) * 5),
            duration: 15000
        },
        shopItems: [
            { id: 'dash', name: 'Dash', price: 5, description: 'Accélération rapide', type: 'feature' },
            { id: 'checkpoint', name: 'Checkpoint', price: 3, description: 'Sauvegarde ta position', type: 'feature' },
            { id: 'rope', name: 'Rope', price: 1, description: 'Trace une corde derrière toi', type: 'feature' },
            { id: 'speedBoost', name: 'Vitesse +1', price: 2, description: 'Augmente ta vitesse', type: 'speedBoost', stackable: true }
        ],
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
    closeAdminPanel();
    
    // Mettre à jour l'affichage du mode personnalisé
    updateCustomModeDisplay();
    
    alert('✅ Mode personnalisé créé! Sélectionnez "Personnalisé" dans le menu de sélection des modes.');
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
