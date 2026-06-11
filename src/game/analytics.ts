/**
 * Data & Analytics systems:
 * - Win Condition Predictor
 * - Placement Pattern Analyzer
 * - Shot Efficiency Grade
 * - Head-to-Head History
 * - Improvement Tracker
 * - Expected Value Display
 * - Strategy Fingerprint
 * - Benchmark Mode
 */

import type { Board, Coord, Ship } from "./types";

/* ─── Win Condition Predictor ─── */

export function predictWinProbability(
  playerShipsRemaining: number,
  enemyShipsRemaining: number,
  playerAccuracy: number,
  enemyShotsTotal: number,
  boardSize: number
): number {
  // Simple Bayesian estimate based on ship ratio, accuracy, and board coverage
  const shipRatio = playerShipsRemaining / Math.max(1, enemyShipsRemaining);
  const accuracyFactor = Math.min(1, playerAccuracy / 100) * 0.3;
  const coverageFactor = Math.min(1, enemyShotsTotal / (boardSize * boardSize)) * 0.2;
  const base = 0.5 * shipRatio;
  return Math.min(0.99, Math.max(0.01, base + accuracyFactor - coverageFactor));
}

/* ─── Placement Pattern Analyzer ─── */

const PLACEMENT_KEY = "battleship.placements";

export interface PlacementHeatmap {
  cells: Record<string, number>; // "row,col" -> count
  totalGames: number;
  boardSize: number;
}

