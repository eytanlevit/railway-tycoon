(() => {
  // Canvas and DPI setup
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap for perf
  const mapCanvas = document.getElementById('mapCanvas');
  const mapCtx = mapCanvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const minimapCtx = minimapCanvas.getContext('2d');

  // Controls
  const btnIn = document.getElementById('zoomIn');
  const btnOut = document.getElementById('zoomOut');
  const btnReset = document.getElementById('resetView');

  // World configuration
  const WORLD_SIZE = 1024; // square world for simplicity/perf
  const worldCanvas = document.createElement('canvas');
  worldCanvas.width = WORLD_SIZE;
  worldCanvas.height = WORLD_SIZE;
  const worldCtx = worldCanvas.getContext('2d', { willReadFrequently: true });

  // Viewport in world coordinates
  const viewport = { x: 0, y: 0, w: WORLD_SIZE, h: WORLD_SIZE };

  // Minimap configuration
  const MINIMAP_SIZE = 200; // CSS pixels

  // Seeded pseudo-random helpers
  function hash2i(x, y, seed) {
    // 2D integer hash, deterministic
    let h = (x * 0x27d4eb2d) ^ (y * 0x165667b1) ^ seed;
    h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function rand01FromHash(h) {
    return (h & 0xffffffff) / 0xffffffff;
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function valueNoise2D(x, y, freq, seed) {
    // Value noise on integer lattice with bilinear interpolation
    const xf = x * freq;
    const yf = y * freq;
    const x0 = Math.floor(xf), y0 = Math.floor(yf);
    const tx = xf - x0, ty = yf - y0;

    const h00 = rand01FromHash(hash2i(x0, y0, seed));
    const h10 = rand01FromHash(hash2i(x0 + 1, y0, seed));
    const h01 = rand01FromHash(hash2i(x0, y0 + 1, seed));
    const h11 = rand01FromHash(hash2i(x0 + 1, y0 + 1, seed));

    const sx = smoothstep(tx);
    const sy = smoothstep(ty);
    const ix0 = h00 + (h10 - h00) * sx;
    const ix1 = h01 + (h11 - h01) * sx;
    return ix0 + (ix1 - ix0) * sy;
  }

  function fractalNoise2D(x, y, seed, octaves = 4, lacunarity = 2.0, gain = 0.5, baseFreq = 1 / 256) {
    let amp = 1.0, freq = baseFreq, sum = 0.0, norm = 0.0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * valueNoise2D(x, y, freq, seed + i * 1013);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm; // roughly 0..1
  }

  // Terrain generation
  const SEED_ELEV = 1337;
  const SEED_MOIST = 4242;
  const SEED_LAKES = 7777;

  function generateWorld() {
    const img = worldCtx.createImageData(WORLD_SIZE, WORLD_SIZE);
    const data = img.data;
    let i = 0;
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        // Normalize coordinates to center bias to create continents feel
        const nx = (x / WORLD_SIZE) * 2 - 1;
        const ny = (y / WORLD_SIZE) * 2 - 1;

        // Radial falloff for islands/continents
        const r = Math.hypot(nx, ny);
        const falloff = Math.max(0, 1 - r * 0.9);

        // Elevation and moisture
        const elevation = Math.min(1, Math.max(0,
          0.12 + 0.88 * fractalNoise2D(x, y, SEED_ELEV, 5, 2.0, 0.55, 1 / 280) * 0.9 + falloff * 0.35
        ));

        const moisture = Math.min(1, Math.max(0,
          fractalNoise2D(x + 1000, y - 2000, SEED_MOIST, 5, 2.3, 0.55, 1 / 220)
        ));

        // Lake mask to sprinkle inland lakes
        const lakeMask = fractalNoise2D(x - 5000, y + 3500, SEED_LAKES, 4, 2.2, 0.6, 1 / 160);

        // Classification thresholds
        let type;
        if (elevation < 0.32) {
          type = 'ocean';
        } else if (elevation < 0.40 && lakeMask < 0.48) {
          type = 'lake';
        } else if (elevation > 0.80) {
          type = 'mountain';
        } else if (elevation > 0.62) {
          type = 'hills';
        } else if (moisture < 0.28) {
          type = 'desert';
        } else if (moisture > 0.62) {
          type = 'farm';
        } else {
          type = 'land';
        }

        // Color palette
        let rC = 0, gC = 0, bC = 0;
        switch (type) {
          case 'ocean': {
            // Deeper blue for deeper ocean
            const depth = Math.min(1, (0.32 - elevation) / 0.32);
            rC = 18 - 6 * depth;
            gC = 60 - 12 * depth;
            bC = 130 + 70 * depth;
            break;
          }
          case 'lake': {
            rC = 59; gC = 130; bC = 246; // blue-500
            break;
          }
          case 'desert': {
            rC = 233; gC = 216; bC = 166; // sand
            break;
          }
          case 'farm': {
            // vibrant farmland green with slight variation from moisture
            const v = 0.1 * (moisture - 0.62) / 0.38;
            rC = Math.round(80 - 20 * v);
            gC = Math.round(185 + 40 * v);
            bC = Math.round(110 - 10 * v);
            break;
          }
          case 'land': {
            rC = 147; gC = 197; bC = 114; // soft green
            break;
          }
          case 'hills': {
            rC = 107; gC = 142; bC = 35; // olive drab
            break;
          }
          case 'mountain': {
            // rocky to snowy peak gradient
            const t = Math.min(1, (elevation - 0.80) / 0.20);
            rC = Math.round(141 + (237 - 141) * t);
            gC = Math.round(153 + (242 - 153) * t);
            bC = Math.round(174 + (244 - 174) * t);
            break;
          }
        }

        data[i++] = rC; // R
        data[i++] = gC; // G
        data[i++] = bC; // B
        data[i++] = 255; // A
      }
    }
    worldCtx.putImageData(img, 0, 0);
  }

  // Canvas sizing
  function resize() {
    // Map canvas
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    mapCanvas.width = Math.max(1, Math.floor(w * dpr));
    mapCanvas.height = Math.max(1, Math.floor(h * dpr));
    mapCanvas.style.width = w + 'px';
    mapCanvas.style.height = h + 'px';
    mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Minimap
    const mm = MINIMAP_SIZE;
    minimapCanvas.width = Math.floor(mm * dpr);
    minimapCanvas.height = Math.floor(mm * dpr);
    minimapCanvas.style.width = mm + 'px';
    minimapCanvas.style.height = mm + 'px';
    minimapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function draw() {
    // Draw current viewport to full canvas
    const cw = mapCanvas.width / dpr;
    const ch = mapCanvas.height / dpr;
    mapCtx.clearRect(0, 0, cw, ch);
    mapCtx.imageSmoothingEnabled = false;
    mapCtx.drawImage(
      worldCanvas,
      viewport.x, viewport.y, viewport.w, viewport.h,
      0, 0, cw, ch
    );

    drawMinimap();
  }

  function drawMinimap() {
    const mm = MINIMAP_SIZE;
    minimapCtx.clearRect(0, 0, mm, mm);
    minimapCtx.imageSmoothingEnabled = false;
    minimapCtx.drawImage(worldCanvas, 0, 0, WORLD_SIZE, WORLD_SIZE, 0, 0, mm, mm);

    // Viewport rectangle overlay
    const scale = mm / WORLD_SIZE;
    const rx = viewport.x * scale;
    const ry = viewport.y * scale;
    const rw = viewport.w * scale;
    const rh = viewport.h * scale;

    minimapCtx.save();
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.9)';
    minimapCtx.strokeRect(rx, ry, rw, rh);
    minimapCtx.restore();
  }

  // Interaction: panning
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let viewportStart = { x: 0, y: 0 };

  mapCanvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    viewportStart = { x: viewport.x, y: viewport.y };
  });
  window.addEventListener('mouseup', () => { isPanning = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const cw = mapCanvas.width / dpr;
    const ch = mapCanvas.height / dpr;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    const sx = (dx / cw) * viewport.w;
    const sy = (dy / ch) * viewport.h;
    viewport.x = clamp(viewportStart.x - sx, 0, WORLD_SIZE - viewport.w);
    viewport.y = clamp(viewportStart.y - sy, 0, WORLD_SIZE - viewport.h);
    draw();
  });

  // Interaction: zoom via wheel (focus at cursor)
  mapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY); // - down, + up
    const factor = delta > 0 ? 0.85 : 1.15; // zoom in/out by scaling viewport
    zoomAt(e.clientX, e.clientY, factor);
  }, { passive: false });

  function zoomAt(clientX, clientY, factor) {
    const cw = mapCanvas.width / dpr;
    const ch = mapCanvas.height / dpr;
    const mx = (clientX / cw); // 0..1 across canvas
    const my = (clientY / ch);

    // World coordinate at mouse before zoom
    const wx = viewport.x + viewport.w * mx;
    const wy = viewport.y + viewport.h * my;

    // New viewport size
    const minW = Math.max(64, WORLD_SIZE / 16); // limit max zoom-in
    const maxW = WORLD_SIZE; // zoom-out to full map
    const newW = clamp(viewport.w * factor, minW, maxW);
    const newH = clamp(viewport.h * factor, minW, maxW);

    // Adjust x,y so that (wx, wy) stays under cursor
    viewport.x = clamp(wx - newW * mx, 0, WORLD_SIZE - newW);
    viewport.y = clamp(wy - newH * my, 0, WORLD_SIZE - newH);
    viewport.w = newW;
    viewport.h = newH;
    draw();
  }

  // Buttons
  btnIn.addEventListener('click', () => {
    const rect = mapCanvas.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, 0.85);
  });
  btnOut.addEventListener('click', () => {
    const rect = mapCanvas.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, 1.15);
  });
  btnReset.addEventListener('click', () => {
    viewport.x = 0; viewport.y = 0; viewport.w = WORLD_SIZE; viewport.h = WORLD_SIZE; draw();
  });

  // Minimap click to reposition view center
  minimapCanvas.addEventListener('mousedown', (e) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const scale = MINIMAP_SIZE / WORLD_SIZE;
    const wx = x / scale;
    const wy = y / scale;
    viewport.x = clamp(wx - viewport.w / 2, 0, WORLD_SIZE - viewport.w);
    viewport.y = clamp(wy - viewport.h / 2, 0, WORLD_SIZE - viewport.h);
    draw();
  });

  // Init
  generateWorld();
  resize();
  window.addEventListener('resize', resize);
})();

