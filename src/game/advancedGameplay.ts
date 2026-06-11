/**
 * Advanced Gameplay features:
 * - Formation Bonuses
 * - Tactical Abilities Cooldown
 * - Capture the Flag
 * - King of the Hill
 * - Escort Mission
 * - Fuel System
 * - Submarine Stealth
 * - Boarding Action
 * - Handicap System
 * - Bounty System
 * - Draft Mode
 * - Co-op vs AI
 */

import type { Coord, Ship, ShipDef } from "./types";

/* ─── Formation Bonuses ─── */

export interface FormationBonus {
  type: "defense" | "offense" | "scout";
  value: number;
  description: string;
}

export function calculateFormationBonuses(ships: Ship[], boardSize: number): FormationBonus[] {
  const bonuses: FormationBonus[] = [];
  const allCells = new Set<string>();
  for (const ship of ships) {
    for (const cell of ship.cells) {
      allCells.add(`${cell.row},${cell.col}`);
    }
  }

  // Check adjacency between ships
  let adjacentPairs = 0;
  for (const ship of ships) {
    for (const cell of ship.cells) {
      const neighbors = [
        { row: cell.row - 1, col: cell.col },
        { row: cell.row + 1, col: cell.col },
        { row: cell.row, col: cell.col - 1 },
        { row: cell.row, col: cell.col + 1 },
      ];
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (allCells.has(key)) {
          // Check if this cell belongs to a DIFFERENT ship
          const otherShip = ships.find(s => s !== ship && s.cells.some(c => c.row === n.row && c.col === n.col));
          if (otherShip) adjacentPairs++;
        }
      }
    }
  }

  // Divide by 2 (counted from both sides)
  adjacentPairs = Math.floor(adjacentPairs / 2);

  if (adjacentPairs >= 3) {
    bonuses.push({ type: "defense", value: 15, description: "Fleet Formation: +15% defense (3+ adjacent ship segments)" });
  }
  if (adjacentPairs >= 1) {
    bonuses.push({ type: "offense", value: 5, description: "Mutual Support: +5% accuracy (ships supporting each other)" });
  }

  // Check if all ships are in same quadrant (concentrated fleet)
  const quadrants = new Set<string>();
  const mid = Math.floor(boardSize / 2);
  for (const ship of ships) {
    for (const cell of ship.cells) {
      quadrants.add(`${cell.row < mid ? "top" : "bottom"}-${cell.col < mid ? "left" : "right"}`);
    }
  }
  if (quadrants.size === 1) {
    bonuses.push({ type: "scout", value: 1, description: "Concentrated Fleet: +1 scout range" });
  }

  return bonuses;
}

/* ─── Tactical Abilities Cooldown ─── */

export interface AbilityCooldown {
  ability: string;
  maxCooldown: number;
  currentCooldown: number;
  charges: number;
  maxCharges: number;
}

export function createAbilityCooldowns(): AbilityCooldown[] {
  return [
    { ability: "radar", maxCooldown: 5, currentCooldown: 0, charges: 2, maxCharges: 2 },
    { ability: "sonar", maxCooldown: 4, currentCooldown: 0, charges: 3, maxCharges: 3 },
    { ability: "airstrike", maxCooldown: 8, currentCooldown: 0, charges: 1, maxCharges: 1 },
    { ability: "torpedo", maxCooldown: 6, currentCooldown: 0, charges: 2, maxCharges: 2 },
    { ability: "emp", maxCooldown: 10, currentCooldown: 0, charges: 1, maxCharges: 1 },
  ];
}

export function tickCooldowns(cooldowns: AbilityCooldown[]): AbilityCooldown[] {
  return cooldowns.map(cd => ({
    ...cd,
    currentCooldown: Math.max(0, cd.currentCooldown - 1),
  }));
}

export function useAbility(cooldowns: AbilityCooldown[], ability: string): AbilityCooldown[] | null {
  const cd = cooldowns.find(c => c.ability === ability);
  if (!cd || cd.currentCooldown > 0 || cd.charges <= 0) return null;
  return cooldowns.map(c =>
    c.ability === ability
      ? { ...c, currentCooldown: c.maxCooldown, charges: c.charges - 1 }
      : c
  );
}

/* ─── Capture the Flag ─── */

