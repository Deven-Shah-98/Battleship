import { describe, it, expect } from "vitest";
import {
  allShipsSunk,
  canPlaceShip,
  coordKey,
  placeShipsRandomly,
  receiveAttack,
  remainingShips,
} from "./board";
import {
  chooseAIMove,
  createAIState,
  updateAIAfterResult,
  type Difficulty,
} from "./ai";
import { BOARD_SIZE, SHIP_DEFS } from "./constants";
import type { Board } from "./types";

/**
 * Deterministic PRNG (mulberry32) so the stress run is reproducible: a failure
 * can be re-run with the same seed instead of being a flaky one-off.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOTAL_SHIP_CELLS = SHIP_DEFS.reduce((n, d) => n + d.size, 0); // 17
const MAX_MOVES = BOARD_SIZE * BOARD_SIZE; // 100 cells; a game must finish in <= this

/** Assert a freshly placed fleet is well-formed: right count, in-bounds, no overlap. */
function assertValidFleet(board: Board): void {
  expect(board.ships).toHaveLength(SHIP_DEFS.length);
  const occupied = new Set<string>();
  let cellCount = 0;
  for (const ship of board.ships) {
    expect(ship.cells).toHaveLength(ship.size);
    for (const c of ship.cells) {
      expect(c.row).toBeGreaterThanOrEqual(0);
      expect(c.row).toBeLessThan(board.size);
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeLessThan(board.size);
      const key = coordKey(c);
      expect(occupied.has(key)).toBe(false); // no overlap
      occupied.add(key);
      cellCount += 1;
    }
  }
  expect(cellCount).toBe(TOTAL_SHIP_CELLS);
}

/**
 * Play one full game of a given difficulty's AI firing at a randomly placed
 * fleet, asserting invariants every move. Returns the number of moves taken.
 */
function playOneGame(difficulty: Difficulty, rng: () => number): number {
  let board = placeShipsRandomly(SHIP_DEFS, BOARD_SIZE, rng);
  assertValidFleet(board);

  let state = createAIState();
  const fired = new Set<string>();
  let moves = 0;
  let prevRemaining = remainingShips(board);

  while (!allShipsSunk(board)) {
    moves += 1;
    expect(moves).toBeLessThanOrEqual(MAX_MOVES); // must always terminate

    const { move, state: next } = chooseAIMove(board, state, difficulty, rng);
    const key = coordKey(move);

    // Invariant: AI never repeats a shot and never targets out of bounds.
    expect(fired.has(key)).toBe(false);
    expect(move.row).toBeGreaterThanOrEqual(0);
    expect(move.row).toBeLessThan(board.size);
    expect(move.col).toBeGreaterThanOrEqual(0);
    expect(move.col).toBeLessThan(board.size);
    fired.add(key);

    const { board: nb, result, sunkShip } = receiveAttack(board, move);
    // Invariant: a fresh cell is never reported as "already".
    expect(result).not.toBe("already");
    board = nb;

    // Invariant: remaining ship count is monotonically non-increasing.
    const nowRemaining = remainingShips(board);
    expect(nowRemaining).toBeLessThanOrEqual(prevRemaining);
    prevRemaining = nowRemaining;

    state = updateAIAfterResult(next, board, move, result, !!sunkShip);
  }

  // A perfect-information lower bound: cannot win in fewer than 17 shots.
  expect(moves).toBeGreaterThanOrEqual(TOTAL_SHIP_CELLS);
  return moves;
}

describe("stress: auto-play many randomized full games", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const GAMES_PER_DIFFICULTY = 200;

  for (const difficulty of difficulties) {
    it(`${difficulty} AI finishes ${GAMES_PER_DIFFICULTY} random games without invariant violations`, () => {
      const rng = mulberry32(0xc0ffee + difficulty.length);
      let totalMoves = 0;
      for (let g = 0; g < GAMES_PER_DIFFICULTY; g++) {
        totalMoves += playOneGame(difficulty, rng);
      }
      // Every game terminated (no throw / timeout), and the average is sane.
      const avg = totalMoves / GAMES_PER_DIFFICULTY;
      expect(avg).toBeGreaterThanOrEqual(TOTAL_SHIP_CELLS);
      expect(avg).toBeLessThanOrEqual(MAX_MOVES);
    });
  }

  it("hard solves in far fewer shots than easy over many games", () => {
    const avgFor = (difficulty: Difficulty): number => {
      const rng = mulberry32(0x1234);
      const games = 100;
      let total = 0;
      for (let g = 0; g < games; g++) total += playOneGame(difficulty, rng);
      return total / games;
    };
    expect(avgFor("hard")).toBeLessThan(avgFor("easy"));
  });

  it("placeShipsRandomly yields a valid fleet across many seeds", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = mulberry32(seed);
      assertValidFleet(placeShipsRandomly(SHIP_DEFS, BOARD_SIZE, rng));
    }
  });

  it("canPlaceShip rejects overlaps and out-of-bounds placements", () => {
    const rng = mulberry32(42);
    const board = placeShipsRandomly(SHIP_DEFS, BOARD_SIZE, rng);
    // Out of bounds: a size-5 ship starting near the right edge horizontally.
    expect(canPlaceShip(board, 5, { row: 0, col: BOARD_SIZE - 2 }, "horizontal")).toBe(false);
    // Overlap: placing a ship on top of an existing ship's first cell.
    const occupied = board.ships[0].cells[0];
    expect(canPlaceShip(board, 1, occupied, "horizontal")).toBe(false);
  });
});