export function loadPlacementHeatmap(): PlacementHeatmap {
  try {
    const raw = localStorage.getItem(PLACEMENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { cells: {}, totalGames: 0, boardSize: 10 };
}

export function recordPlacement(ships: Ship[], boardSize: number): void {
  const heatmap = loadPlacementHeatmap();
  heatmap.boardSize = boardSize;
  heatmap.totalGames += 1;
  for (const ship of ships) {
    for (const cell of ship.cells) {
      const key = `${cell.row},${cell.col}`;
      heatmap.cells[key] = (heatmap.cells[key] ?? 0) + 1;
    }
  }
  localStorage.setItem(PLACEMENT_KEY, JSON.stringify(heatmap));
}

export function getPlacementWarning(heatmap: PlacementHeatmap): string | null {
  if (heatmap.totalGames < 5) return null;
  const threshold = heatmap.totalGames * 0.6; // if a cell is used >60% of games
  const hotCells = Object.entries(heatmap.cells).filter(([, count]) => count >= threshold);
  if (hotCells.length >= 3) {
    return "Your placement pattern is becoming predictable! The AI may exploit this.";
  }
  return null;
}

/* ─── Shot Efficiency Grade ─── */

export type EfficiencyGrade = "S" | "A+" | "A" | "B" | "C" | "D" | "F";

export function calculateEfficiencyGrade(
  shots: number,
  totalEnemySegments: number,
  boardSize: number
): { grade: EfficiencyGrade; score: number; optimalShots: number } {
  // Optimal is hitting every segment with no misses
  const optimalShots = totalEnemySegments;
  // Perfect game = all hits, no misses
  const ratio = shots > 0 ? totalEnemySegments / shots : 0;

  let score = Math.round(ratio * 100);
  // Adjust for board coverage
  score += Math.max(0, Math.round((1 - shots / (boardSize * boardSize)) * 10));
  // Bonus for low shot count
  if (shots <= optimalShots * 1.5) score += 20;
  if (shots <= optimalShots * 2) score += 10;

  score = Math.min(100, Math.max(0, score));

  let grade: EfficiencyGrade;
  if (score >= 95) grade = "S";
  else if (score >= 85) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 45) grade = "C";
  else if (score >= 30) grade = "D";
  else grade = "F";

  return { grade, score, optimalShots };
}

/* ─── Head-to-Head History ─── */

const H2H_KEY = "battleship.h2h";

export interface HeadToHeadRecord {
  personality: string;
  difficulty: string;
  wins: number;
  losses: number;
  avgShots: number;
  avgAccuracy: number;
  gamesPlayed: number;
}

export function loadH2H(): HeadToHeadRecord[] {
  try {
    const raw = localStorage.getItem(H2H_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateH2H(
  personality: string,
  difficulty: string,
  won: boolean,
  shots: number,
  accuracy: number
): void {
  const records = loadH2H();
  let record = records.find(r => r.personality === personality && r.difficulty === difficulty);
  if (!record) {
    record = { personality, difficulty, wins: 0, losses: 0, avgShots: 0, avgAccuracy: 0, gamesPlayed: 0 };
    records.push(record);
  }
  if (won) record.wins += 1;
  else record.losses += 1;
  record.gamesPlayed += 1;
  record.avgShots = Math.round((record.avgShots * (record.gamesPlayed - 1) + shots) / record.gamesPlayed);
  record.avgAccuracy = Math.round((record.avgAccuracy * (record.gamesPlayed - 1) + accuracy) / record.gamesPlayed);
  localStorage.setItem(H2H_KEY, JSON.stringify(records));
}

/* ─── Improvement Tracker ─── */

const IMPROVEMENT_KEY = "battleship.improvement";

export interface ImprovementDataPoint {
  date: string;
  accuracy: number;
  avgShots: number;
  winRate: number;
  gamesPlayed: number;
}

export function loadImprovementData(): ImprovementDataPoint[] {
  try {
    const raw = localStorage.getItem(IMPROVEMENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordImprovementData(accuracy: number, shots: number, won: boolean): void {
  const data = loadImprovementData();
  const today = new Date().toLocaleDateString();
  let todayEntry = data.find(d => d.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, accuracy: 0, avgShots: 0, winRate: 0, gamesPlayed: 0 };
    data.push(todayEntry);
  }
  const n = todayEntry.gamesPlayed;
  todayEntry.accuracy = Math.round((todayEntry.accuracy * n + accuracy) / (n + 1));
  todayEntry.avgShots = Math.round((todayEntry.avgShots * n + shots) / (n + 1));
  todayEntry.winRate = Math.round(((todayEntry.winRate / 100) * n + (won ? 1 : 0)) / (n + 1) * 100);
  todayEntry.gamesPlayed += 1;

  // Keep last 90 days
  if (data.length > 90) data.shift();
  localStorage.setItem(IMPROVEMENT_KEY, JSON.stringify(data));
}

/* ─── Strategy Fingerprint ─── */

export type StrategyStyle =
  | "aggressive_opener"
  | "methodical_scanner"
  | "edge_hugger"
  | "center_focused"
  | "random_chaos"
  | "diagonal_hunter";

export function analyzeStrategyFingerprint(
  shotHistory: Coord[],
  boardSize: number
): { style: StrategyStyle; confidence: number; description: string } {
  if (shotHistory.length < 10) {
    return { style: "random_chaos", confidence: 0, description: "Not enough data yet" };
  }

  // Analyze first 10 shots for opening strategy
  const first10 = shotHistory.slice(0, 10);
  const center = boardSize / 2;

  // Check if shots are concentrated in center
  const centerCount = first10.filter(c => Math.abs(c.row - center) < 2 && Math.abs(c.col - center) < 2).length;
  // Check edge shots
  const edgeCount = first10.filter(c => c.row === 0 || c.row === boardSize - 1 || c.col === 0 || c.col === boardSize - 1).length;
  // Check diagonal pattern
  const diagCount = first10.filter(c => Math.abs(c.row - c.col) <= 1 || Math.abs(c.row - (boardSize - 1 - c.col)) <= 1).length;
  // Check systematic (adjacent shots)
  let adjacentCount = 0;
  for (let i = 1; i < first10.length; i++) {
    const dist = Math.abs(first10[i].row - first10[i - 1].row) + Math.abs(first10[i].col - first10[i - 1].col);
    if (dist <= 2) adjacentCount++;
  }

  if (centerCount >= 5) return { style: "center_focused", confidence: centerCount / 10, description: "You prefer targeting the center first" };
  if (edgeCount >= 4) return { style: "edge_hugger", confidence: edgeCount / 10, description: "You like to clear the edges early" };
  if (diagCount >= 6) return { style: "diagonal_hunter", confidence: diagCount / 10, description: "You hunt in diagonal patterns" };
  if (adjacentCount >= 6) return { style: "methodical_scanner", confidence: adjacentCount / 9, description: "You systematically scan adjacent cells" };
  if (adjacentCount <= 2) return { style: "aggressive_opener", confidence: 0.7, description: "You scatter shots aggressively to find targets fast" };

  return { style: "random_chaos", confidence: 0.5, description: "Your strategy is unpredictable" };
}

/* ─── Benchmark Mode ─── */

const BENCHMARK_KEY = "battleship.benchmark";

export interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  boardSize: number;
  seed: string;
  parScore: number; // global average shots to complete
}

export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  { id: "bench-1", name: "Standard 10x10", description: "Classic setup with 5 ships", boardSize: 10, seed: "BENCH001", parScore: 55 },
  { id: "bench-2", name: "Tight Quarters", description: "6x6 board, 3 ships", boardSize: 6, seed: "BENCH002", parScore: 20 },
  { id: "bench-3", name: "Epic Scale", description: "15x15 board, 7 ships", boardSize: 15, seed: "BENCH003", parScore: 95 },
  { id: "bench-4", name: "Speed Run", description: "10x10, optimized placement", boardSize: 10, seed: "BENCH004", parScore: 45 },
  { id: "bench-5", name: "Needle in Haystack", description: "15x15, 2 tiny ships", boardSize: 15, seed: "BENCH005", parScore: 80 },
];

export interface BenchmarkResult {
  scenarioId: string;
  shots: number;
  accuracy: number;
  time: number;
  date: string;
  percentile: number; // estimated
}

export function loadBenchmarkResults(): BenchmarkResult[] {
  try {
    const raw = localStorage.getItem(BENCHMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBenchmarkResult(result: BenchmarkResult): void {
  const results = loadBenchmarkResults();
  results.push(result);
  localStorage.setItem(BENCHMARK_KEY, JSON.stringify(results));
}

export function estimatePercentile(shots: number, parScore: number): number {
  // Estimate percentile based on par score
  const ratio = parScore / Math.max(1, shots);
  if (ratio >= 2) return 99;
  if (ratio >= 1.5) return 90;
  if (ratio >= 1.2) return 75;
  if (ratio >= 1.0) return 50;
  if (ratio >= 0.8) return 30;
  if (ratio >= 0.6) return 15;
  return 5;
}

/* ─── Expected Value / Best Shot ─── */

export function calculateBestShot(
  board: Board,
  shipSizes: number[]
): { coord: Coord; probability: number } | null {
  const size = board.size;
  const probMap: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  // For each alive ship size, count valid placements through each cell
  for (const shipSize of shipSizes) {
    // Horizontal placements
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - shipSize; c++) {
        let valid = true;
        for (let i = 0; i < shipSize; i++) {
          const key = `${r},${c + i}`;
          if (board.shots[key] === "miss") { valid = false; break; }
          if (board.shots[key] === "hit") { /* could be part of unsunk ship */ }
        }
        if (valid) {
          for (let i = 0; i < shipSize; i++) {
            const key = `${r},${c + i}`;
            if (!board.shots[key]) probMap[r][c + i] += 1;
          }
        }
      }
    }
    // Vertical placements
    for (let r = 0; r <= size - shipSize; r++) {
      for (let c = 0; c < size; c++) {
        let valid = true;
        for (let i = 0; i < shipSize; i++) {
          const key = `${r + i},${c}`;
          if (board.shots[key] === "miss") { valid = false; break; }
        }
        if (valid) {
          for (let i = 0; i < shipSize; i++) {
            const key = `${r + i},${c}`;
            if (!board.shots[key]) probMap[r + i][c] += 1;
          }
        }
      }
    }
  }

  // Find cell with highest probability
  let best: { coord: Coord; probability: number } | null = null;
  let maxProb = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board.shots[`${r},${c}`] && probMap[r][c] > maxProb) {
        maxProb = probMap[r][c];
        best = { coord: { row: r, col: c }, probability: probMap[r][c] };
      }
    }
  }
  return best;
}
