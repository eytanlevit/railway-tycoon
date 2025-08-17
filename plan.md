# Railway Tycoon Modularization Plan (Simplified)

## Executive Summary

Mechanically extract the 1046-line monolithic `reference-design.html` into ES6 modules without writing new code. Just cut, paste, and wire with imports/exports. Delivered in 2 simple PRs.

## Goals
- **Minimal Change**: Extract existing code as-is, no rewrites
- **Zero New Logic**: No classes, wrappers, or abstractions  
- **Maintain Compatibility**: Keep window exports during transition
- **Identical Behavior**: Exact same gameplay

## Final Architecture

### Module Dependency Graph
```
constants ← utils ← pathfinding, map
              ↑
           renderer
              ↑
            main
```

### Directory Structure
```
railway-tycoon/
├── index.html
├── package.json
├── reference-design.html (preserved)
└── src/
    ├── main.js
    ├── constants.js
    ├── utils.js
    ├── renderer.js
    ├── pathfinding.js
    └── map.js
```

## PR Breakdown (2 PRs Total)

### PR #1: Mechanical Extraction of Constants, Utils, and Renderer
**Goal**: Move existing functions to modules without any changes

**Files to Create**:
- `package.json` - Minimal dev server scripts
- `src/constants.js` - Cut/paste all constants
- `src/utils.js` - Cut/paste utility functions including isoToScreen
- `src/renderer.js` - Cut/paste ALL drawing functions
- `index-modular.html` - Copy of index.html with module script

**Mechanical Changes**:
```javascript
// src/constants.js
// Cut/paste from reference-design.html lines 52-88
export const MAP_COLS = 25; 
export const MAP_ROWS = 25; 
export const TILE_WIDTH_HALF = 32; 
export const TILE_HEIGHT_HALF = 16;
export const TILE_TYPE = { GRASS: 0, WATER: 1, SAND: 2, CITY: 3, MOUNTAIN: 4, FOREST: 5 };
export const COLORS = { /* all colors exactly as they are */ };
export const CITY_NAMES = [ /* all names */ ];

// No window exports here - main.js will handle that

// src/utils.js
// Cut/paste from lines 103-121 EXACTLY - no param changes
export function isoToScreen(isoX, isoY) {
  // Will read originX/originY from window (set by main.js)
  const screenX = window.originX + (isoX - isoY) * window.TILE_WIDTH_HALF;
  const screenY = window.originY + (isoX + isoY) * window.TILE_HEIGHT_HALF;
  return { x: screenX, y: screenY };
}

export function LightenDarkenColor(col, amt) {
  // Exact copy of existing function
}

export function seededRandom(x, y, seed = 0) {
  // Exact copy of existing function
}

// No window exports here - main.js will handle that

// src/renderer.js
import { COLORS, TILE_WIDTH_HALF, TILE_HEIGHT_HALF } from './constants.js';
import { LightenDarkenColor } from './utils.js';

// Cut/paste ALL drawing functions from lines 146-991
export function drawDiamond(ctx, screenX, screenY, fillColor, strokeColor = null) { 
  // Exact copy
}

export function drawWheel(ctx, radius, phase, wheelColor, spokeColor) {
  // Exact copy
}

export function drawTracks(ctx) {
  // Exact copy - will use globals from window
}

export function drawTrain(ctx) {
  // Exact copy - will use globals from window
}

// ... ALL other drawing functions exactly as they are

// No window exports here - main.js will handle that
```

**package.json**:
```json
{
  "name": "railway-tycoon",
  "scripts": {
    "serve": "python3 -m http.server 8000"
  }
}
```

**Testing**: 
- Run server, load index-modular.html
- Open console, verify all functions available via window object
- Visual output should be identical

**Why Non-Breaking**: All functions still on window, original untouched

---

### PR #2: Extract Game Logic and Wire Everything
**Goal**: Move remaining code and connect with imports

**Files to Create**:
- `src/pathfinding.js` - Cut/paste pathfinding as-is
- `src/map.js` - Cut/paste map generation as-is  
- `src/main.js` - Move game initialization and loop

