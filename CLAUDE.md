# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains both the original **Mushroom Man** Windows puzzle game (2005) and a modern browser-based reimplementation. The original game assets, level data, and analysis tools are preserved alongside the new web version.

## Project Structure

### Browser Game (New Implementation)
- `index.html` - Main game HTML with SVG container and resource panel
- `game.js` - JavaScript game engine with level parser and rendering
- `style.css` - CSS styling for game interface
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
- **Controls**: Keyboard input (Arrow keys + WASD)
- **Level System**: Parses original level format from `levels/orig.txt`

### Key Features
- SVG tile rendering for all game symbols
- Resource tracking panel (keys, money, bombs, dynamite)
- Player movement with collision detection
- Level progression system
- Responsive grid layout

### Technical Details
- `MushroomManGame` class handles game state and rendering
- Level parser distinguishes grid data from metadata using capital letter detection
- SVG DOM manipulation for real-time tile updates
- Conventional commit format for version control

## Development Context

- Original game by Paul Equinox Collins and contributors
- Final version 3.0.3 (October 2005)
- Features recording/playback, level editor, unlimited attempts
- Classic Sokoban-style puzzle mechanics with additional elements
- Browser reimplementation preserves original gameplay and level data

## Development Guidelines

### Commit Practices
- Use conventional commits