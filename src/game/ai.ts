import { coordKey, inBounds } from "./board";
import type { Board, Coord } from "./types";

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

/**
 * Choose the AI's next target against `board` (the human's board).
 *
 * Strategy:
 *  - "Target" mode: if previous hits queued adjacent cells, fire those first.
 *  - "Hunt" mode: otherwise fire at a random untried cell on a checkerboard
 *    parity (no ship smaller than 2 can hide between parity cells), falling
 *    back to any untried cell.
 */
export function chooseAIMove(
  board: Board,
  state: AIState,
  rng: () => number = Math.random,
): { move: Coord; state: AIState } {
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
 * not sink a ship) the orthogonal neighbours are queued for follow-up.
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
