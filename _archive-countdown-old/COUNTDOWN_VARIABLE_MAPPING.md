# 🔐 VARIABLE MAPPING - COUNTDOWN SYSTEM REPLACEMENT

## ⚠️ IMPORTANT: Variable Changes

During the countdown system replacement, some global variables were renamed for clarity.

---

## 🔄 RENAMED VARIABLES

### In: `game-state.js`

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `countdownActive` | `soloStartCountdownActive` | Track if countdown is running |
| `countdownStartTime` | `soloStartCountdownStartTime` | Store countdown start timestamp |

### Why the Change?

The old names were ambiguous (could be confused with other countdown systems).  
The new names clearly indicate:
- **`soloStart`** = This is the solo mode START countdown
- **`Active`** = Boolean flag for activation state
- **`StartTime`** = Timestamp when countdown began

---

## 🔍 VARIABLE USAGE

### `soloStartCountdownActive`
**Type**: `boolean`  
**Initial Value**: `false`  
**Purpose**: Control if countdown is currently rendering and active

**Set to `true`**: When player selects SOLO mode
```javascript
// In mode-selector.js
if (mode === 'solo' && !soloStartCountdownActive) {
    soloStartCountdownActive = true;
    soloStartCountdownStartTime = Date.now();
    inputsBlocked = true;
}
```

**Set to `false`**: When countdown reaches 3500ms
```javascript
// In game-loop.js
if (soloStartCountdownElapsed >= 3500) {
    soloStartCountdownActive = false;
}
```

### `soloStartCountdownStartTime`
**Type**: `number` (timestamp in ms)  
**Initial Value**: `null`  
**Purpose**: Store the exact moment countdown started

**Set**: When `soloStartCountdownActive = true`
```javascript
soloStartCountdownStartTime = Date.now();
```

**Used to calculate**: Elapsed time during countdown
```javascript
soloStartCountdownElapsed = Date.now() - soloStartCountdownStartTime;
```

### `inputsBlocked`
**Type**: `boolean`  
**Purpose**: Block/allow player keyboard input  
**Unchanged**: Already exists, still used

**Set to `true`**: When countdown starts (0ms)
**Set to `false`**: When countdown reaches 3000ms (during "GO" phase)

---

## 🎛️ COMPLETE VARIABLE STATE

### Countdown Phase 1 (0-1000ms) - "3"
```javascript
soloStartCountdownActive: true
soloStartCountdownStartTime: <timestamp>
soloStartCountdownElapsed: 0-1000
inputsBlocked: true
levelStartTime: null
```

### Countdown Phase 2 (1000-2000ms) - "2"
```javascript
soloStartCountdownActive: true
soloStartCountdownStartTime: <timestamp>
soloStartCountdownElapsed: 1000-2000
inputsBlocked: true
levelStartTime: null
```

### Countdown Phase 3 (2000-3000ms) - "1"
```javascript
soloStartCountdownActive: true
soloStartCountdownStartTime: <timestamp>
soloStartCountdownElapsed: 2000-3000
inputsBlocked: true
levelStartTime: null
```

### Countdown Phase 4 (3000-3500ms) - "GO"
```javascript
soloStartCountdownActive: true
soloStartCountdownStartTime: <timestamp>
soloStartCountdownElapsed: 3000-3500
inputsBlocked: false  ← CHANGED at 3000ms!
levelStartTime: <new timestamp>  ← SET at 3000ms!
```

### After Countdown (3500ms+) - Playing
```javascript
soloStartCountdownActive: false  ← Changed at 3500ms
soloStartCountdownStartTime: null (can be reset)
soloStartCountdownElapsed: (no longer calculated)
inputsBlocked: false
levelStartTime: <timestamp>
```

---

## 📡 DATA FLOW

### Initialization (selectMode() in mode-selector.js)
```
selectMode('solo')
    ↓
soloSessionStartTime = Date.now()
soloStartCountdownActive = true    ← NEW
soloStartCountdownStartTime = Date.now()  ← NEW
inputsBlocked = true
levelStartTime = null
```

### Main Loop (game-loop.js render cycle)
```
Calculate soloStartCountdownElapsed = Date.now() - soloStartCountdownStartTime
    ↓
if (elapsed >= 3000):
    levelStartTime = Date.now()
    inputsBlocked = false
    ↓
if (elapsed >= 3500):
    soloStartCountdownActive = false
```

### Render (renderer.js)
```
if (soloStartCountdownActive):
    renderCountdownMultiPhase(
        ctx, 
        canvas, 
        soloStartCountdownElapsed, 
        soloStartCountdownActive
    )
```

### Input Processing (keyboard-input.js)
```
if (inputsBlocked):
    return  // Don't process keyboard input
```

---

## ✅ CHECKLIST: VARIABLE UPDATES

- [x] `countdownActive` → `soloStartCountdownActive` (game-state.js)
- [x] `countdownStartTime` → `soloStartCountdownStartTime` (game-state.js)
- [x] Updated game-loop.js to use new variable names
- [x] Updated renderer.js function signature
- [x] Updated mode-selector.js to initialize new variables
- [x] Updated keyboard-input.js replay button
- [x] Verified no remaining references to old names (in production code)
- [x] All function calls updated
- [x] All console logs updated

---

## 🐛 DEBUGGING TIPS

### Check countdown state:
```javascript
console.log('Active:', soloStartCountdownActive);
console.log('Start time:', soloStartCountdownStartTime);
console.log('Elapsed:', Date.now() - soloStartCountdownStartTime);
console.log('Inputs blocked:', inputsBlocked);
console.log('Level started:', levelStartTime);
```

### Verify timeline:
```javascript
// At t+3000ms, check:
console.assert(levelStartTime !== null, 'Timer should have started');
console.assert(!inputsBlocked, 'Inputs should be unlocked');

// At t+3500ms, check:
console.assert(!soloStartCountdownActive, 'Countdown should be finished');
```

---

## 📚 REFERENCES

- Main implementation: `Public/countdown-renderer.js`
- State management: `Public/game-state.js`
- Logic control: `Public/game-loop.js`
- UI integration: `Public/renderer.js`
- Mode setup: `Public/mode-selector.js`
- Input handling: `Public/keyboard-input.js`

---

**Last Updated**: December 11, 2025  
**Status**: ✅ Complete and Verified
