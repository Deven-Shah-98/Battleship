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

/** Blitz fleet (6x6 board). */
export const BLITZ_FLEET: ShipDef[] = [
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

/** Column labels — enough for 15x15. */
export const COLUMN_LABELS = "ABCDEFGHIJKLMNO".split("");

/** Default power-up inventory per game. */
export const DEFAULT_POWERUPS: PowerUpState = {
  radar: 1,
  sonar: 2,
  airstrike: 1,
};

/** Preset board sizes. */
export const BOARD_SIZES = [
  { size: 6, label: "6x6 (Blitz)", fleet: BLITZ_FLEET },
  { size: 8, label: "8x8 (Quick)", fleet: SHIP_DEFS.slice(1) },
  { size: 10, label: "10x10 (Classic)", fleet: SHIP_DEFS },
  { size: 12, label: "12x12 (Large)", fleet: [...SHIP_DEFS, { name: "Patrol Boat", size: 2 }] },
  { size: 15, label: "15x15 (Epic)", fleet: [...SHIP_DEFS, { name: "Patrol Boat", size: 2 }, { name: "Frigate", size: 3 }] },
] as const;

/** Custom ship pool for fleet builder. */
export const SHIP_POOL: ShipDef[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
  { name: "Patrol Boat", size: 2 },
  { name: "Frigate", size: 3 },
  { name: "Dreadnought", size: 6 },
];

/** AI thinking delays per speed setting. */
export const AI_SPEEDS: Record<string, number> = {
  instant: 0,
  fast: 300,
  normal: 650,
  dramatic: 1500,
};

/** Keyboard shortcut definitions. */
export const KEYBOARD_SHORTCUTS = [
  { key: "R", description: "Rotate ship during placement" },
  { key: "?", description: "Show keyboard shortcuts" },
  { key: "M", description: "Toggle mute" },
  { key: "H", description: "Show hint (if available)" },
  { key: "Esc", description: "Close modal / cancel" },
  { key: "Arrow Keys", description: "Navigate grid cells" },
  { key: "Enter/Space", description: "Fire at selected cell" },
  { key: "Home", description: "Jump to first column" },
  { key: "End", description: "Jump to last column" },
  { key: "1-4", description: "Quick-switch theme" },
  { key: "T", description: "Open theme switcher" },
  { key: "S", description: "Open stats" },
  { key: "U", description: "Undo last ship placement" },
];
