---
name: testing-battleship
description: End-to-end testing guide for the Battleship web app. Use when verifying UI features, gameplay mechanics, accessibility, or new feature additions.
---

# Testing the Battleship App

## Setup

1. `cd` to repo root
2. `npm install` (if not already done)
3. `npm run dev` — starts Vite dev server (typically http://localhost:5173 or :5174)
4. Verify with `curl -s -o /dev/null -w '%{http_code}' http://localhost:5174/` → expect `200`

## Unit Tests

- `npx vitest run` — runs all tests (currently 56). Covers board logic, AI heatmap, power-ups, seed RNG, stress tests.
- `npm run lint` and `tsc --noEmit` for lint and typecheck.

## Feature Test Matrix

The app has 12 major features. Key test scenarios:

| Feature | How to Test |
|---------|------------|
| Theme switching | Click theme chips (Ocean/Midnight/Light/Sunset) in setup panel; verify background color changes |
| Salvo mode | Select "Salvo" chip; after starting game, verify status shows "X/X shots remaining" |
| Admiral AI | Select "admiral" difficulty; observe AI targeting patterns (should chase wounded ships) |
| Power-ups | Enable power-ups checkbox; verify Radar/Sonar/Airstrike buttons appear during gameplay |
| Seeded games | Check "Use game seed", enter a seed; verify "Seed: XXX" in status bar |
| 2-Player hotseat | Select "2-Player" mode; critical: verify P2 setup board is EMPTY (not showing P1's ships) |
| Match history | Click Stats button in header; verify modal opens with stat cards |
| Drag-and-drop | Observe ShipDock below setup; drag or click to place ships |
| Keyboard nav | Focus an unshot enemy cell, use arrow keys to navigate (focus ring visible), Enter to fire |
| Visual effects | Start a game; observe water shimmer animation, hit/miss cell animations |
| PWA | Check for service worker registration in DevTools > Application |
| Responsive | Resize viewport to 320px width; verify board fits without horizontal scrollbar |

## Important Testing Notes

### Keyboard Accessibility
- The grid uses a **roving tabindex** pattern with `onKeyDown` on the parent grid div.
- After firing a shot (click or Enter), the cell becomes `disabled` and **focus falls to `<body>`**. You must re-focus an unshot cell to continue keyboard testing.
- To reliably test keyboard nav: use `document.querySelector('[data-coord="ROW,COL"]').focus()` in the console to focus a specific unshot cell, then use arrow keys and Enter.
- Arrow keys might not work if focus is on a disabled cell or outside the grid.

### Drag-and-Drop
- Drag from ShipDock may not always register the drop event in automated testing. Click-to-place is a reliable fallback — clicking a board cell places the currently-selected ship.
- The ShipDock advances to the next ship after successful placement.

### 2-Player Hotseat
- The critical assertion is that P2's setup board shows an EMPTY grid, NOT P1's ships. This was a real bug that was fixed.
- After both players place ships and start the game, a "Pass the device" overlay appears between turns.

### Match History
- The match history modal will show "No games played yet" if no game has been completed to victory/defeat in the current localStorage context.
- Stats only populate after `recordResult()` is called at game end.

### AI Behavior
- Medium AI uses hunt-and-target (checkerboard parity + orthogonal follow-up).
- Hard AI uses probability-density heatmap.
- Admiral AI adds miss-avoidance penalties and active-hit line extension bonuses.
- To verify AI intelligence, observe its shot pattern after getting a hit — it should chase adjacent cells rather than firing randomly.

## Devin Secrets Needed

No secrets required — the app runs entirely client-side with no external API calls.
