# ⚡ ARCHITECTURE REFACTORING - QUICK START GUIDE

**This guide shows EXACTLY what to do in Week 1 (Phase 1)**

---

## 🎯 PHASE 1 GOAL
Create the foundation for better code organization and testability.

**Time Required:** 4 hours  
**Test Coverage Target:** 70% → 75%

---

## 📋 TASK 1: CREATE SHARED CONSTANTS (45 minutes)

### Step 1: Create the file
```bash
cd c:\Users\Jocelyn\Desktop\Mon jeu .io
touch utils/constants.js
```

### Step 2: Extract all magic numbers

**utils/constants.js:**
```javascript
/**
 * Game-wide constants
 * Keep these values in sync across all files
 */

// GAME PHYSICS
const TILE_SIZE = 40; // Tile size in pixels
const COLLISION_BUFFER = 5; // Pixel buffer for collision detection
const MAX_PLAYER_SPEED = 200; // pixels per second

// TIMING (milliseconds)
const SHOP_DURATION = 15000; // 15 seconds
const TRANSITION_DURATION = 3000; // 3 seconds
const VOTE_TIMEOUT = 60000; // 60 seconds
const FRAME_TIME = 16.67; // 60 FPS = 1000/60

// MAZE GENERATION
const MAZE_CONFIG = {
  MIN_WIDTH: 5,
  MAX_WIDTH: 30,
  MIN_HEIGHT: 5,
  MAX_HEIGHT: 30,
  BACKTRACKER_DENSITY: 1.0,
  PRIM_DEFAULT_DENSITY: 0.5,
  PRIM_OPEN_BORDERS: false
};

// SHOP CONFIGURATION
const SHOP_CONFIG = {
  ITEMS: {
    dash: { price: 5, stackable: false },
    checkpoint: { price: 3, stackable: false },
    compass: { price: 4, stackable: false },
    rope: { price: 1, stackable: false },
    speedBoost: { price: 2, stackable: true }
  },
  DEFAULT_ITEMS: [
    'dash',
    'checkpoint',
    'compass',
    'rope',
    'speedBoost'
  ]
};

// GAME MODES
const GAME_MODES = {
  CLASSIC: 'classic',
  CLASSIC_PRIM: 'classicPrim',
  INFINITE: 'infinite',
  SOLO: 'solo',
  CUSTOM: 'custom'
};

module.exports = {
  TILE_SIZE,
  COLLISION_BUFFER,
  MAX_PLAYER_SPEED,
  SHOP_DURATION,
  TRANSITION_DURATION,
  VOTE_TIMEOUT,
  FRAME_TIME,
  MAZE_CONFIG,
  SHOP_CONFIG,
  GAME_MODES
};
```

### Step 3: Update imports in existing files

**utils/collisions.js** (Line 3):
```javascript
// BEFORE:
const TILE_SIZE = 40;

// AFTER:
const { TILE_SIZE, COLLISION_BUFFER } = require('./constants');
```

**utils/map.js** (Line 1):
```javascript
// BEFORE:
const TILE_SIZE = 40;

// AFTER:
const { TILE_SIZE, MAZE_CONFIG } = require('./constants');
```

**server/config.js** (Line 6-7):
```javascript
// BEFORE:
const SHOP_DURATION = 15000;
const TRANSITION_DURATION = 3000;

// AFTER:
const { SHOP_DURATION, TRANSITION_DURATION } = require('../utils/constants');
```

**public/game-loop.js** (Line ~60):
```javascript
// Add at top:
const { SHOP_DURATION } = require('../utils/constants');

// Then replace all instances of 15000 with SHOP_DURATION
```

### Step 4: Verify changes
```bash
npm test -- utils/collisions.test.js
# Should pass

npm test -- utils/map.test.js
# Should pass
```

---

## 📋 TASK 2: CREATE INPUT VALIDATION SCHEMAS (60 minutes)

### Step 1: Create validation directory
```bash
mkdir -p server/validation
touch server/validation/schemas.js
touch server/validation/validator.js
```

### Step 2: Write schemas

