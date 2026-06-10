import type { PowerUpState, ShipDef } from "./types";

export const BOARD_SIZE = 10;

/** Classic Battleship fleet. */
export const SHIP_DEFS: ShipDef[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

/** Column labels A..J used by the UI. */
export const COLUMN_LABELS = "ABCDEFGHIJ".split("");

/** Default power-up inventory per game. */
export const DEFAULT_POWERUPS: PowerUpState = {
  radar: 1,
  sonar: 2,
  airstrike: 1,
};
