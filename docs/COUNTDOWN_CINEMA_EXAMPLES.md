/**
 * COUNTDOWN_CINEMA_EXAMPLES.js
 * Exemples d'utilisation du système de compte à rebours cinématique
 * 
 * Ce fichier montre les différentes façons d'intégrer et de personnaliser
 * le countdown cinématique dans votre jeu.
 */

// =====================================================
// EXEMPLE 1: Utilisation basique (déjà intégré)
// =====================================================

/**
 * Le countdown s'active automatiquement au démarrage du mode solo.
 * Aucune action requise de votre part!
 * 
 * C'est géré dans game-state.js:
 * function startCountdown() {
 *     startCinemaCountdown(callback, currentGameMode);
 * }
 */

// =====================================================
// EXEMPLE 2: Lancer le countdown manuellement
// =====================================================

function launchCountdownManually() {
  // Cas 1: Mode normal (blanc)
  startCinemaCountdown(() => {
    console.log('✅ Jeu lancé en mode normal!');
    // Votre code d'initialisation ici
  }, 'normal');
  
  // Cas 2: Mode Horror/Speedrun (rouge)
  // startCinemaCountdown(() => {
  //     console.log('✅ Jeu lancé en mode horror!');
  // }, 'speedrun');
}

// =====================================================
// EXEMPLE 3: Mode Horror avec musique dramatique
// =====================================================

function startHorrorGameWithMusic() {
  startCinemaCountdown(() => {
    // À la fin du countdown, jouer la musique d'ambiance horror
    if (window.horrorAmbiance) {
      window.horrorAmbiance.play();
    }
    
    // Changer la couleur du HUD en rouge
    document.querySelectorAll('.timer').forEach(timer => {
      timer.style.color = '#FF0000';
      timer.style.textShadow = '0 0 10px #FF0000';
    });
    
    console.log('🎬 Ambiance horror activée!');
  }, 'speedrun');
}

// =====================================================
// EXEMPLE 4: Personnaliser les couleurs
// =====================================================

function customizeCountdownColors() {
  // Avant de lancer le countdown, modifier la config
  CINEMA_COUNTDOWN_CONFIG.colors.text = '#00FF00';      // Vert fluo
  CINEMA_COUNTDOWN_CONFIG.colors.bg = '#001100';        // Fond vert foncé
  CINEMA_COUNTDOWN_CONFIG.colors.accent = '#00FF00';    // Accent vert
  
  startCinemaCountdown(() => {
    console.log('✅ Countdown avec couleurs personnalisées!');
  });
  
  // Restaurer les couleurs par défaut après
  // (Vous pouvez aussi créer une nouvelle config locale)
}

// =====================================================
// EXEMPLE 5: Utiliser une durée différente
// =====================================================

function longerCountdown() {
  // Sauvegarder la durée originale
  const originalDuration = CINEMA_COUNTDOWN_CONFIG.duration;
  
  // Modifier la durée
  CINEMA_COUNTDOWN_CONFIG.duration = 5; // 5 secondes
  
  startCinemaCountdown(() => {
    console.log('✅ Countdown de 5 secondes terminé!');
    
    // Restaurer la durée originale
    CINEMA_COUNTDOWN_CONFIG.duration = originalDuration;
  });
}

// =====================================================
// EXEMPLE 6: Configuration locale personnalisée
// =====================================================

function customCountdownConfig() {
  // Créer une copie de la config par défaut
  const customConfig = JSON.parse(JSON.stringify(CINEMA_COUNTDOWN_CONFIG));
  
  // Personnaliser
  customConfig.filmGrainIntensity = 0.5;  // Plus de grain
  customConfig.flickerFrequency = 0.4;    // Plus de flicker
  customConfig.colors.red = '#FF6B6B';    // Rouge plus vif
  
  // Appliquer temporairement
  const backup = JSON.parse(JSON.stringify(CINEMA_COUNTDOWN_CONFIG));
  Object.assign(CINEMA_COUNTDOWN_CONFIG, customConfig);
  
  startCinemaCountdown(() => {
    // Restaurer la config originale
    Object.assign(CINEMA_COUNTDOWN_CONFIG, backup);
    console.log('✅ Countdown personnalisé terminé!');
  });
}

