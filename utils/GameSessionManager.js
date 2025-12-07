// utils/GameSessionManager.js - Gestionnaire unifié des sessions de jeu

const { generateMaze, getRandomEmptyPosition } = require('./map');
const { initializePlayerForMode } = require('./player');
const GameMode = require('./GameMode');

/**
 * Session de jeu unique pour tous les modes
 */
class GameSession {
    constructor(mode, sessionId) {
        this.sessionId = sessionId;
        this.gameMode = new GameMode(mode);
        this.currentLevel = 1;
        this.startTime = Date.now();
        this.levelStartTime = Date.now();
        this.players = {};  // {playerId: player}
        this.map = null;
        this.coin = null;
        this.splitTimes = [];  // Pour speedrun
        this.currentShopLevel = null;  // Niveau où le shop est actif
        this.totalTime = 0;  // Pour solo
        this.isGameFinished = false;

        this.initializeLevel();
    }

    /**
     * Initialise le premier niveau
     */
    initializeLevel() {
        const mazeSize = this.gameMode.getMazeSize(this.currentLevel);
        this.map = generateMaze(mazeSize.width, mazeSize.height);
        this.coin = getRandomEmptyPosition(this.map);
        this.currentShopLevel = null;
    }

    /**
     * Ajoute un joueur à la session
     * @param {string} playerId
     * @param {object} startPos {x, y}
     * @param {number} playerIndex
     */
    addPlayer(playerId, startPos, playerIndex) {
        const player = initializePlayerForMode(startPos, playerIndex, this.gameMode.modeId);
        this.players[playerId] = player;
        this.gameMode.initializePlayerFeatures(player);
        return player;
    }

    /**
     * Récupère un joueur
     * @param {string} playerId
     * @returns {object|null}
     */
    getPlayer(playerId) {
        return this.players[playerId] || null;
    }

    /**
     * Compte les joueurs dans la session
     * @returns {number}
     */
    getPlayerCount() {
        return Object.keys(this.players).length;
    }

    /**
     * Passe au niveau suivant
     */
    nextLevel() {
        this.currentLevel++;
        
        if (this.gameMode.isGameFinished(this.currentLevel)) {
            this.isGameFinished = true;
            this.totalTime = (Date.now() - this.startTime) / 1000;
            return;
        }

        // Générer le nouveau niveau
        const mazeSize = this.gameMode.getMazeSize(this.currentLevel);
        this.map = generateMaze(mazeSize.width, mazeSize.height);
        this.coin = getRandomEmptyPosition(this.map);
        
        // Téléporter tous les joueurs à une position safe
        for (const playerId in this.players) {
            const player = this.players[playerId];
            const safePos = getRandomEmptyPosition(this.map);
            player.x = safePos.x;
            player.y = safePos.y;
            player.checkpoint = null;
            player.trail = [];
        }

        this.levelStartTime = Date.now();
        this.currentShopLevel = null;
    }

    /**
     * Ouvre le shop après un niveau
     */
    openShop() {
        this.currentShopLevel = this.currentLevel;
        this.levelStartTime = Date.now() + this.gameMode.getShopDuration();
    }

    /**
     * Vérifie si le shop est actuellement actif pour ce niveau
     * @returns {boolean}
     */
    isShopActive() {
        return this.currentLevel === this.currentShopLevel;
    }

    /**
     * Enregistre un temps de split (pour speedrun)
     * @param {number} time en secondes
     */
    recordSplitTime(time) {
        this.splitTimes.push(time);
    }

    /**
     * Récupère tous les infos de la session
     * @returns {object}
     */
    getState() {
        return {
            sessionId: this.sessionId,
            modeId: this.gameMode.modeId,
            currentLevel: this.currentLevel,
            maxLevels: this.gameMode.config.maxLevels,
            isGameFinished: this.isGameFinished,
            players: this.players,
            map: this.map,
            coin: this.coin,
            isShopActive: this.isShopActive(),
            splitTimes: this.splitTimes,
            totalTime: this.totalTime,
            elapsedTime: (Date.now() - this.startTime) / 1000
        };
    }
}

/**
 * Gestionnaire global des sessions
 */
class GameSessionManager {
    constructor() {
        this.sessions = {};  // {sessionId: GameSession}
        this.playerSessions = {};  // {playerId: sessionId}
    }

    /**
     * Crée une nouvelle session
     * @param {string} sessionId
     * @param {string} modeId
     * @returns {GameSession}
     */
    createSession(sessionId, modeId) {
        const session = new GameSession(modeId, sessionId);
        this.sessions[sessionId] = session;
        return session;
    }

    /**
     * Récupère une session
     * @param {string} sessionId
     * @returns {GameSession|null}
     */
    getSession(sessionId) {
        return this.sessions[sessionId] || null;
    }

    /**
     * Récupère la session d'un joueur
     * @param {string} playerId
     * @returns {GameSession|null}
     */
    getPlayerSession(playerId) {
        const sessionId = this.playerSessions[playerId];
        return sessionId ? this.sessions[sessionId] : null;
    }

    /**
     * Ajoute un joueur à une session
     * @param {string} playerId
     * @param {string} sessionId
     * @param {object} startPos
     * @param {number} playerIndex
     */
    addPlayerToSession(playerId, sessionId, startPos, playerIndex) {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`Session ${sessionId} non trouvée`);
        
        this.playerSessions[playerId] = sessionId;
        return session.addPlayer(playerId, startPos, playerIndex);
    }

    /**
     * Supprime un joueur d'une session
     * @param {string} playerId
     */
    removePlayer(playerId) {
        const sessionId = this.playerSessions[playerId];
        if (!sessionId) return;

        const session = this.getSession(sessionId);
        if (session) {
            delete session.players[playerId];
        }
        delete this.playerSessions[playerId];
    }

    /**
     * Supprime une session complètement
     * @param {string} sessionId
     */
    deleteSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) return;

        // Supprimer tous les joueurs
        for (const playerId in session.players) {
            delete this.playerSessions[playerId];
        }

        delete this.sessions[sessionId];
    }

    /**
     * Récupère toutes les sessions actives d'un mode
     * @param {string} modeId
     * @returns {array}
     */
    getSessionsByMode(modeId) {
        return Object.values(this.sessions).filter(s => s.gameMode.modeId === modeId);
    }

    /**
     * Compte le nombre de sessions actives
     * @returns {number}
     */
    getSessionCount() {
        return Object.keys(this.sessions).length;
    }

    /**
     * Affiche l'état de tous les sessions
     */
    debugSessions() {
        console.log('=== SESSIONS ACTIVES ===');
        for (const sessionId in this.sessions) {
            const session = this.sessions[sessionId];
            console.log(`[${sessionId}] Mode: ${session.gameMode.modeId}, Niveau: ${session.currentLevel}, Joueurs: ${session.getPlayerCount()}`);
        }
    }
}

module.exports = {
    GameSession,
    GameSessionManager
};
