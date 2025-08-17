// Cut/paste ALL drawing functions from reference-design.html lines 146-990

import { COLORS, TILE_WIDTH_HALF, TILE_HEIGHT_HALF } from './constants.js';
import { LightenDarkenColor } from './utils.js';

export function drawDiamond(screenX, screenY, fillColor, strokeColor = null) { 
    const ctx = window.ctx; // Get from window
    ctx.beginPath(); 
    ctx.moveTo(screenX, screenY - TILE_HEIGHT_HALF); 
    ctx.lineTo(screenX + TILE_WIDTH_HALF, screenY);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT_HALF); 
    ctx.lineTo(screenX - TILE_WIDTH_HALF, screenY);
    ctx.closePath(); 
    ctx.fillStyle = fillColor; 
    ctx.fill();
    if (strokeColor) { 
        ctx.strokeStyle = strokeColor; 
        ctx.lineWidth = 1; 
        ctx.stroke(); 
    }
}

export function drawWheel(ctx, radius, phase, wheelColor, spokeColor) {
    // Main wheel
    ctx.fillStyle = wheelColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim
    ctx.strokeStyle = LightenDarkenColor(wheelColor, -50);
    ctx.lineWidth = Math.max(2, radius * 0.15);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // Multiple spokes (6 spokes like real train wheels)
    ctx.save();
    ctx.rotate(phase);
    ctx.strokeStyle = spokeColor;
    ctx.lineWidth = Math.max(2, radius * 0.12);
    
    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 6);
        ctx.beginPath();
        ctx.moveTo(radius * 0.2, 0);
        ctx.lineTo(radius * 0.75, 0);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    
    // Center hub
    ctx.fillStyle = LightenDarkenColor(wheelColor, -30);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
}

export function drawCoupler(ctx, x, y, angle, isRear = false) {
    const couplerLength = 8;
    const couplerHeight = 3;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    const xOffset = isRear ? -couplerLength/2 : couplerLength/2;
    ctx.fillStyle = '#444444';
    ctx.fillRect(xOffset - couplerLength/2, -couplerHeight/2, couplerLength, couplerHeight);
    
    // Coupler head
    ctx.fillStyle = '#333333';
    const headSize = 4;
    ctx.fillRect(xOffset + (isRear ? -couplerLength/2 : couplerLength/2) - headSize/2, -headSize/2, headSize, headSize);
    
    ctx.restore();
}

export function drawIsometricCar(ctx, carWidth, carHeight, carDepth, bodyColor, roofColor, details) {
    const halfWidth = carWidth / 2;
    const halfDepth = carDepth / 2;
    
    // Draw 3D isometric car body
    // Front face
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-halfWidth, -carHeight);
    ctx.lineTo(halfWidth, -carHeight);
    ctx.lineTo(halfWidth, 0);
    ctx.lineTo(-halfWidth, 0);
    ctx.closePath();
    ctx.fill();
    
    // Right side face (darker)
    ctx.fillStyle = LightenDarkenColor(bodyColor, -20);
    ctx.beginPath();
    ctx.moveTo(halfWidth, -carHeight);
    ctx.lineTo(halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth + halfDepth, -halfDepth);
    ctx.lineTo(halfWidth, 0);
    ctx.closePath();
    ctx.fill();
    
    // Top face (roof)
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(-halfWidth, -carHeight);
    ctx.lineTo(-halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth, -carHeight);
    ctx.closePath();
    ctx.fill();
    
    // Add details if provided
    if (details && details.windows) {
        ctx.fillStyle = details.windowColor || '#B3E5FC';
        const windowCount = details.windows;
        const windowWidth = carWidth / (windowCount + 1);
        const windowHeight = carHeight * 0.3;
        
        for(let i = 0; i < windowCount; i++) {
            const windowX = -halfWidth + windowWidth * 0.5 + i * windowWidth;
            ctx.fillRect(windowX, -carHeight * 0.8, windowWidth * 0.6, windowHeight);
        }
    }
    
    if (details && details.cargo) {
        ctx.fillStyle = details.cargoColor || '#6D4C41';
        // Draw cargo on top
        ctx.fillRect(-halfWidth * 0.6 + halfDepth * 0.2, -carHeight - halfDepth * 0.8, carWidth * 0.3, halfDepth * 0.4);
        ctx.fillRect(-halfWidth * 0.2 + halfDepth * 0.3, -carHeight - halfDepth * 0.9, carWidth * 0.4, halfDepth * 0.5);
    }
    
    // Outlines for definition
    ctx.strokeStyle = LightenDarkenColor(bodyColor, -50);
    ctx.lineWidth = 1;
    
    // Front face outline
    ctx.beginPath();
    ctx.moveTo(-halfWidth, -carHeight);
    ctx.lineTo(halfWidth, -carHeight);
    ctx.lineTo(halfWidth, 0);
    ctx.lineTo(-halfWidth, 0);
    ctx.closePath();
    ctx.stroke();
    
    // Side face outline
    ctx.beginPath();
    ctx.moveTo(halfWidth, -carHeight);
    ctx.lineTo(halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth + halfDepth, -halfDepth);
    ctx.lineTo(halfWidth, 0);
    ctx.stroke();
    
    // Top face outline
    ctx.beginPath();
    ctx.moveTo(-halfWidth, -carHeight);
    ctx.lineTo(-halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth + halfDepth, -carHeight - halfDepth);
    ctx.lineTo(halfWidth, -carHeight);
    ctx.stroke();
}