export interface CTFState {
  playerFlag: Coord;
  enemyFlag: Coord;
  flagCaptured: boolean;
  flagHit: boolean;
}

export function createCTFState(boardSize: number): CTFState {
  // Place flags in random positions
  const playerFlag = {
    row: Math.floor(Math.random() * boardSize),
    col: Math.floor(Math.random() * boardSize),
  };
  const enemyFlag = {
    row: Math.floor(Math.random() * boardSize),
    col: Math.floor(Math.random() * boardSize),
  };
  return { playerFlag, enemyFlag, flagCaptured: false, flagHit: false };
}

export function checkFlagHit(state: CTFState, coord: Coord, isPlayer: boolean): CTFState {
  const flag = isPlayer ? state.enemyFlag : state.playerFlag;
  if (coord.row === flag.row && coord.col === flag.col) {
    return { ...state, flagHit: true };
  }
  return state;
}

/* ─── King of the Hill ─── */

export interface KOTHState {
  zone: { startRow: number; startCol: number; size: number };
  playerControl: number; // turns controlling
  enemyControl: number;
  currentController: "player" | "enemy" | "none";
  turnsToWin: number;
}

export function createKOTHState(boardSize: number): KOTHState {
  const zoneSize = 3;
  const start = Math.floor((boardSize - zoneSize) / 2);
  return {
    zone: { startRow: start, startCol: start, size: zoneSize },
    playerControl: 0,
    enemyControl: 0,
    currentController: "none",
    turnsToWin: 5,
  };
}

export function updateKOTH(state: KOTHState, playerHitsInZone: number, enemyHitsInZone: number): KOTHState {
  const newState = { ...state };
  if (playerHitsInZone > enemyHitsInZone) {
    newState.currentController = "player";
    newState.playerControl += 1;
  } else if (enemyHitsInZone > playerHitsInZone) {
    newState.currentController = "enemy";
    newState.enemyControl += 1;
  }
  return newState;
}

export function checkKOTHWin(state: KOTHState): "player" | "enemy" | null {
  if (state.playerControl >= state.turnsToWin) return "player";
  if (state.enemyControl >= state.turnsToWin) return "enemy";
  return null;
}

/* ─── Escort Mission ─── */

export interface EscortState {
  transport: { current: Coord; path: Coord[]; stepIndex: number };
  health: number;
  maxHealth: number;
  speed: number; // moves per N turns
  arrived: boolean;
  destroyed: boolean;
}

export function createEscortState(boardSize: number): EscortState {
  // Transport moves from left to right
  const path: Coord[] = [];
  const row = Math.floor(boardSize / 2);
  for (let c = 0; c < boardSize; c++) {
    path.push({ row, col: c });
  }
  return {
    transport: { current: path[0], path, stepIndex: 0 },
    health: 3,
    maxHealth: 3,
    speed: 2, // moves every 2 turns
    arrived: false,
    destroyed: false,
  };
}

export function advanceEscort(state: EscortState, turn: number): EscortState {
  if (state.arrived || state.destroyed) return state;
  if (turn % state.speed !== 0) return state;

  const newIndex = state.transport.stepIndex + 1;
  if (newIndex >= state.transport.path.length) {
    return { ...state, arrived: true };
  }
  return {
    ...state,
    transport: { ...state.transport, current: state.transport.path[newIndex], stepIndex: newIndex },
  };
}

export function hitEscort(state: EscortState, coord: Coord): EscortState {
  if (coord.row === state.transport.current.row && coord.col === state.transport.current.col) {
    const newHealth = state.health - 1;
    return { ...state, health: newHealth, destroyed: newHealth <= 0 };
  }
  return state;
}

/* ─── Fuel System ─── */

export interface FuelState {
  fuel: number;
  maxFuel: number;
  fuelPerMove: number;
  refuelRate: number; // fuel gained per 3 turns
  turnsSinceRefuel: number;
}

export function createFuelState(): FuelState {
  return { fuel: 20, maxFuel: 20, fuelPerMove: 2, refuelRate: 5, turnsSinceRefuel: 0 };
}

export function spendFuel(state: FuelState, amount: number): FuelState | null {
  if (state.fuel < amount) return null;
  return { ...state, fuel: state.fuel - amount };
}

