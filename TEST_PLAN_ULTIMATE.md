# Test Plan: Ultimate Battleship — 12-Feature Mega-Upgrade

## Environment
- Local dev server: http://localhost:5174/
- Deployed: https://dist-iqfiorvc.devinapps.com

## Test 1: Theme Switching (proves feature #7)
**Steps:**
1. Open the app at localhost:5174
2. In setup panel, find "Theme:" row with 4 buttons: Ocean, Midnight, Light, Sunset
3. Click "Midnight" theme button
**Pass criteria:**
- Background color changes to dark (#121212-ish), not the default ocean blue (#0b1d2a)
- The "Midnight" button appears selected/active (has `chip--active` class)
4. Click "Light" theme button
**Pass criteria:**
- Background changes to light/white (#f5f5f5-ish)
5. Click "Ocean" to restore default

## Test 2: Setup Controls — Salvo + Admiral + Power-ups + Seed (proves features #1, #3, #4, #9)
**Steps:**
1. In setup panel, click "Salvo" mode chip
**Pass criteria:** "Salvo" chip is active, hint reads "Fire one shot per surviving ship each turn."
2. Click "admiral" difficulty chip
**Pass criteria:** "admiral" chip is active, difficulty hint updates
3. Verify "Enable power-ups" checkbox is visible and checked by default
4. Check "Use game seed" checkbox, type "TEST" in the seed input
**Pass criteria:** Seed input appears and shows "TEST" (uppercased)
5. Click "Random" to auto-place fleet, then click "Start game"

## Test 3: Gameplay — Salvo Mode + Power-ups + Admiral AI (proves features #1, #3, #4, #6)
**Steps (continuing from Test 2):**
1. After game starts, verify battle log says "Salvo" mode and shows shot count
**Pass criteria:** Log entry contains "Salvo" and a shot count like "You have 5 shots"
2. Verify status bar shows "Your turn — X/X shots remaining" where X = 5 (all ships alive)
**Pass criteria:** Status text contains "5/5 shots remaining"
3. Verify seed is displayed in status area: "Seed: TEST"
**Pass criteria:** Seed label visible with value "TEST"
4. Verify PowerUpBar is visible with 3 buttons (Radar, Sonar, Airstrike)
**Pass criteria:** 3 power-up buttons visible, each with a count badge
5. Click "Radar" power-up button to select it
**Pass criteria:** Radar button shows active/selected state
6. Click a cell on the enemy board to use radar scan
**Pass criteria:** Battle log shows "Radar scan at X: N ship segment(s) detected", radar cells get highlighted
7. Fire 4 more shots at enemy waters (clicking different cells)
**Pass criteria:** After each shot, the remaining count decrements. After all 5 shots used, turn switches to AI
8. Verify AI thinking indicator appears
**Pass criteria:** Status shows "Enemy is analyzing..." with animation class

## Test 4: 2-Player Hotseat — P2 Setup Board Fix (proves feature #10 + bug fix)
**Steps:**
1. Click "Play again" or reload, select "2-Player" mode
**Pass criteria:** "2-Player" chip is active, subtitle changes to "Pass & Play"
2. Click "Random" to place P1's fleet, click "Next: P2 Setup"
**Pass criteria:** Phase changes, heading says "Player 2: Place your fleet"
3. **Critical bug-fix assertion:** The left board ("Your waters") should show an EMPTY grid for P2, NOT P1's ships
**Pass criteria:** The left board grid has 0 visible ship cells (no colored/filled cells). If P1's ships are visible, the bug fix failed.
4. Click "Random" to place P2's fleet
**Pass criteria:** Ships appear on the (previously empty) P2 board
5. Click "Start game"
**Pass criteria:** "Pass the device to Player 1" overlay appears

## Test 5: Match History Panel (proves feature #8)
**Steps:**
1. After playing at least one vs-AI game to completion, click "Stats" button in header
**Pass criteria:** Match history modal opens showing at least 1 game record
2. Verify stats section shows: games played, win rate, avg accuracy
**Pass criteria:** Stat cards are visible with numeric values
3. Close modal

## Test 6: Drag-and-Drop Ship Placement (proves feature #2)
**Steps:**
1. Start a new game, observe the ShipDock component below the setup controls
**Pass criteria:** Ship dock shows ship names with orientation pips
2. Drag the first ship from the dock onto the board grid
**Pass criteria:** Ship appears on the board at the drop location (or click placement works as fallback)

## Test 7: Accessibility — Keyboard Navigation (proves feature #11)
**Steps:**
1. During gameplay, Tab to the enemy board grid
2. Use arrow keys to navigate between cells
**Pass criteria:** Focus ring (visible outline) moves between cells as arrow keys are pressed
3. Press Enter on an unshot cell
**Pass criteria:** Shot fires at the focused cell, battle log updates
