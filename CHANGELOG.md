# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-10-26

### Fixed
- Fixed bug where start position remained occupied after player moved, preventing game elements (like jellybeans) from being pushed to that location (Issue found in Level 37)
- Player sprite now remains visible throughout the game and correctly tracks position

### Changed
- Redesigned portal/teleporter arrows to be smaller and more intuitive
- Portal arrow tips now touch the edge of the tile in the exit direction

## [1.0.4] - 2025-10-26

### Fixed
- Fixed gun direction when landing on gun after teleport - now correctly passes exit direction to gun
- Fixed previous best score display in level complete modal

### Changed
- Added cache-busting query parameter to game.js to prevent Safari caching issues

## [1.0.3] - Previous versions

Earlier versions focused on initial browser implementation with full game mechanics including:
- Core movement and collision system
- All game elements (keys, locks, guards, money, cement, holes, oxygen, water, etc.)
- Bombs, dynamite, and guns with proper destruction mechanics
- Teleporter/portal system with directional exits
- Level progression and scoring system
- Touch/swipe controls for mobile devices
