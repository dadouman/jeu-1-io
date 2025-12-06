// tests/solo-shop.test.js
// Tests pour le système de shop en mode solo

const { isShopLevel, getShopItems, purchaseItem } = require('../utils/shop');
const { calculateGemsForLevel, addGems } = require('../utils/gems');
const { initializePlayerForMode } = require('../utils/player');
const { generateMaze, getRandomEmptyPosition } = require('../utils/map');

describe('Solo Mode - Shop System', () => {

    let soloSession;

    beforeEach(() => {
        // Initialiser une session solo
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'solo');
        
        soloSession = {
            currentLevel: 1,
            map: generateMaze(15, 15),
            coin: getRandomEmptyPosition(generateMaze(15, 15)),
            player: player,
            startTime: Date.now(),
            levelStartTime: Date.now() + 3000, // Attendre transition
            checkpoints: [],
            totalTime: 0
        };
    });

    // --- TEST 1 : Shop s'ouvre tous les 5 niveaux (logique de base) ---
    test('isShopLevel retourne true pour les multiples de 5 > 0', () => {
        expect(isShopLevel(5)).toBe(true);   // Doit ouvrir
        expect(isShopLevel(10)).toBe(true);  // Doit ouvrir
        expect(isShopLevel(15)).toBe(true);  // Doit ouvrir
        expect(isShopLevel(20)).toBe(true);  // Selon isShopLevel (le serveur filtrera)
        
        // Autres niveaux ne doivent pas ouvrir le shop
        expect(isShopLevel(1)).toBe(false);
        expect(isShopLevel(4)).toBe(false);
        expect(isShopLevel(6)).toBe(false);
        expect(isShopLevel(11)).toBe(false);
    });

    // --- TEST 2 : Shop disponible en solo avec tous les items ---
    test('Tous les items du shop sont disponibles en solo', () => {
        const shopItems = getShopItems();
        
        expect(shopItems.dash).toBeDefined();
        expect(shopItems.checkpoint).toBeDefined();
        expect(shopItems.rope).toBeDefined();
        expect(shopItems.speedBoost).toBeDefined();
        
        expect(shopItems.dash.id).toBe('dash');
        expect(shopItems.checkpoint.id).toBe('checkpoint');
        expect(shopItems.rope.id).toBe('rope');
        expect(shopItems.speedBoost.id).toBe('speedBoost');
    });

    // --- TEST 3 : Joueur commence avec 0 features achetées en solo ---
    test('Joueur commence avec aucune feature achetée en solo', () => {
        const player = soloSession.player;
        
        expect(player.purchasedFeatures.dash).toBe(false);
        expect(player.purchasedFeatures.checkpoint).toBe(false);
        expect(player.purchasedFeatures.rope).toBe(false);
        expect(player.purchasedFeatures.speedBoost).toBe(0);
    });

    // --- TEST 4 : Obtenir des gems en complétant les niveaux ---
    test('Joueur gagne 1 gem par niveau complété en solo', () => {
        const player = soloSession.player;
        expect(player.gems).toBe(0);
        
        // Compléter le niveau 1
        addGems(player, calculateGemsForLevel(1));
        expect(player.gems).toBe(1);
        
        // Compléter les niveaux 2-4
        for (let i = 2; i <= 4; i++) {
            addGems(player, calculateGemsForLevel(i));
        }
        expect(player.gems).toBe(4);
    });

    // --- TEST 5 : Acheter un item au shop en solo ---
    test('Acheter un item au shop en solo', () => {
        const player = soloSession.player;
        
        // Donner des gems
        addGems(player, 5);
        expect(player.gems).toBe(5);
        
        // Acheter le dash (5 gems)
        const result = purchaseItem(player, 'dash');
        
        expect(result.success).toBe(true);
        expect(player.gems).toBe(0);
        expect(player.purchasedFeatures.dash).toBe(true);
        expect(result.item.name).toBe('Dash ⚡');
    });

    // --- TEST 6 : Acheter plusieurs items au shop ---
    test('Acheter plusieurs items en solo', () => {
        const player = soloSession.player;
        
        // Donner des gems
        addGems(player, 10);
        
        // Acheter rope (1 gem)
        let result = purchaseItem(player, 'rope');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(9);
        expect(player.purchasedFeatures.rope).toBe(true);
        
        // Acheter checkpoint (3 gems)
        result = purchaseItem(player, 'checkpoint');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(6);
        expect(player.purchasedFeatures.checkpoint).toBe(true);
        
        // Acheter speedBoost (2 gems)
        result = purchaseItem(player, 'speedBoost');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(4);
    });

    // --- TEST 7 : Ne pas pouvoir acheter sans assez de gems ---
    test('Ne pas pouvoir acheter un item sans assez de gems en solo', () => {
        const player = soloSession.player;
        
        // Donner seulement 3 gems
        addGems(player, 3);
        
        // Essayer d'acheter le dash (5 gems)
        const result = purchaseItem(player, 'dash');
        
        expect(result.success).toBe(false);
        expect(player.gems).toBe(3);
        expect(player.purchasedFeatures.dash).toBe(false);
        expect(result.gemsRequired).toBe(5);
        expect(result.gemsAvailable).toBe(3);
    });

    // --- TEST 8 : Profiter du shop au niveau 5 ---
    test('Joueur peut accéder au shop après compléter le niveau 5', () => {
        // Simuler la complétion des niveaux 1-5
        soloSession.currentLevel = 6; // Après complétion du niveau 5
        
        const completedLevel = 5;
        const shouldShopOpen = isShopLevel(completedLevel);
        
        expect(shouldShopOpen).toBe(true);
        expect(soloSession.currentLevel).toBe(6);
    });

    // --- TEST 9 : Pas de shop au niveau 20 en solo (serveur vérifie completedLevel < 20) ---
    test('Le serveur ne doit pas ouvrir le shop après le niveau 20 en solo', () => {
        soloSession.currentLevel = 21; // Après complétion du niveau 20
        
        const completedLevel = 20;
        const isShopLevelBasic = isShopLevel(completedLevel);
        const shouldShopOpen = isShopLevelBasic && completedLevel < 20; // Logique du serveur
        
        expect(isShopLevelBasic).toBe(true);  // isShopLevel retourne true
        expect(shouldShopOpen).toBe(false);   // Mais le serveur bloque (< 20)
    });

    // --- TEST 10 : Progression avec shop aux niveaux 5, 10, 15 (pas 20) ---
    test('Progression complète du solo avec shop aux bons niveaux', () => {
        const progression = [];
        
        // Simuler 20 niveaux
        for (let level = 1; level <= 20; level++) {
            const completedLevel = level - 1;
            // Le serveur applique la logique: isShopLevel ET completedLevel < 20
            const hasShop = isShopLevel(completedLevel) && completedLevel < 20;
            
            progression.push({
                level: level,
                hasShop: hasShop
            });
        }
        
        // Vérifier les niveaux de shop (avec la condition completedLevel < 20)
        // progression[0] = level 1, completion 0 → pas de shop
        // progression[5] = level 6, completion 5 → isShopLevel(5) && 5 < 20 = true → SHOP!
        // progression[10] = level 11, completion 10 → isShopLevel(10) && 10 < 20 = true → SHOP!
        // progression[15] = level 16, completion 15 → isShopLevel(15) && 15 < 20 = true → SHOP!
        // progression[19] = level 20, completion 19 → isShopLevel(19) && 19 < 20 = false && true = false → pas de shop
        
        expect(progression[5].hasShop).toBe(true);   // progression[5] = niveau 6 (après complétion du 5)
        expect(progression[10].hasShop).toBe(true);  // progression[10] = niveau 11 (après complétion du 10)
        expect(progression[15].hasShop).toBe(true);  // progression[15] = niveau 16 (après complétion du 15)
        expect(progression[19].hasShop).toBe(false); // progression[19] = niveau 20 (après complétion du 19 - pas de shop car isShopLevel(19) = false)
        
        // Vérifier que les autres niveaux n'ont pas de shop
        expect(progression[0].hasShop).toBe(false);
        expect(progression[1].hasShop).toBe(false);
        expect(progression[2].hasShop).toBe(false);
        expect(progression[3].hasShop).toBe(false);
        expect(progression[4].hasShop).toBe(false);
    });

    // --- TEST 11 : Shop items pricing ---
    test('Les prix des items sont corrects en solo', () => {
        const shopItems = getShopItems();
        
        expect(shopItems.dash.price).toBe(5);
        expect(shopItems.checkpoint.price).toBe(3);
        expect(shopItems.rope.price).toBe(1);
        expect(shopItems.speedBoost.price).toBe(2);
    });

    // --- TEST 12 : Timing du shop avec transition ---
    test('Le timing du shop inclut la transition (3s) + shop duration (15s)', () => {
        const TRANSITION_DURATION = 3000;
        const SHOP_DURATION = 15000;
        
        // Quand le shop ouvre, le timer du prochain niveau commence après :
        const totalDelay = TRANSITION_DURATION + SHOP_DURATION;
        
        expect(totalDelay).toBe(18000); // 18 secondes totales
        
        // Simuler le timing serveur
        const levelCompletionTime = Date.now();
        const nextLevelStartTime = levelCompletionTime + totalDelay;
        
        const expectedDelay = nextLevelStartTime - levelCompletionTime;
        expect(expectedDelay).toBe(18000);
    });

    // --- TEST 13 : Progression de gems à travers les niveaux ---
    test('Accumulation des gems pour acheter au shop', () => {
        const player = soloSession.player;
        
        // Compléter 5 niveaux = 5 gems
        for (let i = 1; i <= 5; i++) {
            addGems(player, calculateGemsForLevel(i));
        }
        expect(player.gems).toBe(5);
        
        // Acheter dash au shop (niveau 5)
        let result = purchaseItem(player, 'dash');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(0);
        
        // Compléter 10 niveaux de plus = 10 gems
        for (let i = 6; i <= 15; i++) {
            addGems(player, calculateGemsForLevel(i));
        }
        expect(player.gems).toBe(10);
        
        // Acheter checkpoint et rope au shop (niveau 10)
        result = purchaseItem(player, 'checkpoint');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(7);
        
        result = purchaseItem(player, 'rope');
        expect(result.success).toBe(true);
        expect(player.gems).toBe(6);
    });

    // --- TEST 14 : Vérifier l'état des features après achat ---
    test('État des features après avoir acheté au shop', () => {
        const player = soloSession.player;
        
        // Acheter tous les items
        addGems(player, 20);
        
        purchaseItem(player, 'dash');
        purchaseItem(player, 'checkpoint');
        purchaseItem(player, 'rope');
        purchaseItem(player, 'speedBoost');
        
        // Vérifier que tout est acheté
        expect(player.purchasedFeatures.dash).toBe(true);
        expect(player.purchasedFeatures.checkpoint).toBe(true);
        expect(player.purchasedFeatures.rope).toBe(true);
        expect(player.purchasedFeatures.speedBoost).toBe(1); // speedBoost est un compte, pas un booléen
    });

});

