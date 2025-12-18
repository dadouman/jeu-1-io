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
            // Si le shop est actif, récupérer les items pour les envoyer
            let shopItems = {};
            if (session.shopActive) {
                const gameModes = require('../../config/gameModes');
                const soloConfig = gameModes.getGameModeConfig('solo');
                shopItems = soloConfig.shopItems || {};
            }
            session.sendGameState(shopItems);
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
        
        // 1. Ajouter les gems gagnées pour ce niveau
        const { calculateGemsForLevel, addGems } = require('../../utils/gems');
        const gemsEarned = calculateGemsForLevel(currentLevel);
        addGems(session.player, gemsEarned);
        console.log(`💎 [SOLO] +${gemsEarned} gems (total: ${session.player.gems})`);
        
        // 2. Enregistrer le split time
        session.finishLevel();
        
        // 3. Vérifier si le jeu est terminé
        if (session.isGameFinished) {
            this.endGame(session);
            return;
        }
        
        // 4. Vérifier si un shop doit ouvrir (basé sur la configuration de la session)
        let shopItems = {};
        if (session.shouldOpenShop(currentLevel)) {
            session.openShop();
            // Récupérer les items du shop pour envoyer au client
            const gameModes = require('../../config/gameModes');
            const soloConfig = gameModes.getGameModeConfig('solo');
            shopItems = soloConfig.shopItems || [];
        }
        
        // 5. Générer le prochain niveau
        this.generateNextLevel(session);
        
        // 6. Envoyer l'état mis à jour avec les items du shop si ouvert
        session.sendGameState(shopItems);
    }
    
    /**
     * Fermer le shop automatiquement (après 15s)
     */
    closeShopAutomatically(session) {
        session.closeShop();
        this.generateNextLevel(session);
        session.sendGameState();
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
        
        // Placer le joueur sur une position aléatoire et réinitialiser le trail
        const startPos = getRandomEmptyPosition(session.map);
        session.player.x = startPos.x;
        session.player.y = startPos.y;
        session.player.checkpoint = null;
        session.player.trail = [];  // Réinitialiser la rope/trail
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
                error: 'Données de jeu invalides - splits incorrects',
                endType: 'solo'
            });
            
            // Nettoyer la session
            delete this.soloSessions[playerId];
            return;
        }
        
        // ===== SAUVEGARDE MONGODB (AVEC RETRY) =====
        const MAX_RETRIES = 3;
        let retryCount = 0;
        let saved = false;
        
        while (retryCount < MAX_RETRIES && !saved) {
            try {
                // Vérifier si les modèles sont disponibles
                if (!this.SoloRunModel || !this.SoloBestSplitsModel) {
                    console.warn(`⚠️ [SOLO] Modèles MongoDB non disponibles, sauvegarde skippée`);
                    session.socket.emit('gameFinished', {
                        finalLevel: session.currentLevel - 1,
                        totalTime,
                        gems: player.gems,
                        splits: splitTimes,
                        splitTimes: splitTimes,
                        saved: false,
                        warning: 'Modèles non disponibles',
                        endType: 'solo'
                    });
                    delete this.soloSessions[playerId];
                    return;
                }
                
                // === CRÉER LE DOCUMENT DE RUN ===
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
                
                // === SAUVEGARDER ===
                await soloRun.save();
                console.log(`💾 [SOLO] Run sauvegardée: ${totalTime.toFixed(2)}s (tentative ${retryCount + 1})`);
                
                // === METTRE À JOUR LES MEILLEURS SPLITS ===
                for (let i = 0; i < splitTimes.length; i++) {
                    const level = i + 1;
                    const splitTime = splitTimes[i];
                    
                    try {
                        await this.SoloBestSplitsModel.updateOne(
                            { level },
                            { 
                                bestSplitTime: splitTime, 
                                playerSkin: player.skin,
                                updatedAt: new Date()
                            },
                            { upsert: true }
                        );
                    } catch (splitErr) {
                        console.warn(`⚠️ [SOLO] Erreur mise à jour split level ${level}: ${splitErr.message}`);
                        // Continue even if split update fails
                    }
                }
                
                console.log(`✅ [SOLO] Données sauvegardées avec succès`);
                
                // Notifier le client
                session.socket.emit('gameFinished', {
                    finalLevel: session.currentLevel - 1,
                    totalTime,
                    gems: player.gems,
                    splits: splitTimes,
                    splitTimes: splitTimes,
                    saved: true,
                    endType: 'solo'
                });
                
                saved = true;
                
            } catch (err) {
                retryCount++;
                console.error(`❌ [SOLO] Erreur sauvegarde (tentative ${retryCount}/${MAX_RETRIES}): ${err.message}`);
                
                // Si dernière tentative échouée
                if (retryCount >= MAX_RETRIES) {
                    console.error(`❌ [SOLO] Sauvegarde échouée après ${MAX_RETRIES} tentatives`);
                    session.socket.emit('gameFinished', { 
                        error: 'Erreur sauvegarde MongoDB',
                        finalLevel: session.currentLevel - 1,
                        totalTime,
                        gems: player.gems,
                        splits: splitTimes,
                        splitTimes: splitTimes,
                        saved: false,
                        endType: 'solo'
                    });
                } else {
                    // Attendre avant de réessayer (200ms * tentative)
                    await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
                }
            }
        }
        
        // ===== NETTOYER LA SESSION =====
        delete this.soloSessions[playerId];
    }
}

module.exports = SoloGameLoop;
