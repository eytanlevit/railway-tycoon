class RailwayTycoonGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        this.mapWidth = 50;
        this.mapHeight = 50;
        this.tileWidth = 64;
        this.tileHeight = 32;
        
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoveredTile = null;
        this.showGrid = false;
        
        this.terrainTypes = {
            WATER: { 
                color: '#1e88e5',
                darkColor: '#1565c0',
                lightColor: '#42a5f5',
                name: 'Water',
                height: 0
            },
            GRASS: { 
                color: '#66bb6a',
                darkColor: '#43a047',
                lightColor: '#81c784',
                name: 'Grassland',
                height: 1
            },
            DESERT: { 
                color: '#ffb74d',
                darkColor: '#fb8c00',
                lightColor: '#ffcc80',
                name: 'Desert',
                height: 1
            },
            MOUNTAIN: { 
                color: '#8d6e63',
                darkColor: '#6d4c41',
                lightColor: '#a1887f',
                name: 'Mountains',
                height: 2
            }
        };
        
        this.map = this.generateMap();
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.centerCamera();
        this.updateMinimap();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Make canvas square, using the smaller dimension
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Center the canvas
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.canvas.style.left = (window.innerWidth - size) / 2 + 'px';
        this.canvas.style.top = (window.innerHeight - size) / 2 + 'px';
        
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 200;
        
        window.addEventListener('resize', () => {
            const newSize = Math.min(window.innerWidth, window.innerHeight);
            this.canvas.width = newSize;
            this.canvas.height = newSize;
            this.canvas.style.width = newSize + 'px';
            this.canvas.style.height = newSize + 'px';
            this.canvas.style.left = (window.innerWidth - newSize) / 2 + 'px';
            this.canvas.style.top = (window.innerHeight - newSize) / 2 + 'px';
        });
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('toggle-grid').addEventListener('click', () => this.toggleGrid());
    }
    
    generateMap() {
        const map = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const value = this.getTerrainNoise(x, y);
                let terrain;
                
                if (value < 0.25) {
                    terrain = 'WATER';
                } else if (value < 0.5) {
                    terrain = 'GRASS';
                } else if (value < 0.75) {
                    terrain = 'DESERT';
                } else {
                    terrain = 'MOUNTAIN';
                }
                
                map[y][x] = terrain;
            }
        }
        
        this.smoothTerrain(map);
        
        return map;
    }
    
    getTerrainNoise(x, y) {
        const scale1 = 0.05;
        const scale2 = 0.1;
        const scale3 = 0.2;
        
        const noise1 = this.simpleNoise(x * scale1, y * scale1) * 0.5;
        const noise2 = this.simpleNoise(x * scale2, y * scale2) * 0.3;
        const noise3 = this.simpleNoise(x * scale3, y * scale3) * 0.2;
        
        return (noise1 + noise2 + noise3 + 1) / 2;
    }
    
    simpleNoise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }
    
    smoothTerrain(map) {
        for (let i = 0; i < 2; i++) {
            for (let y = 1; y < this.mapHeight - 1; y++) {
                for (let x = 1; x < this.mapWidth - 1; x++) {
                    const neighbors = this.getNeighborCounts(map, x, y);
                    const current = map[y][x];
                    
                    if (current === 'MOUNTAIN' && neighbors.MOUNTAIN < 2) {
                        map[y][x] = 'DESERT';
                    } else if (current === 'WATER' && neighbors.WATER < 3) {
                        map[y][x] = 'GRASS';
                    }
                }
            }
        }
    }
    
    getNeighborCounts(map, x, y) {
        const counts = { WATER: 0, GRASS: 0, DESERT: 0, MOUNTAIN: 0 };
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < this.mapHeight && nx >= 0 && nx < this.mapWidth) {
                    counts[map[ny][nx]]++;
                }
            }
        }
        
        return counts;
    }
    
    screenToIso(screenX, screenY) {
        const x = (screenX - this.camera.x) / this.camera.zoom;
        const y = (screenY - this.camera.y) / this.camera.zoom;
        
        const isoX = (x / (this.tileWidth / 2) + y / (this.tileHeight / 2)) / 2;
        const isoY = (y / (this.tileHeight / 2) - x / (this.tileWidth / 2)) / 2;
        
        return { x: Math.floor(isoX), y: Math.floor(isoY) };
    }
    
    isoToScreen(isoX, isoY) {
        const x = (isoX - isoY) * (this.tileWidth / 2);
        const y = (isoX + isoY) * (this.tileHeight / 2);
        
        return {
            x: x * this.camera.zoom + this.camera.x,
            y: y * this.camera.zoom + this.camera.y
        };
    }
    
    drawTile(x, y, terrain) {
        const screen = this.isoToScreen(x, y);
        const tileW = this.tileWidth * this.camera.zoom;
        const tileH = this.tileHeight * this.camera.zoom;
        const terrainData = this.terrainTypes[terrain];
        const height = terrainData.height * 8 * this.camera.zoom;
        
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        
        if (height > 0 && terrain !== 'WATER') {
            this.ctx.fillStyle = terrainData.darkColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(tileW / 2, tileH / 2);
            this.ctx.lineTo(tileW / 2, tileH / 2 + height);
            this.ctx.lineTo(0, tileH + height);
            this.ctx.lineTo(0, tileH);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = terrainData.lightColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-tileW / 2, tileH / 2);
            this.ctx.lineTo(-tileW / 2, tileH / 2 + height);
            this.ctx.lineTo(0, tileH + height);
            this.ctx.lineTo(0, tileH);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.translate(0, -height);
        }
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, tileH);
        gradient.addColorStop(0, terrainData.lightColor);
        gradient.addColorStop(0.5, terrainData.color);
        gradient.addColorStop(1, terrainData.darkColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(tileW / 2, tileH / 2);
        this.ctx.lineTo(0, tileH);
        this.ctx.lineTo(-tileW / 2, tileH / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (this.showGrid) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        if (terrain === 'WATER') {
            const time = Date.now() * 0.001;
            const waveOffset = Math.sin(time + x * 0.5 + y * 0.5) * 2;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.beginPath();
            this.ctx.arc(0, tileH / 2 + waveOffset, tileW / 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (terrain === 'MOUNTAIN') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -height);
            this.ctx.lineTo(tileW / 6, tileH / 4 - height);
            this.ctx.lineTo(0, tileH / 3 - height);
            this.ctx.lineTo(-tileW / 6, tileH / 4 - height);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    render() {
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startTile = this.screenToIso(-this.tileWidth * 2, -this.tileHeight * 2);
        const endTile = this.screenToIso(
            this.canvas.width + this.tileWidth * 2,
            this.canvas.height + this.tileHeight * 2
        );
        
        const tilesOrder = [];
        for (let y = Math.max(0, startTile.y - 2); y < Math.min(this.mapHeight, endTile.y + 2); y++) {
            for (let x = Math.max(0, startTile.x - 2); x < Math.min(this.mapWidth, endTile.x + 2); x++) {
                if (this.map[y] && this.map[y][x]) {
                    tilesOrder.push({ x, y, terrain: this.map[y][x] });
                }
            }
        }
        
        tilesOrder.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        
        for (const tile of tilesOrder) {
            this.drawTile(tile.x, tile.y, tile.terrain);
        }
        
        this.updateUI();
    }
    
    updateMinimap() {
        const scale = 4;
        
        this.minimapCtx.fillStyle = '#0a0a0f';
        this.minimapCtx.fillRect(0, 0, 200, 200);
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const terrain = this.map[y][x];
                this.minimapCtx.fillStyle = this.terrainTypes[terrain].color;
                this.minimapCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        
        const viewportX = (-this.camera.x / this.camera.zoom) / this.tileWidth * scale + 100;
        const viewportY = (-this.camera.y / this.camera.zoom) / this.tileHeight * scale + 100;
        const viewportW = (this.canvas.width / this.camera.zoom) / this.tileWidth * scale;
        const viewportH = (this.canvas.height / this.camera.zoom) / this.tileHeight * scale;
        
        const viewport = document.getElementById('minimap-viewport');
        viewport.style.left = `${Math.max(0, Math.min(200 - viewportW, viewportX))}px`;
        viewport.style.top = `${Math.max(0, Math.min(200 - viewportH, viewportY))}px`;
        viewport.style.width = `${Math.min(200, viewportW)}px`;
        viewport.style.height = `${Math.min(200, viewportH)}px`;
    }
    
    updateUI() {
        document.getElementById('zoom-level').textContent = `${Math.round(this.camera.zoom * 100)}%`;
        const centerTile = this.screenToIso(this.canvas.width / 2, this.canvas.height / 2);
        document.getElementById('map-position').textContent = `${centerTile.x}, ${centerTile.y}`;
        
        if (this.hoveredTile) {
            const terrain = this.map[this.hoveredTile.y] && this.map[this.hoveredTile.y][this.hoveredTile.x];
            if (terrain) {
                const info = document.getElementById('hover-info');
                const tileInfo = document.getElementById('tile-info');
                tileInfo.textContent = `${this.terrainTypes[terrain].name} (${this.hoveredTile.x}, ${this.hoveredTile.y})`;
                info.classList.add('visible');
            }
        } else {
            document.getElementById('hover-info').classList.remove('visible');
        }
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.camera.x += deltaX;
            this.camera.y += deltaY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.updateMinimap();
        } else {
            const tile = this.screenToIso(e.clientX, e.clientY);
            if (tile.x >= 0 && tile.x < this.mapWidth && tile.y >= 0 && tile.y < this.mapHeight) {
                this.hoveredTile = tile;
            } else {
                this.hoveredTile = null;
            }
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomSpeed = 0.1;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const worldX = (mouseX - this.camera.x) / this.camera.zoom;
        const worldY = (mouseY - this.camera.y) / this.camera.zoom;
        
        if (e.deltaY < 0) {
            this.camera.zoom = Math.min(3, this.camera.zoom * (1 + zoomSpeed));
        } else {
            this.camera.zoom = Math.max(0.3, this.camera.zoom * (1 - zoomSpeed));
        }
        
        this.camera.x = mouseX - worldX * this.camera.zoom;
        this.camera.y = mouseY - worldY * this.camera.zoom;
        
        this.updateMinimap();
    }
    
    zoomIn() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const worldX = (centerX - this.camera.x) / this.camera.zoom;
        const worldY = (centerY - this.camera.y) / this.camera.zoom;
        
        this.camera.zoom = Math.min(3, this.camera.zoom * 1.2);
        
        this.camera.x = centerX - worldX * this.camera.zoom;
        this.camera.y = centerY - worldY * this.camera.zoom;
        
        this.updateMinimap();
    }
    
    zoomOut() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const worldX = (centerX - this.camera.x) / this.camera.zoom;
        const worldY = (centerY - this.camera.y) / this.camera.zoom;
        
        this.camera.zoom = Math.max(0.3, this.camera.zoom * 0.8);
        
        this.camera.x = centerX - worldX * this.camera.zoom;
        this.camera.y = centerY - worldY * this.camera.zoom;
        
        this.updateMinimap();
    }
    
    resetView() {
        this.centerCamera();
        this.updateMinimap();
    }
    
    centerCamera() {
        // Center the map in the viewport
        const mapScreenWidth = this.mapWidth * this.tileWidth / 2 + this.mapHeight * this.tileWidth / 2;
        const mapScreenHeight = this.mapWidth * this.tileHeight / 2 + this.mapHeight * this.tileHeight / 2;
        
        // Calculate zoom to fit the map in viewport (with some padding)
        const zoomX = (this.canvas.width * 0.8) / mapScreenWidth;
        const zoomY = (this.canvas.height * 0.8) / mapScreenHeight;
        this.camera.zoom = Math.min(zoomX, zoomY, 1.5);
        
        // Center the camera on the map
        this.camera.x = this.canvas.width / 2;
        this.camera.y = this.canvas.height / 2 - (this.mapHeight * this.tileHeight * 0.25 * this.camera.zoom);
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
    }
    
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new RailwayTycoonGame();
});