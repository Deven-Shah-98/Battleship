import type { Coord, GameReplay, ReplayMove, ShotResult } from "./types";

const STORAGE_KEY = "battleship.replays";
const MAX_REPLAYS = 20;

export function createReplayRecorder(
  seed: string | null,
  difficulty: string,
  mode: "classic" | "salvo",
  boardSize: number,
  playerShips: { name: string; cells: Coord[] }[],
  enemyShips: { name: string; cells: Coord[] }[],
): { recorder: ReplayRecorder; id: string } {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    recorder: {
      id,
      date: new Date().toISOString(),
      seed,
      difficulty,
      mode,
      boardSize,
      playerShips,
      enemyShips,
      moves: [],
      startTime: Date.now(),
      turnCounter: 0,
    },
  };
}

export interface ReplayRecorder {
  id: string;
  date: string;
  seed: string | null;
  difficulty: string;
  mode: "classic" | "salvo";
  boardSize: number;
  playerShips: { name: string; cells: Coord[] }[];
  enemyShips: { name: string; cells: Coord[] }[];
  moves: ReplayMove[];
  startTime: number;
  turnCounter: number;
}

export function recordMove(
  recorder: ReplayRecorder,
  player: "player" | "ai" | "p1" | "p2",
  coord: Coord,
  result: ShotResult,
  sunkShip?: string,
): ReplayRecorder {
  return {
    ...recorder,
    turnCounter: recorder.turnCounter + 1,
    moves: [
      ...recorder.moves,
      {
        turn: recorder.turnCounter + 1,
        player,
        coord,
        result,
        sunkShip,
        timestamp: Date.now() - recorder.startTime,
      },
    ],
  };
}

export function finalizeReplay(
  recorder: ReplayRecorder,
  winner: "player" | "ai" | "p1" | "p2",
): GameReplay {
  return {
    id: recorder.id,
    date: recorder.date,
    seed: recorder.seed,
    difficulty: recorder.difficulty,
    mode: recorder.mode,
    boardSize: recorder.boardSize,
    playerShips: recorder.playerShips,
    enemyShips: recorder.enemyShips,
    moves: recorder.moves,
    winner,
    duration: (Date.now() - recorder.startTime) / 1000,
  };
}

export function loadReplays(): GameReplay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameReplay[];
  } catch {
    return [];
  }
}

export function saveReplay(replay: GameReplay): void {
  try {
    const existing = loadReplays();
    const updated = [replay, ...existing].slice(0, MAX_REPLAYS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function deleteReplay(id: string): void {
  try {
    const existing = loadReplays();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function exportReplay(replay: GameReplay): string {
  return btoa(JSON.stringify(replay));
}

export function importReplay(encoded: string): GameReplay | null {
  try {
    return JSON.parse(atob(encoded)) as GameReplay;
  } catch {
    return null;
  }
}
