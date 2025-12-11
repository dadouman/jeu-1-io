# Compte à Rebours "Cinéma Muet / Noir et Blanc"

## 📽️ Vue d'ensemble

Un compte à rebours stylisé façon **projection de film ancien** (Metropolis, Nosferatu, Les Temps Modernes) intégré au mode solo speedrun. Le système crée une ambiance rétro immersive avec effets visuels et sonores.

### Caractéristiques principales

✅ **Visuel noir et blanc sépia** avec grain filmique  
✅ **Rayures de pellicule** et effet de saut de pellicule  
✅ **Animation de clignotement** (flicker) et zoom pulsé  
✅ **Perforations de film** sur les bords du canvas  
✅ **Effets sonores synthétisés** (pas de fichiers externes)  
✅ **Mode Horror** (timer rouge sang) pour speedrun  
✅ **Intégration automatique** au démarrage du mode solo  

---

## 🎬 Architecture Technique

### Fichiers principaux

```
Public/
├── countdown-cinema.js          ← Nouvelle implémentation
├── game-state.js               ← Modifié pour lancer le countdown
├── game-loop.js                ← Gère la boucle de jeu pendant le countdown
├── index.html                  ← Ajouté le script et polices Google
└── styles.css                  ← Ajouté le styling du canvas
```

### Configuration

```javascript
const CINEMA_COUNTDOWN_CONFIG = {
  duration: 3,                    // Compte à rebours de 3 secondes
  filmGrainIntensity: 0.3,        // Intensité du grain (0-1)
  scratchLines: true,             // Rayures de pellicule
  flickerFrequency: 0.2,          // Fréquence du clignotement
  font: "'Bebas Neue', 'Arial Black', sans-serif",
  
  colors: {
    bg: "#121212",                // Fond noir profond
    text: "#f0f0f0",              // Texte blanc cassé
    accent: "#d4af37",            // Doré vieilli
    red: "#8B0000"                // Rouge sang (mode horror)
  }
};
```

---

## 🎨 Effets Visuels

### 1. **Grain Filmique**
- Bruit aléatoire subtil généré via `createImageData`
- Intensité progressive (fade-in au démarrage)
- Augmente lors du passage à "0"

### 2. **Rayures de Pellicule**
- Rayures verticales aléatoires (pellicule abîmée)
- Rayures horizontales avec opacité variable
- Actualisées chaque frame pour effet tremblant

### 3. **Cadre de Film**
- Bordure noire épaisse (25px)
- **Perforations** sur les côtés gauche/droit
- **Vignettage** (dégradé radial assombrissant les bords)

### 4. **Animations**
```
Phase 1 (0-500ms): Écran noir + grain qui s'intensifie
Phase 2-4 (500ms-3.5s): Countdown 3 → 2 → 1
  - Zoom pulsé sinusoïdal (~8% amplitude)
  - Flicker aléatoire (20% de chance par frame)
  - Saut de pellicule (glitch vertical ±2px)
Phase 5 (3.5s+): Flash blanc + "ACTION!"
```

### 5. **Effets de Couleur**
- **Mode normal** : Texte blanc cassé, accent doré
- **Mode Horror** : Texte rouge sang avec ombre portée sinistre

---

## 🔊 Effets Sonores

Tous les sons sont **synthétisés via Web Audio API** (pas de fichiers .mp3 requis).

### Implémentation

```javascript
// Oscillateur simple
playSynthSound(frequency, duration, type)
// frequency: 200-2000 Hz
// duration: 50-500 ms
// type: 'sine', 'square', 'sawtooth', 'triangle'
```

### Sons du countdown

| Phase | Son | Fréquence | Durée | Effet |
|-------|-----|-----------|-------|-------|
| Démarrage | Bruit de projecteur | Bruit blanc filtré | 500ms | Fade out |
| "3" | Tic-tac | 800 Hz | 150ms | Bruit blanc filtré |
| "2" | Tic-tac | 600 Hz | 150ms | Son plus grave |
| "1" | Tic-tac | 400 Hz | 150ms | Son grave final |
| ACTION! | Clap cinéma | 800 Hz | 100ms | Carré (square wave) |

