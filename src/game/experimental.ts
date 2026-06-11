/**
 * Experimental game modes:
 * - Fog Exploration (dark board, reveal 3x3 on shot)
 * - Minehunter (find safe path)
 * - Reverse Battleship (puzzle - fewest shots)
 * - Battleship Poker (bet ships)
 * - Speed Chess (total time bank)
 * - Ironman (one life, no saves)
 * - Roguelike Run (10 consecutive games)
 * - Mirror Match (identical placements)
 * - Blind Mode (no feedback until end of turn)
 * - Chaos Mode (random rule changes)
 * - Tag Team (2v2)
 * - Artillery Mode (AoE shots)
 */

import type { Coord } from "./types";

/* ─── Fog Exploration ─── */

export interface FogState {
  revealed: Set<string>; // cells that have been revealed
  boardSize: number;
}

export function createFogState(boardSize: number): FogState {
  return { revealed: new Set(), boardSize };
}

export function revealFogArea(fog: FogState, center: Coord): FogState {
  const newRevealed = new Set(fog.revealed);
  for (let r = center.row - 1; r <= center.row + 1; r++) {
    for (let c = center.col - 1; c <= center.col + 1; c++) {
      if (r >= 0 && r < fog.boardSize && c >= 0 && c < fog.boardSize) {
        newRevealed.add(`${r},${c}`);
      }
    }
  }
  return { ...fog, revealed: newRevealed };
}

export function isCellRevealed(fog: FogState, coord: Coord): boolean {
  return fog.revealed.has(`${coord.row},${coord.col}`);
}

/* ─── Minehunter Mode ─── */

export interface MinehunterState {
  mines: Set<string>;
  safePath: Coord[];
  detonated: number;
  maxDetonations: number;
}

export function createMinehunterState(boardSize: number, mineCount: number): MinehunterState {
  const mines = new Set<string>();
  while (mines.size < mineCount) {
    const r = Math.floor(Math.random() * boardSize);
    const c = Math.floor(Math.random() * boardSize);
    mines.add(`${r},${c}`);
  }
  return { mines, safePath: [], detonated: 0, maxDetonations: 3 };
}

export function checkMine(state: MinehunterState, coord: Coord): { hit: boolean; gameOver: boolean; newState: MinehunterState } {
  const key = `${coord.row},${coord.col}`;
  if (state.mines.has(key)) {
    const newDetonated = state.detonated + 1;
    return { hit: true, gameOver: newDetonated >= state.maxDetonations, newState: { ...state, detonated: newDetonated } };
  }
  return { hit: false, gameOver: false, newState: { ...state, safePath: [...state.safePath, coord] } };
}

/* ─── Speed Chess Mode ─── */

export interface SpeedChessState {
  playerTimeMs: number;
  aiTimeMs: number;
  totalTimeMs: number;
  lastTurnStart: number;
  isPlayerTurn: boolean;
}

export function createSpeedChessState(totalSeconds: number): SpeedChessState {
  const totalMs = totalSeconds * 1000;
  return {
    playerTimeMs: totalMs,
    aiTimeMs: totalMs,
    totalTimeMs: totalMs,
    lastTurnStart: Date.now(),
    isPlayerTurn: true,
  };
}

export function switchSpeedChessTurn(state: SpeedChessState): SpeedChessState {
  const elapsed = Date.now() - state.lastTurnStart;
  const newState = { ...state, lastTurnStart: Date.now() };
  if (state.isPlayerTurn) {
    newState.playerTimeMs = Math.max(0, state.playerTimeMs - elapsed);
    newState.isPlayerTurn = false;
  } else {
    newState.aiTimeMs = Math.max(0, state.aiTimeMs - elapsed);
    newState.isPlayerTurn = true;
  }
  return newState;
}

export function isTimeUp(state: SpeedChessState): "player" | "ai" | null {
  if (state.playerTimeMs <= 0) return "player";
  if (state.aiTimeMs <= 0) return "ai";
  return null;
}

/* ─── Roguelike Run ─── */

const ROGUELIKE_KEY = "battleship.roguelike";

export interface RoguelikeState {
  currentRound: number;
  maxRounds: number;
  wins: number;
  losses: number;
  carryOverPowerUps: { radar: number; sonar: number; airstrike: number };
  active: boolean;
  difficulty: string[];
  score: number;
}

export function createRoguelikeState(): RoguelikeState {
  return {
    currentRound: 1,
    maxRounds: 10,
    wins: 0,
    losses: 0,
    carryOverPowerUps: { radar: 2, sonar: 2, airstrike: 1 },
    active: true,
    difficulty: ["easy", "easy", "medium", "medium", "medium", "hard", "hard", "hard", "admiral", "admiral"],
    score: 0,
  };
}

