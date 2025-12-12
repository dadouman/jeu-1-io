/**
 * SoloGameLoop - Boucle de jeu pour le mode solo
 * S'exécute à chaque tick (60fps)
 */

const PlayerActions = require('../../utils/PlayerActions');
const { generateMaze, getRandomEmptyPosition } = require('../../utils/map');
const { calculateMazeSize } = require('../utils');
const { initializePlayerForMode } = require('../../utils/player');

class SoloGameLoop {
    constructor(soloSessions, io, { SoloRunModel, SoloBestSplitsModel } = {}) {
        this.soloSessions = soloSessions;
        this.io = io;
        this.SoloRunModel = SoloRunModel;
        this.SoloBestSplitsModel = SoloBestSplitsModel;
    }
    
    /**
     * Traiter une itération de la boucle
     * À appeler à chaque tick (~16ms pour 60fps)
     */
    process() {
        for (const [playerId, session] of Object.entries(this.soloSessions)) {
            // Session valide?
            if (!session || !session.socket || !session.socket.connected) {
                delete this.soloSessions[playerId];
                continue;
            }
            
            // ===== VÉRIFIER COLLISION AVEC PIÈCE =====
            if (this.shouldCheckCollision(session)) {
                if (PlayerActions.checkCoinCollision(session.player, session.coin)) {
                    this.handleCoinCollision(session);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT COUNTDOWN =====
            if (session.countdownActive) {
                if (session.getCountdownElapsed() >= session.countdownDuration) {
                    session.countdownActive = false;
                    console.log(`✅ [SOLO] Countdown terminé pour ${session.playerId}`);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT SHOP =====
            if (session.shopActive) {
                if (session.getShopElapsed() >= session.shopDuration) {
                    this.closeShopAutomatically(session);
                }
            }
            
            // ===== VÉRIFIER TIMEOUT TRANSITION =====
            if (session.inTransition) {
                if (session.getTransitionElapsed() >= session.transitionDuration) {
                    session.endTransition();
                    console.log(`✅ [SOLO] Transition terminée pour ${session.playerId}`);
                }
            }
            
            // ===== ENVOYER L'ÉTAT =====
            session.sendGameState();
        }
    }
    
    /**
     * Vérifier si on doit checker collision
     * (pas pendant countdown, pas pendant shop, pas en transition)
     */
    shouldCheckCollision(session) {
        return !session.countdownActive && 
               !session.shopActive && 
               !session.inTransition;
    }
    
    /**
     * Gérer collision avec la pièce
     */
    handleCoinCollision(session) {
        const currentLevel = session.currentLevel;
        console.log(`✅ [SOLO] ${session.player.skin} a complété le niveau ${currentLevel}`);
        
        // 1. Enregistrer le split time
        session.finishLevel();
        
        // 2. Vérifier si le jeu est terminé
        if (session.isGameFinished) {
            this.endGame(session);
            return;
        }
        
        // 3. Vérifier si un shop doit ouvrir
        if (this.isShopLevel(session.currentLevel)) {
            session.openShop();
            console.log(`🏪 [SOLO] Shop s'ouvrira après le niveau ${session.currentLevel - 1}`);
        }
        
        // 4. Générer le prochain niveau
        this.generateNextLevel(session);
        
        // 5. Envoyer l'état mis à jour
        session.sendGameState();
    }
    
    /**
     * Déterminer si un level doit avoir un shop après
     * Par exemple: après level 5, 10, 15, 20
     */
    isShopLevel(level) {
        return level % 5 === 0 && level < 10;
    }
    
    /**
     * Fermer le shop automatiquement (après 15s)
     */
    closeShopAutomatically(session) {
        session.closeShop();
        this.generateNextLevel(session);
        session.sendGameState();
        
        console.log(`✅ [SOLO] Shop fermé automatiquement pour ${session.playerId}`);
    }
    
    /**
     * Générer le prochain niveau
     * Crée une nouvelle map et une nouvelle pièce
     */
    generateNextLevel(session) {
        // Générer la map selon le niveau
        const { width, height } = calculateMazeSize(session.currentLevel, 'solo');
        session.map = generateMaze(width, height);
        session.coin = getRandomEmptyPosition(session.map);
        
        // Placer le joueur sur une position aléatoire
        const startPos = getRandomEmptyPosition(session.map);
        session.player.x = startPos.x;
        session.player.y = startPos.y;
    }
    
    /**
     * Terminer la partie
     * Sauvegarder les données en MongoDB
     */
    async endGame(session) {
        const { playerId, player, totalTime, splitTimes } = session;
        
        // ===== VALIDATION =====
        if (!session.validateSplits(splitTimes)) {
            console.error(`❌ [SOLO] Splits invalides pour ${playerId}, sauvegarde refusée`);
            session.socket.emit('gameFinished', {
                error: 'Données de jeu invalides'
            });
            
            // Nettoyer la session
            delete this.soloSessions[playerId];
            return;
        }
        
        // ===== SAUVEGARDE MONGODB =====
        try {
            // Vérifier si les modèles sont disponibles
            if (!this.SoloRunModel || !this.SoloBestSplitsModel) {
                console.warn(`⚠️ [SOLO] Modèles MongoDB non disponibles, sauvegarde skippée`);
                session.socket.emit('gameFinished', {
                    finalLevel: session.currentLevel - 1,
                    totalTime,
                    gems: player.gems,
                    splits: splitTimes,
                    saved: false
                });
                delete this.soloSessions[playerId];
                return;
            }
            
            // Créer le document de run
            const soloRun = new this.SoloRunModel({
                playerId,
                playerSkin: player.skin,
                mode: 'solo',
                totalTime,
                splitTimes,
                finalLevel: session.currentLevel - 1,
                personalBestTime: totalTime,
                createdAt: new Date()
            });
            
            await soloRun.save();
            console.log(`💾 [SOLO] Run sauvegardée: ${totalTime.toFixed(2)}s`);
            
            // Mettre à jour les meilleurs splits
            for (let i = 0; i < splitTimes.length; i++) {
                const level = i + 1;
                const splitTime = splitTimes[i];
                
                await this.SoloBestSplitsModel.updateOne(
                    { level },
                    { 
                        bestSplitTime: splitTime, 
                        playerSkin: player.skin,
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );
            }
            
            console.log(`✅ [SOLO] Données sauvegardées avec succès`);
            
            // Notifier le client
            session.socket.emit('gameFinished', {
                finalLevel: session.currentLevel - 1,
                totalTime,
                gems: player.gems,
                splits: splitTimes,
                saved: true
            });
            
        } catch (err) {
            console.error(`❌ [SOLO] Erreur sauvegarde MongoDB:`, err);
            session.socket.emit('gameFinished', { 
                error: 'Erreur sauvegarde: ' + err.message 
            });
        }
        
        // ===== NETTOYER LA SESSION =====
        delete this.soloSessions[playerId];
    }
}

module.exports = SoloGameLoop;