---

## 🎮 Intégration au Jeu

### Démarrage automatique

Le countdown cinématique se lance **automatiquement** quand le mode solo démarre :

```javascript
// Dans game-state.js
function startCountdown() {
    startCinemaCountdown(() => {
        console.log('🎬 Countdown cinématique terminé!');
    }, currentGameMode);
}
```

### Flux d'exécution

```
1. Joueur clique "JOUER" en mode solo
   ↓
2. initSolo() déclenche startCountdown()
   ↓
3. Canvas fullscreen du countdown apparaît (z-index: 9999)
   ↓
4. Animation 3 → 2 → 1 → ACTION! + flash blanc
   ↓
5. Canvas se cache, le jeu s'affiche normalement
   ↓
6. Inputs débloqués, timer du jeu démarre
```

### Variables d'état

```javascript
// game-state.js
let cinematicCountdownActive = false;  // État du countdown
let countdownCanvas = null;            // Référence au canvas
let countdownCtx = null;               // Contexte 2D
let countdownAnimationId = null;       // ID du requestAnimationFrame
```

---

## 💾 Fonctions Publiques

### `startCinemaCountdown(callback, gameMode)`

Lance le countdown cinématique complet.

```javascript
startCinemaCountdown(() => {
    console.log('Jeu en cours!');
}, 'normal');  // ou 'speedrun'
```

**Paramètres:**
- `callback` (Function) : Appelée à la fin du countdown
- `gameMode` (String) : `'normal'` (blanc) ou `'speedrun'` (rouge horror)

### `stopCinemaCountdown()`

Arrête et masque le countdown (utile pour pause/abandon).

```javascript
stopCinemaCountdown();
```

### `startHorrorCountdown(callback)`

Wrapper pratique pour le mode horror (alias).

```javascript
startHorrorCountdown(() => {
    // Jeu lancé en mode horror
});
```

### `playProjectorSound()`

Joue le bruit de projecteur de démarrage.

```javascript
playProjectorSound();
```

### `playSynthSound(frequency, duration, type)`

Joue un son synthétisé simple.

```javascript
playSynthSound(440, 200, 'sine');  // La 220Hz pendant 200ms
```

---

## 🎯 Variantes & Personnalisation

### Mode Speedrun (Horror)

Couleur **rouge sang** pour intensifier la pression :

```javascript
startCinemaCountdown(callback, 'speedrun');
// ou
startHorrorCountdown(callback);
```

### Modifier les couleurs

```javascript
CINEMA_COUNTDOWN_CONFIG.colors.text = '#FF0000';  // Rouge vif
CINEMA_COUNTDOWN_CONFIG.colors.accent = '#FFD700'; // Or
CINEMA_COUNTDOWN_CONFIG.colors.red = '#8B0000';   // Rouge sang
```

### Modifier la durée

```javascript
CINEMA_COUNTDOWN_CONFIG.duration = 5;  // 5 secondes au lieu de 3
```

### Désactiver les rayures

```javascript
CINEMA_COUNTDOWN_CONFIG.scratchLines = false;
```

### Augmenter l'intensité du grain

```javascript
CINEMA_COUNTDOWN_CONFIG.filmGrainIntensity = 0.5;  // Plus de bruit
```

---

## 🔧 Dépannage

### Le countdown n'apparaît pas

**Causes possibles:**
1. `countdown-cinema.js` n'est pas chargé → Vérifier `index.html`
2. Z-index insuffisant → Checker le CSS du canvas
3. Canvas caché → Vérifier `countdownCanvas.style.display`

**Solutions:**
```javascript
// Vérifier dans la console
console.log(cinematicCountdownActive);    // Doit être true
console.log(countdownCanvas);             // Doit exister
console.log(CINEMA_COUNTDOWN_CONFIG);    // Config disponible
```

### Les sons ne jouent pas

**Cause:** Web Audio API nécessite un contexte auditive initialisé.

