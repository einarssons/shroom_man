# Mushroom Man

Old PC, but also ZX Spectrum Game

[Entry in World of Spectrum](https://worldofspectrum.net/item/0023117/)

## Splashscreen
![SpashScreen](images/mman_splashscreen.png)


## Screenshot Level 1
![ScreenShot](images/mman_screenshot.png)

## Level Symbols Analysis

Different levels can have different grid sizes.
The currently biggest one is 20 tiles wide and 14 tiles high.

The game uses various symbols in its level files (`MushroomMan/levels.dat` and `MushroomMan/levels.txt`) to represent different gameplay elements:

### Basic Elements
- `w` = Wall
- `s` = Start position
- `e` = Exit
- `l` = Lock
- `k` = Key
- `h` = Hole
- `c` = Cement

### Interactive Objects
- `j` = Jellybean (can be pushed)
- `b` = Bomb (destroys walls)
- `d` = Dynamite (destroys impenetrable walls)
- `g` = Guard
- `f` = Money/Finance (to bribe guards)
- `o` = Oxygen tank
- `n` = Gun/weapon that fires bullets

### Terrain & Environment
- `~` = Water
- `i` = Impenetrable wall (cannot be destroyed by bombs)
- ` ` = Empty walkable space

### Teleports
- `t##` = Teleport pairs (where ## is a two-digit number)
  - Examples: `t11`, `t12`, `t21`, `t22`, etc.
  - Teleports with the same number are connected to each other

### Gameplay Mechanics
The player moves around step by step, either horizontally
or vertically. The goal is to move from Start to End.
Fewer steps is better.

Based on level titles and element interactions:
- Keys open locks and doors
- Cement fills holes  
- Guards can be bribed with money
- Bombs destroys a 3x3 area around its centrum, except
  impenetrable walls, and the main character who stepped into the bomb tile. Neighboring bombs are also destroyed.
  However, dynamite is triggered.
- Dynamite destroys a 3x3 area as does bombs, but it
  also destroys impenetrable walls. It triggers neighboring
  dynamite for a possible chain-reaction
- Jellybeans can be pushed around
- Guns fire once in the direction you walk into the tile
- Oxygen lets you move through water. One oxygen is consumed
  per water tile
- Teleports transport you between numbered pairs

The game features over 100 levels with increasing complexity, combining puzzle-solving elements with strategic gameplay mechanics. 