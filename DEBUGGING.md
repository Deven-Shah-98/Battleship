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

## 44. Hit/miss glow used accent colour instead of semantic colours

**Symptom**  
Hit cells glowed blue (the accent colour) on all themes instead of red, and
miss cells lacked a distinct glow. Game-over icons were also blue.

**Cause**  
Hardcoded `rgba(var(--accent-rgb), 0.25)` box-shadows throughout `styles.css`.
The `--accent-rgb` variable was also not consistently defined.

**Fix**  
Replaced all hit-related glows with `var(--hit-glow)` (red) and win icons with
`var(--ok-glow)` (green). Removed all `--accent-rgb` references in favour of
the pre-composed glow variables.

---

## 45. Cognition theme colours didn't match cognition.ai

**Symptom**  
The "Cognition" theme used a dark navy palette (`#0B0E14` background, `#FA5050`
red accent) that bore no resemblance to cognition.ai's actual brand.

**Fix**  
Extracted the real cognition.ai palette: light cream background (`#f7f6f5`),
blue accent (`#2200ff`), dark text (`#000000`). Updated all 30 CSS variables
in `theme.ts` and `:root` defaults in `styles.css`.

---

## 46. `--text-primary` referenced but never defined

**Symptom**  
Three CSS rules referenced `var(--text-primary)`, which doesn't exist. Text
colour fell back to `inherit`, producing invisible or wrong-colour text.

**Fix**  
Replaced `var(--text-primary)` with `var(--text)` (the actual variable name) in
all three locations.

---

## 47. `--border-subtle` and `--surface-glass` undefined on light themes

**Symptom**  
13 CSS rules used `var(--border-subtle)` and `var(--surface-glass)` with
fallbacks like `rgba(255,255,255,0.1)` — white overlays designed for dark
backgrounds. On light themes these were invisible.

**Fix**  
Defined both variables in all 6 theme configs (`theme.ts`) with appropriate
light/dark values, and added them to the CSS `:root` defaults.

---

## 48. `lastStandGlow` animation lost its pulse

**Symptom**  
The Last Stand glow animation (triggered when the player has one ship left)
used the same `var(--accent-glow)` at 0% and 50% keyframes, producing a
static glow instead of a visible pulse.

**Fix**  
Restored the pulse by using stacked box-shadows (8px + 20px + 40px spread) at
the 50% keyframe and adding an opacity animation (0.7 → 1.0).

---

## 49. XP bar label invisible on light themes

**Symptom**  
The XP bar label colour was changed from `var(--text)` to `#fff` for
readability over the gradient fill. But on light themes at low XP fill, the
white label sat on a near-white `var(--glass-bg)` background.

**Fix**  
Changed `.xp-bar-header` background from `var(--glass-bg)` (translucent white)
to `var(--bg-secondary)` (solid darker colour). Strengthened the text-shadow
to `0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)`.

---

## 50. Strategy textarea placeholder invisible on light themes

**Symptom**  
The `.strategy-textarea::placeholder` used hardcoded `rgba(255,255,255,0.25)`,
invisible on light-background themes.

**Fix**  
Replaced with `var(--text-muted)`, which resolves to an appropriate muted
colour on both light and dark themes.

---

## 51. `--bg-primary` referenced but never defined (hint button text invisible)

**Symptom**  
`.hint-btn:hover` set `color: var(--bg-primary)`, but `--bg-primary` was never
defined. On hover the text colour became invalid and inherited `var(--accent)` —
the same as the hover background, making text invisible.

**Fix**  
Replaced with `color: #fff` since the hover background is `var(--accent)`.

---

## 52. Hardcoded `rgba(255,255,255,…)` in multiple components

**Symptom**  
`.perk-card`, `.battle-pass-mission`, `.battle-pass-progress`, `.journal-entry`,
`.loadout-card__details`, and `AchievementShowcase` used hardcoded white RGBA
values designed for dark backgrounds — invisible on the new light default theme.

**Fix**  
Replaced all with theme-aware CSS variables: `var(--surface-glass)` for
backgrounds, `var(--border-subtle)` for borders, `var(--cell-hover)` for
hover states.

---

## 53. Old accent colour `#FA5050` hardcoded in Confetti and AnalyticsPanel

**Symptom**  
`Confetti.tsx` and `AnalyticsPanel.tsx` hardcoded the old cognition red accent
(`#FA5050` / `rgba(250,80,80,...)`), appearing visually mismatched after the
theme change to blue (`#2200ff`).

**Fix**  
Confetti: `#FA5050` → `#2200ff` (new accent), `#9EAEE9` → `#e53935` (hit red).
AnalyticsPanel heatmap: `rgba(250,80,80,…)` → `rgba(229,57,53,…)` matching
`--hit`.

---

## 54. Campaign cards and Profile panel completely unstyled