**Solution:** Cliquer sur le canvas du jeu en premier (les navigateurs modernes bloquent l'audio auto).

```javascript
// Vérifier le contexte audio
console.log(window.audioContext);  // Doit être défini
```

### Le countdown est trop rapide/lent

Vérifier que `CINEMA_COUNTDOWN_CONFIG.duration` est correct et que `Date.now()` fonctionne normalement (pas de freeze du navigateur).

---

## 📊 Performance

### Optimisations appliquées

✅ **requestAnimationFrame** pour les animations fluides  
✅ **Canvas 2D natif** (pas de librairies externes)  
✅ **Web Audio API** pour les sons (pas de fichiers)  
✅ **Générération procédurale** (grain, rayures, bruit)  
✅ **Nettoyage du canvas** via `fillRect`  

### Benchmarks estimés

- **FPS** : 60 FPS stable (dépend du navigateur)
- **Mémoire** : ~2-5 MB (canvas + audio context)
- **CPU** : ~10-15% sur CPU moderne (grain + animation)

---

## 🎓 Exemples d'Utilisation

### Démarrage simple

```javascript
// Mode normal
startCinemaCountdown(() => {
    console.log('🎬 Jeu commencé!');
});
```

### Mode horror avec callback avancé

```javascript
startCinemaCountdown(() => {
    // Déclencher la musique d'horreur
    if (window.horrorMusic) {
        window.horrorMusic.play();
    }
    
    // Changer le timer en rouge
    if (soloTimerElement) {
        soloTimerElement.style.color = '#FF0000';
    }
}, 'speedrun');
```

### Avec gestion d'erreur

```javascript
if (cinematicCountdownActive) {
    console.warn('Un countdown est déjà en cours');
} else {
    startCinemaCountdown(() => {
        console.log('Transition complète');
    });
}
```

---

## 🚀 Intégration avec les modes de jeu

### Mode Solo (défaut)

```javascript
// game-loop.js - Déjà intégré
if (currentGameMode === 'solo') {
    startCountdown();  // Lance le countdown cinéma
}
```

### Mode Classique / Infini (optionnel)

Pour ajouter le countdown à d'autres modes :

```javascript
if (currentGameMode === 'classic') {
    startCinemaCountdown(() => {
        // Démarrer le jeu classique
    }, 'normal');
}
```

---

## 📝 Notes de Conception

### Inspirations cinématographiques

- **Metropolis** (1927) : Contraste noir/blanc très marqué
- **Nosferatu** (1922) : Grain filmique et rayures
- **Les Temps Modernes** (1936) : Typographie époque

### Choix techniques

1. **Canvas 2D** : Plus performant que SVG ou DOM pour l'animation haute-fréquence
2. **Web Audio API** : Évite de charger des fichiers MP3/OGG
3. **requestAnimationFrame** : Synchronisation avec l'écran (60 FPS natif)
4. **Polices Google** : Bebas Neue pour le style "affiche rétro"

### Accessibilité

⚠️ **À noter** : Le countdown cinématique a un design visuel fort. Pour l'accessibilité :
- Les sons jouent automatiquement (Web Audio)
- Le texte "3", "2", "1" est visible même pour les daltoniens
- La durée est prévisible (3 secondes)

---

## 🔄 Mise à Jour Future

### Améliorations possibles

- [ ] Variante "couleur sépia" (brown tone au lieu de noir/blanc)
- [ ] Variante "Expressionnisme Allemand" (ombres exagérées)
- [ ] Sous-titres interactifs ("Êtes-vous prêts?" → Clic pour commencer)
- [ ] Integration avec son extérieur (charger `sfx/projector.mp3`)
- [ ] Responsivité tactile (vibration sur mobile)
- [ ] Thème sombre/clair selon préférences utilisateur

---

## ✅ Checklist d'Intégration

- [x] Fichier `countdown-cinema.js` créé
- [x] Script ajouté dans `index.html`
- [x] Polices Google Bebas Neue chargées
- [x] `game-state.js` modifié pour lancer le countdown
- [x] CSS du canvas ajouté
- [x] Sons synthétisés via Web Audio API
- [x] Variables d'état initialisées
- [x] Fonction d'arrêt disponible (`stopCinemaCountdown`)
- [x] Documentation complète

---

**Version** : 1.0  
**Dernière mise à jour** : Décembre 2025  
**Statut** : ✅ Production Ready
