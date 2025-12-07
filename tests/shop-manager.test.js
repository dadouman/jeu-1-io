// tests/shop-manager.test.js

const GameMode = require('../utils/GameMode');
const { ShopManager } = require('../utils/ShopManager');

describe('ShopManager - Gestion centralisée du shop', () => {
    
    let gameMode;
    let shopManager;

    beforeEach(() => {
        gameMode = new GameMode('solo');
        shopManager = new ShopManager(gameMode);
    });

    describe('Ouverture du shop', () => {
        test('Ouvre le shop après le niveau 5 en mode solo', () => {
            const result = shopManager.openShop(5);
            
            expect(result).toBe(true);
            expect(shopManager.isShopCurrentlyActive).toBe(true);
            expect(shopManager.shopStartLevel).toBe(5);
        });

        test('N\'ouvre pas le shop après le niveau 3 en mode solo', () => {
            const result = shopManager.openShop(3);
            
            expect(result).toBe(false);
            expect(shopManager.isShopCurrentlyActive).toBe(false);
        });

        test('Ouvre le shop après le niveau 10 en mode solo', () => {
            const result = shopManager.openShop(10);
            
            expect(result).toBe(true);
            expect(shopManager.isShopCurrentlyActive).toBe(true);
        });

        test('Ne peut pas ouvrir le shop après le niveau 11+ (fin du jeu)', () => {
            const result = shopManager.openShop(11);
            
            expect(result).toBe(false);
            expect(shopManager.isShopCurrentlyActive).toBe(false);
        });
    });

    describe('Blocage des collisions', () => {
        test('Bloque les collisions quand le shop est actif', () => {
            shopManager.openShop(5);
            
            const shouldBlock = shopManager.shouldBlockCollisions();
            expect(shouldBlock).toBe(true);
        });

        test('Ne bloque pas les collisions quand le shop est fermé', () => {
            const shouldBlock = shopManager.shouldBlockCollisions();
            
            expect(shouldBlock).toBe(false);
        });

        test('Arrête de bloquer après que la durée du shop soit écoulée', (done) => {
            // Ouvrir le shop avec une très courte durée
            const mode = new GameMode('solo');
            const manager = new ShopManager(mode);
            
            // Simuler une durée très courte (100ms)
            manager.openShop(5, Date.now());
            manager.shopEndTime = Date.now() + 100;
            
            expect(manager.shouldBlockCollisions()).toBe(true);
            
            // Après 150ms, le shop devrait être fermé
            setTimeout(() => {
                expect(manager.shouldBlockCollisions()).toBe(false);
                expect(manager.isShopCurrentlyActive).toBe(false);
                done();
            }, 150);
        });
    });

    describe('Gestion du temps du shop', () => {
        test('Retourne le temps restant du shop', () => {
            shopManager.openShop(5);
            
            const remaining = shopManager.getShopTimeRemaining();
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(gameMode.getShopDuration());
        });

        test('Retourne 0 quand le shop est fermé', () => {
            const remaining = shopManager.getShopTimeRemaining();
            
            expect(remaining).toBe(0);
        });
    });

    describe('Fermeture du shop', () => {
        test('Ferme le shop manuellement', () => {
            shopManager.openShop(5);
            expect(shopManager.isShopCurrentlyActive).toBe(true);
            
            shopManager.closeShop();
            expect(shopManager.isShopCurrentlyActive).toBe(false);
        });

        test('Réinitialise complètement le shop', () => {
            shopManager.openShop(5);
            
            shopManager.reset();
            
            expect(shopManager.isShopCurrentlyActive).toBe(false);
            expect(shopManager.shopStartLevel).toBeNull();
            expect(shopManager.shopEndTime).toBeNull();
        });
    });

    describe('État du shop', () => {
        test('Retourne l\'état complet du shop', () => {
            shopManager.openShop(5);
            
            const state = shopManager.getState();
            
            expect(state.isActive).toBe(true);
            expect(state.shopStartLevel).toBe(5);
            expect(state.timeRemaining).toBeGreaterThan(0);
            expect(state.modeId).toBe('solo');
        });
    });

    describe('Fonctionnement avec différents modes', () => {
        test('Fonctionne avec le mode classic', () => {
            const classicMode = new GameMode('classic');
            const manager = new ShopManager(classicMode);
            
            // Classic a des shops aux niveaux [5, 10, 15, 20, 25, 30]
            expect(manager.openShop(5)).toBe(true);
            expect(manager.isShopCurrentlyActive).toBe(true);
        });

        test('Fonctionne avec le mode infinite', () => {
            const infiniteMode = new GameMode('infinite');
            const manager = new ShopManager(infiniteMode);
            
            // Infinite a des shops aux niveaux [3, 6, 9, 12, 15]
            expect(manager.openShop(3)).toBe(true);
            expect(manager.isShopCurrentlyActive).toBe(true);
        });

        test('Respecte les niveaux de shop de chaque mode', () => {
            const soloMode = new GameMode('solo');
            const soloManager = new ShopManager(soloMode);
            
            const classicMode = new GameMode('classic');
            const classicManager = new ShopManager(classicMode);
            
            // Solo: shop aux niveaux [5, 10]
            // Classic: shop aux niveaux [5, 10, 15, 20, 25, 30]
            
            expect(soloManager.openShop(5)).toBe(true);
            expect(soloManager.openShop(15)).toBe(false);  // Pas de shop au niveau 15 en solo
            
            expect(classicManager.openShop(5)).toBe(true);
            expect(classicManager.openShop(15)).toBe(true);  // Shop au niveau 15 en classic
        });
    });

    describe('Scénario complet: progression à travers les niveaux', () => {
        test('Scénario: Solo niveau 1-10 avec shop au niveau 5', () => {
            const mode = new GameMode('solo');
            const manager = new ShopManager(mode);
            
            // Niveau 1-4: pas de shop
            for (let level = 1; level <= 4; level++) {
                expect(manager.openShop(level)).toBe(false);
                expect(manager.isShopCurrentlyActive).toBe(false);
            }
            
            // Niveau 5: shop s'ouvre
            expect(manager.openShop(5)).toBe(true);
            expect(manager.shouldBlockCollisions()).toBe(true);
            
            // Fermer le shop
            manager.closeShop();
            expect(manager.isShopCurrentlyActive).toBe(false);
            
            // Niveau 6-9: pas de shop
            for (let level = 6; level <= 9; level++) {
                expect(manager.openShop(level)).toBe(false);
            }
            
            // Niveau 10: shop s'ouvre
            expect(manager.openShop(10)).toBe(true);
            expect(manager.shouldBlockCollisions()).toBe(true);
        });
    });
});
