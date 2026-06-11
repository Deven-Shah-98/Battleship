# Test Plan: 100-Feature Mega-Upgrade (PR #9, merged to main)

## Scope
PR #9 added 100 features across 5 batches: advanced gameplay mechanics, visual/audio, social/competitive, progression/meta, board variants, and technical/platform features. This plan tests the highest-impact, user-visible features through the UI.

## Environment
- Local dev server: `http://localhost:5173/`
- Branch: `main` (PR #9 merged)
- Browser: Chrome (desktop)
- Pre-test: Clear localStorage to start fresh (no stale state from prior sessions)

## Test 1: Setup Controls & Theme Switching
**Goal**: Verify the new setup controls render and function correctly.

**Steps**:
1. Load `http://localhost:5173/`, clear localStorage via console (`localStorage.clear()`)
2. Refresh the page
3. Verify setup panel shows: Board size chips (6x6, 10x10, 12x12, 15x15), Mode (Classic/Salvo), Players (vs AI/2-Player), AI difficulty (easy/medium/hard/admiral), AI personality (5 options), Speed, Timer, Power-ups/Weather/Narrator toggles, Theme switcher
4. Click "Salvo" mode chip
5. Click "admiral" difficulty chip  
6. Enable "Weather" checkbox
7. Enable "Power-ups" checkbox
8. Switch theme (click a non-default theme in the theme switcher)

**Pass criteria**:
- Salvo chip has `chip--active` class / visually highlighted
- Admiral chip has `chip--active` class / visually highlighted
- Weather checkbox is checked
- Power-ups checkbox is checked
- Theme changes visible background/accent colors
- Hint text below Mode says "Fire one shot per surviving ship each turn."
- Hint text below AI difficulty describes Admiral

## Test 2: Settings Panel — Board Variants & Advanced Mechanics
**Goal**: Verify the Settings modal opens and toggles persist.

**Steps**:
1. Click "Settings" button in the header
2. Verify modal opens with sections: Accessibility, Gameplay Assists, Notifications, Board Variants, Advanced Mechanics, Platform
3. Toggle "Islands" on (under Board Variants)
4. Toggle "Ship Shields" on (under Advanced Mechanics)  
5. Toggle "Scout Plane" on (under Advanced Mechanics)
6. Close the Settings modal
7. Re-open Settings modal

**Pass criteria**:
- Settings modal renders with all 6 sections visible
- After closing and re-opening, Islands, Ship Shields, and Scout Plane checkboxes remain checked (persisted in state)

## Test 3: Salvo Gameplay with Power-Ups & Weather
**Goal**: Verify salvo mode gives multiple shots per turn, power-ups work, and weather indicator appears.

**Steps**:
1. From setup (Salvo mode, Admiral difficulty, Weather ON, Power-ups ON already configured)
2. Place all 5 ships on the board (click cells to place)
3. Click "Start game"
4. Observe turn label — should show "X/5 shots remaining" (5 ships alive = 5 shots)
5. Fire 5 shots at different enemy cells by clicking them
6. After 5th shot, AI should take its turn (AI thinking indicator appears)
7. Check if weather indicator appears at top (may show "Clear Skies" or a weather event)
8. If Radar power-up is available (button visible), click "Radar" then click a cell — should reveal a 3x3 area

**Pass criteria**:
- Turn label contains "5/5 shots remaining" at start of first player turn
- After each shot, remaining count decrements (4/5, 3/5, etc.)
- After 5th shot, turn switches to AI (label shows "Enemy is analyzing..." or similar)
- Weather indicator div is present (either showing a weather type or "Clear Skies" if clear)
- If Radar used: battle log contains "Radar scan" entry and cells on enemy board change state

## Test 4: Campaign Panel
**Goal**: Verify Campaign modal opens and shows missions.

**Steps**:
1. Click "Campaign" button in the header
2. Observe the campaign panel content

**Pass criteria**:
- Campaign modal opens
- At least 1 mission is listed with a name, briefing, and "Start Mission" button
- Mission shows difficulty indicator

## Test 5: Game Over — XP, Achievements, Stats
**Goal**: Verify game-over overlay shows correct per-game XP earned and achievement toasts fire.

**Steps**:
1. Start a new game (click "Play Again" or refresh + set up) with Easy AI, Classic mode
2. Play through the game to completion (sink all enemy ships)
3. Observe game-over overlay

**Pass criteria**:
- GameOverOverlay appears with "You win!" label
- Shows shots, hits, accuracy percentage, duration
- Shows XP earned (a positive number, NOT zero, NOT total accumulated XP)
- "Play Again", "Analysis", "Share", "Replay" buttons visible
- If "first_sink" achievement wasn't previously unlocked: "Achievement Unlocked" toast appeared during gameplay when first ship was sunk

## Test 6: Profile & Match History Panels  
**Goal**: Verify meta panels show data after a completed game.

**Steps**:
1. After completing Test 5 (at least 1 game played)
2. Click "Profile" button in header
3. Observe profile content
4. Close profile, click "Stats" button in header
5. Observe match history content

**Pass criteria**:
- Profile modal opens showing player level (>= 1), title, XP bar, lifetime stats
- Stats modal opens showing at least 1 game in match history with win/loss, shots, accuracy

## Test 7: Achievements Panel
**Goal**: Verify achievements panel shows unlocked and locked achievements.

**Steps**:
1. Click "Achievements" button in header
2. Observe achievements list

**Pass criteria**:
- Achievements modal opens
- Shows a mix of unlocked (from games played) and locked achievements
- At least "first_win" or "first_sink" shows as unlocked (green/highlighted) if a game was won

---

## Out of Scope (not tested in this plan)
- 2-Player hotseat (tested in prior PR #6 testing)
- Drag-and-drop placement (tested in prior PR #6 testing)  
- Keyboard accessibility (tested in prior PR #6 testing)
- WebSocket multiplayer (no backend server)
- Gamepad/Voice/PiP (hardware-dependent)
- IndexedDB, Service Worker, export/import (infrastructure — verified by unit tests)
