import { coordKey, inBounds, shipAt } from "./board";
import type {
  Board,
  Coord,
  PowerUpKind,
  PowerUpState,
  RadarResult,
  SonarResult,
} from "./types";

/** Cells in the 3×3 grid centred on `center`, clamped to board bounds. */
function areaAround(center: Coord, boardSize: number): Coord[] {
  const cells: Coord[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const c = { row: center.row + dr, col: center.col + dc };
      if (inBounds(c, boardSize)) cells.push(c);
    }
  }
  return cells;
}

/** Radar scan: reveal which cells in a 3×3 area contain a ship. */
export function radarScan(board: Board, center: Coord): RadarResult {
  const cells = areaAround(center, board.size).map((coord) => ({
    coord,
    hasShip: shipAt(board, coord) !== null,
  }));
  return { center, cells };
}

/** Sonar ping: count ship segments in a 3×3 area. */
export function sonarPing(board: Board, center: Coord): SonarResult {
  const cells = areaAround(center, board.size);
  let count = 0;
  for (const c of cells) {
    if (shipAt(board, c)) count++;
  }
  return { center, count };
}

/**
 * Airstrike: fire at up to 5 random unshot cells in a row or column.
 * Returns the coords attacked (caller resolves hits via receiveAttack).
 */
export function airstrikeTargets(
  board: Board,
  axis: "row" | "col",
  index: number,
  rng: () => number = Math.random,
): Coord[] {
  const candidates: Coord[] = [];
  for (let i = 0; i < board.size; i++) {
    const c: Coord =
      axis === "row" ? { row: index, col: i } : { row: i, col: index };
    if (!(coordKey(c) in board.shots)) candidates.push(c);
  }
  // Shuffle and take up to 5
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, 5);
}

/** Returns true if the player has at least 1 use of the given power-up. */
export function canUsePowerUp(
  powerUps: PowerUpState,
  kind: PowerUpKind,
): boolean {
  return powerUps[kind] > 0;
}

/** Spend one use of a power-up, returning the updated state. */
export function spendPowerUp(
  powerUps: PowerUpState,
  kind: PowerUpKind,
): PowerUpState {
  return { ...powerUps, [kind]: Math.max(0, powerUps[kind] - 1) };
}
