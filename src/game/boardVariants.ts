/** Board Variants — islands, reefs, wrap-around, hex adjacency, variable shapes */

import type { Coord } from "./types";

/** Generate random island cells that block both placement and shots */
export function generateIslands(boardSize: number, count?: number): Set<string> {
  const n = count ?? Math.max(2, Math.floor(boardSize * boardSize * 0.05));
  const islands = new Set<string>();
  let attempts = 0;
  while (islands.size < n && attempts < 1000) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    islands.add(`${row},${col}`);
    attempts++;
  }
  return islands;
}

/** Generate random reef cells — shots landing here always miss */
export function generateReefs(boardSize: number, count?: number): Set<string> {
  const n = count ?? Math.max(2, Math.floor(boardSize * boardSize * 0.04));
  const reefs = new Set<string>();
  let attempts = 0;
  while (reefs.size < n && attempts < 1000) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    reefs.add(`${row},${col}`);
    attempts++;
  }
  return reefs;
}

/** Wrap a coordinate around the board edges */
export function wrapCoord(coord: Coord, boardSize: number): Coord {
  return {
    row: ((coord.row % boardSize) + boardSize) % boardSize,
    col: ((coord.col % boardSize) + boardSize) % boardSize,
  };
}

/** Check if a coordinate is on an island */
export function isIsland(coord: Coord, islands: Set<string>): boolean {
  return islands.has(`${coord.row},${coord.col}`);
}

/** Check if a coordinate is on a reef */
export function isReef(coord: Coord, reefs: Set<string>): boolean {
  return reefs.has(`${coord.row},${coord.col}`);
}

/** Get hex-grid neighbors (6 directions instead of 4) */
export function hexNeighbors(coord: Coord, boardSize: number): Coord[] {
  const { row, col } = coord;
  const isEvenRow = row % 2 === 0;
  const offsets = isEvenRow
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

  return offsets
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter((c) => c.row >= 0 && c.row < boardSize && c.col >= 0 && c.col < boardSize);
}

/** Variable ship shapes — L, T, Z in addition to standard lines */
export type ShipShape = "line" | "L" | "T" | "Z";

export interface ShapeTemplate {
  name: ShipShape;
  /** Relative cell offsets from anchor (0,0) */
  cells: Coord[];
}

export const SHAPE_TEMPLATES: Record<ShipShape, (size: number) => Coord[]> = {
  line: (size: number) => {
    const cells: Coord[] = [];
    for (let i = 0; i < size; i++) cells.push({ row: 0, col: i });
    return cells;
  },
  L: (size: number) => {
    const cells: Coord[] = [];
    const stem = Math.ceil(size * 0.6);
    const branch = size - stem;
    for (let i = 0; i < stem; i++) cells.push({ row: i, col: 0 });
    for (let i = 1; i <= branch; i++) cells.push({ row: stem - 1, col: i });
    return cells;
  },
  T: (size: number) => {
    const cells: Coord[] = [];
    const armLength = Math.floor(size / 2);
    const stemLength = size - armLength;
    // Top bar
    for (let i = 0; i < armLength; i++) cells.push({ row: 0, col: i });
    // Stem down from center of bar
    const centerCol = Math.floor(armLength / 2);
    for (let i = 1; i < stemLength; i++) cells.push({ row: i, col: centerCol });
    return cells;
  },
  Z: (size: number) => {
    const cells: Coord[] = [];
    const half = Math.ceil(size / 2);
    const rest = size - half;
    // Top row
    for (let i = 0; i < half; i++) cells.push({ row: 0, col: i });
    // Bottom row offset
    for (let i = 0; i < rest; i++) cells.push({ row: 1, col: half - 1 + i });
    return cells;
  },
};

/** Rotate shape cells 90 degrees clockwise */
export function rotateShape(cells: Coord[]): Coord[] {
  return cells.map(({ row, col }) => ({ row: col, col: -row }));
}

/** Normalize shape so all coordinates are non-negative */
export function normalizeShape(cells: Coord[]): Coord[] {
  const minRow = Math.min(...cells.map((c) => c.row));
  const minCol = Math.min(...cells.map((c) => c.col));
  return cells.map((c) => ({ row: c.row - minRow, col: c.col - minCol }));
}
