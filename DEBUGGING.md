# Debugging Log

A record of every significant bug encountered during development and how each
was resolved. Organised chronologically by when they were discovered.

---

## 1. `vite build` failed — `test` is not a valid Vite config property

**Symptom**  
`tsc -b` rejected `vite.config.ts` with _"'test' does not exist in type
'UserConfigExport'"_.

**Cause**  
The Vitest `test: { … }` block was inside a config created with
`defineConfig` imported from `vite`, whose types don't include `test`.

**Fix**  
Changed the import to `import { defineConfig } from "vitest/config"`, which
extends the type with Vitest's `test` options.

---

## 2. AI double-firing — nested `setState` side effects

**Symptom**  
The AI's move logic was inside a `setPlayerBoard(board => { … })` updater
that also called `setAiState`, `setTurn`, `setWinner`, and `addLog`. React's
`<StrictMode>` (and concurrent rendering) can invoke updaters more than once,
causing duplicate battle-log entries and double turn advancement.

**Fix**  
Refactored to compute the move in a `setTimeout` callback, read current state
from the closure, and call each setter exactly once at top level — no side
effects inside updaters.

---

## 3. AI re-targeting already-fired cells / infinite loop risk

**Symptom**  
A naive hunt-and-target AI could re-queue cells it already fired at.

**Fix**  
`chooseAIMove` filters the target queue against `board.shots` every call.
`updateAIAfterResult` excludes out-of-bounds and already-fired neighbours.
Regression test plays a full game and asserts the AI never fires the same cell
twice.

---

## 4. Random placement could hang with pathological RNG

**Symptom**  
Pure rejection sampling for ship placement has no upper bound.

**Fix**  
`placeShipsRandomly` caps attempts per ship at 1 000 and throws a clear error.
Standard fleet on 10×10 converges well within that. Test verifies no overlaps
or out-of-bounds.

---

## 5. `Record` interface shadowed the built-in utility type

**Symptom**  
`tsc` error: _"Type 'GameRecord' is not generic"_ on `Record<Difficulty, …>`.

**Cause**  
A local `interface Record { wins; losses }` shadowed TypeScript's global
`Record<K, V>`.

**Fix**  
Renamed to `GameRecord`.

---

## 6. Hard AI could cheat by reading ship positions

**Design decision**  
The AI receives the full `Board` object, which includes ship coordinates.

**Fix**  
`computeHeatmap` only uses `board.shots`, sunk-ship cells (already revealed),
and sizes of remaining ships. It never inspects un-hit positions. Tests assert
it zeroes out miss-surrounded cells and boosts cells in line with a hit.

---

## 7. `useEffect` dependency completeness for the AI turn

**Symptom**  
ESLint's `react-hooks/exhaustive-deps` flagged missing `difficulty` and
`recordResult`.

**Fix**  
Added them to the dependency array. `recordResult` and `addLog` are wrapped
in `useCallback` with stable deps so they don't re-trigger the effect.

---

## 8. Hotseat salvo initialisation + stale board refs

**Symptom**  
In hotseat (pass-and-play) salvo mode, the shot counter didn't initialise
correctly, and the displayed board could be stale after switching players.

**Fix**  
Reset `salvoShotsRemaining` when switching players; pass the latest board
reference rather than a stale closure capture.

---

## 9. Radar/sonar power-ups showed sunk ships

**Symptom**  
Radar scan and sonar ping highlighted cells belonging to already-sunk ships,
giving misleading information.

**Fix**  
Both abilities now filter out cells occupied by sunk ships before highlighting.

---

## 10. Hotseat P2 last-shot ring on wrong board

**Symptom**  
After Player 2 fired, the "last shot" highlight ring appeared on Player 1's
board instead of Player 2's tracking grid.

**Fix**  
Tracked `lastShotP2` separately and routed it to the correct grid.

---

## 11. Admiral AI heatmap — negative extension penalty

**Symptom**  
The Admiral-difficulty heatmap incorrectly penalised cells adjacent to wounded
ships, making the AI *less* likely to finish off a partially-hit ship.

**Fix**  
Corrected the extension-scoring formula so the AI strongly favours cells in
line with existing hits.

---

## 12. Stale `aiBoard` in `recordResult`

**Symptom**  
The `recordResult` callback captured a stale `aiBoard` reference, so AI hits
were sometimes applied to an outdated board snapshot, causing visual desync.

**Fix**  
Used a `useRef` for `aiBoard` inside `recordResult`, ensuring it always reads
the latest board.

---

## 13. AI timer not cleaned up on game-over

**Symptom**  
If the game ended during the AI's thinking delay, the pending `setTimeout`
would fire after game-over, creating ghost turns.

**Fix**  
Clear the AI timer on game-over and when the component unmounts.

---

## 14. P2 setup board showed P1's ships in hotseat

