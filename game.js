class MushroomManGame {
    constructor() {
        this.gameGrid = document.getElementById('gameGrid');
        this.currentLevel = 0;
        this.levels = [];
        this.playerPos = { x: 0, y: 0 };
        this.resources = {
            keys: 0,
            money: 0,
            bombs: 0,
            dynamite: 0
        };
        this.moveCount = 0;
        this.tileSize = 20;
        
        this.loadLevels();
        this.setupControls();
    }
    
    async loadLevels() {
        try {
            const response = await fetch('./levels/orig.txt');
            const text = await response.text();
            this.parseLevels(text);
            this.loadLevel(0);
        } catch (error) {
            console.error('Failed to load levels:', error);
        }
    }
    
    parseLevels(text) {
        const lines = text.split('\n');
        let currentLevel = null;
        let gridLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip version info and empty lines
            if (line === '' || line.startsWith('Mushroom Man') || /^\d+$/.test(line)) {
                continue;
            }
            
            // Check if this is a level title (not a grid line)
            if (!this.isGridLine(line)) {
                // If we have accumulated grid lines, save the previous level
                if (gridLines.length > 0 && currentLevel) {
                    currentLevel.grid = gridLines;
                    this.levels.push(currentLevel);
                    gridLines = [];
                }
                
                // Start new level
                currentLevel = {
                    title: line,
                    author: (lines[i + 1] || '').trim(),
                    grid: []
                };
                i++; // Skip author line
            } else {
                // This is a grid line
                if (currentLevel) {
                    gridLines.push(line);
                }
            }
        }
        
        // Don't forget the last level
        if (gridLines.length > 0 && currentLevel) {
            currentLevel.grid = gridLines;
            this.levels.push(currentLevel);
        }
        
        console.log(`Loaded ${this.levels.length} levels`);
    }
    
    isGridLine(line) {
        // Grid lines don't contain capital letters (titles/authors do)
        return !/[A-Z]/.test(line);
    }
    
    cleanTeleporterCodes(line) {
        // Remove digits from teleporter codes (t11 -> t)
        return line.replace(/t\d+/g, 't');
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) return;
        
        const level = this.levels[levelIndex];
        this.currentLevel = levelIndex;
        this.moveCount = 0;
        this.resources = { keys: 0, money: 0, bombs: 0, dynamite: 0 };
        
        // Clear previous level
        this.gameGrid.innerHTML = '';
        
        // Update UI
        document.getElementById('levelNumber').textContent = `Level: ${levelIndex + 1}`;
        document.getElementById('moveCount').textContent = `Moves: ${this.moveCount}`;
        document.getElementById('levelInfo').textContent = `Level ${levelIndex + 1}`;
        
        // Render level
        this.renderLevel(level);
        this.updateResourceDisplay();
    }
    
    renderLevel(level) {
        const grid = level.grid;
        const maxWidth = Math.max(...grid.map(row => this.cleanTeleporterCodes(row).length));
        const maxHeight = grid.length;
        
        // Update SVG viewBox to fit the level
        this.gameGrid.setAttribute('viewBox', `0 0 ${maxWidth * this.tileSize} ${maxHeight * this.tileSize}`);
        
        for (let y = 0; y < grid.length; y++) {
            const row = this.cleanTeleporterCodes(grid[y]);
            for (let x = 0; x < row.length; x++) {
                const symbol = row[x];
                this.createTile(symbol, x, y);
                
                // Track player start position
                if (symbol === 's') {
                    this.playerPos = { x, y };
                }
            }
        }
    }
    
    createTile(symbol, x, y) {
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;
        
        let element;
        
        switch (symbol) {
            case 'w': // Wall
                element = this.createRect(tileX, tileY, '#8B4513', 'wall');
                break;
            case 'i': // Impenetrable wall
                element = this.createRect(tileX, tileY, '#444444', 'impenetrable-wall');
                break;
            case 's': // Start/Player
                element = this.createCircle(tileX + 10, tileY + 10, 8, '#FF6B35', 'player');
                break;
            case 'e': // Exit
                element = this.createRect(tileX, tileY, '#00FF00', 'exit');
                break;
            case 'l': // Lock
                element = this.createRect(tileX, tileY, '#FFD700', 'lock');
                break;
            case 'k': // Key
                element = this.createCircle(tileX + 10, tileY + 10, 6, '#FFD700', 'key');
                break;
            case 'h': // Hole
                element = this.createCircle(tileX + 10, tileY + 10, 8, '#654321', 'hole');
                break;
            case 'c': // Cement
                element = this.createRect(tileX, tileY, '#808080', 'cement');
                break;
            case 'j': // Jellybean
                element = this.createCircle(tileX + 10, tileY + 10, 6, '#FF1493', 'jellybean');
                break;
            case 'b': // Bomb
                element = this.createCircle(tileX + 10, tileY + 10, 8, '#000000', 'bomb');
                break;
            case 'd': // Dynamite
                element = this.createRect(tileX, tileY, '#FF4500', 'dynamite');
                break;
            case 'g': // Guard
                element = this.createCircle(tileX + 10, tileY + 10, 8, '#8B0000', 'guard');
                break;
            case 'f': // Money
                element = this.createCircle(tileX + 10, tileY + 10, 6, '#32CD32', 'money');
                break;
            case 'o': // Oxygen
                element = this.createCircle(tileX + 10, tileY + 10, 6, '#87CEEB', 'oxygen');
                break;
            case 'n': // Gun
                element = this.createRect(tileX, tileY, '#708090', 'gun');
                break;
            case '~': // Water
                element = this.createRect(tileX, tileY, '#0066CC', 'water');
                break;
            case 't': // Teleporter
                element = this.createCircle(tileX + 10, tileY + 10, 8, '#800080', 'teleporter');
                break;
            default:
                return; // Empty space
        }
        
        if (element) {
            element.setAttribute('data-x', x);
            element.setAttribute('data-y', y);
            element.setAttribute('data-symbol', symbol);
            this.gameGrid.appendChild(element);
        }
    }
    
    createRect(x, y, fill, className) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', this.tileSize);
        rect.setAttribute('height', this.tileSize);
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', '#333');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('class', className);
        return rect;
    }
    
    createCircle(cx, cy, r, fill, className) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '1');
        circle.setAttribute('class', className);
        return circle;
    }
    
    updateResourceDisplay() {
        document.getElementById('keyCount').textContent = this.resources.keys;
        document.getElementById('moneyCount').textContent = this.resources.money;
        document.getElementById('bombCount').textContent = this.resources.bombs;
        document.getElementById('dynamiteCount').textContent = this.resources.dynamite;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.movePlayer(0, -1);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.movePlayer(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movePlayer(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movePlayer(1, 0);
                    e.preventDefault();
                    break;
            }
        });
        
        document.getElementById('resetLevel').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });
        
        document.getElementById('nextLevel').addEventListener('click', () => {
            if (this.currentLevel < this.levels.length - 1) {
                this.loadLevel(this.currentLevel + 1);
            }
        });
    }
    
    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        
        // Check bounds and collision
        if (this.canMoveTo(newX, newY)) {
            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.moveCount++;
            
            // Update player position
            const player = this.gameGrid.querySelector('.player');
            if (player) {
                player.setAttribute('cx', newX * this.tileSize + 10);
                player.setAttribute('cy', newY * this.tileSize + 10);
            }
            
            // Handle interactions
            this.handleTileInteraction(newX, newY);
            
            // Update UI
            document.getElementById('moveCount').textContent = `Moves: ${this.moveCount}`;
        }
    }
    
    canMoveTo(x, y) {
        const tile = this.getTileAt(x, y);
        if (!tile) return true; // Empty space - can move
        
        const symbol = tile.getAttribute('data-symbol');
        
        // Can't move through walls
        if (symbol === 'w' || symbol === 'i') return false;
        
        // Can't move through locks without keys
        if (symbol === 'l' && this.resources.keys === 0) return false;
        
        return true;
    }
    
    getTileAt(x, y) {
        return this.gameGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    }
    
    handleTileInteraction(x, y) {
        const tile = this.getTileAt(x, y);
        if (!tile) return;
        
        const symbol = tile.getAttribute('data-symbol');
        
        switch (symbol) {
            case 'k': // Key
                this.resources.keys++;
                tile.remove();
                break;
            case 'f': // Money
                this.resources.money++;
                tile.remove();
                break;
            case 'b': // Bomb
                this.resources.bombs++;
                tile.remove();
                break;
            case 'd': // Dynamite
                this.resources.dynamite++;
                tile.remove();
                break;
            case 'l': // Lock
                if (this.resources.keys > 0) {
                    this.resources.keys--;
                    tile.remove();
                }
                break;
            case 'e': // Exit
                this.handleLevelComplete();
                break;
        }
        
        this.updateResourceDisplay();
    }
    
    handleLevelComplete() {
        alert(`Level ${this.currentLevel + 1} completed in ${this.moveCount} moves!`);
        if (this.currentLevel < this.levels.length - 1) {
            this.loadLevel(this.currentLevel + 1);
        } else {
            alert('Congratulations! You completed all levels!');
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MushroomManGame();
});