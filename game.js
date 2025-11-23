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

        // Load progress from localStorage
        this.loadProgress();

        this.loadLevels();
        this.setupControls();
        this.setupModals();
    }

    loadProgress() {
        // Load saved progress from localStorage
        const saved = localStorage.getItem('mushroomManProgress');
        if (saved) {
            try {
                this.progress = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load progress:', e);
                this.progress = {};
            }
        } else {
            this.progress = {};
        }
        // progress structure: { levelIndex: { completed: true, bestMoves: 42 } }
    }

    saveProgress() {
        // Save progress to localStorage
        try {
            localStorage.setItem('mushroomManProgress', JSON.stringify(this.progress));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

    getLevelProgress(levelIndex) {
        return this.progress[levelIndex] || { completed: false, bestMoves: null };
    }

    updateLevelProgress(levelIndex, moves) {
        if (!this.progress[levelIndex]) {
            this.progress[levelIndex] = { completed: true, bestMoves: moves };
        } else {
            this.progress[levelIndex].completed = true;
            if (this.progress[levelIndex].bestMoves === null || moves < this.progress[levelIndex].bestMoves) {
                this.progress[levelIndex].bestMoves = moves;
            }
        }
        this.saveProgress();
    }

    getLastPlayedLevel() {
        try {
            const lastLevel = localStorage.getItem('mushroomManLastLevel');
            if (lastLevel !== null) {
                const levelIndex = parseInt(lastLevel);
                if (levelIndex >= 0 && levelIndex < this.levels.length) {
                    return levelIndex;
                }
            }
        } catch (e) {
            console.error('Failed to load last level:', e);
        }
        return 0; // Default to first level
    }

    saveLastPlayedLevel(levelIndex) {
        try {
            localStorage.setItem('mushroomManLastLevel', levelIndex.toString());
        } catch (e) {
            console.error('Failed to save last level:', e);
        }
    }

    async loadLevels() {
        try {
            const response = await fetch('./levels/orig.txt');
            const text = await response.text();
            this.parseLevels(text);

            // Load the last played level, or start at level 0
            const lastLevel = this.getLastPlayedLevel();
            this.loadLevel(lastLevel);
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

    updateMovesDisplay() {
        const progress = this.getLevelProgress(this.currentLevel);
        const movesInfo = document.getElementById('movesInfo');

        if (progress.completed && progress.bestMoves !== null) {
            movesInfo.textContent = `Moves: ${this.moveCount} (Best: ${progress.bestMoves})`;
        } else {
            movesInfo.textContent = `Moves: ${this.moveCount}`;
        }
    }

    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) return;

        const level = this.levels[levelIndex];
        this.currentLevel = levelIndex;
        this.moveCount = 0;
        this.resources = { keys: 0, money: 0, cement: 0, oxygen: 0 };

        // Save this as the last played level
        this.saveLastPlayedLevel(levelIndex);

        // Clear previous level
        this.gameGrid.innerHTML = '';

        // Update UI
        document.getElementById('levelNumber').textContent = `Level: ${levelIndex + 1}`;
        document.getElementById('levelTitle').textContent = level.title || 'Untitled';
        document.getElementById('levelAuthor').textContent = `Author: ${level.author || 'Unknown'}`;
        this.updateMovesDisplay();

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

        // Store portal information for this level
        this.portals = new Map(); // Maps "x,y" -> {pairId, direction}

        for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            let x = 0;
            let i = 0;

            while (i < row.length) {
                let symbol = row[i];
                let portalInfo = null;

                // Check if this is a portal (t followed by two digits)
                if (symbol === 't' && i + 2 < row.length) {
                    const pairId = row[i + 1];
                    const direction = row[i + 2];

                    if (/\d/.test(pairId) && /\d/.test(direction)) {
                        // Valid portal code
                        portalInfo = {
                            pairId: parseInt(pairId),
                            direction: parseInt(direction)
                        };
                        this.portals.set(`${x},${y}`, portalInfo);
                        i += 3; // Skip the two digits
                    } else {
                        i++;
                    }
                } else {
                    i++;
                }

                this.createTile(symbol, x, y, portalInfo);

                // Track player start position
                if (symbol === 's') {
                    this.playerPos = { x, y };
                }

                x++;
            }
        }
    }

    createTile(symbol, x, y, portalInfo = null) {
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;

        let element;

        switch (symbol) {
            case 'w': // Wall
                element = this.createWall(tileX, tileY);
                break;
            case 'i': // Impenetrable wall
                element = this.createImpenetrableWall(tileX, tileY);
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
                element = this.createWater(tileX, tileY);
                break;
            case 't': // Teleporter/Portal
                if (portalInfo) {
                    element = this.createPortal(tileX, tileY, portalInfo.pairId, portalInfo.direction);
                } else {
                    // Fallback to simple circle if no portal info
                    element = this.createCircle(tileX + 10, tileY + 10, 8, '#800080', 'teleporter');
                }
                break;
            default:
                return; // Empty space
        }

        if (element) {
            element.setAttribute('data-x', x);
            element.setAttribute('data-y', y);
            element.setAttribute('data-symbol', symbol);

            // Store portal info if this is a portal
            if (portalInfo) {
                element.setAttribute('data-portal-pair', portalInfo.pairId);
                element.setAttribute('data-portal-direction', portalInfo.direction);
            }

            this.gameGrid.appendChild(element);
        }
    }

    createWall(x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'wall');

        // Create a unique clip path for this wall
        const clipId = `wall-clip-${x}-${y}`;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);

        const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', x);
        clipRect.setAttribute('y', y);
        clipRect.setAttribute('width', this.tileSize);
        clipRect.setAttribute('height', this.tileSize);

        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);
        group.appendChild(defs);

        // Apply clip path to the group
        group.setAttribute('clip-path', `url(#${clipId})`);

        // Mortar background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', x);
        bg.setAttribute('y', y);
        bg.setAttribute('width', this.tileSize);
        bg.setAttribute('height', this.tileSize);
        bg.setAttribute('fill', '#8B4513'); // SaddleBrown
        group.appendChild(bg);

        // Bricks
        const brickHeight = this.tileSize / 4;
        const brickWidth = this.tileSize / 2;
        const brickColor = '#A0522D'; // Sienna

        for (let row = 0; row < 4; row++) {
            const offsetY = row * brickHeight;
            const offsetX = (row % 2 === 0) ? 0 : -brickWidth / 2;

            for (let col = 0; col < 3; col++) {
                const brickX = x + offsetX + (col * brickWidth);
                const brickY = y + offsetY;

                const brick = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                brick.setAttribute('x', brickX + 1); // +1 for mortar gap
                brick.setAttribute('y', brickY + 1);
                brick.setAttribute('width', brickWidth - 2);
                brick.setAttribute('height', brickHeight - 2);
                brick.setAttribute('fill', brickColor);

                group.appendChild(brick);
            }
        }
        return group;
    }

    createImpenetrableWall(x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'impenetrable-wall');

        // Create a unique clip path for this wall
        const clipId = `imp-wall-clip-${x}-${y}`;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);

        const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', x);
        clipRect.setAttribute('y', y);
        clipRect.setAttribute('width', this.tileSize);
        clipRect.setAttribute('height', this.tileSize);

        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);
        group.appendChild(defs);

        // Apply clip path to the group
        group.setAttribute('clip-path', `url(#${clipId})`);

        // Base metal plate
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', this.tileSize);
        rect.setAttribute('height', this.tileSize);
        rect.setAttribute('fill', '#555555');
        rect.setAttribute('stroke', '#222222');
        rect.setAttribute('stroke-width', '2');
        group.appendChild(rect);

        // Inner plate (bevel effect)
        const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        innerRect.setAttribute('x', x + 3);
        innerRect.setAttribute('y', y + 3);
        innerRect.setAttribute('width', this.tileSize - 6);
        innerRect.setAttribute('height', this.tileSize - 6);
        innerRect.setAttribute('fill', 'none');
        innerRect.setAttribute('stroke', '#777777');
        innerRect.setAttribute('stroke-width', '1');
        group.appendChild(innerRect);

        // Rivets
        const rivetPositions = [
            { rx: x + 4, ry: y + 4 },
            { rx: x + this.tileSize - 4, ry: y + 4 },
            { rx: x + 4, ry: y + this.tileSize - 4 },
            { rx: x + this.tileSize - 4, ry: y + this.tileSize - 4 }
        ];

        rivetPositions.forEach(pos => {
            const rivet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rivet.setAttribute('cx', pos.rx);
            rivet.setAttribute('cy', pos.ry);
            rivet.setAttribute('r', '1.5');
            rivet.setAttribute('fill', '#AAAAAA');
            rivet.setAttribute('stroke', '#222222');
            rivet.setAttribute('stroke-width', '0.5');
            group.appendChild(rivet);
        });

        // Cross brace (X shape)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x + 4},${y + 4} L ${x + this.tileSize - 4},${y + this.tileSize - 4} M ${x + this.tileSize - 4},${y + 4} L ${x + 4},${y + this.tileSize - 4}`);
        path.setAttribute('stroke', '#333333');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('opacity', '0.5');
        group.appendChild(path);

        return group;
    }

    createWater(x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'water');

        // Water background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', this.tileSize);
        rect.setAttribute('height', this.tileSize);
        rect.setAttribute('fill', '#0077BE'); // Ocean Blue
        group.appendChild(rect);

        // Waves
        for (let i = 0; i < 3; i++) {
            const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const waveY = y + 5 + (i * 5);

            // Wave path
            const d = `M ${x},${waveY} Q ${x + 5},${waveY - 2} ${x + 10},${waveY} T ${x + 20},${waveY}`;
            wave.setAttribute('d', d);
            wave.setAttribute('fill', 'none');
            wave.setAttribute('stroke', '#FFFFFF');
            wave.setAttribute('stroke-width', '1');
            wave.setAttribute('opacity', '0.5');

            // Animate wave
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'd');
            animate.setAttribute('values',
                `M ${x},${waveY} Q ${x + 5},${waveY - 2} ${x + 10},${waveY} T ${x + 20},${waveY};` +
                `M ${x},${waveY} Q ${x + 5},${waveY + 2} ${x + 10},${waveY} T ${x + 20},${waveY};` +
                `M ${x},${waveY} Q ${x + 5},${waveY - 2} ${x + 10},${waveY} T ${x + 20},${waveY}`
            );
            animate.setAttribute('dur', `${2 + i * 0.5}s`);
            animate.setAttribute('repeatCount', 'indefinite');

            wave.appendChild(animate);
            group.appendChild(wave);
        }

        return group;
    }

    createHole(x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'hole');

        // Background (ground around hole)
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', x);
        bg.setAttribute('y', y);
        bg.setAttribute('width', this.tileSize);
        bg.setAttribute('height', this.tileSize);
        bg.setAttribute('fill', '#5D4037'); // Dark brown ground
        group.appendChild(bg);

        // The Hole (black circle)
        const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole.setAttribute('cx', x + this.tileSize / 2);
        hole.setAttribute('cy', y + this.tileSize / 2);
        hole.setAttribute('r', (this.tileSize / 2) - 2);
        hole.setAttribute('fill', '#000000');
        group.appendChild(hole);

        // Inner shadow/depth gradient simulation (concentric circles)
        const innerHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerHole.setAttribute('cx', x + this.tileSize / 2);
        innerHole.setAttribute('cy', y + this.tileSize / 2);
        innerHole.setAttribute('r', (this.tileSize / 2) - 5);
        innerHole.setAttribute('fill', '#1a1a1a'); // Slightly lighter black
        group.appendChild(innerHole);

        const deepHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        deepHole.setAttribute('cx', x + this.tileSize / 2);
        deepHole.setAttribute('cy', y + this.tileSize / 2);
        deepHole.setAttribute('r', (this.tileSize / 2) - 7);
        deepHole.setAttribute('fill', '#000000');
        group.appendChild(deepHole);

        return group;
    }

    createExit(x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'exit');

        // Door frame - fills the whole tile
        const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        frame.setAttribute('x', x);
        frame.setAttribute('y', y);
        frame.setAttribute('width', this.tileSize);
        frame.setAttribute('height', this.tileSize);
        frame.setAttribute('fill', '#4E342E'); // Dark wood
        frame.setAttribute('stroke', '#3E2723');
        frame.setAttribute('stroke-width', '1');
        group.appendChild(frame);

        // Door opening (darkness)
        const opening = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        opening.setAttribute('x', x + 2);
        opening.setAttribute('y', y + 2);
        opening.setAttribute('width', this.tileSize - 4);
        opening.setAttribute('height', this.tileSize - 2);
        opening.setAttribute('fill', '#000000');
        group.appendChild(opening);

        // Light at the end of the tunnel (or stairs)
        const stairs = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        stairs.setAttribute('d', `M ${x + 4},${y + this.tileSize - 4} L ${x + this.tileSize - 4},${y + this.tileSize - 4} L ${x + this.tileSize - 6},${y + 8} L ${x + 6},${y + 8} Z`);
        stairs.setAttribute('fill', '#FFD700'); // Gold light
        stairs.setAttribute('opacity', '0.3');
        group.appendChild(stairs);

        // Exit sign text (optional, simplified as a green rect above)
        const sign = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        sign.setAttribute('x', x + 4);
        sign.setAttribute('y', y + 1);
        sign.setAttribute('width', this.tileSize - 8);
        sign.setAttribute('height', 3);
        sign.setAttribute('fill', '#00FF00');
        group.appendChild(sign);

        return group;
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

    createPortal(x, y, pairId, direction) {
        // Color scheme for different portal pairs
        const colors = [
            '#FF00FF', // Magenta (pair 1)
            '#FF0000', // Red (pair 2)
            '#FFFF00', // Yellow (pair 3)
            '#00FF00', // Green (pair 4)
            '#00FFFF', // Cyan (pair 5)
            '#FF00AA', // Pink (pair 6)
            '#FF8800', // Orange (pair 7)
            '#8800FF', // Purple (pair 8)
            '#00FF88'  // Teal (pair 9)
        ];

        const color = colors[(pairId - 1) % colors.length];

        // Create group for portal
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'portal');

        // Background square with gradient
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', this.tileSize);
        rect.setAttribute('height', this.tileSize);
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.8');
        group.appendChild(rect);

        // Animated wave pattern
        for (let i = 0; i < 3; i++) {
            const wave = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const offset = i * 2;
            const waveSize = this.tileSize - 6 - (offset * 2);

            // Only create wave if it has positive dimensions
            if (waveSize > 0) {
                wave.setAttribute('x', x + 3 + offset);
                wave.setAttribute('y', y + 3 + offset);
                wave.setAttribute('width', waveSize);
                wave.setAttribute('height', waveSize);
                wave.setAttribute('fill', 'none');
                wave.setAttribute('stroke', '#FFFFFF');
                wave.setAttribute('stroke-width', '0.5');
                wave.setAttribute('opacity', '0.6');

                // Simple animation using CSS
                const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateOpacity.setAttribute('attributeName', 'opacity');
                animateOpacity.setAttribute('values', '0.2;0.6;0.2');
                animateOpacity.setAttribute('dur', '2s');
                animateOpacity.setAttribute('begin', `${i * 0.3}s`);
                animateOpacity.setAttribute('repeatCount', 'indefinite');
                wave.appendChild(animateOpacity);

                group.appendChild(wave);
            }
        }

        // Direction arrow/triangle
        const arrow = this.createDirectionArrow(x, y, direction);
        group.appendChild(arrow);

        return group;
    }

    createDirectionArrow(x, y, direction) {
        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;
        const arrowWidth = 3; // Width of arrow base

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

        let points;
        switch (direction) {
            case 1: // Up - tip touches top edge
                points = `${centerX},${y} ${centerX - arrowWidth},${centerY} ${centerX + arrowWidth},${centerY}`;
                break;
            case 2: // Down - tip touches bottom edge
                points = `${centerX},${y + this.tileSize} ${centerX - arrowWidth},${centerY} ${centerX + arrowWidth},${centerY}`;
                break;
            case 3: // Left - tip touches left edge
                points = `${x},${centerY} ${centerX},${centerY - arrowWidth} ${centerX},${centerY + arrowWidth}`;
                break;
            case 4: // Right - tip touches right edge
                points = `${x + this.tileSize},${centerY} ${centerX},${centerY - arrowWidth} ${centerX},${centerY + arrowWidth}`;
                break;
        }

        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', '#FFFFFF');
        polygon.setAttribute('stroke', '#000000');
        polygon.setAttribute('stroke-width', '0.5');

        return polygon;
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

        // Setup touch/swipe controls for mobile devices
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isTouchActive = false;

        // Minimum swipe distance in pixels to register as a swipe (not a tap)
        const minSwipeDistance = 40;

        // Cooldown to prevent rapid-fire moves (in milliseconds)
        const moveCooldown = 250;
        let lastMoveTime = 0;

        // Add touch listeners to the game grid only (not container to avoid duplicates)
        const gameGrid = document.getElementById('gameGrid');

        gameGrid.addEventListener('touchstart', (e) => {
            // Prevent pinch zoom
            if (e.touches.length > 1) {
                e.preventDefault();
                return;
            }

            isTouchActive = true;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        gameGrid.addEventListener('touchend', (e) => {
            if (!isTouchActive) return;

            const now = Date.now();
            const timeSinceLastMove = now - lastMoveTime;

            // Enforce cooldown
            if (timeSinceLastMove < moveCooldown) {
                isTouchActive = false;
                e.preventDefault();
                return;
            }

            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const moved = this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, minSwipeDistance);

            if (moved) {
                lastMoveTime = now;
            }

            isTouchActive = false;
            e.preventDefault(); // Prevent default touch behavior
        }, { passive: false });

        // Prevent touch move (dragging) which could interfere
        gameGrid.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleSwipe(startX, startY, endX, endY, minDistance) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Check if swipe distance meets minimum threshold
        if (absDeltaX < minDistance && absDeltaY < minDistance) {
            return false; // Too short to be a swipe, likely a tap
        }

        // Determine swipe direction based on which axis has larger movement
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0) {
                // Swipe right
                this.movePlayer(1, 0);
            } else {
                // Swipe left
                this.movePlayer(-1, 0);
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                // Swipe down
                this.movePlayer(0, 1);
            } else {
                // Swipe up
                this.movePlayer(0, -1);
            }
        }

        return true; // A move was attempted
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

        // Global keyboard handler for modal shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // Check if level complete modal is showing
                const levelCompleteModal = document.getElementById('levelCompleteModal');
                if (levelCompleteModal && levelCompleteModal.classList.contains('show')) {
                    // Trigger next level (same as clicking "Next Level" button)
                    document.getElementById('modalNextLevel').click();
                    e.preventDefault();
                    return;
                }

                // Check if level failed modal is showing
                const levelFailedModal = document.getElementById('levelFailedModal');
                if (levelFailedModal && levelFailedModal.classList.contains('show')) {
                    // Trigger retry (same as clicking "Try Again" button)
                    document.getElementById('modalRetry').click();
                    e.preventDefault();
                    return;
                }
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
            // Update the old position's data-symbol from 's' to empty
            // This prevents the start position from being considered "occupied"
            // but keeps the player visual element
            const player = this.gameGrid.querySelector('.player');
            if (player && player.getAttribute('data-symbol') === 's') {
                // Change symbol to indicate it's no longer the start position
                player.setAttribute('data-symbol', 'player');
            }

            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.moveCount++;

            // Update player position
            if (player) {
                player.setAttribute('x', newX * this.tileSize);
                player.setAttribute('y', newY * this.tileSize);
                player.setAttribute('data-x', newX);
                player.setAttribute('data-y', newY);

                // Ensure player is always on top by moving to end of SVG
                this.gameGrid.appendChild(player);
            }

            // Handle interactions (pass direction for gun)
            this.handleTileInteraction(newX, newY, dx, dy);

            // Update UI
            this.updateMovesDisplay();
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

        // Portal - check if exit destination is valid
        if (symbol === 't') {
            const pairId = parseInt(tile.getAttribute('data-portal-pair'));
            const pairedPortal = this.findPairedPortal(pairId, x, y);

            if (pairedPortal) {
                // Calculate exit position
                let exitX = pairedPortal.x;
                let exitY = pairedPortal.y;

                switch (pairedPortal.direction) {
                    case 1: exitY -= 1; break; // Up
                    case 2: exitY += 1; break; // Down
                    case 3: exitX -= 1; break; // Left
                    case 4: exitX += 1; break; // Right
                }

                // Check if exit position is valid (recursively, but prevent infinite loop by checking for portal)
                const exitTile = this.getTileAt(exitX, exitY);
                if (!exitTile) return true; // Empty exit - OK

                const exitSymbol = exitTile.getAttribute('data-symbol');

                // Can't exit into walls or dynamite
                if (exitSymbol === 'w' || exitSymbol === 'i' || exitSymbol === 'd') return false;

                // Can't exit into lock without key
                if (exitSymbol === 'l' && this.resources.keys === 0) return false;

                // Can't exit into guard without money
                if (exitSymbol === 'g' && this.resources.money === 0) return false;

                // Can't exit into jellybean that can't be pushed
                if (exitSymbol === 'j') {
                    // Would need to calculate if jellybean can be pushed in exit direction
                    // For now, block portal entry if jellybean is at exit
                    return false;
                }

                // Can exit into hole only if we have cement (or will die)
                // Can exit into water only if we have oxygen (or will drown)
                // These are OK - player will handle consequences

                return true;
            }
            return false; // No paired portal found
        }

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

    findPairedPortal(pairId, currentX, currentY) {
        // Find the other portal with the same pair ID
        const allPortals = this.gameGrid.querySelectorAll('[data-symbol="t"]');
        for (const portal of allPortals) {
            const portalPairId = parseInt(portal.getAttribute('data-portal-pair'));
            const portalX = parseInt(portal.getAttribute('data-x'));
            const portalY = parseInt(portal.getAttribute('data-y'));

            // Same pair ID but different location
            if (portalPairId === pairId && (portalX !== currentX || portalY !== currentY)) {
                const direction = parseInt(portal.getAttribute('data-portal-direction'));
                return { x: portalX, y: portalY, direction: direction };
            }
        }
        return null;
    }

    teleportPlayer(portalX, portalY, exitDirection) {
        // Calculate exit position based on direction
        // 1 = up, 2 = down, 3 = left, 4 = right
        let exitX = portalX;
        let exitY = portalY;
        let dx = 0;
        let dy = 0;

        switch (exitDirection) {
            case 1: // Up
                exitY -= 1;
                dy = -1;
                break;
            case 2: // Down
                exitY += 1;
                dy = 1;
                break;
            case 3: // Left
                exitX -= 1;
                dx = -1;
                break;
            case 4: // Right
                exitX += 1;
                dx = 1;
                break;
        }

        // Update player position
        this.playerPos.x = exitX;
        this.playerPos.y = exitY;

        // Update player visual position
        const player = this.gameGrid.querySelector('.player');
        if (player) {
            player.setAttribute('x', exitX * this.tileSize);
            player.setAttribute('y', exitY * this.tileSize);
            this.gameGrid.appendChild(player); // Ensure player is on top
        }

        // Handle interaction at the exit tile (pass direction for gun)
        this.handleTileInteraction(exitX, exitY, dx, dy);
    }

    destroyPortalPair(pairId) {
        // Remove both portals with this pair ID
        const allPortals = this.gameGrid.querySelectorAll('[data-symbol="t"]');
        for (const portal of allPortals) {
            const portalPairId = parseInt(portal.getAttribute('data-portal-pair'));
            if (portalPairId === pairId) {
                portal.remove();
            }
        }
    }

    handleTileInteraction(x, y, dx = 0, dy = 0) {
        const tile = this.getTileAt(x, y);
        if (!tile) return;

        const symbol = tile.getAttribute('data-symbol');

        // Handle portal teleportation
        if (symbol === 't') {
            const pairId = parseInt(tile.getAttribute('data-portal-pair'));
            const exitDirection = parseInt(tile.getAttribute('data-portal-direction'));

            // Find the paired portal
            const pairedPortal = this.findPairedPortal(pairId, x, y);
            if (pairedPortal) {
                // Teleport to paired portal
                this.teleportPlayer(pairedPortal.x, pairedPortal.y, pairedPortal.direction);
            }
            return;
        }

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

            // Portal - destroy both portals in the pair
            if (symbol === 't') {
                const pairId = parseInt(tile.getAttribute('data-portal-pair'));
                this.destroyPortalPair(pairId);
                console.log(`Destroyed portal pair ${pairId}`);
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
        const portalPairsToDestroy = new Set();
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

                // Track portal pairs to destroy
                if (symbol === 't') {
                    const pairId = parseInt(tile.getAttribute('data-portal-pair'));
                    portalPairsToDestroy.add(pairId);
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

        // Destroy paired portals
        for (const pairId of portalPairsToDestroy) {
            // Find and remove the other portal in this pair (if it wasn't already destroyed)
            const allPortals = this.gameGrid.querySelectorAll('[data-symbol="t"]');
            for (const portal of allPortals) {
                const portalPairId = parseInt(portal.getAttribute('data-portal-pair'));
                if (portalPairId === pairId) {
                    console.log(`  Destroying paired portal ${pairId}`);
                    portal.remove();
                }
            }
        }

        // If dynamite was destroyed, level fails
        if (dynamiteDestroyed) {
            setTimeout(() => {
                this.showModal('levelFailedModal', 'Level Failed', 'Dynamite was destroyed! Level failed.');
            }, 300);
        }
    }

    handleLevelComplete() {
        // Get previous best score (save the value, not the reference)
        const prevProgress = this.getLevelProgress(this.currentLevel);
        const previousBestMoves = prevProgress.bestMoves;
        const isNewBest = previousBestMoves === null || this.moveCount < previousBestMoves;

        // Update progress
        this.updateLevelProgress(this.currentLevel, this.moveCount);

        // Build message with best score info
        let message = `You completed Level ${this.currentLevel + 1} in ${this.moveCount} moves!`;

        if (isNewBest) {
            if (previousBestMoves === null) {
                message += '\n🎉 First time completing this level!';
            } else {
                message += `\n🏆 New best! (Previous: ${previousBestMoves} moves)`;
            }
        } else {
            message += `\n⭐ Your best: ${previousBestMoves} moves`;
        }

        if (this.currentLevel < this.levels.length - 1) {
            this.showModal(
                'levelCompleteModal',
                'Level Complete!',
                message
            );
        } else {
            this.showModal(
                'levelCompleteModal',
                'Congratulations!',
                `You completed all ${this.levels.length} levels!\nFinal level completed in ${this.moveCount} moves.`
            );
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MushroomManGame();
});