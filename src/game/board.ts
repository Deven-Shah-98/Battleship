import { BOARD_SIZE, SHIP_DEFS } from "./constants";
import type {
  AttackOutcome,
  Board,
  Coord,
  Orientation,
  Ship,
  ShipDef,
} from "./types";

export const coordKey = (c: Coord): string => `${c.row},${c.col}`;

export const inBounds = (c: Coord, size = BOARD_SIZE): boolean =>
  c.row >= 0 && c.row < size && c.col >= 0 && c.col < size;

export function createEmptyBoard(size = BOARD_SIZE): Board {
  return { size, ships: [], shots: {} };
}

/** Compute the cells a ship would occupy given a start, size and orientation. */
export function shipCells(
  start: Coord,
  size: number,
  orientation: Orientation,
): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < size; i++) {
    cells.push({
      row: orientation === "vertical" ? start.row + i : start.row,
      col: orientation === "horizontal" ? start.col + i : start.col,
    });
  }
  return cells;
}

/** True if a ship of `size` can be legally placed at `start`/`orientation`. */
export function canPlaceShip(
  board: Board,
  size: number,
  start: Coord,
  orientation: Orientation,
): boolean {
  const cells = shipCells(start, size, orientation);
  if (cells.some((c) => !inBounds(c, board.size))) return false;

  const occupied = new Set<string>();
  for (const ship of board.ships) {
    for (const c of ship.cells) occupied.add(coordKey(c));
  }
  return cells.every((c) => !occupied.has(coordKey(c)));
}

let shipCounter = 0;
/** Generate a stable-enough unique id for a ship instance. */
function nextShipId(name: string): string {
  shipCounter += 1;
  return `${name}-${shipCounter}`;
}

/** Place a ship and return a new board (does not mutate the input). */
export function placeShip(
  board: Board,
  def: ShipDef,
  start: Coord,
  orientation: Orientation,
): Board {
  if (!canPlaceShip(board, def.size, start, orientation)) {
    throw new Error(`Cannot place ${def.name} at ${coordKey(start)}`);
  }
  const ship: Ship = {
    id: nextShipId(def.name),
    name: def.name,
    size: def.size,
    cells: shipCells(start, def.size, orientation),
    hits: new Array(def.size).fill(false),
  };
  return { ...board, ships: [...board.ships, ship] };
}

/** Randomly place all fleet ships on a fresh board. */
export function placeShipsRandomly(
  defs: ShipDef[] = SHIP_DEFS,
  size = BOARD_SIZE,
  rng: () => number = Math.random,
): Board {
  let board = createEmptyBoard(size);
  for (const def of defs) {
    let placed = false;
    // Bounded attempts to avoid an infinite loop in pathological cases.
    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const orientation: Orientation =
        rng() < 0.5 ? "horizontal" : "vertical";
      const maxRow = orientation === "vertical" ? size - def.size : size - 1;
      const maxCol = orientation === "horizontal" ? size - def.size : size - 1;
      const start: Coord = {
        row: Math.floor(rng() * (maxRow + 1)),
        col: Math.floor(rng() * (maxCol + 1)),
      };
      if (canPlaceShip(board, def.size, start, orientation)) {
        board = placeShip(board, def, start, orientation);
        placed = true;
      }
    }
    if (!placed) {
      throw new Error(`Failed to place ${def.name} after many attempts`);
    }
  }
  return board;
}

export const isShipSunk = (ship: Ship): boolean => ship.hits.every(Boolean);

export const allShipsSunk = (board: Board): boolean =>
  board.ships.length > 0 && board.ships.every(isShipSunk);

/** Find the ship occupying a given cell, if any. */
export function shipAt(board: Board, coord: Coord): Ship | null {
  const key = coordKey(coord);
  return board.ships.find((s) => s.cells.some((c) => coordKey(c) === key)) ?? null;
}

/**
 * Fire at a coordinate. Returns a new board plus the result.
 * Firing at a previously targeted cell yields result "already" and no change.
 */
export function receiveAttack(board: Board, coord: Coord): AttackOutcome {
  const key = coordKey(coord);
  if (key in board.shots) {
    return { board, result: "already", sunkShip: null };
  }

  const target = shipAt(board, coord);
  if (!target) {
    return {
      board: { ...board, shots: { ...board.shots, [key]: "miss" } },
      result: "miss",
      sunkShip: null,
    };
  }

  const hitIndex = target.cells.findIndex((c) => coordKey(c) === key);
  const updatedShip: Ship = {
    ...target,
    hits: target.hits.map((h, i) => (i === hitIndex ? true : h)),
  };
  const ships = board.ships.map((s) => (s.id === target.id ? updatedShip : s));
  const newBoard: Board = {
    ...board,
    ships,
    shots: { ...board.shots, [key]: "hit" },
  };
  return {
    board: newBoard,
    result: "hit",
    sunkShip: isShipSunk(updatedShip) ? updatedShip : null,
  };
}

/** Number of ships remaining (not sunk). */
export const remainingShips = (board: Board): number =>
  board.ships.filter((s) => !isShipSunk(s)).length;