**Symptom**  
Campaign mission cards and the Player Profile panel had no dedicated CSS.
Text ran together, cards had no borders or padding, and star ratings were
unformatted.

**Fix**  
Added full CSS for `.mission-card`, `.profile-header`, `.profile-stats`, etc.
with proper grid layouts, borders, padding, and theme-aware colours.

---

## 55. Fashionista achievement unreachable — THEMES registry still had 6 entries

**Symptom**  
The "Fashionista" achievement (`all_themes`) required `used.size >=
Object.keys(THEMES).length`. After Cognition was removed from the UI, only 5
themes were selectable, but `THEMES` still contained the cognition entry —
`Object.keys(THEMES).length` was 6, making the achievement impossible.

**Fix**  
Removed the `cognition` entry from the `THEMES` object and the `"cognition"`
member from the `ThemeName` union type. Added migration in `loadTheme()`:
if `localStorage` contains `"cognition"`, it's overwritten with `"midnight"`.

---

## 56. `applyTheme()` crash on invalid/removed theme name

**Symptom**  
Applying a loadout saved when the Cognition theme existed would call
`applyTheme("cognition")`. Since `THEMES["cognition"]` was now `undefined`,
accessing `.vars` threw a `TypeError`, crashing the app.

**Fix**  
Added a guard at the top of `applyTheme()`: if `THEMES[theme]` is undefined,
recursively call `applyTheme("midnight")` and return early. This catches any
invalid theme from loadouts, imported backups, or corrupted localStorage.

---

## 57. `recordThemeUsed` re-added "cognition" when called with stale loadout data

**Symptom**  
`recordThemeUsed` deleted `"cognition"` from the used-themes set but then
unconditionally added the `theme` parameter. If called with `"cognition"`
(via loadout apply → `changeTheme`), the delete was immediately undone,
inflating `used.size` and potentially false-triggering the Fashionista
achievement. Additionally, `changeTheme("cognition")` called
`saveTheme("cognition")` and `setThemeState("cognition")`, corrupting the
active theme state so no ThemeSwitcher button appeared selected.

**Fix**  
Two changes: (1) `recordThemeUsed` now guards with `if (theme in THEMES)`
before `used.add(theme)`, then unconditionally deletes `"cognition"`.
(2) Loadout application validates `loadout.theme in THEMES` before calling
`changeTheme`, preventing the entire corruption chain.

---

## 58. Game-over modals trapped behind overlay — z-index stacking

**Symptom**  
Clicking Analysis, Replay, or Loss Analysis on the game-over screen produced
no visible change. The modals opened in the DOM but were invisible, hidden
behind the `.gameover-overlay`.

**Cause**  
`.modal-overlay` had `z-index: 800` while `.gameover-overlay` was at `950`.
Modals rendered *below* the gameover screen.

**Fix**  
Raised `.modal-overlay` z-index from `800` → `1100`, placing it above
`.gameover-overlay` at `950`.

---

## 59. Game-over button classes didn't match CSS — double-underscore BEM

**Symptom**  
Secondary buttons (Analysis, Share, Replay, Loss Analysis) rendered with no
background, border, or hover styling — effectively invisible.

**Cause**  
`GameOverOverlay.tsx` emitted BEM double-underscore class names
(`gameover__actions`, `gameover__xp`, `gameover__rating`) but the CSS used
single-dash naming (`gameover-actions`, `gameover-xp`, `gameover-rating`).

**Fix**  
Changed component class names to single-dash convention matching the CSS:
`gameover-actions`, `gameover-btn`, `gameover-btn--secondary`, `gameover-xp`,
`gameover-rating`.

---

## 60. Missing `.gameover-btn--secondary` CSS rule

**Symptom**  
Secondary game-over buttons had no glass background, no border, and no hover
effect — just transparent text floating on the overlay.

**Cause**  
The `.gameover-btn--secondary` selector was referenced by the component but
never defined in `styles.css`.

**Fix**  
Added complete styling: `background: var(--glass-bg)`, `border-color:
var(--glass-border)`, hover brightness boost, and the base `.gameover-btn`
rule with padding, font-size, border-radius, cursor, and transition.

---

## 61. Missing layout CSS for game-over sub-elements

**Symptom**  
Game-over buttons stacked awkwardly, XP and rating text had no accent
styling, rating letter wasn't enlarged.

**Cause**  
`.gameover-actions` (flex container), `.gameover-rating` sub-elements, and
`.gameover-xp` sub-elements had no CSS rules defined.

**Fix**  
Added `.gameover-actions` with `display: flex`, `gap: 10px`, `flex-wrap:
wrap`, `justify-content: center`; `.gameover-rating` letter sizing and color;
`.gameover-xp` accent coloring.

---

## 62. Dozens of non-functional features cluttering the app