export function drawPassengerCar(ctx, carWidth, carHeight, wheelPhase, verticalAdjust) {
    const bodyColor = '#2E7D32';
    const roofColor = '#1B5E20';
    const carDepth = carHeight * 0.6;
    
    drawIsometricCar(ctx, carWidth, carHeight, carDepth, bodyColor, roofColor, {
        windows: 4,
        windowColor: '#B3E5FC'
    });
    
    // Wheels
    const wheelRadius = carHeight * 0.25;
    const wheelColor = '#2d2d2d';
    const spokeColor = '#aaaaaa';
    
    ctx.save();
    ctx.translate(carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase, wheelColor, spokeColor);
    ctx.restore();
    
    ctx.save();
    ctx.translate(-carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase + Math.PI / 3, wheelColor, spokeColor);
    ctx.restore();
}

export function drawFreightCar(ctx, carWidth, carHeight, wheelPhase, verticalAdjust) {
    const bodyColor = '#8D6E63';
    const roofColor = '#6D4C41';
    const carDepth = carHeight * 0.6;
    
    drawIsometricCar(ctx, carWidth, carHeight, carDepth, bodyColor, roofColor, {
        cargo: true,
        cargoColor: '#5D4037'
    });
    
    // Wheels
    const wheelRadius = carHeight * 0.25;
    const wheelColor = '#2d2d2d';
    const spokeColor = '#aaaaaa';
    
    ctx.save();
    ctx.translate(carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase, wheelColor, spokeColor);
    ctx.restore();
    
    ctx.save();
    ctx.translate(-carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase + Math.PI / 3, wheelColor, spokeColor);
    ctx.restore();
}

