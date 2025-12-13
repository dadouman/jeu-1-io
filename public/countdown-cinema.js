/**
 * countdown-cinema.js
 * Compte à rebours stylisé "Cinéma Muet / Noir et Blanc"
 * Animation et SFX pour mode solo speedrun
 * 
 * AMÉLIORATIONS:
 * - Durée réduite à ~2 secondes
 * - Le jeu s'affiche progressivement par transparence
 * - Vignettage circulaire (cercle de vision du joueur)
 */

const CINEMA_COUNTDOWN_CONFIG = {
  duration: 2, // 2 secondes au lieu de 3
  filmGrainIntensity: 0.3,
  scratchLines: true,
  flickerFrequency: 0.2,
  font: "'Bebas Neue', 'Arial Black', sans-serif",
  
  colors: {
    bg: "#121212",
    text: "#f0f0f0",
    accent: "#d4af37",
    red: "#8B0000"
  },
  
  generateSounds: true
};

let cinematicCountdownActive = false;
let countdownCanvas = null;
let countdownCtx = null;
let countdownAnimationId = null;

function initCinemaCountdown(isHorror = false) {
  let canvas = document.getElementById('countdownCinemaCanvas');
  
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'countdownCinemaCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '9999';
    canvas.style.cursor = 'none';
    document.body.appendChild(canvas);
  }
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  countdownCanvas = canvas;
  countdownCtx = canvas.getContext('2d', { alpha: true });
  countdownCanvas.isHorror = isHorror;
  
  return canvas;
}

/**
 * Dessine le grain filmique sur le canvas
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width 
 * @param {number} height 
 * @param {number} intensity 
 */
function drawFilmGrain(ctx, width, height, intensity) {
  // Arrondir les dimensions et s'assurer qu'elles sont valides
  const w = Math.max(1, Math.floor(width) || 1);
  const h = Math.max(1, Math.floor(height) || 1);
  
  // Vérifier que les valeurs sont des nombres valides
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return; // Ne pas dessiner si les dimensions sont invalides
  }
  
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const grain = Math.random() * intensity * 255;
    data[i] = grain;       // R
    data[i + 1] = grain;   // G
    data[i + 2] = grain;   // B
    data[i + 3] = 255;     // Alpha (opaque)
  }
  
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Dessine des rayures de pellicule
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width 
 * @param {number} height 
 */
function drawScratchLines(ctx, width, height) {
  // Rayures verticales aléatoires
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, 0);
    ctx.lineTo(Math.random() * width, height);
    ctx.stroke();
  }
  
  // Rayures horizontales (pellicule abîmée)
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.15})`;
    ctx.lineWidth = Math.random() * 3 + 2;
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * height);
    ctx.lineTo(width, Math.random() * height);
    ctx.stroke();
  }
}

/**
 * Dessine le cadre de film avec perforations
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width 
 * @param {number} height 
 */
function drawFilmFrame(ctx, width, height) {
  // Bordure extérieure
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 25;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  
  // Perforations gauche
  const perfSize = 12;
  const perfSpacing = 40;
  ctx.fillStyle = "#0a0a0a";
  for (let y = 50; y < height - 50; y += perfSpacing) {
    ctx.fillRect(5, y, perfSize, perfSize);
  }
  
  // Perforations droite
  for (let y = 50; y < height - 50; y += perfSpacing) {
    ctx.fillRect(width - perfSize - 5, y, perfSize, perfSize);
  }
  
  // Dégradé vignette (bords assombris)
  const gradient = ctx.createRadialGradient(width / 2, height / 2, width / 4, width / 2, height / 2, width);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Dessine un vignettage circulaire (cercle de vision du joueur)
 */
function drawCircularVignette(ctx, width, height, opacity) {
  ctx.save();
  
  // Créer un dégradé circulaire depuis le centre
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2.5;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius * 1.2);
  gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
  gradient.addColorStop(0.7, `rgba(0, 0, 0, ${0.3 * opacity})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${0.8 * opacity})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}

/**
 * Joue un son synthétisé (oscillateur simple)
 * @param {number} frequency - Fréquence en Hz
 * @param {number} duration - Durée en ms
 * @param {string} type - 'sine', 'square', 'sawtooth', 'triangle'
 */
function playSynthSound(frequency = 440, duration = 200, type = 'sine') {
  if (!window.audioContext) {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API non disponible');
      return;
    }
  }
  
  const ctx = window.audioContext;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = frequency;
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + duration / 1000);
}

/**
 * Joue le son de projecteur (bruit blanc filtré)
 */
function playProjectorSound() {
  if (!window.audioContext) {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
  }
  
  const ctx = window.audioContext;
  const now = ctx.currentTime;
  
  // Bruit blanc
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  
  // Filtre passe-bas pour effet "vieux projecteur"
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  
  // Gain avec fade
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(now);
  noise.stop(now + 0.5);
}

