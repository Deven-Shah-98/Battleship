---
name: testing-battleship
description: End-to-end UI testing for the Battleship game (human vs AI). Use when verifying gameplay, AI difficulty, fleet status, stats, sound, animations, or localStorage persistence.
---

# Testing the Battleship game

React + TypeScript + Vite single-page app. Pure game logic in `src/game/`
(`board.ts`, `ai.ts`), UI state machine in `src/App.tsx`, components in
`src/components/`, sound in `src/sound.ts`.

## Run it

```bash
npm install
npm run dev      # serves on http://localhost:5173 (or next free port, e.g. 5174)
```

Other checks: `npm run lint`, `npm test` (Vitest), `npm run build`.

No backend, no auth, no secrets required. State (win/loss record, mute) is in
`localStorage` under keys `battleship.record` and `battleship.muted`.

## Deterministic-win test aid

The enemy fleet is placed randomly and hidden, so winning by guessing is slow.
To win deterministically and exercise every HUD path, temporarily reveal enemy
ships by editing the enemy `BoardGrid` in `src/App.tsx`:

```tsx
// change
showShips={phase === "gameover"}
// to (TEMP TEST AID — revert, do NOT commit)
showShips={phase !== "setup"}
```

Then Random-place your fleet, Start, and click the grey (revealed) enemy cells.
Always revert this edit before committing; verify with `git diff` that it's gone.

## UI flow / selectors

- Difficulty chips (easy/medium/hard) appear in the setup panel; click to select.
- `Random` fills your fleet, `Start game` begins play.
- Fire by clicking enemy-board cells (`aria-label` like `B3`).
- Cells render `✦` for a hit, `•` for a miss; the most-recent shot gets a
  `cell--last` ring.
- Header shows the W/L record and a Sound toggle (🔊 Sound / 🔇 Muted).
- Status bar shows `Shots N · Hits H · Accuracy A%`.
- Fleet panels under each board list ships with hit pips; sunk ships get
  strikethrough + `SUNK`.

## Key assertions to verify

- Difficulty selection reflected in battle log: "Game on! Difficulty: <level>."
- Hit/miss glyphs, last-shot ring, and fleet pips update per shot.
- Stats math is exact (e.g. 1 hit of 2 shots = 50%).
- Ship shows `SUNK` (both panels) when all its cells are hit.
- Victory: "You win! 🎉", enemy 0 left, all enemy ships SUNK, record increments.
- Sound button toggles label/title; state persists across reload (localStorage).
- Hard AI is a hunt/target solver: after a hit it fires at adjacent cells
  (runtime observation; heatmap correctness is also covered by unit tests).

## Recording tips

Maximize the window first (`wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`).
Use `zoom` on the status bar / fleet panels to read exact stats and SUNK labels.
Audio is not captured on video — assert the visible mute toggle state instead.

## Devin Secrets Needed

None — the app is fully client-side with no auth or external services.