**server/validation/schemas.js:**
```javascript
/**
 * Input validation schemas for Socket.io events
 */

const SCHEMAS = {
  movement: {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: {
        type: 'number',
        enum: [-1, 0, 1],
        description: 'X direction: -1 (left), 0 (idle), 1 (right)'
      },
      y: {
        type: 'number',
        enum: [-1, 0, 1],
        description: 'Y direction: -1 (up), 0 (idle), 1 (down)'
      }
    }
  },

  shopPurchase: {
    type: 'object',
    required: ['itemId'],
    properties: {
      itemId: {
        type: 'string',
        enum: ['dash', 'checkpoint', 'compass', 'rope', 'speedBoost'],
        description: 'The item to purchase'
      }
    }
  },

  modeSelection: {
    type: 'object',
    required: ['mode'],
    properties: {
      mode: {
        type: 'string',
        enum: ['classic', 'classicPrim', 'infinite', 'solo', 'custom'],
        description: 'Selected game mode'
      }
    }
  },

  checkpoint: {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: {
        type: 'number',
        description: 'X position in pixels'
      },
      y: {
        type: 'number',
        description: 'Y position in pixels'
      }
    }
  },

  dutchAuctionPurchase: {
    type: 'object',
    required: ['lotId'],
    properties: {
      lotId: {
        type: 'string',
        description: 'Auction lot ID'
      }
    }
  }
};

module.exports = SCHEMAS;
```

### Step 3: Write validator utility

