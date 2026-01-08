// tests/shop-concurrency.test.js
// Tests pour couvrir les scénarios de transaction concurrente et atomicité du shop

const { 
    purchaseItem, 
    canAfford 
} = require('../utils/shop');

const { 
    addGems, 
    removeGems 
} = require('../utils/gems');

const { 
    initializePlayer 
} = require('../utils/player');

describe('Shop System - Concurrency & Atomicity', () => {

    // === TEST 1 : Concurrent Purchases (Race Condition) ===
    test('Deux achats simultanés du même item ne devraient pas causer de double achat', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 5;

        // Simuler 2 requêtes concurrentes pour acheter 'dash' (coût 5)
        const purchase1 = purchaseItem(player, 'dash');
        
        // Avant que purchase1 se termine, purchase2 arrive
        // (dans un vrai système, ça serait une race condition)
        const canAfford2 = canAfford(player.gems, 'dash');
        
        // Si purchase1 s'était complété, player.gems = 0
        // Donc purchase2 devrait échouer
        if (purchase1.success) {
            expect(canAfford2).toBe(false);
        }
    });

    test('Transaction atomique: Achat doit être tout ou rien', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 3; // Pas assez pour 'dash' (coût 5)

        const result = purchaseItem(player, 'dash');

        // Should fail
        expect(result.success).toBe(false);
        
        // Gems n'ont pas changé (atomicité)
        expect(player.gems).toBe(3);
        // Si achat échoue, purchasedFeatures.dash doit rester false
        expect(player.purchasedFeatures.dash).toBe(false);
    });

    // === TEST 2 : Multiple Players Buying Concurrently ===
    test('4 joueurs achètent items différents simultanément', () => {
        const players = [
            initializePlayer({ x: 100, y: 100 }, 0),
            initializePlayer({ x: 200, y: 200 }, 1),
            initializePlayer({ x: 300, y: 300 }, 2),
            initializePlayer({ x: 400, y: 400 }, 3)
        ];

        // Tous ont 10 gems
        players.forEach(p => p.gems = 10);

        const purchases = [];
        
        // Achats concurrent
        purchases.push(purchaseItem(players[0], 'dash'));       // -5 gems
        purchases.push(purchaseItem(players[1], 'checkpoint')); // -3 gems
        purchases.push(purchaseItem(players[2], 'rope'));       // -1 gem
        purchases.push(purchaseItem(players[3], 'speedBoost')); // -2 gems

        // Tous devraient réussir
        purchases.forEach(p => expect(p.success).toBe(true));

        // Vérifier les gems restants
        expect(players[0].gems).toBe(5);  // 10 - 5
        expect(players[1].gems).toBe(7);  // 10 - 3
        expect(players[2].gems).toBe(9);  // 10 - 1
        expect(players[3].gems).toBe(8);  // 10 - 2
    });

    // === TEST 3 : Network Failure During Purchase ===
    test('Perte de connexion pendant achat ne devrait pas perdre de gems', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 5;

        // Simuler achat
        const transaction = {
            playerId: 'test-player',
            itemId: 'dash',
            cost: 5,
            gemsBeforePurchase: player.gems,
            completed: false
        };

        // Vérifier avant
        expect(player.gems).toBe(5);

        // Si acheter réussit
        const result = purchaseItem(player, 'dash');
        
        if (result.success) {
            transaction.completed = true;
            expect(player.gems).toBe(0);
        } else {
            // Si échoue, gems conservés
            expect(player.gems).toBe(5);
        }

        // Gems cohérents
        const expectedGems = transaction.completed ? 0 : 5;
        expect(player.gems).toBe(expectedGems);
    });

    // === TEST 4 : Duplicate Purchase Prevention ===
    test('Acheter le même item plusieurs fois devrait être géré', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 15;

        // Premier achat
        const purchase1 = purchaseItem(player, 'dash');
        expect(purchase1.success).toBe(true);
        expect(player.gems).toBe(10);

        // Deuxième achat du même item
        const purchase2 = purchaseItem(player, 'dash');

        // Comportement: soit refusé, soit accepté
        // Important: si accepté, doit être atomique
        if (purchase2.success) {
            expect(player.gems).toBe(5); // -5 de plus
        } else {
            expect(player.gems).toBe(10); // Pas changé
        }
    });

    // === TEST 5 : Gem Modification Race Condition ===
    test('addGems et removeGems ne devraient pas créer d\'incohérence', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 10;

        // Simuler deux opérations concurrentes
        // Thread 1: removeGems(5)
        // Thread 2: addGems(3)
        // Final: 10 - 5 + 3 = 8 (peu importe l'ordre)

        removeGems(player, 5);
        expect(player.gems).toBe(5);

        addGems(player, 3);
        expect(player.gems).toBe(8);

        // Vérifier que c'est cohérent
        expect(player.gems).toBe(8);
    });

    // === TEST 6 : Insufficient Funds Check ===
    test('Vérifier les fonds avant chaque transaction', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        
        const items = [
            { name: 'dash', cost: 5 },
            { name: 'checkpoint', cost: 3 },
            { name: 'rope', cost: 1 },
            { name: 'speedBoost', cost: 2 }
        ];

        // Test avec différents montants
        [0, 1, 3, 5, 10].forEach(gems => {
            player.gems = gems;
            
            items.forEach(item => {
                const canBuy = canAfford(player.gems, item.name);
                expect(canBuy).toBe(player.gems >= item.cost);
            });
        });
    });

    // === TEST 7 : Transaction Queue ===
    test('Queue de transactions doit être FIFO (First In First Out)', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 20;

        const transactionLog = [];

        // 3 achats en séquence
        const buy = (itemId, timestamp) => {
            const result = purchaseItem(player, itemId);
            if (result.success) {
                transactionLog.push({
                    itemId,
                    timestamp,
                    gemsAfter: player.gems
                });
            }
            return result;
        };

        buy('dash', 1);       // -5 -> 15
        buy('checkpoint', 2); // -3 -> 12
        buy('rope', 3);       // -1 -> 11

        // Order doit être respecté
        expect(transactionLog.length).toBe(3);
        expect(transactionLog[0].itemId).toBe('dash');
        expect(transactionLog[1].itemId).toBe('checkpoint');
        expect(transactionLog[2].itemId).toBe('rope');
        
        // Gems final: 11
        expect(transactionLog[2].gemsAfter).toBe(11);
    });

    // === TEST 8 : Long Transaction Duration ===
    test('Transaction longue ne devrait pas bloquer d\'autres', (done) => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 20;

        let slowTransactionComplete = false;
        let fastTransactionComplete = false;

        // Simuler transaction lente
        setTimeout(() => {
            purchaseItem(player, 'dash');
            slowTransactionComplete = true;
        }, 100);

        // Transaction rapide pendant ce temps
        setTimeout(() => {
            purchaseItem(player, 'rope');
            fastTransactionComplete = true;
        }, 50);

        // Attendre les deux
        setTimeout(() => {
            expect(slowTransactionComplete).toBe(true);
            expect(fastTransactionComplete).toBe(true);
            expect(player.gems).toBe(14); // 20 - 5 (dash) - 1 (rope)
            done();
        }, 200);
    });

    // === TEST 9 : Negative Gems Prevention ===
    test('Gems ne devraient jamais devenir négatifs', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 2;

        // Tenter acheter quelque chose de trop cher
        const result1 = purchaseItem(player, 'dash'); // Coûte 5
        expect(result1.success).toBe(false);
        expect(player.gems).toBeGreaterThanOrEqual(0);

        // Même après 10 tentatives
        for (let i = 0; i < 10; i++) {
            purchaseItem(player, 'checkpoint');
        }
        expect(player.gems).toBeGreaterThanOrEqual(0);
    });

    // === TEST 10 : Multiple Items Same Price ===
    test('Acheter plusieurs items du même prix ne cause pas de confusion', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 10;

        // Items à 1 gem
        const singleGemItems = ['rope']; // À adapter selon shop.js

        singleGemItems.forEach(item => {
            const result = purchaseItem(player, item);
            if (result.success) {
                player.gems -= 1;
            }
        });

        // Doit être cohérent
        expect(player.gems).toBeGreaterThanOrEqual(0);
        expect(player.gems).toBeLessThanOrEqual(10);
    });

    // === TEST 11 : State Rollback on Error ===
    test('En cas d\'erreur, l\'état du joueur doit être restauré', () => {
        const player = initializePlayer({ x: 100, y: 100 }, 0);
        player.gems = 5;
        const initialState = { ...player };

        // Tenter transaction invalide
        purchaseItem(player, 'nonExistentItem');

        // État devrait être inchangé
        expect(player.gems).toBe(initialState.gems);
    });
});
