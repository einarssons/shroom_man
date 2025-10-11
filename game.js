class MushroomManGame {
    constructor() {
        this.gameGrid = document.getElementById('gameGrid');
        this.currentLevel = 0;
        this.levels = [];
        this.playerPos = { x: 0, y: 0 };
        this.resources = {
            keys: 0,
            money: 0,
            cement: 0,
            oxygen: 0
        };
        this.moveCount = 0;
        this.tileSize = 20;

        this.loadLevels();
        this.setupControls();
        this.setupModals();
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
        this.resources = { keys: 0, money: 0, cement: 0, oxygen: 0 };
        
        // Clear previous level
        this.gameGrid.innerHTML = '';
        
        // Update UI
        document.getElementById('levelNumber').textContent = `Level: ${levelIndex + 1}`;
        document.getElementById('moveCount').textContent = `${this.moveCount}`;
        document.getElementById('levelTitle').textContent = level.title || 'Untitled';
        document.getElementById('levelAuthor').textContent = `Author: ${level.author || 'Unknown'}`;
        
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
                element = this.createSVGImage(tileX, tileY, './images/mushroom_man.svg', 'player');
                break;
            case 'e': // Exit
                element = this.createSVGImage(tileX, tileY, './images/exit.svg', 'exit');
                break;
            case 'l': // Lock
                element = this.createSVGImage(tileX, tileY, './images/lock.svg', 'lock');
                break;
            case 'k': // Key
                element = this.createSVGImage(tileX, tileY, './images/key.svg', 'key');
                break;
            case 'h': // Hole
                element = this.createSVGImage(tileX, tileY, './images/hole.svg', 'hole');
                break;
            case 'c': // Cement
                element = this.createSVGImage(tileX, tileY, './images/cement_sack.svg', 'cement');
                break;
            case 'j': // Jellybean
                element = this.createSVGImage(tileX, tileY, './images/jelly_bean.svg', 'jellybean');
                break;
            case 'b': // Bomb
                element = this.createSVGImage(tileX, tileY, './images/bomb.svg', 'bomb');
                break;
            case 'd': // Dynamite
                element = this.createSVGImage(tileX, tileY, './images/dynamite.svg', 'dynamite');
                break;
            case 'g': // Guard
                element = this.createSVGImage(tileX, tileY, './images/guard.svg', 'guard');
                break;
            case 'f': // Money
                element = this.createSVGImage(tileX, tileY, './images/money.svg', 'money');
                break;
            case 'o': // Oxygen
                element = this.createSVGImage(tileX, tileY, './images/oxygen.svg', 'oxygen');
                break;
            case 'n': // Gun
                element = this.createSVGImage(tileX, tileY, './images/gun.svg', 'gun');
                break;
            case '~': // Water
                element = this.createSVGImage(tileX, tileY, './images/water.svg', 'water');
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
    
    createSVGImage(x, y, href, className) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('width', this.tileSize);
        image.setAttribute('height', this.tileSize);
        image.setAttribute('href', href);
        image.setAttribute('class', className);
        return image;
    }
    
    updateResourceDisplay() {
        document.getElementById('keyCount').textContent = this.resources.keys;
        document.getElementById('moneyCount').textContent = this.resources.money;
        document.getElementById('cementCount').textContent = this.resources.cement;
        document.getElementById('oxygenCount').textContent = this.resources.oxygen;
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
                case 'n':
                case 'N':
                    // Next level
                    if (this.currentLevel < this.levels.length - 1) {
                        this.loadLevel(this.currentLevel + 1);
                    }
                    e.preventDefault();
                    break;
                case 'p':
                case 'P':
                    // Previous level
                    if (this.currentLevel > 0) {
                        this.loadLevel(this.currentLevel - 1);
                    }
                    e.preventDefault();
                    break;
                case 'l':
                case 'L':
                    // Open level selector
                    this.showLevelSelector();
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

        document.getElementById('chooseLevel').addEventListener('click', () => {
            this.showLevelSelector();
        });
    }

    setupModals() {
        // Level complete modal buttons
        document.getElementById('modalNextLevel').addEventListener('click', () => {
            this.hideModal('levelCompleteModal');
            if (this.currentLevel < this.levels.length - 1) {
                this.loadLevel(this.currentLevel + 1);
            }
        });

        document.getElementById('modalRestart').addEventListener('click', () => {
            this.hideModal('levelCompleteModal');
            this.loadLevel(this.currentLevel);
        });

        // Level failed modal button
        document.getElementById('modalRetry').addEventListener('click', () => {
            this.hideModal('levelFailedModal');
            this.loadLevel(this.currentLevel);
        });

        // Level selector modal buttons
        document.getElementById('modalGoToLevel').addEventListener('click', () => {
            const levelInput = document.getElementById('levelInput');
            const levelNum = parseInt(levelInput.value);

            if (levelNum >= 1 && levelNum <= this.levels.length) {
                this.hideModal('levelSelectorModal');
                this.loadLevel(levelNum - 1); // Convert to 0-based index
            }
        });

        document.getElementById('modalCancelLevel').addEventListener('click', () => {
            this.hideModal('levelSelectorModal');
        });

        // Level input validation and preview
        const levelInput = document.getElementById('levelInput');
        levelInput.addEventListener('input', () => {
            this.updateLevelPreview();
        });

        // Allow Enter key to submit level selection
        levelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('modalGoToLevel').click();
            }
        });
    }

    showModal(modalId, title, message) {
        // Hide all modals first
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));

        const modal = document.getElementById(modalId);
        if (title) {
            const titleElement = modal.querySelector('h2');
            if (titleElement) titleElement.textContent = title;
        }
        if (message) {
            const messageElement = modal.querySelector('p');
            if (messageElement) messageElement.textContent = message;
        }
        modal.classList.add('show');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }

    showLevelSelector() {
        // Update max level
        document.getElementById('maxLevel').textContent = this.levels.length;

        // Set input to current level
        const levelInput = document.getElementById('levelInput');
        levelInput.value = this.currentLevel + 1; // Convert to 1-based
        levelInput.max = this.levels.length;

        // Update preview
        this.updateLevelPreview();

        // Show modal
        this.showModal('levelSelectorModal');

        // Focus input and select text
        setTimeout(() => {
            levelInput.focus();
            levelInput.select();
        }, 100);
    }

    updateLevelPreview() {
        const levelInput = document.getElementById('levelInput');
        const previewTitle = document.getElementById('previewTitle');
        const levelError = document.getElementById('levelError');

        const levelNum = parseInt(levelInput.value);

        // Clear error
        levelError.textContent = '';

        // Validate
        if (isNaN(levelNum) || levelNum < 1) {
            previewTitle.textContent = 'Invalid level number';
            levelError.textContent = 'Level must be at least 1';
            return;
        }

        if (levelNum > this.levels.length) {
            previewTitle.textContent = 'Invalid level number';
            levelError.textContent = `Level must be ${this.levels.length} or less`;
            return;
        }

        // Show level title
        const level = this.levels[levelNum - 1];
        previewTitle.textContent = level.title || 'Untitled';
    }
    
    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        // Check if there's a jellybean to push
        const tile = this.getTileAt(newX, newY);
        if (tile && tile.getAttribute('data-symbol') === 'j') {
            // Try to push the jellybean
            const behindX = newX + dx;
            const behindY = newY + dy;
            const behindTile = this.getTileAt(behindX, behindY);

            if (!behindTile) {
                // Empty space behind - push the jellybean
                tile.setAttribute('x', behindX * this.tileSize);
                tile.setAttribute('y', behindY * this.tileSize);
                tile.setAttribute('data-x', behindX);
                tile.setAttribute('data-y', behindY);
            }
        }

        // Check bounds and collision
        if (this.canMoveTo(newX, newY, dx, dy)) {
            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.moveCount++;

            // Update player position
            const player = this.gameGrid.querySelector('.player');
            if (player) {
                player.setAttribute('x', newX * this.tileSize);
                player.setAttribute('y', newY * this.tileSize);

                // Ensure player is always on top by moving to end of SVG
                this.gameGrid.appendChild(player);
            }

            // Handle interactions (pass direction for gun)
            this.handleTileInteraction(newX, newY, dx, dy);

            // Update UI
            document.getElementById('moveCount').textContent = `${this.moveCount}`;
        }
    }
    
    canMoveTo(x, y, dx, dy) {
        const tile = this.getTileAt(x, y);
        if (!tile) return true; // Empty space - can move

        const symbol = tile.getAttribute('data-symbol');

        // Can't move through walls
        if (symbol === 'w' || symbol === 'i') return false;

        // Can't move through dynamite - it blocks passage
        if (symbol === 'd') return false;

        // Can't move through locks without keys
        if (symbol === 'l' && this.resources.keys === 0) return false;

        // Can't move through guards without money
        if (symbol === 'g' && this.resources.money === 0) return false;

        // Jellybean - can push if there's empty space behind it
        if (symbol === 'j') {
            const behindX = x + dx;
            const behindY = y + dy;
            const behindTile = this.getTileAt(behindX, behindY);
            // Can only push if space behind is empty
            return !behindTile;
        }

        // Check hole - need cement to cross or player dies
        if (symbol === 'h') {
            if (this.resources.cement === 0) {
                // Player falls into hole and dies - move player there first so they disappear into hole
                return true; // Allow movement into hole so player sprite moves there
            }
            // Has cement - will fill hole in handleTileInteraction
        }

        // Check water - need oxygen or player drowns
        if (symbol === '~') {
            if (this.resources.oxygen === 0) {
                // Player drowns - move player there first so they enter the water
                return true; // Allow movement into water so player sprite moves there
            }
            // Has oxygen - will consume in handleTileInteraction
        }

        return true;
    }
    
    getTileAt(x, y) {
        return this.gameGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    }
    
    handleTileInteraction(x, y, dx = 0, dy = 0) {
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
            case 'c': // Cement
                this.resources.cement++;
                tile.remove();
                break;
            case 'o': // Oxygen
                this.resources.oxygen += 3; // Each oxygen tank gives 3 units
                tile.remove();
                break;
            case 'l': // Lock
                if (this.resources.keys > 0) {
                    this.resources.keys--;
                    tile.remove();
                }
                break;
            case 'g': // Guard
                if (this.resources.money > 0) {
                    this.resources.money--;
                    tile.remove(); // Bribe guard and they disappear
                }
                break;
            case 'b': // Bomb
                this.explodeBomb(x, y, false); // false = don't destroy impenetrable walls
                this.checkExitDestroyed();
                break;
            case 'n': // Gun
                this.fireGun(x, y, dx, dy);
                tile.remove(); // Gun is consumed after firing
                break;
            case 'h': // Hole
                if (this.resources.cement > 0) {
                    // Fill hole with cement - hole becomes traversable plain area
                    this.resources.cement--;
                    tile.remove(); // Remove the hole, it's now filled
                } else {
                    // Player falls into hole and dies
                    const player = this.gameGrid.querySelector('.player');
                    if (player) {
                        player.remove(); // Remove player sprite
                    }
                    // Use setTimeout to show player disappearing before modal
                    setTimeout(() => {
                        this.showModal('levelFailedModal', 'Level Failed', 'You fell into a hole!');
                    }, 300);
                }
                break;
            case '~': // Water
                if (this.resources.oxygen > 0) {
                    // Consume oxygen to swim through water (water tile remains)
                    this.resources.oxygen--;
                } else {
                    // Player drowns
                    const player = this.gameGrid.querySelector('.player');
                    if (player) {
                        player.remove(); // Remove player sprite
                    }
                    // Use setTimeout to show player disappearing before modal
                    setTimeout(() => {
                        this.showModal('levelFailedModal', 'Level Failed', 'You drowned! You need oxygen to cross water.');
                    }, 300);
                }
                break;
            case 'e': // Exit
                // Remove the exit door
                tile.remove();
                // Use setTimeout to show player at exit before completing
                setTimeout(() => {
                    this.handleLevelComplete();
                }, 200);
                break;
        }

        this.updateResourceDisplay();
    }
    
    checkExitDestroyed() {
        // Check if exit still exists on the grid
        const exitExists = this.gameGrid.querySelector('[data-symbol="e"]');
        if (!exitExists) {
            // Exit was destroyed by explosion - level cannot be completed
            setTimeout(() => {
                this.showModal('levelFailedModal', 'Level Failed', 'The exit was destroyed! Level cannot be completed.');
            }, 500);
        }
    }

    fireGun(gunX, gunY, dx, dy) {
        console.log(`Gun fired from (${gunX}, ${gunY}) in direction (${dx}, ${dy})`);

        // Bullet travels in the direction the player was moving
        let bulletX = gunX + dx;
        let bulletY = gunY + dy;

        // Keep moving bullet until it hits something
        while (true) {
            const tile = this.getTileAt(bulletX, bulletY);

            // If no tile (empty space or out of bounds), bullet continues
            if (!tile) {
                bulletX += dx;
                bulletY += dy;
                continue;
            }

            const symbol = tile.getAttribute('data-symbol');
            console.log(`Bullet hit ${symbol} at (${bulletX}, ${bulletY})`);

            // Impenetrable walls stop the bullet but are not destroyed
            if (symbol === 'i') {
                console.log('Bullet stopped by impenetrable wall');
                break;
            }

            // Dynamite - destroying it causes level failure
            if (symbol === 'd') {
                tile.remove();
                setTimeout(() => {
                    this.showModal('levelFailedModal', 'Level Failed', 'You destroyed dynamite! Level failed.');
                }, 300);
                break;
            }

            // Everything else - destroy the first thing hit and stop
            tile.remove();
            console.log(`Destroyed ${symbol}`);

            // Check if exit was destroyed
            if (symbol === 'e') {
                this.checkExitDestroyed();
            }
            break;
        }
    }

    explodeBomb(centerX, centerY, destroysImpenetrable) {
        console.log(`Explosion at (${centerX}, ${centerY}), destroysImpenetrable: ${destroysImpenetrable}`);

        // Remove the bomb/dynamite itself first
        const centerTile = this.getTileAt(centerX, centerY);
        if (centerTile) {
            centerTile.remove();
        }

        // Collect all tiles to destroy first, then remove them
        // This prevents chain reactions from bombs being removed during iteration
        const tilesToDestroy = [];
        let dynamiteDestroyed = false;

        // Explode in a 3x3 area around the center
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;

                // Skip the center (already removed)
                if (dx === 0 && dy === 0) continue;

                const tile = this.getTileAt(x, y);
                if (!tile) continue;

                const symbol = tile.getAttribute('data-symbol');
                console.log(`  Checking tile at (${x}, ${y}): ${symbol}`);

                // Player is never destroyed by explosions
                if (symbol === 's') continue;

                // Impenetrable walls only destroyed by dynamite
                if (symbol === 'i' && !destroysImpenetrable) continue;

                // Check if dynamite is being destroyed
                if (symbol === 'd') {
                    dynamiteDestroyed = true;
                }

                // Add tile to destroy list
                tilesToDestroy.push(tile);
            }
        }

        // Now remove all tiles at once (prevents chain reactions)
        for (const tile of tilesToDestroy) {
            const symbol = tile.getAttribute('data-symbol');
            const x = tile.getAttribute('data-x');
            const y = tile.getAttribute('data-y');
            console.log(`  Destroying tile at (${x}, ${y}): ${symbol}`);
            tile.remove();
        }

        // If dynamite was destroyed, level fails
        if (dynamiteDestroyed) {
            setTimeout(() => {
                this.showModal('levelFailedModal', 'Level Failed', 'Dynamite was destroyed! Level failed.');
            }, 300);
        }
    }

    handleLevelComplete() {
        if (this.currentLevel < this.levels.length - 1) {
            this.showModal(
                'levelCompleteModal',
                'Level Complete!',
                `You completed Level ${this.currentLevel + 1} in ${this.moveCount} moves!`
            );
        } else {
            this.showModal(
                'levelCompleteModal',
                'Congratulations!',
                `You completed all ${this.levels.length} levels! Final level completed in ${this.moveCount} moves.`
            );
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MushroomManGame();
});