export function refuelTick(state: FuelState): FuelState {
  const newState = { ...state, turnsSinceRefuel: state.turnsSinceRefuel + 1 };
  if (newState.turnsSinceRefuel >= 3) {
    newState.fuel = Math.min(newState.maxFuel, newState.fuel + newState.refuelRate);
    newState.turnsSinceRefuel = 0;
  }
  return newState;
}

/* ─── Submarine Stealth ─── */

export interface StealthState {
  stealthShips: Map<string, { active: boolean; turnsRemaining: number; usedThisGame: boolean }>;
}

export function createStealthState(ships: Ship[]): StealthState {
  const stealthShips = new Map<string, { active: boolean; turnsRemaining: number; usedThisGame: boolean }>();
  for (const ship of ships) {
    if (ship.name.toLowerCase().includes("submarine") || ship.name.toLowerCase().includes("sub")) {
      stealthShips.set(ship.id, { active: false, turnsRemaining: 0, usedThisGame: false });
    }
  }
  return { stealthShips };
}

export function activateStealth(state: StealthState, shipId: string): StealthState {
  const entry = state.stealthShips.get(shipId);
  if (!entry || entry.usedThisGame) return state;
  const newMap = new Map(state.stealthShips);
  newMap.set(shipId, { active: true, turnsRemaining: 1, usedThisGame: true });
  return { stealthShips: newMap };
}

export function isShipStealthed(state: StealthState, shipId: string): boolean {
  return state.stealthShips.get(shipId)?.active ?? false;
}

export function tickStealth(state: StealthState): StealthState {
  const newMap = new Map(state.stealthShips);
  for (const [id, entry] of newMap) {
    if (entry.active) {
      const remaining = entry.turnsRemaining - 1;
      if (remaining <= 0) {
        newMap.set(id, { ...entry, active: false, turnsRemaining: 0 });
      } else {
        newMap.set(id, { ...entry, turnsRemaining: remaining });
      }
    }
  }
  return { stealthShips: newMap };
}

/* ─── Boarding Action ─── */

export interface BoardingState {
  capturedShips: { name: string; cells: Coord[]; capturedTurn: number }[];
  boardingEnabled: boolean;
}

export function createBoardingState(): BoardingState {
  return { capturedShips: [], boardingEnabled: true };
}

export function attemptBoarding(state: BoardingState, sunkShip: Ship, turn: number): BoardingState {
  if (!state.boardingEnabled) return state;
  // 50% chance of successful boarding
  if (Math.random() > 0.5) return state;
  return {
    ...state,
    capturedShips: [...state.capturedShips, { name: sunkShip.name, cells: sunkShip.cells, capturedTurn: turn }],
  };
}

/* ─── Handicap System ─── */

export interface HandicapSettings {
  playerShipReduction: number; // remove N ships from player
  aiExtraShips: number; // give AI N extra ships
  playerBoardReduction: number; // reduce player board size
  aiFirstStrike: boolean; // AI gets first turn
  playerBonusPowerUps: number; // extra power-ups for weaker player
}

export function calculateHandicap(playerWinRate: number, gamesPlayed: number): HandicapSettings {
  if (gamesPlayed < 5) return { playerShipReduction: 0, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: false, playerBonusPowerUps: 0 };

  if (playerWinRate >= 0.8) {
    return { playerShipReduction: 1, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: true, playerBonusPowerUps: 0 };
  }
  if (playerWinRate >= 0.65) {
    return { playerShipReduction: 0, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: true, playerBonusPowerUps: 0 };
  }
  if (playerWinRate <= 0.2) {
    return { playerShipReduction: 0, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: false, playerBonusPowerUps: 5 };
  }
  if (playerWinRate <= 0.3) {
    return { playerShipReduction: 0, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: false, playerBonusPowerUps: 3 };
  }
  return { playerShipReduction: 0, aiExtraShips: 0, playerBoardReduction: 0, aiFirstStrike: false, playerBonusPowerUps: 0 };
}

/* ─── Bounty System ─── */

export interface Bounty {
  id: string;
  description: string;
  condition: "sink_first" | "no_miss_3" | "sink_in_zone" | "fast_sink" | "accuracy_50";
  reward: number; // bonus XP
  active: boolean;
  completed: boolean;
}

