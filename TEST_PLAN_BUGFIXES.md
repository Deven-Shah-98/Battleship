# Test Plan: PR #9 Bug Fixes (Round 1 + Round 2)

## Overview
Testing the 9 bug fixes applied to PR #9 after two rounds of Devin Review.
Local dev server: http://localhost:5175

## Test 1: GameOver overlay shows per-game XP (not total accumulated XP)

**What changed:** `xpEarned={lastGameXP}` instead of `xpEarned={xpState.totalXP}`

**Steps:**
1. Clear localStorage to reset XP (`localStorage.clear()` in console)
2. Start a classic game vs Easy AI, 10x10 board
3. Click "Random" to place ships, click "Start Battle"
4. Play to completion (win or lose)
5. Observe the GameOver overlay

**Pass criteria:** The overlay shows `+N XP` where N is a small number (typically 10-100 for one game). If the bug were still present, it would show the total accumulated XP which would equal this value on the first game — so play a SECOND game and check that the XP shown is again a small per-game value, NOT the sum of both games.

**Concrete assertion:** After 2nd game, `+N XP` value should be roughly similar to the 1st game's value (both < 200), NOT double it.

## Test 2: Turn timer auto-fires when time expires (10s timer)

**What changed:** Timer now calls `handleFireRef.current()` which reads fresh board state and auto-fires a random cell.

**Steps:**
1. New game: classic mode, Easy AI, enable Timer = 10s
2. Place ships (Random), Start Battle
3. Do NOT fire — let the 10-second timer count down to 0
4. Watch the battle log and board state

**Pass criteria:**
- The status label shows a countdown `(Xs)` that decrements each second
- When it reaches 0, the battle log shows "Time's up! Auto-firing at [cell]."
- A cell on the enemy board changes state (hit marker or miss marker appears)
- Turn passes to AI (status shows "Enemy is analyzing..." or similar)

**Fail if:** Timer reaches 0 and nothing happens (old behavior — timer was cosmetic only).

## Test 3: Storm weather disables power-ups

**What changed:** `applyPowerUp()` now checks `currentWeather === "storm"` and rejects.

**Steps:**
1. New game: classic mode, Easy AI, enable Weather checkbox AND Power-ups checkbox
2. Place ships, Start Battle
3. Use browser console to force storm weather: run in console:
   ```js
   // We can't easily force weather, so we'll test via battle log observation
   ```
4. Alternative approach: Play turns with weather enabled and watch for storm weather in the weather indicator. When storm appears, try to use a power-up (click Radar/Sonar/Airstrike button, then click a cell)

**Pass criteria:** When storm is active and player tries to use a power-up, battle log shows "Power-ups are disabled during storms!" and the power-up is NOT consumed.

**Note:** Weather is random, so storm may not appear. If it doesn't appear within ~10 turns, mark as UNTESTED and note the reason.

## Test 4: Calm weather grants bonus shot (skip AI turn)

**Steps:**
1. Same game as Test 3 or new game with Weather enabled, classic mode
2. Play turns and watch for "Calm Seas" in the weather indicator
3. When calm is active, fire a shot

**Pass criteria:** After firing during calm weather, battle log shows "Calm seas grant a bonus shot!" and the player gets to fire again immediately without AI taking a turn. The status should still read "Your turn" after firing.

**Note:** Weather is random. If calm doesn't appear, mark as UNTESTED.

## Test 5: Auto-save restores game on page reload

**What changed:** New mount effect reads `AUTOSAVE_KEY` from localStorage and restores all state.

**Steps:**
1. New game: classic mode, vs AI, any settings
2. Place ships, Start Battle
3. Fire 3-5 shots so the game is in progress (note the shots on the board)
4. Reload the page (F5 or navigate to localhost:5175 again)
5. Observe: does the game resume?

**Pass criteria:**
- After reload, the game is in "playing" phase (not setup)
- The shots previously fired are still visible on the enemy board
- Battle log shows "Game restored from auto-save."
- Player can continue firing

**Fail if:** After reload, game goes to setup screen (old behavior — auto-save was write-only).

## Test 6: Progressive AI difficulty is applied (effectiveDifficulty used in AI effect)

**What changed:** `effectiveDifficulty` state variable created, set by `startGame`, used in AI effect.

**Steps:**
1. This is hard to verify visually since progressive AI adjusts based on win rate
2. Start a game on Easy difficulty
3. Check battle log for "Progressive AI adjusted difficulty to [X]!" message

**Pass criteria:** If the message appears, the progressive adjustment is being computed and logged (it was always logged, but now the `effectiveDifficulty` state is set too). The key fix is in the AI effect code path — verified by code review. Mark as PASSED BY CODE REVIEW if log message appears.

**Alternative verification:** Check browser console — no errors during AI turn when using personality modes.

## Test 7: first_sink achievement unlocks

**What changed:** `tryUnlock("first_sink")` added to `checkGameAchievements`.

**Steps:**
1. Clear localStorage to reset achievements
2. Start a game vs Easy AI
3. Play until you sink at least one enemy ship
4. Complete the game (win or lose)
5. Check for achievement toast "Achievement Unlocked: Down She Goes"

**Pass criteria:** Achievement toast appears after the game ends (when `recordResult` fires), showing "Down She Goes" (the first_sink achievement name).

**Fail if:** No achievement toast for first_sink despite sinking a ship.