export function drawTankCar(ctx, carWidth, carHeight, wheelPhase, verticalAdjust) {
    const tankColor = '#37474F';
    const highlightColor = '#546E7A';
    const carDepth = carHeight * 0.5;
    const halfWidth = carWidth / 2;
    const halfDepth = carDepth / 2;
    const tankRadius = carHeight * 0.35;
    
    // Draw isometric cylindrical tank
    // Tank front (ellipse)
    ctx.fillStyle = tankColor;
    ctx.beginPath();
    ctx.ellipse(0, -tankRadius, halfWidth, tankRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tank body (3D cylinder sides)
    ctx.fillStyle = LightenDarkenColor(tankColor, -15);
    ctx.fillRect(-halfWidth, -tankRadius * 1.6, carWidth, tankRadius * 1.2);
    
    // Tank right side (darker)
    ctx.fillStyle = LightenDarkenColor(tankColor, -25);
    ctx.beginPath();
    ctx.ellipse(halfDepth, -tankRadius - halfDepth, halfWidth, tankRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Support frame (isometric)
    const frameColor = '#424242';
    ctx.fillStyle = frameColor;
    
    // Front support
    ctx.fillRect(-halfWidth, -carHeight * 0.1, carWidth, carHeight * 0.2);
    
    // Side support (isometric)
    ctx.fillStyle = LightenDarkenColor(frameColor, -20);
    ctx.beginPath();
    ctx.moveTo(halfWidth, -carHeight * 0.1);
    ctx.lineTo(halfWidth + halfDepth, -carHeight * 0.1 - halfDepth);
    ctx.lineTo(halfWidth + halfDepth, carHeight * 0.1 - halfDepth);
    ctx.lineTo(halfWidth, carHeight * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Tank details
    ctx.fillStyle = '#616161';
    ctx.fillRect(-3, -tankRadius * 1.8, 6, 8); // Valve
    
    // Wheels
    const wheelRadius = carHeight * 0.25;
    const wheelColor = '#2d2d2d';
    const spokeColor = '#aaaaaa';
    
    ctx.save();
    ctx.translate(carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase, wheelColor, spokeColor);
    ctx.restore();
    
    ctx.save();
    ctx.translate(-carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase + Math.PI / 3, wheelColor, spokeColor);
    ctx.restore();
    
    // Outlines
    ctx.strokeStyle = LightenDarkenColor(tankColor, -50);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -tankRadius, halfWidth, tankRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
}

export function drawCaboose(ctx, carWidth, carHeight, wheelPhase, verticalAdjust) {
    const bodyColor = '#C62828';
    const roofColor = '#B71C1C';
    const carDepth = carHeight * 0.6;
    
    drawIsometricCar(ctx, carWidth, carHeight, carDepth, bodyColor, roofColor, {
        windows: 2,
        windowColor: '#FFEB3B'
    });
    
    // Draw cupola (observation deck) - isometric style
    const cupolaWidth = carWidth * 0.4;
    const cupolaHeight = carHeight * 0.3;
    const cupolaDepth = carDepth * 0.7;
    const halfCupolaWidth = cupolaWidth / 2;
    const halfCupolaDepth = cupolaDepth / 2;
    
    // Cupola front face
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-halfCupolaWidth, -carHeight - cupolaHeight);
    ctx.lineTo(halfCupolaWidth, -carHeight - cupolaHeight);
    ctx.lineTo(halfCupolaWidth, -carHeight);
    ctx.lineTo(-halfCupolaWidth, -carHeight);
    ctx.closePath();
    ctx.fill();
    
    // Cupola side face
    ctx.fillStyle = LightenDarkenColor(bodyColor, -20);
    ctx.beginPath();
    ctx.moveTo(halfCupolaWidth, -carHeight - cupolaHeight);
    ctx.lineTo(halfCupolaWidth + halfCupolaDepth, -carHeight - cupolaHeight - halfCupolaDepth);
    ctx.lineTo(halfCupolaWidth + halfCupolaDepth, -carHeight - halfCupolaDepth);
    ctx.lineTo(halfCupolaWidth, -carHeight);
    ctx.closePath();
    ctx.fill();
    
    // Cupola roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(-halfCupolaWidth, -carHeight - cupolaHeight);
    ctx.lineTo(-halfCupolaWidth + halfCupolaDepth, -carHeight - cupolaHeight - halfCupolaDepth);
    ctx.lineTo(halfCupolaWidth + halfCupolaDepth, -carHeight - cupolaHeight - halfCupolaDepth);
    ctx.lineTo(halfCupolaWidth, -carHeight - cupolaHeight);
    ctx.closePath();
    ctx.fill();
    
    // Cupola windows
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(-cupolaWidth * 0.3, -carHeight - cupolaHeight * 0.7, cupolaWidth * 0.25, cupolaHeight * 0.4);
    ctx.fillRect(cupolaWidth * 0.05, -carHeight - cupolaHeight * 0.7, cupolaWidth * 0.25, cupolaHeight * 0.4);
    
    // Wheels
    const wheelRadius = carHeight * 0.25;
    const wheelColor = '#2d2d2d';
    const spokeColor = '#aaaaaa';
    
    ctx.save();
    ctx.translate(carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase, wheelColor, spokeColor);
    ctx.restore();
    
    ctx.save();
    ctx.translate(-carWidth * 0.25, carHeight * 0.15 * verticalAdjust);
    ctx.scale(1, 0.5);
    drawWheel(ctx, wheelRadius, wheelPhase + Math.PI / 3, wheelColor, spokeColor);
    ctx.restore();
}

export function drawEngine(ctx, engineWidth, engineHeight, wheelPhase, verticalAdjust) {
    /* A more detailed, classic steam-locomotive:
       - shaded cylindrical boiler
       - rear cab built with the shared isometric-car helper
       - chimney with lip
       - cow-catcher / pilot at the front
       - two large driving wheels linked by a connecting rod
    */
    
    // --- Basic dimensions ------------------------------------------------------
    const carDepth      = engineHeight * 0.6;       // same depth logic as other cars
    const boilerLength  = engineWidth  * 0.75;
    const boilerRadius  = engineHeight * 0.45;
    const cabWidth      = engineWidth  * 0.35;
    const halfDepth     = carDepth / 2;
    
    // --- Colours --------------------------------------------------------------
    const cabBodyColor  = COLORS.trainEngine;                 // keep red cab
    const cabRoofColor  = LightenDarkenColor(cabBodyColor,-30);
    const boilerColor   = LightenDarkenColor(cabBodyColor,-20);
    const chimneyColor  = COLORS.smokestack;
    const metalDark     = '#3e3e3e';
    const metalLight    = '#777777';
    
    // --------------------------------------------------------------------------
    // Draw CAB (reuse isometric helper; placed slightly behind boiler centre)
    // --------------------------------------------------------------------------
    ctx.save();
    ctx.translate(-engineWidth * 0.45, 0); // shift to the rear of loco
    drawIsometricCar(ctx, cabWidth, engineHeight * 0.9, carDepth,
                     cabBodyColor, cabRoofColor,
                     { windows: 1, windowColor: '#B3E5FC' });
    ctx.restore();
    
    // --------------------------------------------------------------------------
    // Draw BOILER – shaded cylinder
    // --------------------------------------------------------------------------
    // Body (rectangle side)
    ctx.fillStyle = LightenDarkenColor(boilerColor, -15);
    ctx.fillRect(-boilerLength * 0.5, -boilerRadius * 1.4,
                  boilerLength,           boilerRadius * 1.2);
    
    // Rear ellipse cap
    ctx.fillStyle = boilerColor;
    ctx.beginPath();
    ctx.ellipse(-boilerLength * 0.5, -boilerRadius,
                boilerRadius, boilerRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Front ellipse cap (darker for 3-D cue)
    ctx.fillStyle = LightenDarkenColor(boilerColor, -25);
    ctx.beginPath();
    ctx.ellipse( boilerLength * 0.5, -boilerRadius,
                 boilerRadius, boilerRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Thin outline on caps
    ctx.strokeStyle = LightenDarkenColor(boilerColor, -50);
    ctx.lineWidth   = 1;
    ['-','+'].forEach(sign => {
        const sx = (sign === '-') ? -boilerLength * 0.5 : boilerLength * 0.5;
        ctx.beginPath();
        ctx.ellipse(sx, -boilerRadius,
                    boilerRadius, boilerRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // --------------------------------------------------------------------------
    // Chimney / smokestack
    // --------------------------------------------------------------------------
    const chimneyWidth  = boilerRadius * 0.5;
    const chimneyHeight = boilerRadius * 1.1;
    const chimneyX      = boilerLength * 0.25;
    const chimneyY      = -boilerRadius * 1.8;
    
    // Lip / opening
    ctx.fillStyle = chimneyColor;
    ctx.beginPath();
    ctx.ellipse(chimneyX, chimneyY + chimneyHeight * 0.1,
                chimneyWidth, chimneyWidth * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Stack
    ctx.fillRect(chimneyX - chimneyWidth,
                 chimneyY,
                 chimneyWidth * 2,
                 chimneyHeight);
    
    // --------------------------------------------------------------------------
    // Cow-catcher (pilot)
    // --------------------------------------------------------------------------
    const catcherFront  =  boilerLength * 0.55;
    const catcherWidth  =  engineWidth  * 0.22;
    const catcherHeight =  engineHeight * 0.4;
    
    ctx.fillStyle = metalDark;
    ctx.beginPath();
    ctx.moveTo(catcherFront, 0);
    ctx.lineTo(catcherFront + catcherWidth, -catcherHeight * 0.5);
    ctx.lineTo(catcherFront + catcherWidth,  catcherHeight * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = metalLight;
    ctx.stroke();
    
    // --------------------------------------------------------------------------
    // Driving wheels (two big ones) + connecting rod
    // --------------------------------------------------------------------------
    const wheelRadius  = engineHeight * 0.28;
    const wheelColor   = '#2d2d2d';
    const spokeColor   = '#bbbbbb';
    
    const wheelPositions = [
        -engineWidth * 0.15,   // rear driver
         engineWidth * 0.20    // front driver
    ];
    
    wheelPositions.forEach((xPos, idx) => {
        ctx.save();
        ctx.translate(xPos, engineHeight * 0.15 * verticalAdjust);
        ctx.scale(1, 0.5); // isometric squash
        drawWheel(ctx, wheelRadius,
                  wheelPhase + (idx ? Math.PI / 3 : 0),
                  wheelColor, spokeColor);
        ctx.restore();
    });
    
    // Connecting rod (simple bar linking wheel hubs)
    ctx.strokeStyle = metalLight;
    ctx.lineWidth   = wheelRadius * 0.15;
    ctx.beginPath();
    ctx.moveTo(wheelPositions[0], engineHeight * 0.15 * verticalAdjust);
    ctx.lineTo(wheelPositions[1], engineHeight * 0.15 * verticalAdjust);
    ctx.stroke();
}

export function drawBuilding(centerX, baseY, buildingWidthHalf, buildingDepthHalf, buildingHeight, wallColor, roofColor) { 
    const ctx = window.ctx; // Get from window
    const screenYTop = baseY - buildingHeight;
    ctx.beginPath(); 
    ctx.moveTo(centerX, screenYTop - buildingDepthHalf); 
    ctx.lineTo(centerX + buildingWidthHalf, screenYTop);
    ctx.lineTo(centerX, screenYTop + buildingDepthHalf); 
    ctx.lineTo(centerX - buildingWidthHalf, screenYTop); 
    ctx.closePath();
    ctx.fillStyle = roofColor; 
    ctx.fill(); 
    ctx.strokeStyle = LightenDarkenColor(roofColor, -30); 
    ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(centerX - buildingWidthHalf, screenYTop); 
    ctx.lineTo(centerX, screenYTop + buildingDepthHalf);
    ctx.lineTo(centerX, baseY + buildingDepthHalf); 
    ctx.lineTo(centerX - buildingWidthHalf, baseY); 
    ctx.closePath();
    ctx.fillStyle = wallColor; 
    ctx.fill(); 
    ctx.strokeStyle = LightenDarkenColor(wallColor, -30); 
    ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(centerX + buildingWidthHalf, screenYTop); 
    ctx.lineTo(centerX, screenYTop + buildingDepthHalf);
    ctx.lineTo(centerX, baseY + buildingDepthHalf); 
    ctx.lineTo(centerX + buildingWidthHalf, baseY); 
    ctx.closePath();
    ctx.fillStyle = LightenDarkenColor(wallColor, -20); 
    ctx.fill(); 
    ctx.strokeStyle = LightenDarkenColor(wallColor, -50); 
    ctx.stroke();
}

export function drawCityBuildingsOnly(isoX, isoY) {
    const { x: tileCenterX, y: tileCenterY } = window.isoToScreen(isoX, isoY);
    const cityKey = `city-${isoX}-${isoY}`; 
    if (window.featureLayouts[cityKey] && window.featureLayouts[cityKey].buildings) {
        window.featureLayouts[cityKey].buildings.forEach(b => {
            drawBuilding(tileCenterX + b.offsetX, tileCenterY + b.offsetY, 
                        b.buildingWidthHalf, b.buildingDepthHalf, b.buildingHeight, 
                        b.wallColor, b.roofColor);
        });
    } else {
        console.warn(`No building layout for city at ${isoX},${isoY} during drawCityBuildingsOnly.`);
    }
}

export function drawMountainFeatureOnly(isoX, isoY) {
    const ctx = window.ctx; // Get from window
    const { x: screenX, y: screenYBase } = window.isoToScreen(isoX, isoY);
    const mountainHeight = TILE_HEIGHT_HALF * (3 + window.seededRandom(isoX, isoY, 100) * 2); 
    const screenYPeak = screenYBase - mountainHeight;
    
    ctx.beginPath(); 
    ctx.moveTo(screenX, screenYPeak); 
    ctx.lineTo(screenX - TILE_WIDTH_HALF, screenYBase); 
    ctx.lineTo(screenX, screenYBase + TILE_HEIGHT_HALF); 
    ctx.closePath();
    ctx.fillStyle = COLORS.mountain; 
    ctx.fill(); 
    ctx.strokeStyle = LightenDarkenColor(COLORS.mountain, -30); 
    ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(screenX, screenYPeak); 
    ctx.lineTo(screenX + TILE_WIDTH_HALF, screenYBase); 
    ctx.lineTo(screenX, screenYBase + TILE_HEIGHT_HALF); 
    ctx.closePath();
    ctx.fillStyle = LightenDarkenColor(COLORS.mountain, -20); 
    ctx.fill(); 
    ctx.strokeStyle = LightenDarkenColor(COLORS.mountain, -50); 
    ctx.stroke();
    if(mountainHeight > TILE_HEIGHT_HALF * 4){ 
        ctx.beginPath();
        ctx.moveTo(screenX, screenYPeak);
        ctx.lineTo(screenX + TILE_WIDTH_HALF * 0.4, screenYPeak + mountainHeight * 0.3);
        ctx.lineTo(screenX, screenYPeak + mountainHeight * 0.4);
        ctx.lineTo(screenX - TILE_WIDTH_HALF * 0.4, screenYPeak + mountainHeight * 0.3);
        ctx.closePath();
        ctx.fillStyle = COLORS.mountainSnow;
        ctx.fill();
    }
}

export function drawForestTreesOnly(isoX, isoY) {
    const ctx = window.ctx; // Get from window
    const { x: screenX, y: screenYBase } = window.isoToScreen(isoX, isoY);
    const forestKey = `forest-${isoX}-${isoY}`; 
    if (window.featureLayouts[forestKey] && window.featureLayouts[forestKey].trees) { 
        window.featureLayouts[forestKey].trees.forEach(p => {
            const tCX = screenX + p.dx;
            const tBY = screenYBase + p.dy;
            const trH = TILE_HEIGHT_HALF * 1.5 * p.scale;
            const cR = TILE_WIDTH_HALF * 0.3 * p.scale;
            const cCY = tBY - trH;
            ctx.fillStyle = COLORS.forestTrunk;
            ctx.fillRect(tCX - 3 * p.scale, tBY - trH, 6 * p.scale, trH);
            ctx.beginPath();
            ctx.arc(tCX, cCY, cR, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.forestCanopy;
            ctx.fill();
            ctx.strokeStyle = LightenDarkenColor(COLORS.forestCanopy, -30);
            ctx.stroke();
        });
    } else {
         console.warn(`No tree layout for forest at ${isoX},${isoY} during drawForestTreesOnly.`);
    }
}

export function drawCityName(isoX, isoY){
    const ctx = window.ctx; // Get from window
    const { x: tileCenterX, y: tileCenterY } = window.isoToScreen(isoX, isoY);
    const cityKey = `city-${isoX}-${isoY}`;
    if(window.featureLayouts[cityKey] && window.featureLayouts[cityKey].name){
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        const nameTxt = window.featureLayouts[cityKey].name;
        const txtMet = ctx.measureText(nameTxt);
        const txtW = txtMet.width;
        const txtH = 12;
        const pad = 4;
        const nX = tileCenterX;
        const nY = tileCenterY - TILE_HEIGHT_HALF * 2.0 - txtH; 
        ctx.fillStyle = COLORS.cityNameBackground;
        ctx.fillRect(nX - txtW/2 - pad, nY - txtH - pad + 2, txtW + pad * 2, txtH + pad * 2 - 2);
        ctx.fillStyle = COLORS.cityNameText;
        ctx.fillText(nameTxt, nX, nY);
    }
}

export function drawTracks() { 
    const ctx = window.ctx; // Get from window
    if(window.trainPath.length < 2) return;
    ctx.strokeStyle = COLORS.track;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const fP = window.isoToScreen(window.trainPath[0].x, window.trainPath[0].y);
    ctx.moveTo(fP.x, fP.y);
    for(let i = 1; i < window.trainPath.length; i++){
        const p = window.isoToScreen(window.trainPath[i].x, window.trainPath[i].y);
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
}

export function drawTrain() {
    const ctx = window.ctx; // Get from window
    if(window.trainPath.length < 2) return;
    const carriageBodyWidth = TILE_WIDTH_HALF * 0.65; 
    const carriageBodyHeight = TILE_HEIGHT_HALF * 0.75;

    // Store carriage positions for coupler drawing
    const carriagePositions = [];

    for(let k = 0; k < window.train.numCarriages; k++) {
        let currentCarriageProgress;
        if (k === 0) {
            // Locomotive - no offset
            currentCarriageProgress = window.train.progress;
        } else if (k === 1) {
            // First car after locomotive - add small extra spacing to match visual gap between other cars
            // Locomotive is 1.4x longer, so we need about 0.2-0.3 extra spacing
            currentCarriageProgress = window.train.progress - (window.train.carriageSpacingProgress + 0.25);
        } else {
            // Subsequent cars - standard spacing plus the initial extra gap
            currentCarriageProgress = window.train.progress - ((k - 1) * window.train.carriageSpacingProgress + window.train.carriageSpacingProgress + 0.25);
        }
        let currentCarriageSegmentIdx = window.train.segmentIndex;

        while(currentCarriageProgress < 0) {
            const numSegments = window.trainPath.length > 1 ? window.trainPath.length - 1 : 1;
            currentCarriageSegmentIdx = (currentCarriageSegmentIdx - 1 + numSegments) % numSegments;
            currentCarriageProgress += 1.0; 
        }
        
        if (currentCarriageSegmentIdx < 0 || currentCarriageSegmentIdx >= window.trainPath.length - 1) {
            continue; 
        }

        const p1 = window.isoToScreen(window.trainPath[currentCarriageSegmentIdx].x, window.trainPath[currentCarriageSegmentIdx].y);
        const p2 = window.isoToScreen(window.trainPath[currentCarriageSegmentIdx + 1].x, window.trainPath[currentCarriageSegmentIdx + 1].y);

        const carX = p1.x + (p2.x - p1.x) * currentCarriageProgress;
        const carY = p1.y + (p2.y - p1.y) * currentCarriageProgress;
        
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        // Flip if the train is moving left-ish on screen (dx_screen < 0)
        const facingDown = Math.abs(angle) > Math.PI/2;
        const verticalAdjust = facingDown ? -1 : 1; // This verticalAdjust is not directly used by car drawing functions anymore, but good to keep consistent if any part refers to it.

        // Store position for coupler drawing
        carriagePositions.push({ x: carX, y: carY, angle: angle });

        const carriageType = window.train.carriageTypes[k] || 'freight';
        const carWidth = carriageBodyWidth * (carriageType === 'engine' ? 1.4 : 1); 
        const carHeight = carriageBodyHeight * (carriageType === 'engine' ? 1.15 : 1);

        // Draw the appropriate carriage type
        ctx.save(); 
        ctx.translate(carX, carY); 
        ctx.rotate(angle);         
        if (facingDown) {
            ctx.scale(1, -1); // Flip vertically to keep cars upright in both directions
        }
        
        const adj = 1; // Always draw upright
        
        switch(carriageType) {
            case 'engine':
                drawEngine(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
                break;
            case 'passenger':
                drawPassengerCar(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
                break;
            case 'freight':
                drawFreightCar(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
                break;
            case 'tank':
                drawTankCar(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
                break;
            case 'caboose':
                drawCaboose(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
                break;
            default:
                drawFreightCar(ctx, carWidth, carHeight, window.train.wheelPhase, adj);
        }
        ctx.restore();

        // Handle engine smoke
        if (carriageType === 'engine') {
            const smokestackWidth = carWidth * 0.15;
            const smokestackHeight = carHeight * 0.7;
            
            const baseSmokestackLocalY = -(carHeight / 2 + smokestackHeight / 2);
            const localSmokestackX = carWidth * 0.30;
            const localSmokestackY = baseSmokestackLocalY * verticalAdjust;

            const rotatedSmokestackOffsetX = localSmokestackX * Math.cos(angle) - localSmokestackY * Math.sin(angle);
            const rotatedSmokestackOffsetY = localSmokestackX * Math.sin(angle) + localSmokestackY * Math.cos(angle);

            const smokestackScreenX = carX + rotatedSmokestackOffsetX;
            const smokestackScreenY = carY + rotatedSmokestackOffsetY;

            // Draw smokestack
            ctx.save();
            ctx.translate(smokestackScreenX, smokestackScreenY);
            ctx.fillStyle = COLORS.smokestack;
            ctx.fillRect(-smokestackWidth / 2, -smokestackHeight / 2, smokestackWidth, smokestackHeight);
            ctx.restore();
            
            // Spawn smoke
            const wheelRotationCycle = (window.train.wheelPhase % (Math.PI * 2)) / (Math.PI * 2);
            const puffRate = 1.5 + window.train.speed * 4;
            
            if (Math.random() < puffRate && wheelRotationCycle < 0.7) {
               window.spawnSmokeParticle(
                   smokestackScreenX, 
                   smokestackScreenY - smokestackHeight / 2,
                   angle,
                   window.train.speed
               );
            }
        }
    }
}

export function drawSmokeParticles() {
    const ctx = window.ctx; // Get from window
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

// No window exports here - main.js will handle that