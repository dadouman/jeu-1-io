// server/utils/solo-utils.js
// Utilitaires pour le mode solo et solo-express

const { SHOP_ITEMS } = require('../../utils/shop');

/**
 * Génère une feature aléatoire pondérée par le prix (plus cher = moins probable)
 * @returns {string} - L'ID de la feature (dash, checkpoint, rope, speedBoost)
 */
function generateRandomFeatureWeighted() {
    const items = Object.values(SHOP_ITEMS);
    
    // Créer un tableau avec un poids inversement proportionnel au prix
    // Plus le prix est bas, plus la probabilité est haute
    const maxPrice = Math.max(...items.map(item => item.price));
    const weights = items.map(item => {
        // Inversion: prixMax - prixActuel (plus le prix est bas, plus le poids est haut)
        return (maxPrice - item.price + 1);
    });
    
    // Générer un nombre aléatoire
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i].id;
        }
    }
    
    return items[0].id; // Fallback
}

/**
 * Calcule la taille du labyrinthe selon le mode et le niveau
 * @param {number} level - Le niveau actuel
 * @param {string} mode - Le mode de jeu (solo, solo-express, etc.)
 * @returns {{width: number, height: number}} - Les dimensions du labyrinthe
 */
function calculateSoloMazeSize(level, mode) {
    const baseSize = 15;
    const increment = 2;
    const size = baseSize + (level * increment);
    
    return { width: size, height: size };
}

module.exports = {
    generateRandomFeatureWeighted,
    calculateSoloMazeSize
};