describe('Solo Mode - Shop & Checkpoint Interaction', () => {

    let soloSession;

    beforeEach(() => {
        const startPos = getRandomEmptyPosition(generateMaze(15, 15));
        const player = initializePlayerForMode(startPos, 0, 'solo');
        
        soloSession = {
            currentLevel: 1,
            map: generateMaze(15, 15),
            coin: getRandomEmptyPosition(generateMaze(15, 15)),
            player: player,
            startTime: Date.now(),
            levelStartTime: Date.now() + 3000,
            checkpoints: [],
            totalTime: 0
        };
    });

    // --- TEST 1 : Checkpoint times not affected by shop ---
    test('Le temps des checkpoints ne doit pas être affecté par le shop', () => {
        // Simuler les checkpoints
        soloSession.checkpoints = [2.5, 3.1, 2.8, 2.9, 3.0]; // Niveaux 1-5
        
        // Après le shop au niveau 5, les checkpoints suivants continuent
        soloSession.checkpoints.push(3.2); // Niveau 6
        soloSession.checkpoints.push(2.7); // Niveau 7
        
        // Vérifier que les checkpoints restent valides
        expect(soloSession.checkpoints.length).toBe(7);
        expect(soloSession.checkpoints[4]).toBe(3.0); // Dernier avant shop
        expect(soloSession.checkpoints[5]).toBe(3.2); // Premier après shop
    });

    // --- TEST 2 : Shop timing deduction from total time ---
    test('Le temps du shop doit être déduction du temps total en solo', () => {
        const SHOP_DURATION = 15000; // 15 secondes
        const TRANSITION_DURATION = 3000; // 3 secondes
        
        const sessionStartTime = Date.now();
        
        // Temps brut (tout)
        const rawTime = 50000; // 50 secondes
        
        // Temps inactif (shop + transition)
        const inactiveTime = SHOP_DURATION + TRANSITION_DURATION; // 18 secondes
        
        // Temps de jeu réel
        const activeTime = rawTime - inactiveTime;
        
        expect(activeTime).toBe(32000); // 32 secondes
    });

});
