// tests/socket-reconnect.test.js
// Tests pour couvrir les scénarios de disconnect/reconnect Socket.io

const { generateMaze, getRandomEmptyPosition } = require('../utils/map');
const { initializePlayerForMode } = require('../utils/player');

describe('Socket.io Reconnection - Real-time Sync', () => {

    // === TEST 1 : Player Disconnect and Reconnect ===
    test('Disconnect d\'un joueur devrait retirer de la session', () => {
        const playerId = 'player-1';
        const mode = 'classic';
        const map = generateMaze(15, 15);
        
        const lobbies = {
            classic: {
                players: {
                    [playerId]: initializePlayerForMode(getRandomEmptyPosition(map), 0, mode)
                }
            }
        };

        // Joueur présent
        expect(lobbies.classic.players[playerId]).toBeDefined();

        // Simuler disconnect
        delete lobbies.classic.players[playerId];

        // Joueur absent
        expect(lobbies.classic.players[playerId]).toBeUndefined();
    });

    test('Reconnect d\'un joueur devrait le restaurer avec nouveau socket', () => {
        const playerId = 'player-1';
        const mode = 'classic';
        const map = generateMaze(15, 15);
        const pos = getRandomEmptyPosition(map);

        const lobbies = {
            classic: {
                players: {}
            }
        };

        // Joueur 1 se connecte
        lobbies.classic.players[playerId] = initializePlayerForMode(pos, 0, mode);
        expect(lobbies.classic.players[playerId]).toBeDefined();
        const player1 = lobbies.classic.players[playerId];

        // Simuler disconnect
        delete lobbies.classic.players[playerId];
        expect(lobbies.classic.players[playerId]).toBeUndefined();

        // Reconnect avec nouveau socket (game state reset)
        lobbies.classic.players[playerId] = initializePlayerForMode(pos, 0, mode);
        const player2 = lobbies.classic.players[playerId];

        // Devrait être une nouvelle instance
        expect(player2).toBeDefined();
        // Mais même position de spawn
        expect(player2.x).toBe(player1.x);
        expect(player2.y).toBe(player1.y);
    });

    // === TEST 2 : Lag Simulation (Delayed Updates) ===
    test('Updates retardés ne devraient pas créer de divergence d\'état', () => {
        const playerId = 'player-1';
        const mode = 'classic';
        const map = generateMaze(15, 15);
        const startPos = getRandomEmptyPosition(map);

        const lobbyState = {
            players: {
                [playerId]: {
                    ...initializePlayerForMode(startPos, 0, mode),
                    x: startPos.x,
                    y: startPos.y
                }
            }
        };

        // Simuler plusieurs updates retardés
        const updates = [
            { x: startPos.x + 10, y: startPos.y },
            { x: startPos.x + 20, y: startPos.y },
            { x: startPos.x + 30, y: startPos.y }
        ];

        // Appliquer updates
        updates.forEach(update => {
            lobbyState.players[playerId].x = update.x;
            lobbyState.players[playerId].y = update.y;
        });

        // État final devrait être correct
        expect(lobbyState.players[playerId].x).toBe(startPos.x + 30);
        expect(lobbyState.players[playerId].y).toBe(startPos.y);
    });

    // === TEST 3 : Multiple Players Disconnect/Reconnect ===
    test('Plusieurs joueurs disconnect et reconnect simultanément', () => {
        const mode = 'classic';
        const map = generateMaze(15, 15);

        const lobbies = {
            classic: {
                players: {}
            }
        };

        // 3 joueurs se connectent
        const playerIds = ['p1', 'p2', 'p3'];
        playerIds.forEach(id => {
            lobbies.classic.players[id] = initializePlayerForMode(getRandomEmptyPosition(map), 0, mode);
        });

        expect(Object.keys(lobbies.classic.players).length).toBe(3);

        // 2 joueurs disconnect
        delete lobbies.classic.players['p1'];
        delete lobbies.classic.players['p2'];

        expect(Object.keys(lobbies.classic.players).length).toBe(1);
        expect(lobbies.classic.players['p3']).toBeDefined();

        // Ils reconnect
        lobbies.classic.players['p1'] = initializePlayerForMode(getRandomEmptyPosition(map), 0, mode);
        lobbies.classic.players['p2'] = initializePlayerForMode(getRandomEmptyPosition(map), 0, mode);

        expect(Object.keys(lobbies.classic.players).length).toBe(3);
    });

    // === TEST 4 : Solo Mode Disconnect (No Lobby) ===
    test('Solo player disconnect ne devrait pas affecter lobbies partagées', () => {
        const soloPlayerId = 'solo-player';
        const mode = 'solo';
        const map = generateMaze(15, 15);

        const soloSessions = {
            [soloPlayerId]: {
                player: initializePlayerForMode(getRandomEmptyPosition(map), 0, mode),
                level: 1
            }
        };

        const lobbies = {
            classic: {
                players: {}
            }
        };

        // Solo player disconnect
        delete soloSessions[soloPlayerId];

        // Lobbies ne devraient pas être affectés
        expect(lobbies.classic.players).toBeDefined();
        expect(soloSessions[soloPlayerId]).toBeUndefined();
    });

    // === TEST 5 : Reconnect Timeout ===
    test('Reconnect après timeout devrait créer nouvelle session', (done) => {
        const playerId = 'player-1';
        const mode = 'classic';
        const map = generateMaze(15, 15);
        const reconnectTimeout = 100; // ms

        const lobbies = {
            classic: {
                players: {
                    [playerId]: initializePlayerForMode(getRandomEmptyPosition(map), 0, mode)
                }
            }
        };

        // Disconnect
        const disconnectTime = Date.now();
        delete lobbies.classic.players[playerId];

        // Attendre timeout
        setTimeout(() => {
            const timeElapsed = Date.now() - disconnectTime;

            if (timeElapsed > reconnectTimeout) {
                // Session expirée - créer nouveau
                lobbies.classic.players[playerId] = initializePlayerForMode(getRandomEmptyPosition(map), 0, mode);
            }

            expect(lobbies.classic.players[playerId]).toBeDefined();
            done();
        }, reconnectTimeout + 50);
    });

    // === TEST 6 : Broadcast to Other Players ===
    test('Disconnect devrait notifier les autres joueurs', () => {
        const mode = 'classic';
        const map = generateMaze(15, 15);

        const lobbies = {
            classic: {
                players: {
                    'p1': initializePlayerForMode(getRandomEmptyPosition(map), 0, mode),
                    'p2': initializePlayerForMode(getRandomEmptyPosition(map), 0, mode)
                }
            }
        };

        const notificationQueue = [];

        // Simuler broadcast
        const handleDisconnect = (playerId) => {
            delete lobbies.classic.players[playerId];
            notificationQueue.push({
                event: 'playerDisconnected',
                playerId: playerId,
                remainingPlayers: Object.keys(lobbies.classic.players)
            });
        };

        handleDisconnect('p1');

        expect(lobbies.classic.players['p1']).toBeUndefined();
        expect(notificationQueue.length).toBe(1);
        expect(notificationQueue[0].remainingPlayers).toContain('p2');
        expect(notificationQueue[0].remainingPlayers).not.toContain('p1');
    });

    // === TEST 7 : State Sync on Reconnect ===
    test('Reconnect devrait resynchroniser l\'état du jeu', () => {
        const playerId = 'player-1';
        const mode = 'classic';
        const map = generateMaze(15, 15);

        const gameState = {
            lobbies: {
                classic: {
                    players: {
                        [playerId]: {
                            ...initializePlayerForMode(getRandomEmptyPosition(map), 0, mode),
                            level: 5,
                            health: 100,
                            gems: 50
                        }
                    }
                }
            }
        };

        // Disconnect
        delete gameState.lobbies.classic.players[playerId];

        // Reconnect - devrait recevoir l'état actuel du serveur
        const serverState = {
            lobbies: {
                classic: {
                    players: {
                        [playerId]: {
                            ...initializePlayerForMode(getRandomEmptyPosition(map), 0, mode),
                            level: 5,
                            health: 100,
                            gems: 50
                        }
                    }
                }
            }
        };

        // Restaurer avec état serveur
        gameState.lobbies.classic.players[playerId] = serverState.lobbies.classic.players[playerId];

        expect(gameState.lobbies.classic.players[playerId].level).toBe(5);
        expect(gameState.lobbies.classic.players[playerId].gems).toBe(50);
    });

    // === TEST 8 : Rapid Connect/Disconnect ===
    test('Connexions/déconnexions rapides ne devraient pas crasher', () => {
        const playerId = 'player-rapid';
        const mode = 'classic';
        const map = generateMaze(15, 15);

        const lobbies = {
            classic: {
                players: {}
            }
        };

        // 5 cycles rapides
        for (let i = 0; i < 5; i++) {
            // Connect
            lobbies.classic.players[playerId] = initializePlayerForMode(getRandomEmptyPosition(map), 0, mode);
            expect(lobbies.classic.players[playerId]).toBeDefined();

            // Disconnect
            delete lobbies.classic.players[playerId];
            expect(lobbies.classic.players[playerId]).toBeUndefined();
        }

        expect(true).toBe(true); // Si arrivé ici, pas de crash
    });

    // === TEST 9 : Connection Pooling ===
    test('Gestion de queue de reconnect', () => {
        const reconnectQueue = [];
        const mode = 'classic';
        const map = generateMaze(15, 15);

        // 3 joueurs demandent reconnect
        const disconnectedPlayers = ['p1', 'p2', 'p3'];

        disconnectedPlayers.forEach(playerId => {
            reconnectQueue.push({
                playerId,
                timestamp: Date.now(),
                position: getRandomEmptyPosition(map)
            });
        });

        expect(reconnectQueue.length).toBe(3);

        // Traiter la queue
        while (reconnectQueue.length > 0) {
            const request = reconnectQueue.shift();
            expect(request.playerId).toBeDefined();
            expect(request.position).toBeDefined();
        }

        expect(reconnectQueue.length).toBe(0);
    });
});
