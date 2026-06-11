# Test Plan — Battleship Enhancements (PR #2)

Target: local dev build of branch `devin/1780504815-battleship-enhancements`
at http://localhost:5174 (matches PR code). A **temporary test aid** reveals
enemy ships during play (`showShips={phase !== "setup"}` in App.tsx) so a full
game to victory can be played deterministically. This aid is reverted before any
commit; it does not affect the logic being tested.

Code references grounding the plan:
- Difficulty chips + log line: `src/App.tsx` (chips ~300-318; `startGame` log
  `Game on! Difficulty: ${difficulty}` ~178).
- Stats readout: `src/App.tsx` ~360-368 (`Shots N · Hits H · Accuracy A%`),
  `countShots`/`accuracy` ~57-98.
- Fleet panel SUNK + pips: `src/components/FleetStatus.tsx`.
- Last-shot ring: `src/components/BoardGrid.tsx` `cell--last`.
- Hard AI targeting: `src/game/ai.ts` `computeHeatmap`/`chooseAIMove`.
- Sound toggle button: `src/App.tsx` ~290-298 (label `🔇 Muted`/`🔊 Sound`,
  `aria-pressed`).
- Record persistence: `loadRecord`/`recordResult` + `localStorage` `battleship.record`.

---

## Test 1 (PRIMARY): Full game vs Hard AI with HUD verification

Steps:
1. Load the page. In setup, click the **hard** difficulty chip.
   - **PASS**: `hard` chip becomes highlighted (active style); description text
     reads "Probability-density targeting — plays to win."
2. Click **Random**, then **Start game**.
   - **PASS**: phase switches to playing; battle log's oldest entry reads
     **"Game on! Difficulty: hard. Fire at the enemy waters."** (If it said
     "medium" or omitted difficulty, FAIL.)
3. Click one **revealed enemy ship cell** (grey) → expect a HIT.
   - **PASS**: cell turns red with `✶`; it has the cyan **last-shot ring**;
     "Enemy fleet" panel shows one pip turned red for that ship; stats update to
     **Shots 1 · Hits 1 · Accuracy 100%**.
4. Click an **empty (sea) enemy cell** → expect a MISS (after AI's turn returns).
   - **PASS**: cell shows `•` (miss style); stats accuracy drops — with 1 hit of
     2 shots, reads **Accuracy 50%** (exact). The last-shot ring moves to the
     newest cell.
5. Finish off one entire enemy ship (click all its cells).
   - **PASS**: when its final cell is hit, the "Enemy fleet" panel row for that
     ship shows **SUNK** with strikethrough name and all-red pips; battle log
     reads "You sank the enemy <Name>!".
6. Continue clicking all remaining revealed enemy ship cells until the fleet is
   destroyed.
   - **PASS**: status shows **"You win! 🎉"**; enemy board fully revealed; battle
     log contains "Victory! You destroyed the enemy fleet."; header record
     **W** increases by exactly 1 vs. its pre-game value.

Why adversarial: a broken stats calc would not show exactly 50% after 1/2; a
broken FleetStatus would never render SUNK/strikethrough; a broken difficulty
wire-up would log the wrong level; a broken win check wouldn't reach the win
screen or increment the record.

## Test 2: Hard AI targets intelligently (not random)

During Test 1's AI turns, watch the enemy's shots on **Your waters** after the
AI lands its first hit on one of your ships.
- **PASS**: the AI's next shot after a hit is an **orthogonal neighbour** of a
  prior hit (adjacent cell in the same row/column), i.e. it chases the wounded
  ship rather than firing at a distant random cell. Observe at least two
  post-hit shots clustering around the hit.
- Marked as an **observation** (semi-deterministic): if the AI hasn't hit yet,
  note it as inconclusive rather than passing.

## Test 3: Sound mute toggle

Click the **🔊 Sound** button in the header.
- **PASS**: label changes to **🔇 Muted** (button `aria-pressed=true`). Click
  again → returns to **🔊 Sound**. (Audio itself is not captured on video;
  verifying the visible toggle state + that no errors occur is the assertion.)

## Test 4 (Regression-lite): Record persists across reload

After winning Test 1, reload the page.
- **PASS**: header still shows the incremented **W** count (loaded from
  localStorage), confirming persistence.