/**
 * Lance le countdown cinématique
 * @param {Function} callback - Fonction appelée quand le countdown est terminé
 * @param {string} gameMode - 'speedrun' pour mode horror, sinon normal
 */
function startCinemaCountdown(callback, gameMode = 'normal') {
  if (cinematicCountdownActive) return;
  
  cinematicCountdownActive = true;
  
  const isHorror = gameMode === 'speedrun';
  const canvas = initCinemaCountdown(isHorror);
  const ctx = countdownCtx;
  const width = canvas.width;
  const height = canvas.height;
  
  let elapsedTime = 0;
  let lastTickTime = -1;
  const startTime = Date.now();
  
  playProjectorSound();
  countdownAnimationId = null;
  
  const animate = () => {
    const now = Date.now();
    elapsedTime = now - startTime;
    
    const totalCountdownDuration = 2300; // ~2.3 secondes total
    
    // PHASE 1: Démarrage (0-200ms)
    if (elapsedTime < 200) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(18, 18, 18, ${0.3 + (elapsedTime / 200) * 0.7})`;
      ctx.fillRect(0, 0, width, height);
      
      const grainIntensity = (elapsedTime / 200) * CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity;
      drawFilmGrain(ctx, width, height, grainIntensity);
      
      countdownAnimationId = requestAnimationFrame(animate);
      return;
    }
    
    // PHASE 2: Countdown avec transparence décroissante (200-2200ms)
    const countdownElapsed = elapsedTime - 200;
    const currentCount = Math.max(0, 2 - Math.floor(countdownElapsed / 1000));
    
    // Transparence: de 1.0 à 0.2 (le jeu apparaît progressivement)
    const countdownProgress = Math.min(1, countdownElapsed / 2000);
    const bgOpacity = Math.max(0.2, 1 - (countdownProgress * 0.8));
    
    ctx.clearRect(0, 0, width, height);
    
    // Fond semi-transparent
    ctx.fillStyle = `rgba(18, 18, 18, ${bgOpacity})`;
    ctx.fillRect(0, 0, width, height);
    
    // Effets cinéma (diminuent progressivement)
    const grainLevel = (CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity * bgOpacity);
    drawFilmGrain(ctx, width, height, grainLevel);
    
    if (CINEMA_COUNTDOWN_CONFIG.scratchLines && bgOpacity > 0.3) {
      drawScratchLines(ctx, width, height);
    }
    
    if (bgOpacity > 0.5) {
      drawFilmFrame(ctx, width, height);
    }
    
    if (Math.random() < CINEMA_COUNTDOWN_CONFIG.flickerFrequency * bgOpacity) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1 * bgOpacity})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Afficher les chiffres (2, 1)
    if (currentCount > 0) {
      const glitchOffset = Math.random() < 0.1 ? (Math.random() - 0.5) * 4 : 0;
      ctx.save();
      ctx.translate(0, glitchOffset);
      
      const textSize = 200;
      ctx.font = `bold ${textSize}px ${CINEMA_COUNTDOWN_CONFIG.font}`;
      
      if (isHorror) {
        ctx.fillStyle = CINEMA_COUNTDOWN_CONFIG.colors.red;
        ctx.shadowColor = 'rgba(139, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
      } else {
        ctx.fillStyle = CINEMA_COUNTDOWN_CONFIG.colors.text;
        ctx.shadowColor = 'rgba(100, 100, 100, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const pulse = Math.sin((countdownElapsed) / 120) * 0.1;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(1 + pulse, 1 + pulse);
      ctx.fillText(currentCount, 0, 0);
      ctx.restore();
      
      if (currentCount > lastTickTime) {
        lastTickTime = currentCount;
        const frequency = 400 + (currentCount * 200);
        playSynthSound(frequency, 150, 'sine');
      }
      
      ctx.restore();
    }
    
    // Flash blanc final (2000-2300ms)
    if (currentCount === 0 && countdownElapsed >= 2000) {
      const flashProgress = (countdownElapsed - 2000) / 300;
      if (flashProgress < 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * (1 - flashProgress)})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // Vignettage circulaire (cercle de vision)
    drawCircularVignette(ctx, width, height, bgOpacity);
    
    // Continuer ou terminer
    if (elapsedTime < totalCountdownDuration) {
      countdownAnimationId = requestAnimationFrame(animate);
    } else {
      stopCinemaCountdown();
      if (callback) callback();
    }
  };
  
  countdownAnimationId = requestAnimationFrame(animate);
}

/**
 * Arrête le countdown cinématique
 */
function stopCinemaCountdown() {
  cinematicCountdownActive = false;
  if (countdownAnimationId) {
    cancelAnimationFrame(countdownAnimationId);
    countdownAnimationId = null;
  }
  if (countdownCanvas) {
    countdownCanvas.style.display = 'none';
  }
}

/**
 * Crée une variante "Horror" du countdown avec couleurs rouges
 * @param {Function} callback 
 */
function startHorrorCountdown(callback) {
  startCinemaCountdown(callback, 'speedrun');
}
