/** Board variant systems — islands, shrinking, variable shapes */
import type { Coord, Board, ShipDef } from "./types";
import { coordKey, inBounds } from "./board";

/* ─── Islands ─── */
export function generateIslands(boardSize: number, count: number, rng = Math.random): Set<string> {
  const islands = new Set<string>();
  let attempts = 0;
  while (islands.size < count && attempts < 500) {
    const row = Math.floor(rng() * boardSize);
    const col = Math.floor(rng() * boardSize);
    // Don't place islands on edges (leave room for ships)
    if (row > 0 && row < boardSize - 1 && col > 0 && col < boardSize - 1) {
      islands.add(coordKey({ row, col }));
    }
    attempts++;
  }
  return islands;
}

export function isIsland(islands: Set<string>, coord: Coord): boolean {
  return islands.has(coordKey(coord));
}

/* ─── Shrinking Board ─── */
export interface ShrinkState {
  enabled: boolean;
  currentRing: number; // how many outer rings are blocked
  shrinkEveryN: number; // shrink every N turns
  turnCount: number;
}

export function createShrinkState(enabled: boolean, shrinkEveryN = 10): ShrinkState {
  return { enabled, currentRing: 0, shrinkEveryN, turnCount: 0 };
}

export function isShrunk(state: ShrinkState, coord: Coord, boardSize: number): boolean {
  if (!state.enabled || state.currentRing === 0) return false;
  const ring = state.currentRing;
  return (
    coord.row < ring || coord.row >= boardSize - ring ||
    coord.col < ring || coord.col >= boardSize - ring
  );
}

export function advanceShrink(state: ShrinkState, boardSize: number): ShrinkState {
  if (!state.enabled) return state;
  const next = { ...state, turnCount: state.turnCount + 1 };
  if (next.turnCount >= next.shrinkEveryN) {
    next.turnCount = 0;
    const maxRing = Math.floor(boardSize / 2) - 1;
    if (next.currentRing < maxRing) {
      next.currentRing += 1;
    }
  }
  return next;
}

/* ─── Variable Ship Shapes ─── */
export type ShipShape = "line" | "L" | "T" | "Z";

export interface ShapedShipDef extends ShipDef {
  shape: ShipShape;
}

export function getShapeCells(start: Coord, shape: ShipShape, size: number, rotation: number): Coord[] {
  const cells: Coord[] = [];

  if (shape === "line") {
    for (let i = 0; i < size; i++) {
      if (rotation % 2 === 0) cells.push({ row: start.row + i, col: start.col });
      else cells.push({ row: start.row, col: start.col + i });
    }
    return cells;
  }

  // L-shape: main arm + 1 cell perpendicular at the end
  if (shape === "L") {
    const armLen = size - 1;
    for (let i = 0; i < armLen; i++) {
      cells.push(
        rotation === 0 ? { row: start.row + i, col: start.col } :
        rotation === 1 ? { row: start.row, col: start.col + i } :
        rotation === 2 ? { row: start.row - i, col: start.col } :
        { row: start.row, col: start.col - i }
      );
    }
    const last = cells[cells.length - 1];
    cells.push(
      rotation === 0 ? { row: last.row, col: last.col + 1 } :
      rotation === 1 ? { row: last.row + 1, col: last.col } :
      rotation === 2 ? { row: last.row, col: last.col - 1 } :
      { row: last.row - 1, col: last.col }
    );
    return cells;
  }

  // T-shape: main arm with perpendicular branch at midpoint
  if (shape === "T") {
    const armLen = size - 1;
    const mid = Math.floor(armLen / 2);
    for (let i = 0; i < armLen; i++) {
      cells.push(
        rotation % 2 === 0 ? { row: start.row + i, col: start.col } :
        { row: start.row, col: start.col + i }
      );
    }
    const midCell = cells[mid];
    cells.push(
      rotation === 0 ? { row: midCell.row, col: midCell.col + 1 } :
      rotation === 1 ? { row: midCell.row + 1, col: midCell.col } :
      rotation === 2 ? { row: midCell.row, col: midCell.col - 1 } :
      { row: midCell.row - 1, col: midCell.col }
    );
    return cells;
  }

  // Z-shape: offset line segments
  if (shape === "Z") {
    const half = Math.ceil(size / 2);
    for (let i = 0; i < half; i++) {
      cells.push(
        rotation % 2 === 0 ? { row: start.row + i, col: start.col } :
        { row: start.row, col: start.col + i }
      );
    }
    const last = cells[cells.length - 1];
    for (let i = 1; i <= size - half; i++) {
      cells.push(
        rotation % 2 === 0 ? { row: last.row + i, col: last.col + 1 } :
        { row: last.row + 1, col: last.col + i }
      );
    }
    return cells;
  }

  return cells;
}

export function canPlaceShape(
  board: Board,
  cells: Coord[],
  islands?: Set<string>,
): boolean {
  const occupied = new Set<string>();
  for (const ship of board.ships) {
    for (const c of ship.cells) occupied.add(coordKey(c));
  }
  return cells.every(
    (c) =>
      inBounds(c, board.size) &&
      !occupied.has(coordKey(c)) &&
      (!islands || !islands.has(coordKey(c))),
  );
}

/* ─── Reefs (hidden obstacles) ─── */
export function generateReefs(boardSize: number, count: number, rng = Math.random): Set<string> {
  const reefs = new Set<string>();
  let attempts = 0;
  while (reefs.size < count && attempts < 500) {
    const row = Math.floor(rng() * boardSize);
    const col = Math.floor(rng() * boardSize);
    reefs.add(coordKey({ row, col }));
    attempts++;
  }
  return reefs;
}

export function isReef(reefs: Set<string>, coord: Coord): boolean {
  return reefs.has(coordKey(coord));
}
