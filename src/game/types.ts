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

/* ─── Game mode & player mode ─── */

/** Classic = 1 shot/turn. Salvo = 1 shot per surviving ship per turn. */
export type GameMode = "classic" | "salvo";

/** vs-ai = human vs computer. hotseat = local 2-player pass-and-play. */
export type PlayerMode = "vs-ai" | "hotseat";

/* ─── Power-ups ─── */

export type PowerUpKind = "radar" | "sonar" | "airstrike";

export interface PowerUpState {
  radar: number;
  sonar: number;
  airstrike: number;
}

/** Result of a radar scan: which cells in the 3×3 grid contain a ship. */
export interface RadarResult {
  center: Coord;
  cells: { coord: Coord; hasShip: boolean }[];
}

/** Result of a sonar ping: count of ship segments in the 3×3 area. */
export interface SonarResult {
  center: Coord;
  count: number;
}

/* ─── Themes ─── */

export type ThemeName = "cognition" | "midnight" | "arctic" | "ember";

/* ─── Match history ─── */

export interface MatchRecord {
  id: string;
  date: string;
  won: boolean;
  difficulty: string;
  mode: GameMode;
  playerMode: PlayerMode;
  shots: number;
  hits: number;
  accuracy: number;
  /** Seconds from game start to end. */
  duration: number;
  seed: string | null;
}

/* ─── Seeded RNG ─── */

/** A function that returns the next pseudo-random number in [0, 1). */
export type RNG = () => number;
