#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze levels.txt to find actual grid dimensions after cleaning teleporter codes.
"""

import re

def clean_teleporter_codes(line):
    """Remove digits from teleporter codes like t11, t12 -> t, t"""
    return re.sub(r't\d+', 't', line)

def is_title_or_author(line):
    """Check if first characters of line is a capital letter"""
    if not line.strip():
        return False
    
    # Skip obvious title lines (words only, no game symbols)
    if re.match(r'^[A-Z]+.+$', line.strip()):
        return True
    
    return False

def is_grid_line(line):
    """Check if a line contains actual game grid symbols"""
    if not line.strip():
        return False
    
    if is_title_or_author(line):
        return False
    
    # Grid lines should contain mostly game symbols
    game_symbols = set('wseklgfbdhijcno~')
    line_chars = set(line.strip().lower())
    
    if not (line_chars & game_symbols):
        return False
    
    # Should be mostly game symbols (at least 50%)
    if len(line_chars & game_symbols) < len(line_chars) * 0.5:
        return False
    
    return True

def analyze_levels_file(filename):
    """Analyze the levels file to find grid dimensions"""
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    current_level_lines = []
    level_count = 0
    max_width_original = 0
    max_width_cleaned = 0
    max_height = 0
    
    print("Processing levels...")
    
    for line_num, line in enumerate(lines, 1):
        # Remove line number prefix
        if line_num <=3: # Header lines
            continue
        
        line = re.sub(r'^\s*\d+.', '', line).rstrip('\n\r')
        
        if is_grid_line(line):
            current_level_lines.append(line)
            
            original_width = len(line)
            max_width_original = max(max_width_original, original_width)
            
            cleaned_line = clean_teleporter_codes(line)
            cleaned_width = len(cleaned_line)
            max_width_cleaned = max(max_width_cleaned, cleaned_width)
        else:
            # End of current level
            if current_level_lines:
                level_height = len(current_level_lines)
                max_height = max(max_height, level_height)
                level_count += 1
                current_level_lines = []
    
    # Handle last level
    if current_level_lines:
        level_height = len(current_level_lines)
        max_height = max(max_height, level_height)
        level_count += 1
    
    return {
        'total_levels': level_count,
        'max_width_original': max_width_original,
        'max_width_cleaned': max_width_cleaned,
        'max_height': max_height
    }

def main():
    filename = '/Users/tobbe/proj/github/tobbee/mushman/MushroomMan/levels.txt'
    
    print("=" * 60)
    print("MUSHMAN LEVELS.TXT GRID DIMENSION ANALYSIS")
    print("=" * 60)
    
    results = analyze_levels_file(filename)
    
    print("\nRESULTS:")
    print("-" * 40)
    print("Total levels found: %d" % results['total_levels'])
    print()
    print("GRID DIMENSIONS:")
    print("  Maximum width:  %d characters" % results['max_width_cleaned'])
    print("  Maximum height: %d lines" % results['max_height'])
    print()
    print("FINAL GAME GRID DIMENSIONS: %d x %d" % (results['max_width_cleaned'], results['max_height']))
    print("-" * 60)

if __name__ == "__main__":
    main()