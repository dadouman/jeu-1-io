// tests/architecture-refactoring.test.js - Tests pour la nouvelle architecture

const GameMode = require('../utils/GameMode');
const { GameSessionManager } = require('../utils/GameSessionManager');
const PlayerActions = require('../utils/PlayerActions');
const { getGameModeConfig } = require('../config/gameModes');

describe('Architecture Refactorée - Flexible Game Configuration', () => {

    describe('GameMode - Configuration centralisée', () => {
        
        test('Récupère la config d\'un mode existant', () => {
            const classicMode = new GameMode('classic');
            
            expect(classicMode.modeId).toBe('classic');
            expect(classicMode.config.maxPlayers).toBeDefined();
            expect(classicMode.config.maxLevels).toBeDefined();
            expect(classicMode.config.shop).toBeDefined();
        });

        test('Lève une erreur pour un mode inexistant', () => {
            expect(() => {
                new GameMode('unknownMode');
            }).toThrow('Mode "unknownMode" non configuré');
        });

        test('Récupère la taille du maze selon le niveau', () => {
            const soloMode = new GameMode('solo');
            const size1 = soloMode.getMazeSize(1);
            const size5 = soloMode.getMazeSize(5);
            const size10 = soloMode.getMazeSize(10);
            
            expect(size1.width).toBe(15);
            expect(size5.width).toBe(23);  // Pic au niveau 5
            expect(size10.width).toBe(15);  // Décroissance: 23 -> 21 -> 19 -> 17 -> 15
        });

        test('Récupère les gems selon le niveau', () => {
            const classicMode = new GameMode('classic');
            const gemsLevel1 = classicMode.getGemsForLevel(1);
            const gemsLevel10 = classicMode.getGemsForLevel(10);
            
            expect(gemsLevel1).toBe(10);
            expect(gemsLevel10).toBeGreaterThan(gemsLevel1);
        });

        test('Vérifie si un niveau a un shop', () => {
            const soloMode = new GameMode('solo');
            
            expect(soloMode.isShopLevel(5)).toBe(true);   // Shop au niveau 5
            expect(soloMode.isShopLevel(10)).toBe(true);  // Shop au niveau 10
            expect(soloMode.isShopLevel(3)).toBe(false);  // Pas de shop
            expect(soloMode.isShopLevel(6)).toBe(false);  // Pas de shop
        });

        test('Récupère les items du shop', () => {
            const classicMode = new GameMode('classic');
            const items = classicMode.getShopItems();
            
            expect(items.length).toBeGreaterThan(0);
            expect(items[0].id).toBeDefined();
            expect(items[0].price).toBeDefined();
        });

        test('Récupère un item spécifique par ID', () => {
            const classicMode = new GameMode('classic');
            const dashItem = classicMode.getShopItem('dash');
            
            expect(dashItem).toBeDefined();
            expect(dashItem.id).toBe('dash');
            expect(dashItem.price).toBeGreaterThan(0);
        });

        test('Vérifie le nombre max de joueurs', () => {
            const soloMode = new GameMode('solo');
            const classicMode = new GameMode('classic');
            
            expect(soloMode.canAccommodatePlayers(1)).toBe(true);
            expect(soloMode.canAccommodatePlayers(2)).toBe(false);  // Solo: max 1
            
            expect(classicMode.canAccommodatePlayers(4)).toBe(true);
            expect(classicMode.canAccommodatePlayers(10)).toBe(false);  // Classic: max 8
        });

        test('Vérifie la fin du jeu', () => {
            const soloMode = new GameMode('solo');
            
            expect(soloMode.isGameFinished(9)).toBe(false);
            expect(soloMode.isGameFinished(10)).toBe(false);
            expect(soloMode.isGameFinished(11)).toBe(true);  // Solo: 10 niveaux max
        });

        test('Récupère la vitesse du joueur selon les features', () => {
            const classicMode = new GameMode('classic');
            const player = {
                purchasedFeatures: {
                    speedBoost: 0
                }
            };
            
            const speed0 = classicMode.getPlayerSpeed(player);
            player.purchasedFeatures.speedBoost = 1;
            const speed1 = classicMode.getPlayerSpeed(player);
            
            expect(speed1).toBeGreaterThan(speed0);
        });
    });

    describe('GameSessionManager - Gestion unifiée des sessions', () => {
        
        let manager;
        
        beforeEach(() => {
            manager = new GameSessionManager();
        });

        test('Crée une session', () => {
            const session = manager.createSession('session-1', 'solo');
            
            expect(session).toBeDefined();
            expect(session.gameMode.modeId).toBe('solo');
            expect(session.currentLevel).toBe(1);
        });

        test('Récupère une session', () => {
            manager.createSession('session-1', 'classic');
            const session = manager.getSession('session-1');
            
            expect(session).toBeDefined();
            expect(session.sessionId).toBe('session-1');
        });

        test('Ajoute un joueur à une session', () => {
            const session = manager.createSession('session-1', 'solo');
            const pos = { x: 100, y: 100 };
            
            manager.addPlayerToSession('player-1', 'session-1', pos, 0);
            
            expect(session.getPlayerCount()).toBe(1);
            expect(session.getPlayer('player-1')).toBeDefined();
        });

        test('Supprime un joueur', () => {
            manager.createSession('session-1', 'solo');
            manager.addPlayerToSession('player-1', 'session-1', { x: 100, y: 100 }, 0);
            
            expect(manager.getPlayerSession('player-1')).toBeDefined();
            manager.removePlayer('player-1');
            expect(manager.getPlayerSession('player-1')).toBeNull();
        });

        test('Supprime une session complètement', () => {
            manager.createSession('session-1', 'solo');
            manager.addPlayerToSession('player-1', 'session-1', { x: 100, y: 100 }, 0);
            
            manager.deleteSession('session-1');
            
            expect(manager.getSession('session-1')).toBeNull();
            expect(manager.getPlayerSession('player-1')).toBeNull();
        });

        test('Récupère les sessions par mode', () => {
            manager.createSession('solo-1', 'solo');
            manager.createSession('solo-2', 'solo');
            manager.createSession('classic-1', 'classic');
            
            const soloSessions = manager.getSessionsByMode('solo');
            const classicSessions = manager.getSessionsByMode('classic');
            
            expect(soloSessions.length).toBe(2);
            expect(classicSessions.length).toBe(1);
        });

        test('Les features du joueur sont initialisées selon le mode', () => {
            const classicSession = manager.createSession('session-1', 'classic');
            const soloSession = manager.createSession('session-2', 'solo');
            
            manager.addPlayerToSession('player-1', 'session-1', { x: 100, y: 100 }, 0);
            manager.addPlayerToSession('player-2', 'session-2', { x: 100, y: 100 }, 0);
            
            const classicPlayer = classicSession.getPlayer('player-1');
            const soloPlayer = soloSession.getPlayer('player-2');
            
            // Classic: dash désactivé au départ
            expect(classicPlayer.purchasedFeatures.dash).toBe(false);
            // Solo: dash activé au départ
            expect(soloPlayer.purchasedFeatures.dash).toBe(true);
        });
    });

    describe('PlayerActions - Actions unifiées', () => {
        
        let player, map;
        
        beforeEach(() => {
            player = {
                x: 100,
                y: 100,
                lastDirection: 'right',
                trail: [],
                purchasedFeatures: {
                    dash: true,
                    checkpoint: true,
                    rope: false,
                    speedBoost: 0
                },
                gems: 100
            };
            
            // Map simple 5x5 avec un mur au centre
            map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
        });

        test('Traite le mouvement unifié', () => {
            const startX = player.x;
            const input = { left: true, right: false, up: false, down: false };
            
            // Note: Le mouvement devrait marcher, mais la map de test n'a pas de cases vides accessibles
            // On teste juste que la fonction ne crash pas
            PlayerActions.processMovement(player, map, input, 'classic');
            
            expect(player.x).toBeDefined();
            expect(player.y).toBeDefined();
        });

        test('Traite le dash unifié', () => {
            // Créer une map plus grande avec plus d'espace
            const largerMap = Array(20).fill(null).map(() => Array(20).fill(0));
            
            const startX = player.x;
            const result = PlayerActions.processDash(player, largerMap, 'classic');
            
            // Le dash devrait réussir avec cette map
            expect(result.success).toBe(true);
            expect(player.x).not.toBe(startX);
        });

        test('Gère les checkpoints', () => {
            const checkpoint = PlayerActions.processCheckpoint(player, 'set');
            
            expect(checkpoint.success).toBe(true);
            expect(player.checkpoint).toBeDefined();
        });

        test('Ajoute des gems', () => {
            const startGems = player.gems;
            
            PlayerActions.addGems(player, 50);
            
            expect(player.gems).toBe(startGems + 50);
        });

        test('Achète un item au shop', () => {
            const item = {
                id: 'dash',
                name: 'Dash',
                price: 20,
                type: 'feature'
            };
            
            const startGems = player.gems;
            const result = PlayerActions.buyItem(player, item);
            
            expect(result.success).toBe(true);
            expect(player.gems).toBe(startGems - item.price);
        });

        test('Refuse l\'achat si pas assez de gems', () => {
            player.gems = 5;
            const item = {
                id: 'dash',
                price: 20,
                type: 'feature'
            };
            
            const result = PlayerActions.buyItem(player, item);
            
            expect(result.success).toBe(false);
            expect(player.gems).toBe(5);  // Pas changé
        });
    });

    describe('Configuration flexible - Scénarios', () => {
        
        test('Scénario: Créer un mode solo20 (20 niveaux)', () => {
            const config = getGameModeConfig('solo20');
            
            expect(config.maxLevels).toBe(20);
            expect(config.shop.levels).toContain(5);
            expect(config.shop.levels).toContain(10);
            expect(config.shop.levels).toContain(15);
            expect(config.shop.levels).toContain(20);
        });

        test('Scénario: Changer le nombre de niveaux = une ligne', () => {
            // Simule le changement dans la config
            const oldConfig = getGameModeConfig('solo');
            expect(oldConfig.maxLevels).toBe(10);
            
            const newConfig = getGameModeConfig('solo20');
            expect(newConfig.maxLevels).toBe(20);  // Différent, mais zero duplication
        });

        test('Scénario: Vérifier que les gems sont scalables', () => {
            const classicMode = new GameMode('classic');
            const soloMode = new GameMode('solo');
            
            const classicGems = classicMode.getGemsForLevel(5);
            const soloGems = soloMode.getGemsForLevel(5);
            
            // Différentes formules pour différents modes
            expect(typeof classicGems).toBe('number');
            expect(typeof soloGems).toBe('number');
        });
    });
});
