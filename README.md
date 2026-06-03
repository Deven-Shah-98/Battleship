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
- **AI opponent** — a classic "hunt & target" AI: it searches on a checkerboard
  parity and, once it lands a hit, focuses fire on adjacent cells until the ship
  is sunk.
- **Win/loss detection** — the game ends when one side's entire fleet is sunk,
  and reveals the enemy fleet on game over.
- **Unit tests** for the core logic (placement validation, hit/miss/sink, win
  conditions, and AI behaviour).

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

1. **Place your ships.** Each ship is placed in turn. Hover your grid to preview,
   press `R` (or the **Rotate** button) to change orientation, and click to
   place. Or hit **Random** to auto-place the whole fleet. **Reset** clears the
   board.
2. **Start the game** once all five ships are placed.
3. **Fire** by clicking a cell on the **Enemy waters** grid. Hits are marked with
   `✶`, misses with `•`.
4. The AI fires back automatically. Sink the enemy's entire fleet before it sinks
   yours.

## Project structure

```
src/
  game/                 # framework-agnostic game logic (unit tested)
    types.ts            # shared types (Board, Ship, Coord, ...)
    constants.ts        # board size and fleet definition
    board.ts            # placement, attacks, sink/win detection
    ai.ts               # hunt & target AI
    board.test.ts       # tests for board logic
    ai.test.ts          # tests for the AI
  components/
    BoardGrid.tsx       # renders a 10×10 board (own or tracking view)
  App.tsx               # game state machine and UI
  main.tsx              # React entry point
  styles.css            # styling
```

## Notes

See [`DEBUGGING.md`](./DEBUGGING.md) for significant bugs encountered during
development and how they were resolved.
