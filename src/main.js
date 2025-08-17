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
// Map exports need special handling for the variables
window.mapData = map.mapData;
window.featureLayouts = map.featureLayouts;
window.placedCitiesCoords = map.placedCitiesCoords;
window.availableCityNames = map.availableCityNames;
window.trainPath = map.trainPath;
window.generateMap = map.generateMap;

// Cut/paste the window.onload function content EXACTLY
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Could not get 2D context!");
        return;
    }

    // Setup dimensions - exact copy
    canvas.width = (window.MAP_COLS + window.MAP_ROWS) * window.TILE_WIDTH_HALF + window.TILE_WIDTH_HALF * 2; 
    canvas.height = (window.MAP_COLS + window.MAP_ROWS) * window.TILE_HEIGHT_HALF + window.TILE_HEIGHT_HALF * 8; 

    // Set globals that functions expect
    window.originX = canvas.width / 2;
    window.originY = window.TILE_HEIGHT_HALF * window.MAP_ROWS * 0.5 + 50;
    window.ctx = ctx;

    // Initialize train state - exact copy from lines 91-100
    let smokeParticles = []; // Added for smoke effects
    window.train = { 
        segmentIndex: 0, 
        progress: 0, 
        speed: 0.008, 
        numCarriages: 7, 
        carriageSpacingProgress: 0.8,
        wheelPhase: 0,
        carriageTypes: ['engine', 'passenger', 'freight', 'passenger', 'tank', 'freight', 'caboose']
    };
    window.smokeParticles = smokeParticles;

    // Cut/paste all the remaining functions exactly from lines 774-995
    function updateTrain() {
        if(window.trainPath.length<2)return;
        
        // Calculate actual distance for wheel rotation sync
        const currentSegmentIdx = window.train.segmentIndex;
        const nextSegmentIdx = (currentSegmentIdx + 1) % (window.trainPath.length - 1);
        const p1 = window.isoToScreen(window.trainPath[currentSegmentIdx].x, window.trainPath[currentSegmentIdx].y);
        const p2 = window.isoToScreen(window.trainPath[nextSegmentIdx].x, window.trainPath[nextSegmentIdx].y);
        const segmentDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        
        window.train.progress += window.train.speed;
        
        // Sync wheel rotation to actual movement distance - wheels should spin much faster
        const wheelRadius = window.TILE_HEIGHT_HALF * 0.7 * 0.30; // Same as in drawEngine
        const wheelCircumference = 2 * Math.PI * wheelRadius;
        window.train.wheelPhase += (window.train.speed * segmentDistance) / wheelCircumference * Math.PI * 2 * 2.5; // Extra multiplier for faster spinning
        
        if(window.train.progress >= 1.0){
            window.train.progress -= 1.0;
            window.train.segmentIndex++;
            if(window.train.segmentIndex >= window.trainPath.length - 1){
                window.train.segmentIndex = 0; 
                window.train.progress = 0;
            } 
        }
    }

    function spawnSmokeParticle(chimneyTopX, chimneyTopY, trainAngle = 0, trainSpeed = 0) {
        const lifeMax = 80 + Math.random() * 40; // Slightly longer life
        
        // Add wind drift based on train direction
        const windStrength = 0.4;
        const windX = Math.cos(trainAngle + Math.PI) * windStrength; // Opposite to train direction
        const windY = Math.sin(trainAngle + Math.PI) * windStrength * 0.3; // Less vertical wind
        
        window.smokeParticles.push({
            x: chimneyTopX,
            y: chimneyTopY,
            vx: (Math.random() - 0.5) * 0.2 + windX, // Wind drift
            vy: -0.2 - Math.random() * 0.3 + windY,  // Upward with wind
            life: 0,
            maxLife: lifeMax,
            initialSize: 1 + Math.random() * 2, // Start smaller
            growthRate: 1.5 + Math.random() * 0.5, // How much it grows
            colorVal: 240 + Math.floor(Math.random() * 15), // Much whiter start color
            turbulence: Math.random() * 0.1 // Random movement
        });
    }

    function updateSmokeParticles() {
        for (let i = window.smokeParticles.length - 1; i >= 0; i--) {
            const p = window.smokeParticles[i];
            
            // Add slight turbulence for more realistic movement
            const turbulenceX = (Math.random() - 0.5) * p.turbulence;
            const turbulenceY = (Math.random() - 0.5) * p.turbulence;
            
            p.x += p.vx + turbulenceX;
            p.y += p.vy + turbulenceY;
            
            // Gradually slow down horizontal movement (air resistance)
            p.vx *= 0.995;
            p.vy *= 0.998; // Slight upward deceleration
            
            p.life++;
            if (p.life >= p.maxLife) {
                window.smokeParticles.splice(i, 1);
            }
        }
    }

    // Make spawnSmokeParticle available to window for drawTrain
    window.spawnSmokeParticle = spawnSmokeParticle;

    function drawSmokeParticles() {
        window.smokeParticles.forEach(p => {
            const lifeRatio = p.life / p.maxLife;
            
            // More realistic alpha fade (starts strong, fades faster at end)
            const alpha = Math.pow(1 - lifeRatio, 1.5);
            
            // Grows more dramatically
            const currentSize = p.initialSize * (1 + lifeRatio * p.growthRate);
            
            // Keep smoke whiter throughout its life - less darkening
            const baseColor = Math.floor(p.colorVal * (0.95 - lifeRatio * 0.15));
            
            // Pure white smoke - no blue tint
            const r = baseColor;
            const g = baseColor;
            const b = baseColor;
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha * 0.7)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function update(){
        updateTrain();
        updateSmokeParticles();
    }

    function draw() {
        ctx.fillStyle = window.COLORS.sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Layer 1: Base ground tiles
        for (let r_draw = 0; r_draw < window.MAP_ROWS; r_draw++) {
            for (let c_draw = 0; c_draw < window.MAP_COLS; c_draw++) {
                const tileType = window.mapData[r_draw][c_draw];
                const { x: screenX, y: screenY } = window.isoToScreen(c_draw, r_draw);
                
                switch (tileType) {
                    case window.TILE_TYPE.GRASS: window.drawDiamond(screenX, screenY, window.COLORS.grass, window.LightenDarkenColor(window.COLORS.grass, -30)); break;
                    case window.TILE_TYPE.WATER: window.drawDiamond(screenX, screenY, window.COLORS.water, window.LightenDarkenColor(window.COLORS.water, -30)); break;
                    case window.TILE_TYPE.SAND: window.drawDiamond(screenX, screenY, window.COLORS.sand, window.LightenDarkenColor(window.COLORS.sand, -30)); break;
                    case window.TILE_TYPE.CITY: window.drawDiamond(screenX, screenY, window.COLORS.cityGround, window.LightenDarkenColor(window.COLORS.cityGround, -20)); break;
                    case window.TILE_TYPE.MOUNTAIN: case window.TILE_TYPE.FOREST: window.drawDiamond(screenX, screenY, window.COLORS.grass, window.LightenDarkenColor(window.COLORS.grass, -30)); break;
                }
            }
        }

        // Layer 2: Tracks
        window.drawTracks(); 
        
        // Layer 3: Train (drawn BEFORE features)
        window.drawTrain(); 

        // Layer 3.5: Smoke Particles (drawn after train, before tall features)
        drawSmokeParticles();
        
        // Layer 4: Features (actual vertical parts of cities, mountains, forests) & City Names
        for (let r_draw = 0; r_draw < window.MAP_ROWS; r_draw++) {
            for (let c_draw = 0; c_draw < window.MAP_COLS; c_draw++) {
                const tileType = window.mapData[r_draw][c_draw];
                if (tileType === window.TILE_TYPE.CITY) {
                    window.drawCityBuildingsOnly(c_draw, r_draw); 
                    window.drawCityName(c_draw, r_draw); 
                } else if (tileType === window.TILE_TYPE.MOUNTAIN) {
                    window.drawMountainFeatureOnly(c_draw, r_draw); 
                } else if (tileType === window.TILE_TYPE.FOREST) {
                    window.drawForestTreesOnly(c_draw, r_draw); 
                }
            }
        }
    }

    function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}
    
    function init(){
        window.generateMap();
        // Re-sync map variables to window after generateMap
        window.mapData = map.mapData;
        window.featureLayouts = map.featureLayouts;
        window.placedCitiesCoords = map.placedCitiesCoords;
        window.availableCityNames = map.availableCityNames;
        window.trainPath = map.trainPath;
        gameLoop();
    }
    
    // Start the game
    init();
};