**server/validation/validator.js:**
```javascript
/**
 * Simple schema validator
 */

const SCHEMAS = require('./schemas');

/**
 * Validates data against a schema
 * @param {string} schemaName - Name of the schema to validate against
 * @param {object} data - Data to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateData(schemaName, data) {
  const schema = SCHEMAS[schemaName];
  const errors = [];

  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown schema: ${schemaName}`]
    };
  }

  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: ['Data must be an object']
    };
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Validate properties
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (!(field in data)) continue; // Already checked in required

      const value = data[field];

      // Type check
      if (fieldSchema.type && typeof value !== fieldSchema.type) {
        errors.push(
          `Field '${field}' must be ${fieldSchema.type}, got ${typeof value}`
        );
      }

      // Enum check
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(
          `Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Middleware for validating socket events
 * @param {string} schemaName - Schema to validate against
 * @returns {function} Express-style middleware
 */
function validateSchema(schemaName) {
  return (socket, data, callback) => {
    const { valid, errors } = validateData(schemaName, data);

    if (!valid) {
      console.error(`❌ Validation failed for ${schemaName}:`, errors);
      if (callback) callback(new Error(errors[0]));
      return false;
    }

    if (callback) callback(null);
    return true;
  };
}

module.exports = {
  validateData,
  validateSchema,
  SCHEMAS
};
```

### Step 4: Update socket handlers to use validation

**Example: server/socket-handlers/movement.js**
```javascript
const { validateSchema } = require('../validation/validator');

function handleMovement(socket, lobbies, soloSessions, playerModes) {
  socket.on('movement', (data) => {
    // Validate input
    if (!validateSchema('movement')(socket, data)) {
      return; // Validation failed, already sent error
    }

    // ... rest of movement logic
    const { x, y } = data;
    // ...
  });
}

module.exports = { handleMovement };
```

### Step 5: Test validation
```bash
# Create a test file: server/validation/validator.test.js
npm test -- server/validation/validator.test.js
```

---

## 📋 TASK 3: EXTRACT GAME LOOP PROCESSOR (90 minutes)

### Step 1: Create processor directory
```bash
mkdir -p server/processors
touch server/processors/GameLoopProcessor.js
touch server/processors/LobbyProcessor.js
```

### Step 2: Create GameLoopProcessor base class

**server/processors/GameLoopProcessor.js:**
```javascript
/**
 * Base game loop processor
 * Handles frame-by-frame game logic
 */

const { debugLog } = require('../debug');

class GameLoopProcessor {
  constructor(config = {}) {
    this.frameCount = 0;
    this.frameTime = 0;
    this.lastFrameTime = Date.now();
    this.config = config;
  }

  /**
   * Process one frame
   */
  processFrame() {
    const frameStart = Date.now();
    
    try {
      // Process movement
      this.processMovement();
      
      // Check collisions
      this.processCollisions();
      
      // Update game state
      this.processGameLogic();
      
      // Handle transitions
      this.processTransitions();
      
      // Broadcast state
      this.broadcastState();
      
    } catch (error) {
      console.error('❌ Frame processing error:', error);
    }
    
    // Calculate frame time
    this.frameTime = Date.now() - frameStart;
    this.lastFrameTime = Date.now();
    this.frameCount++;
    
    // Warn if frame took too long
    if (this.frameTime > 17) {
      debugLog(`⚠️ Frame overrun: ${this.frameTime}ms (target: 16.67ms)`);
    }
  }

  /**
   * Process player movement
   * Override in subclass
   */
  processMovement() {
    throw new Error('processMovement() must be implemented');
  }

  /**
   * Process collision detection
   * Override in subclass
   */
  processCollisions() {
    throw new Error('processCollisions() must be implemented');
  }

  /**
   * Process game logic
   * Override in subclass
   */
  processGameLogic() {
    throw new Error('processGameLogic() must be implemented');
  }

  /**
   * Process state transitions (shop, level change, etc.)
   * Override in subclass
   */
  processTransitions() {
    throw new Error('processTransitions() must be implemented');
  }

  /**
   * Broadcast game state to clients
   * Override in subclass
   */
  broadcastState() {
    throw new Error('broadcastState() must be implemented');
  }

  /**
   * Get frame metrics
   */
  getMetrics() {
    return {
      frameCount: this.frameCount,
      frameTime: this.frameTime,
      lastFrameTime: this.lastFrameTime,
      avgFrameTime: this.frameCount > 0 ? this.frameTime : 0
    };
  }
}

module.exports = GameLoopProcessor;
```

### Step 3: Create LobbyProcessor

**server/processors/LobbyProcessor.js:**
```javascript
/**
 * Game loop processor for lobby-based games
 * Handles: Classic, Infinite, ClassicPrim modes
 */

const GameLoopProcessor = require('./GameLoopProcessor');
const { checkWallCollision } = require('../../utils/collisions');
const { getRandomEmptyPosition } = require('../../utils/map');

class LobbyProcessor extends GameLoopProcessor {
  constructor(lobbies, io, config) {
    super(config);
    this.lobbies = lobbies;
    this.io = io;
  }

  /**
   * Process movement for all players in all lobbies
   */
  processMovement() {
    for (const [lobbyName, lobby] of Object.entries(this.lobbies)) {
      if (!lobby.players) continue;

      for (const [playerId, player] of Object.entries(lobby.players)) {
        if (!player.pendingMovement) continue;

        const { x, y } = player.pendingMovement;
        const newX = player.x + (x * player.speed);
        const newY = player.y + (y * player.speed);

        // Check collision
        if (!checkWallCollision(newX, newY, lobby.map)) {
          player.x = newX;
          player.y = newY;
        }

        player.pendingMovement = null;
      }
    }
  }

  /**
   * Process collisions (coin pickup, player-to-player, etc.)
   */
  processCollisions() {
    for (const [lobbyName, lobby] of Object.entries(this.lobbies)) {
      if (!lobby.players || !lobby.coin) continue;

      for (const [playerId, player] of Object.entries(lobby.players)) {
        const distToCoin = Math.hypot(
          player.x - lobby.coin.x,
          player.y - lobby.coin.y
        );

        // 40px radius
        if (distToCoin < 40) {
          this.handleCoinPickup(playerId, player, lobby, lobbyName);
        }
      }
    }
  }

  /**
   * Handle coin pickup
   */
  handleCoinPickup(playerId, player, lobby, lobbyName) {
    player.score++;
    player.gems += this.getGemReward(lobby.currentLevel);
    
    // Move coin
    lobby.coin = getRandomEmptyPosition(lobby.map);
    
    debugLog(`💎 ${playerId} picked up gem at level ${lobby.currentLevel}`);
  }

  /**
   * Get gem reward for level
   */
  getGemReward(level) {
    const rewards = [1, 2, 3, 4, 5, 7, 10, 15, 20, 30];
    return rewards[Math.min(level - 1, rewards.length - 1)] || 30;
  }

  /**
   * Process game logic (level transitions, shop logic, etc.)
   */
  processGameLogic() {
    for (const [lobbyName, lobby] of Object.entries(this.lobbies)) {
      if (!lobby.players) continue;

      // Check if any player reached score target for this level
      for (const [playerId, player] of Object.entries(lobby.players)) {
        const scoreTarget = lobby.currentLevel * 1; // 1 gem per level
        if (player.score >= scoreTarget && !player.levelCompleted) {
          this.handleLevelCompletion(playerId, player, lobby, lobbyName);
        }
      }
    }
  }

  /**
   * Handle when a player completes a level
   */
  handleLevelCompletion(playerId, player, lobby, lobbyName) {
    player.levelCompleted = true;
    player.shopOpened = true;
    debugLog(`✅ ${playerId} completed level ${lobby.currentLevel}`);
  }

  /**
   * Process state transitions
   */
  processTransitions() {
    for (const [lobbyName, lobby] of Object.entries(this.lobbies)) {
      if (!lobby.players) continue;

      // Check if all players ready to continue from shop
      const readyPlayers = Object.values(lobby.players).filter(
        p => p.readyToContinue === true
      );
      const allReady = readyPlayers.length === Object.keys(lobby.players).length;

      if (allReady && lobby.inShop) {
        this.transitionToNextLevel(lobby, lobbyName);
      }
    }
  }

  /**
   * Transition to next level
   */
  transitionToNextLevel(lobby, lobbyName) {
    lobby.currentLevel++;
    
    // Reset players for new level
    for (const player of Object.values(lobby.players)) {
      player.score = 0;
      player.levelCompleted = false;
      player.shopOpened = false;
      player.readyToContinue = false;
    }

    debugLog(`🎮 ${lobbyName} advancing to level ${lobby.currentLevel}`);
  }

  /**
   * Broadcast game state to all players
   */
  broadcastState() {
    for (const [lobbyName, lobby] of Object.entries(this.lobbies)) {
      if (!lobby.players) continue;

      const gameState = {
        level: lobby.currentLevel,
        players: this.getPlayerStates(lobby.players),
        coin: lobby.coin,
        map: lobby.map
      };

      // Emit to all players in this lobby
      this.io.to(`lobby-${lobbyName}`).emit('gameState', gameState);
    }
  }

  /**
   * Get public player states
   */
  getPlayerStates(players) {
    const states = {};
    for (const [playerId, player] of Object.entries(players)) {
      states[playerId] = {
        x: player.x,
        y: player.y,
        score: player.score,
        gems: player.gems,
        color: player.color
      };
    }
    return states;
  }
}

module.exports = LobbyProcessor;
```

### Step 4: Update game-loop.js to use processor

**server/game-loop.js** (refactored):
```javascript
const LobbyProcessor = require('./processors/LobbyProcessor');
const SoloProcessor = require('./processors/SoloProcessor');

function startGameLoop(io, lobbies, soloSessions, playerModes, config1, config2) {
  // Create processors
  const lobbyProcessor = new LobbyProcessor(lobbies, io, config2);
  const soloProcessor = new SoloProcessor(soloSessions, io, config2);

  // Game loop: 60 FPS
  setInterval(() => {
    lobbyProcessor.processFrame();
    soloProcessor.processFrame();
  }, 1000 / 60);
}

module.exports = { startGameLoop };
```

### Step 5: Test processors
```bash
npm test -- server/processors/GameLoopProcessor.test.js
```

---

## 📋 TASK 4: RUN TESTS & VERIFY (30 minutes)

### Step 1: Run all tests
```bash
npm test -- --coverage
```

### Step 2: Check coverage report
```
Expected output:
├─ Statements: 75%+ ✅
├─ Branches: 72%+ ✅
├─ Functions: 75%+ ✅
└─ Lines: 75%+ ✅
```

### Step 3: Fix any breaking tests
```bash
# Run tests in watch mode
npm test -- --watch

# Fix any failures by updating code to match new signatures
```

### Step 4: Commit changes
```bash
git add -A
git commit -m "refactor(phase-1): extract constants, add validation, processor pattern"
```

---

## ✅ COMPLETION CHECKLIST

After completing all 4 tasks, verify:

- [ ] `utils/constants.js` created with all magic numbers
- [ ] Constants imported in: collisions.js, map.js, config.js, game-loop.js
- [ ] `server/validation/` directory created with schemas.js & validator.js
- [ ] Input validation added to at least 3 socket handlers
- [ ] `server/processors/` created with GameLoopProcessor & LobbyProcessor
- [ ] Game loop refactored to use processors
- [ ] All tests passing: `npm test`
- [ ] Test coverage: 75%+ (up from 70%)
- [ ] No console errors
- [ ] Code committed to git

---

## 🎯 SUCCESS INDICATORS

After Phase 1, you should see:

✅ **Code Organization**
- No magic numbers visible in code
- Clear constant definitions in one place
- Easier to change values globally

✅ **Input Safety**
- Invalid movement data rejected
- Clear error messages for validation failures
- Consistent validation across handlers

✅ **Maintainability**
- Game loop logic extracted to processor classes
- Easier to understand and modify
- Better structure for future processors (SoloProcessor, etc.)

✅ **Testing**
- Test coverage improved to 75%
- Processors easier to test in isolation
- Better error messages in test failures

---

## 📞 TROUBLESHOOTING

### Tests fail after refactoring
```bash
# Check what broke
npm test -- --verbose

# Common issue: forgot to update require statement
# Solution: Check imports match new file structure
```

### Can't find constants module
```bash
# Make sure path is correct:
const { TILE_SIZE } = require('../utils/constants');
// ↑ correct (relative path from socket-handlers/)

const { TILE_SIZE } = require('./utils/constants');
// ↗ wrong (double slash)
```

### Game loop not processing
```bash
# Check processor is instantiated
console.log('Processor:', lobbyProcessor);

# Check emit is working
io.to(`lobby-${name}`).emit('gameState', state);
```

---

## 🚀 NEXT STEPS (AFTER PHASE 1)

Once Phase 1 is complete:

1. **Run `*run-test-design`** to identify test gaps
2. **Implement Phase 2:** Renderer & middleware refactoring
3. **Implement Phase 3:** Performance optimizations
4. **Implement Phase 4:** Final testing & documentation

**Estimated Total Time:** 4 weeks to reach 85%+ coverage

---

**Good luck with Phase 1! 💪**

Generated by BMAD v6 `*create-architecture` → Quick Start Guide