**Symptom**  
During Player 2's placement phase, the board grid displayed Player 1's placed
ships instead of an empty board.

**Fix**  
Conditionally pass `p2Board` (not `playerBoard`) during P2's setup phase.

---

## 15. Service worker cached non-200 responses

**Symptom**  
Failed fetch responses (e.g., 404) were cached, causing persistent broken
pages even after the issue was resolved.

**Fix**  
Only cache responses with `response.ok === true`. Return a 503 fallback on
cache-miss + network-failure.

---

## 16. GameOverOverlay — hotseat stats and P2 win styling

**Symptom**  
In hotseat mode, the game-over overlay always displayed Player 1's stats.
Player 2 wins lacked distinct visual styling.

**Fix**  
Conditionally display the correct player's shot/hit counts and added a `p2-win`
CSS class.

---

## 17. Level-up toast always showed zero

**Symptom**  
The "Level Up!" toast displayed the player's level as 0.

**Cause**  
`loadXP()` was called before `addGameXP()`, so the toast read the pre-update
value.

**Fix**  
Reordered: call `addGameXP()` first, then read the resulting level for the toast.

---

## 18. Progressive AI difficulty never applied to behaviour

**Symptom**  
The "effective difficulty" increased based on wins, but the AI's actual shot
logic still used the original difficulty setting.

**Fix**  
Stored the computed difficulty in `effectiveDifficulty` state and wired it into
the AI decision function.

---

## 19. Game-over XP showed total accumulated, not per-game

**Symptom**  
The game-over overlay displayed total lifetime XP instead of XP earned in the
current match.

**Fix**  
Captured XP before and after the game, displayed the delta.

---

## 20. Storm weather didn't disable power-ups

**Symptom**  
During a storm, players could still use radar, sonar, and airstrike abilities
despite the storm description saying they should be blocked.

**Fix**  
Added a guard: if `currentWeather === "storm"`, power-up buttons are disabled
with a tooltip explaining why.

---

## 21. Calm weather didn't grant bonus shot

**Symptom**  
The calm weather description promises "a bonus shot (skip AI turn)" but the AI
turn always fired.

**Fix**  
When weather is calm, skip the AI's turn after the player's shot.

---

## 22. Turn timer didn't auto-fire on expiry

**Symptom**  
When the timer reached 0 with timed turns enabled, nothing happened — the player
could wait indefinitely.

**Fix**  
On timer expiry, auto-fire a random unfired cell and pass the turn to the AI.

---

## 23. Auto-save didn't restore game on reload

**Symptom**  
The game saved to `localStorage` during play, but reloading the page always
started a fresh game.

**Fix**  
On mount, check for a saved game in `localStorage`; if found, restore all
state variables and add a "Game restored from auto-save" log entry.

---

## 24. Board size mismatch in hotseat

**Symptom**  
Changing board size before a hotseat game only reset Player 1's board. Player 2
still had a 10×10 board on a 6×6 game.

**Fix**  
`handleBoardSizeChange` now resets `playerBoard`, `aiBoard`, and `p2Board` to
the new size.

---

## 25. Post-game heatmap all zeros on wins

**Symptom**  
The post-game analysis heatmap showed all zeros after a victory.

**Cause**  
Sunk ships were filtered out of the heatmap calculation, but after a win *all*
enemy ships are sunk.

**Fix**  
Include sunk ship cells in the heatmap when the game is over.

---

## 26. Weather scatter silently ate auto-fire shots

**Symptom**  
When weather scattered the auto-fire shot to an already-hit cell, the shot was
silently consumed with no feedback.

**Fix**  
If the scattered target is already hit, retry with a nearby valid cell.

---

## 27. Hit-streak achievement tracked current, not max

**Symptom**  
The "Hot Streak" achievement (5 consecutive hits) only checked the *current*
streak at game-end, not the *maximum* streak during the game.

**Fix**  
Track `maxHitStreak` alongside `currentHitStreak`, reset current on miss,
update max after each hit.

---

## 28. Comeback mechanic granted unlimited radar scans

**Symptom**  
The "Last Stand" mechanic (free radar when down to 1 ship) triggered on every
AI shot, giving unlimited free radar scans.

**Fix**  
Guarded with `lastStandRef` — fires only once per game.

---

## 29. Stale timer closure after auto-fire

**Symptom**  
After the turn timer auto-fired, the remaining salvo shots used a stale timer
reference, causing inconsistent countdown behaviour.

**Fix**  
Intentional design: remaining salvo shots have no timer pressure after one
auto-fire. Documented as forgiving design.

---

## 30. UpgradeTreePanel showed hardcoded 0 XP

**Symptom**  
The upgrade/perk tree always displayed "0 XP" regardless of actual player XP.

**Fix**  
Passed the real `totalXP` value from the parent component instead of a
hardcoded placeholder.

---

## 31. Combo display + AI dialogue leaked into setup phase

