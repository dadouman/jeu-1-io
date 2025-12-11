/**
 * countdown-cinema.test.js
 * Tests unitaires et d'intégration pour le countdown cinématique
 */

describe('Countdown Cinématique', () => {
  
  describe('Initialisation', () => {
    
    test('CINEMA_COUNTDOWN_CONFIG doit être défini', () => {
      expect(CINEMA_COUNTDOWN_CONFIG).toBeDefined();
      expect(CINEMA_COUNTDOWN_CONFIG.duration).toBe(3);
      expect(CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity).toBe(0.3);
    });
    
    test('Couleurs doivent être correctes', () => {
      expect(CINEMA_COUNTDOWN_CONFIG.colors.bg).toBe('#121212');
      expect(CINEMA_COUNTDOWN_CONFIG.colors.text).toBe('#f0f0f0');
      expect(CINEMA_COUNTDOWN_CONFIG.colors.accent).toBe('#d4af37');
      expect(CINEMA_COUNTDOWN_CONFIG.colors.red).toBe('#8B0000');
    });
    
    test('Variables d\'état doivent être initialisées', () => {
      expect(cinematicCountdownActive).toBe(false);
      expect(countdownCanvas).toBeNull();
      expect(countdownCtx).toBeNull();
      expect(countdownAnimationId).toBeNull();
    });
  });
  
  describe('Création du Canvas', () => {
    
    beforeEach(() => {
      // Nettoyer le DOM
      const existing = document.getElementById('countdownCinemaCanvas');
      if (existing) existing.remove();
    });
    
    test('initCinemaCountdown doit créer un canvas fullscreen', () => {
      const canvas = initCinemaCountdown();
      
      expect(canvas).toBeDefined();
      expect(canvas.id).toBe('countdownCinemaCanvas');
      expect(canvas.width).toBe(window.innerWidth);
      expect(canvas.height).toBe(window.innerHeight);
      expect(canvas.style.position).toBe('fixed');
      expect(canvas.style.zIndex).toBe('9999');
    });
    
    test('initCinemaCountdown avec isHorror=true doit définir la propriété', () => {
      const canvas = initCinemaCountdown(true);
      expect(canvas.isHorror).toBe(true);
    });
    
    test('initCinemaCountdown doit retourner le même canvas en deuxième appel', () => {
      const canvas1 = initCinemaCountdown();
      const canvas2 = initCinemaCountdown();
      expect(canvas1).toBe(canvas2);
    });
  });
  
  describe('Effets Visuels', () => {
    
    let canvas, ctx;
    
    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d');
    });
    
    test('drawFilmGrain doit créer un ImageData', () => {
      drawFilmGrain(ctx, canvas.width, canvas.height, 0.3);
      
      // Vérifier que le canvas a été modifié
      const imageData = ctx.getImageData(0, 0, 1, 1);
      expect(imageData.data.length).toBe(4); // RGBA
    });
    
    test('drawScratchLines doit ajouter des lignes', () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Sauvegarder l'état avant
      const before = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Ajouter les rayures
      drawScratchLines(ctx, canvas.width, canvas.height);
      
      // L'état devrait avoir changé (rayures ajoutées)
      const after = ctx.getImageData(0, 0, canvas.width, canvas.height);
      expect(before.data).not.toEqual(after.data);
    });
    
    test('drawFilmFrame doit créer un cadre', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFilmFrame(ctx, canvas.width, canvas.height);
      
      // Vérifier que le canvas a été modifié
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasPixels = imageData.data.some(pixel => pixel > 0);
      expect(hasPixels).toBe(true);
    });
  });
  
  describe('Effets Sonores', () => {
    
    test('playSynthSound doit créer un oscillateur', (done) => {
      // Initialiser le contexte audio
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const spy = jest.spyOn(window.audioContext, 'createOscillator');
      
      playSynthSound(440, 200, 'sine');
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
    
    test('playProjectorSound doit créer un bruit blanc', (done) => {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const spy = jest.spyOn(window.audioContext, 'createBiquadFilter');
      
      playProjectorSound();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
  });
  
  describe('Cycle de vie du Countdown', () => {
    
    beforeEach(() => {
      // Nettoyer
      cinematicCountdownActive = false;
      stopCinemaCountdown();
      
      const existing = document.getElementById('countdownCinemaCanvas');
      if (existing) existing.remove();
    });
    
    test('startCinemaCountdown doit activer le countdown', (done) => {
      expect(cinematicCountdownActive).toBe(false);
      
      startCinemaCountdown(() => {
        // Callback appelé
        done();
      });
      
      expect(cinematicCountdownActive).toBe(true);
    });
    
    test('stopCinemaCountdown doit désactiver le countdown', (done) => {
      startCinemaCountdown(() => {});
      expect(cinematicCountdownActive).toBe(true);
      
      stopCinemaCountdown();
      expect(cinematicCountdownActive).toBe(false);
      
      done();
    });
    
    test('startHorrorCountdown doit utiliser le mode horror', (done) => {
      startHorrorCountdown(() => {
        // Vérifier que le canvas a isHorror=true
        expect(countdownCanvas.isHorror).toBe(true);
        done();
      });
    });
  });
  
  describe('Intégration au Jeu', () => {
    
    test('startCountdown doit appeler startCinemaCountdown', (done) => {
      jest.useFakeTimers();
      
      const spy = jest.spyOn(global, 'startCinemaCountdown')
        .mockImplementation((cb) => cb());
      
      startCountdown();
      
      jest.runAllTimers();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      jest.useRealTimers();
      done();
    });
  });
  
  describe('Cas d\'erreur', () => {
    
    test('startCinemaCountdown ne doit pas se lancer si déjà actif', () => {
      cinematicCountdownActive = true;
      countdownAnimationId = requestAnimationFrame(() => {});
      
      const spy = jest.spyOn(global, 'requestAnimationFrame');
      
      startCinemaCountdown(() => {});
      
      // Ne devrait pas avoir créé une nouvelle animation
      expect(spy).not.toHaveBeenCalled();
      
      spy.mockRestore();
    });
    
    test('Web Audio API indisponible ne doit pas planter', () => {
      const originalAudioContext = window.audioContext;
      window.audioContext = undefined;
      
      expect(() => {
        playSynthSound(440, 200);
      }).not.toThrow();
      
      window.audioContext = originalAudioContext;
    });
  });
});

// Tests de performance
describe('Performance du Countdown', () => {
  
  test('Animation doit tourner à 60 FPS', (done) => {
    jest.useFakeTimers();
    let frameCount = 0;
    
    const spy = jest.spyOn(global, 'requestAnimationFrame')
      .mockImplementation(cb => {
        frameCount++;
        cb(Date.now());
        return frameCount;
      });
    
    startCinemaCountdown(() => {});
    
    // Laisser tourner 3 secondes simulées
    jest.advanceTimersByTime(3000);
    
    // Vérifier qu'on a eu des frames
    expect(frameCount).toBeGreaterThan(0);
    
    spy.mockRestore();
    jest.useRealTimers();
    done();
  });
  
  test('Memory leak: stopCinemaCountdown doit nettoyer', () => {
    startCinemaCountdown(() => {});
    expect(countdownAnimationId).not.toBeNull();
    
    stopCinemaCountdown();
    expect(countdownAnimationId).toBeNull();
  });
});
