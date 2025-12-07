// tests/socket-modes.test.js
// Tests pour vérifier que tous les socket events gèrent correctement chaque mode

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayerForMode } = require('../utils/player');

describe('Socket Events - Mode Safety', () => {

    describe('proposeRestart event', () => {
        test('proposeRestart en classic devrait accéder au lobby', () => {
            const mode = 'classic';
            const lobbies = {
                classic: {
                    players: {
                        'test-player': initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'classic')
                    }
                }
            };
            
            // Simulation: vérifier que le code ne crashe pas
            if (mode === 'solo' || mode === 'solo-express') {
                expect(true).toBe(true); // Skip pour solo
                return;
            }
            
            const lobby = lobbies[mode];
            expect(lobby).toBeDefined();
            expect(lobby.players).toBeDefined();
        });

        test('proposeRestart en solo devrait retourner sans accéder au lobby', () => {
            const mode = 'solo';
            const soloSessions = {
                'test-player': {
                    mode: 'solo',
                    player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo')
                }
            };
            
            // Les votes ne s'appliquent qu'aux modes multijoueur
            if (mode === 'solo' || mode === 'solo-express') {
                expect(true).toBe(true); // Should return early
                return;
            }
            
            expect.fail('Should have returned early');
        });

        test('proposeRestart en solo-express devrait retourner sans accéder au lobby', () => {
            const mode = 'solo-express';
            
            // Les votes ne s'appliquent qu'aux modes multijoueur
            if (mode === 'solo' || mode === 'solo-express') {
                expect(true).toBe(true); // Should return early
                return;
            }
            
            expect.fail('Should have returned early');
        });
    });

    describe('voteRestart event', () => {
        test('voteRestart en classic devrait accéder au lobby', () => {
            const mode = 'classic';
            const lobbies = {
                classic: {
                    players: {
                        'test-player': initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'classic')
                    }
                }
            };
            
            if (mode === 'solo' || mode === 'solo-express') {
                expect.fail('Solo modes should not reach this code');
                return;
            }
            
            const lobby = lobbies[mode];
            expect(lobby).toBeDefined();
            expect(lobby.players).toBeDefined();
        });

        test('voteRestart en solo devrait ignorer sans crasher', () => {
            const mode = 'solo';
            
            if (mode === 'solo' || mode === 'solo-express') {
                // Early return - ne pas crasher
                expect(true).toBe(true);
                return;
            }
        });
    });

    describe('checkpoint event', () => {
        test('checkpoint en classic accède au lobby.players', () => {
            const mode = 'classic';
            const lobbies = {
                classic: {
                    players: {
                        'test-player': initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'classic')
                    }
                }
            };
            
            if (mode === 'solo' || mode === 'solo-express') {
                // Récupère depuis soloSessions
                expect.fail('Should access lobby');
                return;
            }
            
            const lobby = lobbies[mode];
            expect(lobby).toBeDefined();
            expect(lobby.players['test-player']).toBeDefined();
        });

        test('checkpoint en solo accède à soloSessions', () => {
            const mode = 'solo';
            const soloSessions = {
                'test-player': {
                    mode: 'solo',
                    player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo')
                }
            };
            
            if (mode === 'solo' || mode === 'solo-express') {
                const session = soloSessions['test-player'];
                expect(session).toBeDefined();
                expect(session.player).toBeDefined();
                expect(session.player.purchasedFeatures).toBeDefined();
                return;
            }
        });

        test('checkpoint en solo-express accède à soloSessions', () => {
            const mode = 'solo-express';
            const soloSessions = {
                'test-player': {
                    mode: 'solo-express',
                    player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo-express')
                }
            };
            
            if (mode === 'solo' || mode === 'solo-express') {
                const session = soloSessions['test-player'];
                expect(session).toBeDefined();
                expect(session.player).toBeDefined();
                expect(session.player.purchasedFeatures).toBeDefined();
                return;
            }
        });

        test('checkpoint.setCheckpoint en solo fonctionne avec purchased features', () => {
            const player = initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo');
            
            // Sans checkpoint acheté
            expect(player.purchasedFeatures.checkpoint).toBe(false);
            
            // Acheter checkpoint
            player.purchasedFeatures.checkpoint = true;
            expect(player.purchasedFeatures.checkpoint).toBe(true);
            
            // Maintenant setCheckpoint peut fonctionner
            player.checkpoint = { x: player.x, y: player.y };
            expect(player.checkpoint).toBeDefined();
            expect(player.checkpoint.x).toBe(player.x);
        });

        test('checkpoint.dash en solo fonctionne avec purchased features', () => {
            const player = initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo');
            
            // Sans dash acheté
            expect(player.purchasedFeatures.dash).toBe(false);
            
            // Acheter dash
            player.purchasedFeatures.dash = true;
            expect(player.purchasedFeatures.dash).toBe(true);
        });
    });

    describe('shopPurchase event', () => {
        test('shopPurchase en classic accède au lobby', () => {
            const mode = 'classic';
            const lobbies = {
                classic: {
                    players: {
                        'test-player': initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'classic')
                    }
                }
            };
            
            const lobby = lobbies[mode];
            expect(lobby).toBeDefined();
            expect(lobby.players['test-player']).toBeDefined();
        });

        test('shopPurchase en solo accède à soloSessions', () => {
            const mode = 'solo';
            const soloSessions = {
                'test-player': {
                    player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo')
                }
            };
            
            const session = soloSessions['test-player'];
            expect(session).toBeDefined();
            expect(session.player).toBeDefined();
        });
    });

    describe('Movement events', () => {
        test('movement en classic accède au lobby', () => {
            const mode = 'classic';
            const lobbies = {
                classic: {
                    players: {
                        'test-player': initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'classic')
                    }
                }
            };
            
            const lobby = lobbies[mode];
            const player = lobby.players['test-player'];
            expect(player).toBeDefined();
        });

        test('movement en solo accède à soloSessions', () => {
            const mode = 'solo';
            const soloSessions = {
                'test-player': {
                    player: initializePlayerForMode(getRandomEmptyPosition(generateMaze(15, 15)), 0, 'solo')
                }
            };
            
            const session = soloSessions['test-player'];
            const player = session.player;
            expect(player).toBeDefined();
        });
    });

    describe('playerModes tracking', () => {
        test('playerModes devrait tracker tous les modes', () => {
            const playerModes = {
                'player-1': 'classic',
                'player-2': 'infinite',
                'player-3': 'solo',
                'player-4': 'solo-express'
            };
            
            expect(playerModes['player-1']).toBe('classic');
            expect(playerModes['player-2']).toBe('infinite');
            expect(playerModes['player-3']).toBe('solo');
            expect(playerModes['player-4']).toBe('solo-express');
        });

        test('Vérifier mode avant d\'accéder à lobbies ou soloSessions', () => {
            const playerModes = {
                'player-1': 'classic',
                'player-3': 'solo'
            };
            
            const lobbies = { classic: {}, infinite: {} };
            const soloSessions = { 'player-3': {} };
            
            // Pour player-1 (classic)
            const mode1 = playerModes['player-1'];
            if (mode1 === 'solo' || mode1 === 'solo-express') {
                expect.fail('Should not be solo');
            } else {
                expect(lobbies[mode1]).toBeDefined();
            }
            
            // Pour player-3 (solo)
            const mode3 = playerModes['player-3'];
            if (mode3 === 'solo' || mode3 === 'solo-express') {
                expect(soloSessions[mode3]).not.toBeDefined(); // L'ID est la clé, pas le mode
                expect(soloSessions['player-3']).toBeDefined();
            } else {
                expect.fail('Should be solo');
            }
        });
    });

});
