import { coordKey, inBounds, isShipSunk } from "./board";
import type { Board, Coord } from "./types";

/** AI strength. Higher levels search more cleverly. */
export type Difficulty = "easy" | "medium" | "hard" | "admiral";

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

/**
 * Admiral-level heatmap: extends the hard heatmap with additional refinements:
 * - Adjacent-miss penalty: cells adjacent to misses get a 0.7× multiplier,
 *   reflecting that ships tend not to border misses (heuristic, not strict).
 * - Edge bonus: the heatmap is slightly biased towards interior cells early
 *   in the game because more placements cover interior cells.
 * - Active-hit line bonus: if there are 2+ active hits in a line, boost cells
 *   that continue that line even more aggressively.
 */
export function computeAdmiralHeatmap(board: Board): number[][] {
  const heat = computeHeatmap(board);
  const size = board.size;

  // Adjacent-miss penalty
  const missKeys = new Set<string>();
  for (const [key, result] of Object.entries(board.shots)) {
    if (result === "miss") missKeys.add(key);
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (coordKey({ row, col }) in board.shots) continue;

      let adjacentMisses = 0;
      for (const d of ORTHOGONAL) {
        const n = { row: row + d.row, col: col + d.col };
        if (inBounds(n, size) && missKeys.has(coordKey(n))) adjacentMisses++;
      }
      if (adjacentMisses > 0) {
        heat[row][col] *= Math.pow(0.7, adjacentMisses);
      }
    }
  }

  // Active-hit line bonus
  const sunk = sunkCellKeys(board);
  const activeHitCoords: Coord[] = [];
  for (const [key, result] of Object.entries(board.shots)) {
    if (result === "hit" && !sunk.has(key)) {
      const [r, c] = key.split(",").map(Number);
      activeHitCoords.push({ row: r, col: c });
    }
  }

  if (activeHitCoords.length >= 2) {
    // Check for lines of active hits and boost continuation cells
    for (const hit of activeHitCoords) {
      for (const dir of [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ]) {
        let lineLength = 1;
        // Count consecutive hits in this direction
        for (let step = 1; step < size; step++) {
          const next = {
            row: hit.row + dir.row * step,
            col: hit.col + dir.col * step,
          };
          if (
            !inBounds(next, size) ||
            !activeHitCoords.some(
              (h) => h.row === next.row && h.col === next.col,
            )
          )
            break;
          lineLength++;
        }
        if (lineLength >= 2) {
          // Boost cells that continue the line in either direction
          for (const sign of [-1, 1]) {
            const step = sign === 1 ? lineLength : 1;
            const ext = {
              row: hit.row + dir.row * sign * step,
              col: hit.col + dir.col * sign * step,
            };
            if (
              inBounds(ext, size) &&
              !(coordKey(ext) in board.shots) &&
              heat[ext.row][ext.col] > 0
            ) {
              heat[ext.row][ext.col] *= 3;
            }
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
 *  - "admiral": enhanced hard heatmap with adjacent-miss penalties,
 *    line-continuation bonuses, and more aggressive targeting.
 */
export function chooseAIMove(
  board: Board,
  state: AIState,
  difficulty: Difficulty = "medium",
  rng: () => number = Math.random,
): { move: Coord; state: AIState } {
  if (difficulty === "admiral") {
    const move = bestFromHeatmap(board, computeAdmiralHeatmap(board), rng);
    return { move, state };
  }

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

/* ─── AI Personalities ─── */

import type { AIPersonality } from "./types";

export interface PersonalityInfo {
  name: string;
  description: string;
  icon: string;
}

export const AI_PERSONALITIES: Record<AIPersonality, PersonalityInfo> = {
  balanced: { name: "Balanced", description: "Standard play — uses the chosen difficulty's algorithm.", icon: "⚖️" },
  aggressive: { name: "Aggressive", description: "Always chases hits. Never retreats to random hunting.", icon: "🔥" },
  cautious: { name: "Cautious", description: "Spreads shots wide. Avoids clustering near misses.", icon: "🛡️" },
  chaotic: { name: "Chaotic", description: "Random with occasional brilliant moves. Unpredictable.", icon: "🎲" },
  methodical: { name: "Methodical", description: "Systematic row-by-row scanning. Predictable but thorough.", icon: "📐" },
};

export function choosePersonalityMove(
  board: Board,
  state: AIState,
  personality: AIPersonality,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): { move: Coord; state: AIState } {
  if (personality === "balanced") {
    return chooseAIMove(board, state, difficulty, rng);
  }

  if (personality === "aggressive") {
    // Always use heatmap and heavily weight active hits
    const heat = computeHeatmap(board);
    const sunk = sunkCellKeys(board);
    for (const [key, result] of Object.entries(board.shots)) {
      if (result === "hit" && !sunk.has(key)) {
        const [r, c] = key.split(",").map(Number);
        for (const d of ORTHOGONAL) {
          const nr = r + d.row;
          const nc = c + d.col;
          if (inBounds({ row: nr, col: nc }, board.size) && !(coordKey({ row: nr, col: nc }) in board.shots)) {
            heat[nr][nc] *= 5;
          }
        }
      }
    }
    const move = bestFromHeatmap(board, heat, rng);
    return { move, state };
  }

  if (personality === "cautious") {
    // Spread shots wide — penalize cells near existing shots
    const heat = computeHeatmap(board);
    for (let row = 0; row < board.size; row++) {
      for (let col = 0; col < board.size; col++) {
        if (coordKey({ row, col }) in board.shots) continue;
        let nearbyShots = 0;
        for (const d of ORTHOGONAL) {
          const key = coordKey({ row: row + d.row, col: col + d.col });
          if (key in board.shots) nearbyShots++;
        }
        if (nearbyShots > 0) heat[row][col] *= Math.pow(0.5, nearbyShots);
      }
    }
    const move = bestFromHeatmap(board, heat, rng);
    return { move, state };
  }

  if (personality === "chaotic") {
    // 70% random, 30% smart
    if (rng() < 0.7) {
      const untried = untriedCells(board);
      if (untried.length === 0) throw new Error("No cells left");
      const move = untried[Math.floor(rng() * untried.length)];
      return { move, state };
    }
    return chooseAIMove(board, state, "hard", rng);
  }

  // methodical: row-by-row, left-to-right scanning
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      if (!(coordKey({ row, col }) in board.shots)) {
        return { move: { row, col }, state };
      }
    }
  }
  throw new Error("No cells left");
}

/* ─── Hint System ─── */

/** Get the best cell to fire at (for the hint system). */
export function getHint(board: Board): Coord | null {
  const heat = computeHeatmap(board);
  let best: Coord | null = null;
  let bestScore = -1;
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      if (coordKey({ row, col }) in board.shots) continue;
      if (heat[row][col] > bestScore) {
        bestScore = heat[row][col];
        best = { row, col };
      }
    }
  }
  return best;
}

/* ─── Progressive AI ─── */

/** Determine effective difficulty based on win rate. */
export function getProgressiveDifficulty(
  winRate: number,
  baseDifficulty: Difficulty,
): Difficulty {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "admiral"];
  const baseIdx = difficulties.indexOf(baseDifficulty);

  if (winRate > 0.75 && baseIdx < 3) {
    return difficulties[baseIdx + 1];
  }
  if (winRate < 0.25 && baseIdx > 0) {
    return difficulties[baseIdx - 1];
  }
  return baseDifficulty;
}