**Symptom**  
The combo multiplier badge and AI personality dialogue bubble rendered during
the ship placement phase, before the game started.

**Fix**  
Added `phase === "playing"` guards so these elements only render during
gameplay.

---

## 32. Handicap ordering bug

**Symptom**  
When applying handicap (stronger player gets fewer ships), the removal order
was inconsistent, sometimes removing the wrong ship type.

**Fix**  
Sort fleet by size descending before removal, ensuring the largest ships are
removed first for fair handicapping.

---

## 33. Win probability displayed NaN

**Symptom**  
The win probability percentage showed `NaN%` at the start of a game.

**Fix**  
Added a guard for division-by-zero when no shots have been fired yet;
default to 50%.

---

## 34. `checkMine` mutated board state directly

**Symptom**  
The minefield check function directly mutated the board array instead of
creating a new copy, causing React to miss the state change.

**Fix**  
Clone the board before marking mine detonation, then set state with the new
copy.

---

## 35. Escape key handler conflicts between modals

**Symptom**  
Pressing Escape when multiple modals were potentially open would close the wrong
one, or close all of them simultaneously.

**Fix**  
Implemented priority-based Escape handling: the topmost (most recently opened)
modal consumes the event, inner modals ignore it.

---

## 36. HelpGuide search didn't reset on tab change

**Symptom**  
Switching category tabs in the Help Guide while a search filter was active
showed no results because the filter persisted.

**Fix**  
Clear the search query when the active tab changes.

---

## 37. `loadUpgrades` returned a shared reference

**Symptom**  
Loading upgrade data from `localStorage` returned the same object reference,
so mutating it in one place affected all consumers.

**Fix**  
Deep-clone the loaded data before returning it.

---

## 38. Lazy components outside Suspense boundary

**Symptom**  
After the UI/UX overhaul added `React.lazy()` imports, some dynamically-loaded
panels rendered outside the `<Suspense>` boundary, causing React to throw when
the chunk hadn't loaded yet.

**Fix**  
Wrapped all lazy components in a shared `<Suspense fallback={<Loading />}>`.

---

## 39. Preset buttons bypassed `handleBoardSizeChange`

**Symptom**  
Clicking "Quick Play" or "Advanced" preset buttons called `setBoardSize()`
directly, skipping the board-reset logic. The grid visually changed size but
the board arrays (player, AI, P2) still had the old dimensions.

**Fix**  
Preset buttons now call `handleBoardSizeChange(newSize)`, which resets all
three boards atomically.

---

## 40. Campaign mission start — stale game state

**Symptom**  
Starting a campaign mission mid-game or from a completed game carried over
stale state: previous turn, winner banner, power-up charges, weather,
shot history.

**Fix**  
Campaign `onStartMission` now calls `newGame()` first, which resets all 30+
state variables (turn, winner, aiState, powerUps, radarCells, sonarOverlay,
airstrikeCells, salvoShotsRemaining, showConfetti, showPassDevice, aiThinking,
hintCell, placementHistory, currentWeather, weatherTurnsLeft, etc.) and clears
`localStorage` autosave. Campaign overrides are then applied on the clean slate.

---

## 41. Enemy tracking grid wrong size after campaign start

**Symptom**  
After starting a campaign mission with an 8×8 board, the player's board
correctly resized to 8×8 but the enemy tracking grid remained 10×10.

**Root cause**  
`handleBoardSizeChange` reset `playerBoard` and `p2Board` but **not**
`aiBoard`. Since `BoardGrid` derives its dimensions from `board.size`,
the enemy grid kept the old 10×10 size.

**Fix**  
Added `setAiBoard(createEmptyBoard(newSize))` to `handleBoardSizeChange`.
Also added a defence-in-depth `setAiBoard` call in the campaign handler itself.

---

## 42. `enableWeather` never reset for non-weather missions

**Symptom**  
If you played a weather-enabled game, then started a campaign mission without
weather, the weather toggle stayed on. The campaign handler only set
`setEnableWeather(true)` for weather missions but never reset it to `false`
otherwise.

**Fix**  
Added an `else { setEnableWeather(false) }` branch for non-weather missions.

---

## 43. Loadout panel didn't reset AI board on size change

**Symptom**  
Applying a loadout with a different board size reset the player and P2 boards
but not the AI board, identical to bug #41 but through the loadout code path.

**Fix**  
Replaced the manual `setPlayerBoard`/`setP2Board` calls with a single
`handleBoardSizeChange(loadout.boardSize)`, which atomically resets all three
boards.

---

## Known Issue (Not Yet Fixed)

**Campaign weather overridden by `startGame()` roll**  
The campaign handler sets specific weather (e.g., storm), but when the player
clicks "Start game" to begin playing, `startGame()` calls `rollWeather()` which
randomly re-rolls the weather. This is a pre-existing design issue — campaign
weather settings are effectively overridden. Tracked for future fix.