**Mechanical Changes**:
```javascript
// src/pathfinding.js
import { TILE_TYPE } from './constants.js';

// Cut/paste aStar from lines 125-137 EXACTLY as it is
export function aStar(startNode, goalNode, gridData, cols, rows) {
  // Exact copy - no changes to make it "pure"
  function heuristic(nodeA, nodeB) { 
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y); 
  }
  // ... rest of function exactly as is
}

export function validatePathSegment(segment, gridData) {
  // Exact copy from lines 138-143
}

// No window exports here - main.js will handle that

// src/map.js  
import { MAP_COLS, MAP_ROWS, TILE_TYPE, COLORS, CITY_NAMES } from './constants.js';
import { seededRandom, isoToScreen } from './utils.js';
import { aStar, validatePathSegment } from './pathfinding.js';

// Cut/paste global variables that map needs
export let mapData = [];
export let featureLayouts = {};
export let placedCitiesCoords = [];
export let availableCityNames = [...CITY_NAMES];
export let trainPath = [];

// Cut/paste generateMap from lines 692-772 EXACTLY
export function generateMap() {
  // Exact copy - no changes
  // Keep all the nested loops and logic as-is
}

// No window exports here - main.js will handle that

// src/main.js
import * as constants from './constants.js';
import * as utils from './utils.js';
import * as renderer from './renderer.js';
import * as pathfinding from './pathfinding.js';
import * as map from './map.js';

// Export everything to window for compatibility
Object.assign(window, constants);
Object.assign(window, utils);
Object.assign(window, renderer);
Object.assign(window, pathfinding);
Object.assign(window, map);

// Cut/paste the window.onload function content EXACTLY
window.onload = function() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  const ctx = canvas.getContext('2d');
  
  // Setup dimensions - exact copy
  canvas.width = (MAP_COLS + MAP_ROWS) * TILE_WIDTH_HALF + TILE_WIDTH_HALF * 2;
  canvas.height = (MAP_COLS + MAP_ROWS) * TILE_HEIGHT_HALF + TILE_HEIGHT_HALF * 8;
  
  // Set globals that functions expect
  window.originX = canvas.width / 2;
  window.originY = TILE_HEIGHT_HALF * MAP_ROWS * 0.5 + 50;
  window.ctx = ctx;
  
  // Initialize train state - exact copy from lines 92-100
  let train = {
    segmentIndex: 0,
    progress: 0,
    speed: 0.008,
    numCarriages: 7,
    carriageSpacingProgress: 0.8,
    wheelPhase: 0,
    carriageTypes: ['engine', 'passenger', 'freight', 'passenger', 'tank', 'freight', 'caboose']
  };
  
  let smokeParticles = [];
  
  // Cut/paste all the remaining functions exactly
  function spawnSmokeParticle(chimneyTopX, chimneyTopY, trainAngle = 0, trainSpeed = 0) {
    // Exact copy from lines 801-822
  }
  
  function updateSmokeParticles() {
    // Exact copy from lines 823-844
  }
  
  function updateTrain() {
    // Exact copy from lines 774-800
  }
  
  function drawSmokeParticles() {
    // Exact copy from lines 965-990
  }
  
  function update() {
    // Exact copy from lines 992-996
  }
  
  function draw() {
    // Exact copy from lines 997-1041
    // Just update calls to use renderer.drawTracks, etc.
  }
  
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  
  function init() {
    generateMap();
    gameLoop();
  }
  
  // Start the game
  init();
};
```

**Update index.html**:
```html
<!-- Only change: switch to module -->
<script type="module" src="src/main.js"></script>
```

**Testing**:
- Full gameplay test
- Compare side-by-side with reference-design.html
- Should be pixel-perfect identical

**Why Non-Breaking**: Just moved code, no logic changes

---

## Implementation Notes

### What We're NOT Doing
- ❌ No Game class
- ❌ No camera.js module  
- ❌ No async/await changes
- ❌ No "pure" function rewrites
- ❌ No new abstractions

### What We ARE Doing
- ✅ Cut and paste existing code
- ✅ Add export/import statements
- ✅ Keep ALL window exports in main.js only
- ✅ No parameter changes - use globals exactly as before

### Server Requirement
```bash
# Must serve via HTTP for modules
python3 -m http.server 8000
# OR
npx serve
```

### Success Metrics
- ✅ Zero visual/gameplay changes
- ✅ All existing code preserved
- ✅ Can still access via window object
- ✅ Only 2 PRs needed

## Timeline
- PR #1: 20 minutes (pure cut/paste)
- PR #2: 20 minutes (wire imports)

**Total: ~40 minutes**