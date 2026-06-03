import { coordKey, inBounds, isShipSunk } from "./board";
import type { Board, Coord } from "./types";

/** AI strength. Higher levels search more cleverly. */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * State carried by the AI between turns. Kept serializable/immutable so it can
 * live comfortably in React state.
 */
export interface AIState {
  /** Cells queued for "target" mode after a hit (most promising last). */
  targetQueue: Coord[];
}

export function createAIState(): AIState {
  return { targetQueue: [] };
}

const ORTHOGONAL: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Cells that have not been fired at yet. */
function untriedCells(board: Board): Coord[] {
  const cells: Coord[] = [];
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const c = { row, col };
      if (!(coordKey(c) in board.shots)) cells.push(c);
    }
  }
  return cells;
}

/** Sizes of the ships that are still afloat (legitimately known once sunk). */
function remainingShipSizes(board: Board): number[] {
  return board.ships.filter((s) => !isShipSunk(s)).map((s) => s.size);
}

/** Cells belonging to ships that have already been sunk. */
function sunkCellKeys(board: Board): Set<string> {
  const keys = new Set<string>();
  for (const ship of board.ships) {
    if (isShipSunk(ship)) {
      for (const c of ship.cells) keys.add(coordKey(c));
    }
  }
  return keys;
}

/**
 * Build a probability heatmap over every cell: for each remaining ship, count
 * the number of legal placements that cover each unfired cell, weighting
 * placements that overlap an unresolved hit far more heavily so the AI
 * naturally "targets" along a wounded ship.
 *
 * Only information a fair opponent has is used: the grid of past shots
 * (hit/miss), which ships have sunk, and the sizes of the ships still afloat.
 */
export function computeHeatmap(board: Board): number[][] {
  const size = board.size;
  const heat: number[][] = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0),
  );

  const sunk = sunkCellKeys(board);
  // Unresolved hits: cells we hit that are not part of an already-sunk ship.
  const activeHits = new Set<string>();
  for (const [key, result] of Object.entries(board.shots)) {
    if (result === "hit" && !sunk.has(key)) activeHits.add(key);
  }

  const HIT_WEIGHT = 50;

  for (const length of remainingShipSizes(board)) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const horizontal of [true, false]) {
          const cells: Coord[] = [];
          for (let i = 0; i < length; i++) {
            cells.push({
              row: horizontal ? row : row + i,
              col: horizontal ? col + i : col,
            });
          }
          if (cells.some((c) => !inBounds(c, size))) continue;

          let overlapHits = 0;
          let blocked = false;
          for (const c of cells) {
            const key = coordKey(c);
            // A placement cannot cover a miss or a sunk ship's cell.
            if (board.shots[key] === "miss" || sunk.has(key)) {
              blocked = true;
              break;
            }
            if (activeHits.has(key)) overlapHits += 1;
          }
          if (blocked) continue;

          const weight = overlapHits > 0 ? HIT_WEIGHT ** overlapHits : 1;
          for (const c of cells) {
            // Only score cells we could actually fire at next.
            if (!(coordKey(c) in board.shots)) heat[c.row][c.col] += weight;
          }
        }
      }
    }
  }

  return heat;
}

/** Pick the highest-scoring untried cell from a heatmap (random tie-break). */
function bestFromHeatmap(
  board: Board,
  heat: number[][],
  rng: () => number,
): Coord {
  let best: Coord[] = [];
  let bestScore = -1;
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      if (coordKey({ row, col }) in board.shots) continue;
      const score = heat[row][col];
      if (score > bestScore) {
        bestScore = score;
        best = [{ row, col }];
      } else if (score === bestScore) {
        best.push({ row, col });
      }
    }
  }
  if (best.length === 0) throw new Error("No cells left for the AI to target");
  return best[Math.floor(rng() * best.length)];
}

/**
 * Choose the AI's next target against `board` (the human's board).
 *
 * Strategy by difficulty:
 *  - "easy": fire at a uniformly random untried cell.
 *  - "medium": hunt on a checkerboard parity, then chase orthogonal
 *    neighbours of a hit via the target queue.
 *  - "hard": probability-density search that ranks every cell by how many
 *    legal placements of the remaining fleet cover it, strongly favouring
 *    cells in line with an unresolved hit.
 */
export function chooseAIMove(
  board: Board,
  state: AIState,
  difficulty: Difficulty = "medium",
  rng: () => number = Math.random,
): { move: Coord; state: AIState } {
  if (difficulty === "hard") {
    const move = bestFromHeatmap(board, computeHeatmap(board), rng);
    return { move, state };
  }

  if (difficulty === "easy") {
    const untried = untriedCells(board);
    if (untried.length === 0) {
      throw new Error("No cells left for the AI to target");
    }
    const move = untried[Math.floor(rng() * untried.length)];
    return { move, state };
  }

  // medium
  const queue = state.targetQueue.filter((c) => !(coordKey(c) in board.shots));

  if (queue.length > 0) {
    const move = queue[queue.length - 1];
    return { move, state: { targetQueue: queue.slice(0, -1) } };
  }

  const untried = untriedCells(board);
  if (untried.length === 0) {
    throw new Error("No cells left for the AI to target");
  }
  const parity = untried.filter((c) => (c.row + c.col) % 2 === 0);
  const pool = parity.length > 0 ? parity : untried;
  const move = pool[Math.floor(rng() * pool.length)];
  return { move, state: { targetQueue: queue } };
}

/**
 * Update AI state after observing the result of its move. On a hit (that did
 * not sink a ship) the orthogonal neighbours are queued for follow-up. Only
 * the "medium" difficulty relies on this queue; the others recompute from the
 * board each turn, but keeping the update harmless lets callers stay simple.
 */
export function updateAIAfterResult(
  state: AIState,
  board: Board,
  move: Coord,
  result: "hit" | "miss" | "already",
  sunk: boolean,
): AIState {
  if (result !== "hit" || sunk) {
    return state;
  }
  const existing = new Set(state.targetQueue.map(coordKey));
  const additions: Coord[] = [];
  for (const d of ORTHOGONAL) {
    const n = { row: move.row + d.row, col: move.col + d.col };
    if (!inBounds(n, board.size)) continue;
    if (coordKey(n) in board.shots) continue;
    if (existing.has(coordKey(n))) continue;
    additions.push(n);
  }
  return { targetQueue: [...state.targetQueue, ...additions] };
}