export function generateBounties(): Bounty[] {
  const allBounties: Bounty[] = [
    { id: "b1", description: "Sink a ship within 5 shots", condition: "fast_sink", reward: 100, active: true, completed: false },
    { id: "b2", description: "Land 3 hits in a row without missing", condition: "no_miss_3", reward: 75, active: true, completed: false },
    { id: "b3", description: "Sink the first enemy ship before losing any", condition: "sink_first", reward: 150, active: true, completed: false },
    { id: "b4", description: "Achieve 50%+ accuracy by turn 10", condition: "accuracy_50", reward: 200, active: true, completed: false },
  ];
  // Pick 2-3 random bounties per game
  const shuffled = allBounties.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function checkBounty(
  bounty: Bounty,
  stats: { shotsFired: number; hitsLanded: number; shipsLost: number; shipsSunk: number; streak: number }
): boolean {
  switch (bounty.condition) {
    case "fast_sink": return stats.shipsSunk > 0 && stats.shotsFired <= 5;
    case "no_miss_3": return stats.streak >= 3;
    case "sink_first": return stats.shipsSunk > 0 && stats.shipsLost === 0;
    case "accuracy_50": return stats.shotsFired >= 10 && (stats.hitsLanded / stats.shotsFired) >= 0.5;
    default: return false;
  }
}

/* ─── Draft Mode ─── */

export interface DraftState {
  availableShips: ShipDef[];
  playerPicks: ShipDef[];
  aiPicks: ShipDef[];
  currentPicker: "player" | "ai";
  round: number;
  maxPicks: number;
}

export function createDraftState(): DraftState {
  const pool: ShipDef[] = [
    { name: "Carrier", size: 5 },
    { name: "Battleship", size: 4 },
    { name: "Cruiser", size: 3 },
    { name: "Submarine", size: 3 },
    { name: "Destroyer", size: 2 },
    { name: "Frigate", size: 2 },
    { name: "Patrol Boat", size: 1 },
    { name: "Corvette", size: 2 },
    { name: "Gunboat", size: 3 },
    { name: "Dreadnought", size: 4 },
  ];
  return {
    availableShips: pool,
    playerPicks: [],
    aiPicks: [],
    currentPicker: "player",
    round: 0,
    maxPicks: 5,
  };
}

export function draftPick(state: DraftState, shipIndex: number): DraftState {
  if (shipIndex < 0 || shipIndex >= state.availableShips.length) return state;
  const ship = state.availableShips[shipIndex];
  const newAvailable = state.availableShips.filter((_, i) => i !== shipIndex);

  if (state.currentPicker === "player") {
    return {
      ...state,
      availableShips: newAvailable,
      playerPicks: [...state.playerPicks, ship],
      currentPicker: "ai",
      round: state.round + 1,
    };
  } else {
    return {
      ...state,
      availableShips: newAvailable,
      aiPicks: [...state.aiPicks, ship],
      currentPicker: "player",
      round: state.round + 1,
    };
  }
}

export function aiDraftPick(state: DraftState): DraftState {
  // AI picks the largest available ship
  let bestIdx = 0;
  for (let i = 1; i < state.availableShips.length; i++) {
    if (state.availableShips[i].size > state.availableShips[bestIdx].size) bestIdx = i;
  }
  return draftPick(state, bestIdx);
}

/* ─── Fleet Morale ─── */

export interface MoraleState {
  morale: number; // 0-100
  effects: { type: "accuracy" | "evasion" | "speed"; modifier: number }[];
}

export function createMoraleState(): MoraleState {
  return { morale: 75, effects: [] };
}

export function updateMorale(state: MoraleState, event: "hit_enemy" | "miss" | "take_hit" | "lose_ship" | "sink_enemy"): MoraleState {
  let delta = 0;
  switch (event) {
    case "hit_enemy": delta = 3; break;
    case "miss": delta = -1; break;
    case "take_hit": delta = -5; break;
    case "lose_ship": delta = -15; break;
    case "sink_enemy": delta = 10; break;
  }
  const newMorale = Math.max(0, Math.min(100, state.morale + delta));
  const effects: MoraleState["effects"] = [];
  if (newMorale >= 80) effects.push({ type: "accuracy", modifier: 5 });
  if (newMorale >= 90) effects.push({ type: "speed", modifier: 1 });
  if (newMorale <= 30) effects.push({ type: "accuracy", modifier: -10 });
  if (newMorale <= 15) effects.push({ type: "evasion", modifier: -5 });
  return { morale: newMorale, effects };
}
