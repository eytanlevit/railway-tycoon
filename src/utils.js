// Cut/paste from reference-design.html lines 103-122

export function isoToScreen(isoX, isoY) {
    // Will read originX/originY from window (set by main.js)
    const screenX = window.originX + (isoX - isoY) * window.TILE_WIDTH_HALF;
    const screenY = window.originY + (isoX + isoY) * window.TILE_HEIGHT_HALF;
    return { x: screenX, y: screenY };
}

export function LightenDarkenColor(col, amt) {
    let usePound = false; 
    if (col[0] === "#") { 
        col = col.slice(1); 
        usePound = true; 
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt; 
    if (r > 255) r = 255; 
    else if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) + amt; 
    if (g > 255) g = 255; 
    else if (g < 0) g = 0;
    let b = (num & 0x0000FF) + amt; 
    if (b > 255) b = 255; 
    else if (b < 0) b = 0;
    return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

export function seededRandom(x, y, seed = 0) {
    const x_val = Number(x) || 0.1; 
    const y_val = Number(y) || 0.1; 
    const seed_val = Number(seed) || 0.1;
    let val = Math.sin(x_val * 12.9898 + y_val * 78.233 + seed_val * 5.4321) * 43758.5453123;
    return val - Math.floor(val); 
}

// No window exports here - main.js will handle that