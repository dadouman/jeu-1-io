// tests/shop.test.js

const { 
    isShopLevel, 
    getShopItems, 
    getItemPrice, 
    canAfford, 
    purchaseItem 
} = require('../utils/shop');

const { 
    calculateGemsForLevel, 
    addGems, 
    removeGems 
} = require('../utils/gems');

const { 
    initializePlayer 
} = require('../utils/player');

describe('Système de Shop', () => {

    // --- TEST 1 : Détection des niveaux de magasin ---
    test('Le magasin s\'ouvre tous les 5 niveaux', () => {
        expect(isShopLevel(5)).toBe(true);
        expect(isShopLevel(10)).toBe(true);
        expect(isShopLevel(15)).toBe(true);
        expect(isShopLevel(1)).toBe(false);
        expect(isShopLevel(4)).toBe(false);
        expect(isShopLevel(6)).toBe(false);
    });

    // --- TEST 2 : Prix des items ---
    test('Les items ont les bons prix', () => {
        expect(getItemPrice('dash')).toBe(5);
        expect(getItemPrice('checkpoint')).toBe(3);
        expect(getItemPrice('rope')).toBe(1);
        expect(getItemPrice('speedBoost')).toBe(2);
        expect(getItemPrice('nonExistent')).toBe(null);
    });

    // --- TEST 3 : Vérifier si on peut acheter ---
    test('Vérification de la capacité d\'achat', () => {
        expect(canAfford(5, 'dash')).toBe(true);
        expect(canAfford(4, 'dash')).toBe(false);
        expect(canAfford(1, 'rope')).toBe(true);
        expect(canAfford(0, 'rope')).toBe(false);
        expect(canAfford(10, 'checkpoint')).toBe(true);
    });

    // --- TEST 4 : Achat réussi ---
    test('Achat réussi d\'un item', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 5;

        const result = purchaseItem(player, 'dash');

        expect(result.success).toBe(true);
        expect(player.gems).toBe(0);
        expect(player.purchasedFeatures.dash).toBe(true);
        expect(result.gemsLeft).toBe(0);
    });

    // --- TEST 5 : Achat échoué (pas assez de gems) ---
    test('Achat échoué si pas assez de gems', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 2;

        const result = purchaseItem(player, 'dash');

        expect(result.success).toBe(false);
        expect(player.gems).toBe(2);
        expect(player.purchasedFeatures.dash).toBe(false);
        expect(result.gemsRequired).toBe(5);
        expect(result.gemsAvailable).toBe(2);
    });

    // --- TEST 6 : Achat d'un item inexistant ---
    test('Achat d\'un item inexistant échoue', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 100;

        const result = purchaseItem(player, 'nonExistent');

        expect(result.success).toBe(false);
        expect(player.gems).toBe(100);
    });

});

describe('Système de Gems', () => {

    // --- TEST 1 : Calcul des gems gagnées ---
    test('Calcul des gems pour chaque niveau', () => {
        expect(calculateGemsForLevel(1)).toBe(1); // 1 gem par niveau
        expect(calculateGemsForLevel(2)).toBe(1);
        expect(calculateGemsForLevel(3)).toBe(1);
        expect(calculateGemsForLevel(4)).toBe(1);
        expect(calculateGemsForLevel(9)).toBe(1);
        expect(calculateGemsForLevel(100)).toBe(1);
    });

    // --- TEST 2 : Ajout de gems ---
    test('Ajouter des gems à un joueur', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        expect(player.gems).toBe(0);

        addGems(player, 5);
        expect(player.gems).toBe(5);

        addGems(player, 3);
        expect(player.gems).toBe(8);
    });

    // --- TEST 3 : Retrait de gems ---
    test('Retirer des gems d\'un joueur', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 10;

        const success1 = removeGems(player, 3);
        expect(success1).toBe(true);
        expect(player.gems).toBe(7);

        const success2 = removeGems(player, 20);
        expect(success2).toBe(false);
        expect(player.gems).toBe(7);
    });

    // --- TEST 4 : Les gems survivent au changement de niveau ---
    test('Les gems restent après changement de niveau', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 5;
        player.purchasedFeatures.dash = true;

        player.checkpoint = null;
        player.trail = [];

        expect(player.gems).toBe(5);
        expect(player.purchasedFeatures.dash).toBe(true);
    });

});

describe('Intégration Shop + Gems + Joueur', () => {

    // --- TEST 1 : Scénario complet d'achat ---
    test('Scénario complet : collecter gems et acheter item', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);

        // 5 niveaux = 5 gems
        for (let i = 0; i < 5; i++) {
            const gemsEarned = calculateGemsForLevel(i + 1);
            addGems(player, gemsEarned);
        }
        expect(player.gems).toBe(5);

        // Acheter dash (coûte 5)
        let result = purchaseItem(player, 'dash');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(0);
        expect(player.purchasedFeatures.dash).toBe(true);
    });

    // --- TEST 2 : Achat multiples d'items différents ---
    test('Acheter plusieurs items différents', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 10;

        let result = purchaseItem(player, 'rope');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(9);

        result = purchaseItem(player, 'speedBoost');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(7);

        result = purchaseItem(player, 'checkpoint');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(4);

        result = purchaseItem(player, 'dash');
        expect(result.success).toBe(false); // Dash coûte 5, on a 4
        expect(player.gems).toBe(4);
    });

    // --- TEST 3 : Impossible d'acheter 2x le même item (sauf speedBoost) ---
    test('Impossible d\'acheter 2x le même item (sauf speedBoost)', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 20;

        // Premier achat de checkpoint
        let result = purchaseItem(player, 'checkpoint');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(17);

        // Deuxième achat - doit échouer
        result = purchaseItem(player, 'checkpoint');
        expect(result.success).toBe(false);
        expect(result.message).toContain('déjà été acheté');
        expect(player.gems).toBe(17); // Pas changé

        // Mais speedBoost doit réussir plusieurs fois
        result = purchaseItem(player, 'speedBoost');
        expect(result.success).toBe(true);
        expect(player.purchasedFeatures.speedBoost).toBe(1);

        result = purchaseItem(player, 'speedBoost');
        expect(result.success).toBe(true);
        expect(player.purchasedFeatures.speedBoost).toBe(2);
    });

});