// =====================================================
// EXEMPLE 7: Arrêter le countdown prématurément
// =====================================================

function abortCountdown() {
  // Lancer le countdown
  startCinemaCountdown(() => {
    console.log('✅ Countdown normal');
  });
  
  // Arrêter après 1 seconde (ex: joueur appuie sur Échap)
  setTimeout(() => {
    if (cinematicCountdownActive) {
      stopCinemaCountdown();
      console.log('❌ Countdown arrêté!');
      
      // Retourner au menu
      location.reload();
    }
  }, 1000);
}

// =====================================================
// EXEMPLE 8: Callback avancé avec état du jeu
// =====================================================

function advancedCountdownCallback() {
  startCinemaCountdown(() => {
    // Initialiser l'état du jeu
    initGameState();
    
    // Mettre à jour le HUD
    updateHUD();
    
    // Déverrouiller les inputs
    inputsBlocked = false;
    
    // Déclencher l'événement personnalisé
    const event = new CustomEvent('gameStarted', {
      detail: { mode: currentGameMode, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
    
    console.log('🎮 Jeu complètement initialisé!');
  }, currentGameMode);
}

// =====================================================
// EXEMPLE 9: Événement personnalisé "gameStarted"
// =====================================================

// Écouter l'événement
window.addEventListener('gameStarted', (event) => {
  console.log('Mode de jeu:', event.detail.mode);
  console.log('Timestamp:', event.detail.timestamp);
  
  // Déclencher des actions basées sur le mode
  if (event.detail.mode === 'solo') {
    startSoloTimer();
    activateSoloHUD();
  } else if (event.detail.mode === 'classic') {
    startMultiplayerLogic();
  }
});

// =====================================================
// EXEMPLE 10: Vérifier l'état du countdown
// =====================================================

function checkCountdownStatus() {
  console.log('État du countdown:');
  console.log('  Actif?', cinematicCountdownActive);
  console.log('  Canvas existe?', countdownCanvas !== null);
  console.log('  Contexte 2D existe?', countdownCtx !== null);
  console.log('  Animation ID:', countdownAnimationId);
  
  // Vérifier le Web Audio API
  console.log('  Web Audio Context:', window.audioContext);
}

// =====================================================
// EXEMPLE 11: Gérer les cas d'erreur
// =====================================================

function safeCountdownStart() {
  try {
    // Vérifier que le countdown n'est pas déjà actif
    if (cinematicCountdownActive) {
      console.warn('⚠️ Un countdown est déjà en cours');
      return;
    }
    
    // Vérifier que le canvas peut être créé
    if (!document.body) {
      console.error('❌ DOM non chargé');
      return;
    }
    
    // Lancer le countdown avec gestion d'erreur
    startCinemaCountdown(() => {
      console.log('✅ Countdown lancé avec succès');
    }, currentGameMode);
    
  } catch (error) {
    console.error('❌ Erreur lors du lancement du countdown:', error);
    
    // Fallback: lancer le jeu directement sans countdown
    console.log('Fallback: Jeu lancé sans countdown cinématique');
    // Votre code de secours ici
  }
}

// =====================================================
// EXEMPLE 12: Intégration avec le mode pause
// =====================================================

let isPaused = false;
let pauseStartTime = null;

function pauseGame() {
  if (cinematicCountdownActive) {
    // Arrêter le countdown si en cours
    stopCinemaCountdown();
  }
  
  isPaused = true;
  pauseStartTime = Date.now();
  inputsBlocked = true;
  
  console.log('⏸️ Jeu en pause');
}

function resumeGame() {
  if (isPaused) {
    const pauseDuration = Date.now() - pauseStartTime;
    
    // Compenser le temps de pause dans le timer
    if (currentGameMode === 'solo') {
      soloInactiveTime += pauseDuration;
    }
    
    isPaused = false;
    inputsBlocked = false;
    
    console.log('▶️ Jeu repris (pause: ' + pauseDuration + 'ms)');
  }
}

// =====================================================
// EXEMPLE 13: Debug - Visualiser les timings
// =====================================================

function debugCountdownTiming() {
  console.log('🐛 DEBUG: Timings du Countdown Cinématique');
  console.log('Durée config:', CINEMA_COUNTDOWN_CONFIG.duration, 'secondes');
  console.log('Intensité grain:', CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity);
  console.log('Fréq. flicker:', CINEMA_COUNTDOWN_CONFIG.flickerFrequency);
  console.log('Fréq. rayures:', CINEMA_COUNTDOWN_CONFIG.scratchLines ? 'activée' : 'désactivée');
  
  // Mesurer le temps réel d'exécution
  const startTime = performance.now();
  startCinemaCountdown(() => {
    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log('Durée réelle du countdown:', totalTime.toFixed(2), 'secondes');
  });
}

// =====================================================
// EXEMPLE 14: Thème "Expressionnisme Allemand"
// =====================================================

function expressionistCountdown() {
  // Personnaliser pour un style expressionniste (angles, ombres sombres)
  CINEMA_COUNTDOWN_CONFIG.colors.bg = '#0a0a0a';        // Noir très profond
  CINEMA_COUNTDOWN_CONFIG.colors.text = '#f5f5f5';      // Blanc pur
  CINEMA_COUNTDOWN_CONFIG.colors.red = '#660000';       // Marron foncé
  CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity = 0.6;     // Plus d'artefacts
  CINEMA_COUNTDOWN_CONFIG.flickerFrequency = 0.35;      // Plus de flicker
  
  startCinemaCountdown(() => {
    console.log('🌑 Ambiance expressionniste activée');
  });
}

// =====================================================
// EXEMPLE 15: Variant "Sépia Chaleureux"
// =====================================================

function sepiaCountdown() {
  // Utiliser des teintes sépia pour un style chaleureux
  CINEMA_COUNTDOWN_CONFIG.colors.bg = '#2a2520';        // Sépia très sombre
  CINEMA_COUNTDOWN_CONFIG.colors.text = '#e8d4c4';      // Beige chaud
  CINEMA_COUNTDOWN_CONFIG.colors.accent = '#a68070';    // Marron sépia
  CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity = 0.25;    // Subtil
  
  startCinemaCountdown(() => {
    console.log('🟤 Ambiance sépia activée');
  });
}

// =====================================================
// EXEMPLE 16: Utilisation avec Analytics
// =====================================================

function countdownWithAnalytics() {
  const countdownStartTime = Date.now();
  
  startCinemaCountdown(() => {
    const countdownDuration = Date.now() - countdownStartTime;
    
    // Envoyer les données à votre système d'analytics
    if (window.analytics) {
      window.analytics.track('countdown_completed', {
        duration: countdownDuration,
        gameMode: currentGameMode,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('📊 Analytics: Countdown de ' + countdownDuration + 'ms');
  });
}

// =====================================================
// Résumé des fonctions disponibles
// =====================================================

/**
 * FONCTIONS PUBLIQUES DU SYSTEM:
 * 
 * 1. startCinemaCountdown(callback, gameMode)
 *    Lance le countdown cinématique
 *    @param callback - Function appelée à la fin
 *    @param gameMode - 'normal' ou 'speedrun'
 * 
 * 2. stopCinemaCountdown()
 *    Arrête et masque le countdown
 * 
 * 3. startHorrorCountdown(callback)
 *    Alias pour startCinemaCountdown(callback, 'speedrun')
 * 
 * 4. initCinemaCountdown(isHorror)
 *    Initialise le canvas du countdown
 * 
 * 5. playSynthSound(frequency, duration, type)
 *    Joue un son synthétisé
 * 
 * 6. playProjectorSound()
 *    Joue le bruit de projecteur
 * 
 * VARIABLES D'ÉTAT:
 * 
 * - cinematicCountdownActive (boolean)
 * - countdownCanvas (HTMLCanvasElement)
 * - countdownCtx (CanvasRenderingContext2D)
 * - countdownAnimationId (number)
 * 
 * CONFIGURATION:
 * 
 * - CINEMA_COUNTDOWN_CONFIG (object)
 *   Modifiable pour personnaliser l'apparence et le comportement
 */
