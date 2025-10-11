# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains both the original **Mushroom Man** Windows puzzle game (2005) and a modern browser-based reimplementation. The original game assets, level data, and analysis tools are preserved alongside the new web version.

## Project Structure

### Browser Game (New Implementation)
- `index.html` - Main game HTML with SVG container and resource panel
- `game.js` - JavaScript game engine with level parser and rendering
- `style.css` - CSS styling with dark theme and responsive design
- `levels/orig.txt` - Level data in original format

### Original Game Archive
- `MushroomMan/` - Complete game distribution
  - `Mushman.exe` - Main game executable (Windows)
  - `levels.dat` and `levels.txt` - Level data files (identical content)
  - `Sound/` - Game audio files (.wav, .mid)
  - `*.mmr` - Level replay files
  - `mushman.chm` - Compiled HTML help file
  - `versions.txt` - Version history and changelog

### Documentation & Tools
- `images/` - Documentation screenshots
- `README.md` - Project documentation with level symbol analysis
- `analyze_levels_final.py` - Python script for analyzing level data
- `plan.md` - Development plan for browser implementation

## Level Data Format

The game uses a text-based level format where each level is represented as a 2D grid:

### Key Symbols
- `w` = Wall, `s` = Start, `e` = Exit, `l` = Lock, `k` = Key
- `h` = Hole, `c` = Cement, `j` = Jellybean, `b` = Bomb, `d` = Dynamite
- `g` = Guard, `f` = Money, `o` = Oxygen, `n` = Gun, `~` = Water
- `i` = Impenetrable wall, `t##` = Teleporter pairs (e.g., `t11`, `t12`)

### Grid Dimensions
- Maximum grid size: **20×14** characters (after removing digits from teleporter codes)
- 284 total levels across multiple difficulty ranges

## Analysis Tools

### Level Analysis Script
```bash
python analyze_levels_final.py
```

The script processes `MushroomMan/levels.txt` to:
- Calculate actual grid dimensions by filtering teleporter digits
- Count total levels and measure max width/height
- Distinguish between level data and metadata (titles, authors)

Key functions:
- `clean_teleporter_codes()` - Removes digits from teleporter identifiers
- `is_grid_line()` - Identifies actual game grid vs. metadata
- `analyze_levels_file()` - Main analysis routine

## Game Architecture Notes

This is a compiled Windows game with no source code available. The repository serves as:
- Game preservation and distribution
- Level data analysis and documentation
- Reference for understanding classic puzzle game design

The level format uses a simple text-based grid system that could be useful for:
- Creating level editors or converters
- Implementing similar puzzle games
- Analyzing game design patterns

## Browser Implementation

### Architecture
- **Platform**: Browser-based (HTML5/JavaScript)
- **Rendering**: SVG-based tile system for scalable graphics
- **Controls**: Keyboard input (Arrow keys, WASD, N/P/L for navigation)
- **Level System**: Parses original level format from `levels/orig.txt`
- **UI**: Modal-based feedback system with color-coded themes

### Key Features
- **SVG tile rendering** for all game symbols with smooth animations
- **Resource tracking panel** displaying keys, money, cement, oxygen, and move count
- **Player movement** with collision detection and validation
- **Level navigation system**:
  - Next/Previous level buttons and keyboard shortcuts (N/P)
  - Level selector modal (L key) with input validation
  - Real-time level title preview
  - Auto-focus and Enter key support
- **Modal feedback system**:
  - Green-themed level complete modal
  - Red-themed level failed modal
  - Level selector with validation and preview
- **Dark theme UI** with retro game aesthetic
- **Responsive design** for mobile devices
- **Z-order management** ensuring player visibility on all tiles

### Implemented Game Mechanics

All core mechanics from the original game are fully implemented:

1. **Keys and Locks**: Collect keys to unlock locks (consumes 1 key per lock)
2. **Holes and Cement**: Fill holes with cement or fall in and fail the level
3. **Guards and Money**: Bribe guards with money to pass (consumes 1 money per guard)
4. **Jellybeans**: Push jellybeans if there's empty space behind them
5. **Bombs**: 3×3 explosion destroying most objects (player survives, no chain reactions)
6. **Dynamite**:
   - Blocks movement entirely (cannot walk into dynamite)
   - Any destruction of dynamite causes immediate level failure
   - Must be preserved to complete levels
7. **Guns**: Fire bullets in movement direction, destroying first object hit
   - Impenetrable walls stop bullets without being destroyed
   - Shooting dynamite causes level failure
8. **Water and Oxygen**:
   - Each oxygen tank provides 3 oxygen units
   - Water tiles consume 1 oxygen per crossing
   - Water tiles remain after crossing (reusable)
   - Drowning without oxygen causes level failure
9. **Exit**: Walking into exit completes level (exit can be destroyed by explosions)
10. **Teleporters/Portals**:
   - Color-coded pairs (9 different colors) with animated wave effects
   - Directional arrows indicating exit direction
   - Format: `tXY` where X=pair ID (1-9), Y=exit direction (1=up, 2=down, 3=left, 4=right)
   - Validates exit destination before allowing entry
   - Destroying one portal destroys its paired portal

### Technical Details
- **`MushroomManGame` class**: Manages game state, rendering, and user input
- **Level parser**: Distinguishes grid data from metadata using capital letter detection
- **SVG DOM manipulation**: Real-time tile updates with appendChild for z-ordering
- **Resource management**: Tracks inventory and validates actions based on available resources
- **Collision system**: Validates moves before execution, prevents invalid actions
- **Modal system**: Centralized show/hide logic with animations
- **Input validation**: Real-time feedback for level selector with error messages
- **Conventional commit format**: All changes follow conventional commit standards

### Known Limitations
- No sound effects (original game had .wav and .mid audio files)
- No replay recording/playback (original game had .mmr replay files)
- No level editor (original game included one)

## Development Context

- Original game by Paul Equinox Collins and contributors
- Final version 3.0.3 (October 2005)
- Features recording/playback, level editor, unlimited attempts
- Classic Sokoban-style puzzle mechanics with additional elements
- Browser reimplementation preserves original gameplay and level data

## Development Guidelines

### Commit Practices
- Use conventional commits

### Version Numbering
- The version number is displayed in the game UI (index.html, #gameVersion)
- **IMPORTANT**: Increment the version number in `index.html` with each commit that changes gameplay mechanics, features, or user-facing functionality
- Use semantic versioning format: `vMAJOR.MINOR.PATCH`
  - **MAJOR**: Breaking changes or major feature additions
  - **MINOR**: New features or significant improvements
  - **PATCH**: Bug fixes or minor tweaks
- Version number helps users verify they're running the latest version (avoids cache issues on mobile)