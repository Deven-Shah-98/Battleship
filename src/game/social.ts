/**
 * Social & Community systems:
 * - Board Sharing (challenge images)
 * - Community Ship Designs
 * - Reaction GIFs
 * - Match of the Day
 * - Fleet Showcase (public profile)
 * - Streamer Mode
 * - Custom Rules Editor
 * - Puzzle Mode
 */

import type { Coord, Ship, ShipDef, GameMode } from "./types";

/* ─── Board Sharing ─── */

export interface BoardChallenge {
  id: string;
  title: string;
  description: string;
  boardSize: number;
  ships: { name: string; cells: Coord[] }[];
  parShots: number;
  createdBy: string;
  date: string;
}

const CHALLENGES_KEY = "battleship.challenges";

export function loadChallenges(): BoardChallenge[] {
  try {
    const raw = localStorage.getItem(CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : getDefaultChallenges();
  } catch {
    return getDefaultChallenges();
  }
}

function getDefaultChallenges(): BoardChallenge[] {
  return [
    {
      id: "challenge-1",
      title: "Corner Cluster",
      description: "All ships are hiding in corners. Can you find them in under 20 shots?",
      boardSize: 8,
      ships: [
        { name: "Cruiser", cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
        { name: "Submarine", cells: [{ row: 5, col: 5 }, { row: 6, col: 5 }, { row: 7, col: 5 }] },
        { name: "Destroyer", cells: [{ row: 7, col: 0 }, { row: 7, col: 1 }] },
      ],
      parShots: 20,
      createdBy: "System",
      date: new Date().toLocaleDateString(),
    },
    {
      id: "challenge-2",
      title: "The Wall",
      description: "Ships form a vertical wall. Sweep from left to right!",
      boardSize: 10,
      ships: [
        { name: "Carrier", cells: [{ row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 }, { row: 4, col: 4 }] },
        { name: "Battleship", cells: [{ row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }, { row: 8, col: 4 }] },
        { name: "Cruiser", cells: [{ row: 0, col: 5 }, { row: 1, col: 5 }, { row: 2, col: 5 }] },
      ],
      parShots: 15,
      createdBy: "System",
      date: new Date().toLocaleDateString(),
    },
    {
      id: "challenge-3",
      title: "Scattered",
      description: "Ships are spread out with maximum spacing. Good luck!",
      boardSize: 10,
      ships: [
        { name: "Cruiser", cells: [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }] },
        { name: "Submarine", cells: [{ row: 5, col: 7 }, { row: 6, col: 7 }, { row: 7, col: 7 }] },
        { name: "Destroyer", cells: [{ row: 8, col: 1 }, { row: 8, col: 2 }] },
        { name: "Battleship", cells: [{ row: 3, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 }] },
      ],
      parShots: 30,
      createdBy: "System",
      date: new Date().toLocaleDateString(),
    },
  ];
}

export function saveChallenge(challenge: BoardChallenge): void {
  const challenges = loadChallenges();
  challenges.push(challenge);
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
}

export function generateChallengeCode(ships: Ship[], boardSize: number): string {
  // Encode ship positions as a compact string
  const parts: string[] = [`${boardSize}`];
  for (const ship of ships) {
    const start = ship.cells[0];
    const isHorizontal = ship.cells.length > 1 && ship.cells[1].col > ship.cells[0].col;
    parts.push(`${ship.name[0]}${start.row}${start.col}${isHorizontal ? "H" : "V"}${ship.size}`);
  }
  return btoa(parts.join("|")).replace(/=/g, "");
}

/* ─── Reactions ─── */

export interface Reaction {
  id: string;
  emoji: string;
  label: string;
  animation?: string;
}

export const REACTIONS: Reaction[] = [
  { id: "nice-shot", emoji: "🎯", label: "Nice shot!" },
  { id: "boom", emoji: "💥", label: "BOOM!" },
  { id: "close", emoji: "😅", label: "Close one!" },
  { id: "gg", emoji: "🤝", label: "Good game!" },
  { id: "wow", emoji: "😲", label: "Wow!" },
  { id: "oops", emoji: "😬", label: "Oops..." },
  { id: "genius", emoji: "🧠", label: "Big brain!" },
  { id: "lucky", emoji: "🍀", label: "Lucky!" },
  { id: "rage", emoji: "😤", label: "Nooo!" },
  { id: "salute", emoji: "🫡", label: "Respect" },
];

/* ─── Match of the Day ─── */

const MOTD_KEY = "battleship.motd";

export interface MatchOfTheDay {
  date: string;
  replayId: string;
  title: string;
  description: string;
  playerName: string;
  stats: { shots: number; accuracy: number; difficulty: string };
}

export function loadMatchOfTheDay(): MatchOfTheDay | null {
  try {
    const raw = localStorage.getItem(MOTD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function nominateMatchOfTheDay(match: MatchOfTheDay): void {
  const existing = loadMatchOfTheDay();
  // Only update if it's a different day or better stats
  if (!existing || existing.date !== match.date || match.stats.accuracy > existing.stats.accuracy) {
    localStorage.setItem(MOTD_KEY, JSON.stringify(match));
  }
}

/* ─── Streamer Mode ─── */

const STREAMER_KEY = "battleship.streamer";

export interface StreamerSettings {
  enabled: boolean;
  hideShipPositions: boolean;
  hideStats: boolean;
  overlayFriendly: boolean;
  customBorder: boolean;
  delaySeconds: number;
}

export function loadStreamerSettings(): StreamerSettings {
  try {
    const raw = localStorage.getItem(STREAMER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {
    enabled: false,
    hideShipPositions: true,
    hideStats: false,
    overlayFriendly: true,
    customBorder: true,
    delaySeconds: 0,
  };
}

export function saveStreamerSettings(settings: StreamerSettings): void {
  localStorage.setItem(STREAMER_KEY, JSON.stringify(settings));
}

/* ─── Custom Rules Editor ─── */

const RULES_KEY = "battleship.customRules";

export interface CustomRuleSet {
  id: string;
  name: string;
  description: string;
  rules: {
    boardSize: number;
    mode: GameMode;
    enablePowerUps: boolean;
    enableWeather: boolean;
    movingShips: boolean;
    shields: boolean;
    timedTurns: number;
    customFleet: ShipDef[];
    specialRules: string[];
  };
  createdDate: string;
}

export function loadCustomRules(): CustomRuleSet[] {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomRuleSet(ruleSet: CustomRuleSet): void {
  const rules = loadCustomRules();
  const idx = rules.findIndex(r => r.id === ruleSet.id);
  if (idx >= 0) rules[idx] = ruleSet;
  else rules.push(ruleSet);
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function deleteCustomRuleSet(id: string): void {
  const rules = loadCustomRules().filter(r => r.id !== id);
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

/* ─── Puzzle Mode ─── */

const PUZZLE_KEY = "battleship.puzzles";

export interface Puzzle {
  id: string;
  name: string;
  description: string;
  boardSize: number;
  ships: { name: string; cells: Coord[] }[];
  parShots: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  hints: string[];
}

export const PUZZLES: Puzzle[] = [
  {
    id: "puzzle-1",
    name: "The Line",
    description: "All ships are in a single row. Which row?",
    boardSize: 8,
    ships: [
      { name: "Cruiser", cells: [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }] },
      { name: "Submarine", cells: [{ row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 }] },
    ],
    parShots: 8,
    difficulty: "easy",
    hints: ["All ships are horizontal", "They share the same row"],
  },
  {
    id: "puzzle-2",
    name: "Diagonal Thinking",
    description: "Ships are placed along the diagonal. Think outside the box!",
    boardSize: 8,
    ships: [
      { name: "Cruiser", cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
      { name: "Submarine", cells: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }] },
      { name: "Destroyer", cells: [{ row: 6, col: 6 }, { row: 6, col: 7 }] },
    ],
    parShots: 12,
    difficulty: "medium",
    hints: ["Ships start on cells where row equals column", "Think diagonal"],
  },
  {
    id: "puzzle-3",
    name: "Maximum Spread",
    description: "Ships are as far apart as possible. Use process of elimination.",
    boardSize: 10,
    ships: [
      { name: "Cruiser", cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }] },
      { name: "Submarine", cells: [{ row: 0, col: 9 }, { row: 1, col: 9 }, { row: 2, col: 9 }] },
      { name: "Destroyer", cells: [{ row: 9, col: 4 }, { row: 9, col: 5 }] },
    ],
    parShots: 15,
    difficulty: "hard",
    hints: ["Ships are in corners and edges", "No ship is near the center"],
  },
  {
    id: "puzzle-4",
    name: "The Cluster",
    description: "All ships are touching each other. Find the cluster!",
    boardSize: 10,
    ships: [
      { name: "Carrier", cells: [{ row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }] },
      { name: "Battleship", cells: [{ row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 }, { row: 5, col: 7 }] },
      { name: "Cruiser", cells: [{ row: 6, col: 4 }, { row: 6, col: 5 }, { row: 6, col: 6 }] },
    ],
    parShots: 18,
    difficulty: "medium",
    hints: ["All ships are in the center area", "They form a staircase pattern"],
  },
  {
    id: "puzzle-5",
    name: "Expert Challenge",
    description: "Optimal play required. Every shot must count.",
    boardSize: 12,
    ships: [
      { name: "Carrier", cells: [{ row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 }] },
      { name: "Battleship", cells: [{ row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 }] },
      { name: "Cruiser", cells: [{ row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }] },
      { name: "Submarine", cells: [{ row: 6, col: 0 }, { row: 7, col: 0 }, { row: 8, col: 0 }] },
      { name: "Destroyer", cells: [{ row: 11, col: 10 }, { row: 11, col: 11 }] },
    ],
    parShots: 25,
    difficulty: "expert",
    hints: ["Ships are spread across all quadrants", "One ship is along the right edge"],
  },
];

export interface PuzzleResult {
  puzzleId: string;
  shots: number;
  completed: boolean;
  stars: number; // 1-3 based on shots vs par
  date: string;
}

export function loadPuzzleResults(): PuzzleResult[] {
  try {
    const raw = localStorage.getItem(PUZZLE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePuzzleResult(result: PuzzleResult): void {
  const results = loadPuzzleResults();
  const existing = results.findIndex(r => r.puzzleId === result.puzzleId);
  if (existing >= 0) {
    // Keep best score
    if (result.shots < results[existing].shots) results[existing] = result;
  } else {
    results.push(result);
  }
  localStorage.setItem(PUZZLE_KEY, JSON.stringify(results));
}

export function calculatePuzzleStars(shots: number, parShots: number): number {
  if (shots <= parShots * 0.7) return 3;
  if (shots <= parShots) return 2;
  return 1;
}

/* ─── Training Grounds ─── */

export interface TrainingDrill {
  id: string;
  name: string;
  description: string;
  type: "accuracy" | "speed" | "pattern" | "hunt";
  targetScore: number;
  boardSize: number;
}

export const TRAINING_DRILLS: TrainingDrill[] = [
  { id: "drill-1", name: "Quick Draw", description: "Hit 5 targets in under 10 seconds", type: "speed", targetScore: 5, boardSize: 6 },
  { id: "drill-2", name: "Sharpshooter", description: "Achieve 80%+ accuracy over 10 shots", type: "accuracy", targetScore: 80, boardSize: 8 },
  { id: "drill-3", name: "Pattern Breaker", description: "Find all ships using parity strategy", type: "pattern", targetScore: 15, boardSize: 10 },
  { id: "drill-4", name: "Hunt & Kill", description: "Sink a ship after first hit in ≤3 extra shots", type: "hunt", targetScore: 3, boardSize: 10 },
];

/* ─── Ship Graveyard Museum ─── */

const GRAVEYARD_KEY = "battleship.graveyard";

export interface GraveyardEntry {
  shipName: string;
  customName?: string;
  sunkBy: "player" | "ai";
  gameDate: string;
  shotsToSink: number;
  lastWords?: string;
}

export function loadGraveyard(): GraveyardEntry[] {
  try {
    const raw = localStorage.getItem(GRAVEYARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToGraveyard(entry: GraveyardEntry): void {
  const graveyard = loadGraveyard();
  graveyard.unshift(entry); // newest first
  if (graveyard.length > 200) graveyard.length = 200;
  localStorage.setItem(GRAVEYARD_KEY, JSON.stringify(graveyard));
}

const LAST_WORDS = [
  "Tell my family I fought bravely...",
  "The sea takes us all eventually.",
  "Avenge us, Captain!",
  "It was an honor serving with you.",
  "She was a good ship...",
  "May the depths grant us peace.",
  "We'll meet again in calmer waters.",
];

export function getLastWords(): string {
  return LAST_WORDS[Math.floor(Math.random() * LAST_WORDS.length)];
}
