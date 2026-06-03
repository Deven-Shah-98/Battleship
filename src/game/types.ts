export type Orientation = "horizontal" | "vertical";

export interface Coord {
  row: number;
  col: number;
}

/** A ship placed on a board. */
export interface Ship {
  id: string;
  name: string;
  size: number;
  /** Cells occupied by the ship, ordered from the start cell. */
  cells: Coord[];
  /** Parallel to `cells`: whether each cell has been hit. */
  hits: boolean[];
}

/** Definition of a ship type before placement. */
export interface ShipDef {
  name: string;
  size: number;
}

export type ShotResult = "hit" | "miss" | "already";

export interface AttackOutcome {
  board: Board;
  result: ShotResult;
  /** Set when the attack sank a ship. */
  sunkShip: Ship | null;
}

export interface Board {
  size: number;
  ships: Ship[];
  /** Map of "row,col" -> shot result for every cell that has been fired at. */
  shots: Record<string, "hit" | "miss">;
}