export function advanceRoguelike(state: RoguelikeState, won: boolean, shots: number): RoguelikeState {
  const newState = { ...state };
  if (won) {
    newState.wins += 1;
    newState.score += Math.max(0, 1000 - shots * 10);
    // Bonus power-up every 3 wins
    if (newState.wins % 3 === 0) {
      newState.carryOverPowerUps.radar += 1;
      newState.carryOverPowerUps.sonar += 1;
    }
  } else {
    newState.losses += 1;
    newState.active = false; // one loss = restart
  }
  newState.currentRound += 1;
  if (newState.currentRound > newState.maxRounds) {
    newState.active = false;
  }
  return newState;
}

export function loadRoguelikeState(): RoguelikeState | null {
  try {
    const raw = localStorage.getItem(ROGUELIKE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRoguelikeState(state: RoguelikeState): void {
  localStorage.setItem(ROGUELIKE_KEY, JSON.stringify(state));
}

/* ─── Chaos Mode ─── */

export type ChaosRule =
  | "double_damage"
  | "reverse_turns"
  | "random_reveal"
  | "extra_shot"
  | "shield_all"
  | "fog_roll"
  | "swap_boards"
  | "speed_round";

const CHAOS_RULES: { rule: ChaosRule; description: string }[] = [
  { rule: "double_damage", description: "All shots hit twice!" },
  { rule: "reverse_turns", description: "Turn order reversed!" },
  { rule: "random_reveal", description: "A random enemy cell is revealed!" },
  { rule: "extra_shot", description: "Both players get an extra shot!" },
  { rule: "shield_all", description: "All ships gain temporary shields!" },
  { rule: "fog_roll", description: "Fog rolls in — 3 random cells hidden!" },
  { rule: "swap_boards", description: "Tracking boards swap perspectives!" },
  { rule: "speed_round", description: "5-second turns this round!" },
];

export interface ChaosState {
  currentRule: ChaosRule | null;
  ruleDescription: string;
  turnsUntilChange: number;
  rulesApplied: number;
}

export function createChaosState(): ChaosState {
  return { currentRule: null, ruleDescription: "", turnsUntilChange: 3, rulesApplied: 0 };
}

export function advanceChaos(state: ChaosState): ChaosState {
  const newState = { ...state, turnsUntilChange: state.turnsUntilChange - 1 };
  if (newState.turnsUntilChange <= 0) {
    const chaos = CHAOS_RULES[Math.floor(Math.random() * CHAOS_RULES.length)];
    newState.currentRule = chaos.rule;
    newState.ruleDescription = chaos.description;
    newState.turnsUntilChange = 3 + Math.floor(Math.random() * 3);
    newState.rulesApplied += 1;
  }
  return newState;
}

/* ─── Artillery Mode ─── */

export type ArtillerySize = 1 | 2 | 3;

export interface ArtilleryState {
  ammo: { small: number; medium: number; large: number };
  selectedSize: ArtillerySize;
}

export function createArtilleryState(): ArtilleryState {
  return {
    ammo: { small: 20, medium: 5, large: 2 },
    selectedSize: 1,
  };
}

export function getArtilleryTargets(center: Coord, size: ArtillerySize, boardSize: number): Coord[] {
  const targets: Coord[] = [];
  const radius = size - 1;
  for (let r = center.row - radius; r <= center.row + radius; r++) {
    for (let c = center.col - radius; c <= center.col + radius; c++) {
      if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
        targets.push({ row: r, col: c });
      }
    }
  }
  return targets;
}

export function spendArtillery(state: ArtilleryState): ArtilleryState | null {
  const key = state.selectedSize === 1 ? "small" : state.selectedSize === 2 ? "medium" : "large";
  if (state.ammo[key] <= 0) return null;
  return { ...state, ammo: { ...state.ammo, [key]: state.ammo[key] - 1 } };
}

/* ─── Blind Mode ─── */

export interface BlindModeState {
  pendingResults: { coord: Coord; result: "hit" | "miss"; sunkShip?: string }[];
  revealedThisTurn: boolean;
}

export function createBlindModeState(): BlindModeState {
  return { pendingResults: [], revealedThisTurn: false };
}

export function addBlindResult(
  state: BlindModeState,
  coord: Coord,
  result: "hit" | "miss",
  sunkShip?: string
): BlindModeState {
  return {
    ...state,
    pendingResults: [...state.pendingResults, { coord, result, sunkShip }],
  };
}

export function revealBlindResults(_state: BlindModeState): BlindModeState {
  return { pendingResults: [], revealedThisTurn: true };
}

/* ─── Multi-round Match ─── */

export interface MultiRoundState {
  bestOf: number;
  playerScore: number;
  aiScore: number;
  currentRound: number;
  completed: boolean;
}

export function createMultiRoundState(bestOf: 3 | 5 | 7): MultiRoundState {
  return { bestOf, playerScore: 0, aiScore: 0, currentRound: 1, completed: false };
}

export function advanceMultiRound(state: MultiRoundState, playerWon: boolean): MultiRoundState {
  const newState = { ...state };
  if (playerWon) newState.playerScore += 1;
  else newState.aiScore += 1;
  newState.currentRound += 1;

  const winsNeeded = Math.ceil(state.bestOf / 2);
  if (newState.playerScore >= winsNeeded || newState.aiScore >= winsNeeded) {
    newState.completed = true;
  }
  return newState;
}

/* ─── Combo System ─── */

export interface ComboState {
  currentStreak: number;
  maxStreak: number;
  multiplier: number;
  totalBonusXP: number;
}

export function createComboState(): ComboState {
  return { currentStreak: 0, maxStreak: 0, multiplier: 1, totalBonusXP: 0 };
}

export function updateCombo(state: ComboState, hit: boolean): ComboState {
  if (hit) {
    const newStreak = state.currentStreak + 1;
    const multiplier = 1 + Math.floor(newStreak / 3) * 0.5; // +0.5x every 3 hits
    const bonusXP = Math.floor(newStreak * 5 * multiplier);
    return {
      currentStreak: newStreak,
      maxStreak: Math.max(state.maxStreak, newStreak),
      multiplier,
      totalBonusXP: state.totalBonusXP + bonusXP,
    };
  }
  return { ...state, currentStreak: 0, multiplier: 1 };
}

/* ─── Resource Management ─── */

export interface ResourceState {
  ammo: Record<string, number>; // per ship type
  fuel: number;
  maxFuel: number;
  resupplyTurns: number;
  turnsUntilResupply: number;
}

export function createResourceState(shipNames: string[]): ResourceState {
  const ammo: Record<string, number> = {};
  for (const name of shipNames) {
    ammo[name] = 10; // 10 shots per ship
  }
  return { ammo, fuel: 20, maxFuel: 20, resupplyTurns: 5, turnsUntilResupply: 5 };
}

export function spendAmmo(state: ResourceState, shipName: string): ResourceState | null {
  if ((state.ammo[shipName] ?? 0) <= 0) return null;
  return { ...state, ammo: { ...state.ammo, [shipName]: state.ammo[shipName] - 1 } };
}

export function advanceResources(state: ResourceState): ResourceState {
  const newState = { ...state, turnsUntilResupply: state.turnsUntilResupply - 1 };
  if (newState.turnsUntilResupply <= 0) {
    // Resupply: +3 ammo to each ship, restore fuel
    const newAmmo = { ...newState.ammo };
    for (const key of Object.keys(newAmmo)) {
      newAmmo[key] = Math.min(10, newAmmo[key] + 3);
    }
    newState.ammo = newAmmo;
    newState.fuel = Math.min(newState.maxFuel, newState.fuel + 5);
    newState.turnsUntilResupply = state.resupplyTurns;
  }
  return newState;
}

/* ─── Ghost Ships (Decoys) ─── */

export interface GhostShipState {
  ghosts: { coord: Coord; turnsLeft: number }[];
  maxGhosts: number;
}

export function createGhostShipState(): GhostShipState {
  return { ghosts: [], maxGhosts: 2 };
}

export function deployGhost(state: GhostShipState, coord: Coord): GhostShipState {
  if (state.ghosts.length >= state.maxGhosts) return state;
  return { ...state, ghosts: [...state.ghosts, { coord, turnsLeft: 3 }] };
}

export function advanceGhosts(state: GhostShipState): GhostShipState {
  const remaining = state.ghosts
    .map(g => ({ ...g, turnsLeft: g.turnsLeft - 1 }))
    .filter(g => g.turnsLeft > 0);
  return { ...state, ghosts: remaining };
}

export function isGhostAt(state: GhostShipState, coord: Coord): boolean {
  return state.ghosts.some(g => g.coord.row === coord.row && g.coord.col === coord.col);
}

/* ─── Treasure Hunt Mode ─── */

export interface TreasureState {
  treasures: { coord: Coord; type: "radar" | "sonar" | "airstrike" | "xp" | "shield"; collected: boolean }[];
}

export function createTreasureState(boardSize: number, count: number): TreasureState {
  const types: TreasureState["treasures"][0]["type"][] = ["radar", "sonar", "airstrike", "xp", "shield"];
  const treasures: TreasureState["treasures"] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let r: number, c: number, key: string;
    do {
      r = Math.floor(Math.random() * boardSize);
      c = Math.floor(Math.random() * boardSize);
      key = `${r},${c}`;
    } while (used.has(key));
    used.add(key);
    treasures.push({ coord: { row: r, col: c }, type: types[i % types.length], collected: false });
  }
  return { treasures };
}

export function checkTreasure(state: TreasureState, coord: Coord): { found: TreasureState["treasures"][0] | null; newState: TreasureState } {
  const idx = state.treasures.findIndex(t => !t.collected && t.coord.row === coord.row && t.coord.col === coord.col);
  if (idx < 0) return { found: null, newState: state };
  const newTreasures = [...state.treasures];
  newTreasures[idx] = { ...newTreasures[idx], collected: true };
  return { found: state.treasures[idx], newState: { treasures: newTreasures } };
}