**Symptom**  
A full audit of every clickable element found 15 sidebar items (Puzzles,
Training, Benchmark, Crew, Upgrades, Graveyard, Memorial, Skins, Faction,
Lore, H2H, Heatmap, Accessibility, Modes, Progress) that opened broken or
empty panels, 18 settings toggles that had no effect, and a "coming soon"
Custom Rules panel.

**Cause**  
Features were scaffolded during earlier mega-upgrades but never fully wired
to game logic; their UI remained even though the underlying functionality was
incomplete or missing.

**Fix**  
Removed all non-functional features and ~14 dead code modules (~3,000 lines).
The sidebar now has exactly 3 categories (Play / Progress / Settings) and
every remaining item, toggle, and button is verified working.

---

## 63. Stale service worker cache serving old builds

**Symptom**  
After deploying new builds, users (and testers) still saw old UI — removed
features reappeared and fixes seemed missing.

**Cause**  
`public/sw.js` precaches `index.html` and assets under a versioned cache
name. Without bumping the version, returning visitors kept getting the old
cached bundle.

**Fix**  
Bumped the cache version (v4 → v5) so the new service worker installs,
purges old caches, and serves the new build on next load.

---

## 64. Power-up instruction pill rendered as unstyled plain text

**Symptom**  
Arming Radar/Sonar/Airstrike showed the instruction text ("Click an enemy
cell…") as bare text floating in the layout, making power-ups look broken.

**Cause**  
The component emitted `className="powerup-instruction"`, but no such rule
existed in the stylesheet.

**Fix**  
Added `.powerup-instruction` CSS — accent-bordered pill with glass
background, padding, and centered text.

---

## 65. Board grid misaligned on all non-10×10 board sizes

**Symptom**  
On 6×6, 8×8, 12×12, and 15×15 boards, row labels drifted diagonally through
the grid and cells didn't line up with their coordinates, so clicks (and
armed power-ups) appeared to hit the wrong cells.

**Cause**  
`.board__grid` hardcoded `grid-template-columns: repeat(11, ...)` — built for
a 10×10 board plus label column — regardless of the actual board size.

**Fix**  
`BoardGrid` now sets `gridTemplateColumns: repeat(boardSize + 1, ...)` inline
from the live board size, so every size renders a correctly aligned grid.

---

## 66. Replay Viewer boards completely invisible

**Symptom**  
Opening a replay showed playback controls but two empty dark rectangles where
the move-by-move boards should be.

**Cause**  
The component rendered cells with `className="mini-cell"` while the
stylesheet only defined `.mini-board__cell`, so cells had zero size.

**Fix**  
Aligned the component class names with the stylesheet's `.mini-board__cell`
BEM convention; both mini-boards now render with hits/misses during playback.

---

## 67. Miss cells nearly indistinguishable from untouched cells

**Symptom**  
On the tracking board, fired-but-missed cells looked almost identical to
cells that hadn't been fired at, making it hard to read the board state at a
glance.

**Cause**  
Miss styling was only a subtle `rgba(0,0,0,0.2)` background with a faint dot.

**Fix**  
Darkened the miss background to `rgba(0,0,0,0.45)`, added an inset shadow, a
brighter/larger miss dot, and a tinted border so untouched / miss / hit form
three clearly distinct visual states.

---

## 68. vs-AI-only UI leaked into 2-Player hotseat mode

**Symptom**
During 2-Player pass-and-play games, the Win Probability bar, Morale pill,
AI Admiral dialogue bubble, and combo badge all rendered — and the game-over
screen offered a Replay button that opened an empty viewer. None of these
features make sense without an AI opponent.

**Cause**
These components were gated only on `phase === "playing"` (or rendered
unconditionally on game over), with no check on `playerMode`.

**Fix**
Added `playerMode === "vs-ai"` to each render condition (combo display,
win-probability bar, morale indicator, AI dialogue) and made
`onViewReplay` undefined in hotseat so the Replay button doesn't render.

---

## 69. Stale replay recorder carried over from vs-AI into hotseat games

**Symptom**
Starting a 2-Player game right after a vs-AI game (no page reload) could
finalize and save a bogus replay for the hotseat match.

**Cause**
`replayRef.current` was only created for vs-AI games but never cleared when
a hotseat game started, so a leftover recorder from the previous vs-AI game
survived and was finalized at game end.

**Fix**
`startGame()` now sets `replayRef.current = null` when a hotseat game
begins, so no replay is recorded or saved for 2-Player matches.

---

## Known Issue (Not Yet Fixed)

**Campaign weather overridden by `startGame()` roll**  
The campaign handler sets specific weather (e.g., storm), but when the player
clicks "Start game" to begin playing, `startGame()` calls `rollWeather()` which
randomly re-rolls the weather. This is a pre-existing design issue — campaign
weather settings are effectively overridden. Tracked for future fix.
