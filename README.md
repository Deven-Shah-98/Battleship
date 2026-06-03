# Battleship

A web-based [Battleship](https://en.wikipedia.org/wiki/Battleship_(game)) game
where a human player competes against an AI opponent. Built with **React +
TypeScript + Vite**, with the game logic kept framework-agnostic and unit
tested with **Vitest**.

## Features

- **Ship placement** — place your fleet manually (click + rotate with `R`) or
  with one-click **Random** placement, with a live, colour-coded validity
  preview.
- **Turn-based gameplay** — you and the AI alternate single shots on a 10×10
  grid, with hit/miss detection and a running battle log.
- **Three AI difficulty levels:**
  - **Easy** — fires at random.
  - **Medium** — classic "hunt & target": searches on a checkerboard parity
    and chases adjacent cells after a hit.
  - **Hard** — a **probability-density** solver that ranks every cell by how
    many ways the remaining fleet could still be arranged over it, strongly
    favouring cells in line with a wounded ship. It plays fair (never reads
    un-hit ship positions).
- **Sound & animation** — synthesised hit/miss/sink/win sounds via the Web Audio
  API (no asset files), a mute toggle, splash/explosion cell animations, and a
  highlighted last-shot marker. Respects `prefers-reduced-motion`.
- **Fleet status & stats** — per-ship sunk/afloat panels for both sides, plus a
  live shots/hits/accuracy readout and a win–loss record persisted in
  `localStorage`.
- **Win/loss detection** — the game ends when one side's entire fleet is sunk,
  and reveals the enemy fleet on game over.
- **Responsive** — usable layout down to small phone screens.
- **Unit tests** for the core logic (placement validation, hit/miss/sink, win
  conditions, and AI behaviour including the probability heatmap).

## Fleet

| Ship       | Size |
| ---------- | ---- |
| Carrier    | 5    |
| Battleship | 4    |
| Cruiser    | 3    |
| Submarine  | 3    |
| Destroyer  | 2    |

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

### Other scripts

```bash
npm run build    # type-check and build for production (outputs to dist/)
npm run preview  # preview the production build
npm run test     # run the unit tests once
npm run lint     # run ESLint
```

## How to play

1. **Choose a difficulty** (Easy / Medium / Hard) in the setup panel.
2. **Place your ships.** Each ship is placed in turn. Hover your grid to preview,
   press `R` (or the **Rotate** button) to change orientation, and click to
   place. Or hit **Random** to auto-place the whole fleet. **Reset** clears the
   board.
3. **Start the game** once all five ships are placed.
4. **Fire** by clicking a cell on the **Enemy waters** grid. Hits are marked with
   `✶`, misses with `•`, and your most recent shot is ringed.
5. The AI fires back automatically. Sink the enemy's entire fleet before it sinks
   yours. Use the **🔊/🔇** button to toggle sound.

## Project structure

```
src/
  game/                 # framework-agnostic game logic (unit tested)
    types.ts            # shared types (Board, Ship, Coord, ...)
    constants.ts        # board size and fleet definition
    board.ts            # placement, attacks, sink/win detection
    ai.ts               # easy / medium / hard AI + probability heatmap
    board.test.ts       # tests for board logic
    ai.test.ts          # tests for the AI
  components/
    BoardGrid.tsx       # renders a 10×10 board (own or tracking view)
    FleetStatus.tsx     # per-ship sunk/afloat panel
  sound.ts              # Web Audio sound engine (no asset files)
  App.tsx               # game state machine and UI
  main.tsx              # React entry point
  styles.css            # styling
```

## Notes

See [`DEBUGGING.md`](./DEBUGGING.md) for significant bugs encountered during
development and how they were resolved.
