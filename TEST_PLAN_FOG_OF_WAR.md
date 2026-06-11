# Test Plan — Enemy fog of war (hide per-ship hit pips until sunk) — PR #4

## What changed
`FleetStatus` now takes a `revealHits` prop. The enemy fleet panel is rendered with
`revealHits={false}` (App.tsx:403), so a non-sinking hit on an enemy ship must NOT
turn that ship's pip red. Pips only reveal once the ship is fully sunk. The player's
own fleet still shows pips on every hit (`revealHits` defaults true, App.tsx:388).
Logic: `visiblePipHits = hit && (revealHits || sunk)` (src/components/fleetPips.ts).

## Setup (not part of assertions)
- Branch `devin/1780926517-enemy-fleet-pips`, dev server at http://localhost:5173.
- Temporary local-only test aid: set enemy BoardGrid `showShips={phase !== "setup"}`
  (App.tsx:397) so I can see enemy ship cells and land deterministic hits.
  This aid will be reverted before any commit — it does NOT affect FleetStatus logic.

## Primary flow — Enemy pips hidden until sunk

1. Start game (Random fleet → Start). Difficulty default.
   - Pass: both "Your fleet" and "Enemy fleet" panels show 5 ships, all pips grey (no red).

2. Fire ONE hit on an enemy ship that has size ≥ 2 (so a single hit does not sink it).
   - Expected NEW behavior: cell shows ✶ hit marker on the board, BUT the matching
     ship row in the **Enemy fleet** panel keeps all pips grey and is NOT marked SUNK.
   - Pass: enemy ship pip stays grey after a confirmed non-sinking hit.
   - FAIL (old/broken behavior): the enemy ship pip turns red after this first hit.
   - This step distinguishes working vs broken — a broken build reddens the pip here.

3. Fire remaining cells of that same enemy ship to fully sink it.
   - Expected: on the sinking shot, that ship row in **Enemy fleet** flips to SUNK
     (strikethrough + "SUNK") and ALL its pips turn red at once.
   - Pass: pips reveal red only at the moment of sinking, not before.

4. Regression — player's own fleet still reveals hits immediately.
   - Let the AI fire until it lands a hit on one of my ships (or observe over a few turns).
   - Expected: the hit ship's pip in **Your fleet** turns red immediately on a single
     non-sinking hit (revealHits defaults true).
   - Pass: own-fleet pip reddens on first hit — confirms the change is scoped to enemy only.

## Evidence
- Screenshot after step 2: board shows enemy hit ✶ but enemy panel pip grey.
- Screenshot after step 3: enemy ship SUNK with red pips.
- Screenshot for step 4: own-fleet pip red on single hit.
