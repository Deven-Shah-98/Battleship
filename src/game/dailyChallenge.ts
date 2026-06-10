import type { DailyChallenge } from "./types";
import { seededRng } from "./seed";

const STORAGE_KEY = "battleship.daily";
const LEADERBOARD_KEY = "battleship.daily.leaderboard";

/** Get today's date string in YYYY-MM-DD format. */
export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Generate a deterministic daily seed from the date. */
export function getDailySeed(date: string = getTodayKey()): string {
  // Simple hash from date string
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  const rng = seededRng(String(Math.abs(hash)));
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = "";
  for (let i = 0; i < 4; i++) {
    seed += chars[Math.floor(rng() * chars.length)];
  }
  return seed;
}

export function loadDailyChallenge(): DailyChallenge | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DailyChallenge;
    if (data.date !== getTodayKey()) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveDailyChallenge(challenge: DailyChallenge): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  } catch { /* ignore */ }
}

export type ChallengeTier = "easy" | "medium" | "hard";

const TIER_CONFIG: Record<ChallengeTier, { boardSize: number; difficulty: string }> = {
  easy: { boardSize: 8, difficulty: "easy" },
  medium: { boardSize: 10, difficulty: "medium" },
  hard: { boardSize: 10, difficulty: "hard" },
};

export function getTodayChallenge(tier: ChallengeTier = "hard"): DailyChallenge {
  const existing = loadDailyChallenge();
  if (existing) return existing;
  const date = getTodayKey();
  const cfg = TIER_CONFIG[tier];
  return {
    date,
    seed: getDailySeed(date),
    boardSize: cfg.boardSize,
    difficulty: cfg.difficulty,
    completed: false,
  };
}

export function completeDailyChallenge(shots: number, accuracy: number): DailyChallenge {
  const challenge = getTodayChallenge();
  challenge.completed = true;
  challenge.bestScore = challenge.bestScore
    ? Math.min(challenge.bestScore, shots)
    : shots;
  saveDailyChallenge(challenge);
  // Save to leaderboard
  saveDailyScore(challenge.date, shots, accuracy);
  return challenge;
}

interface DailyScore {
  date: string;
  shots: number;
  accuracy: number;
}

export function saveDailyScore(date: string, shots: number, accuracy: number): void {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const scores: DailyScore[] = raw ? JSON.parse(raw) : [];
    scores.push({ date, shots, accuracy });
    // Keep last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const filtered = scores.filter((s) => s.date >= cutoff.toISOString().slice(0, 10));
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

export function loadDailyScores(): DailyScore[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDailyStreak(): number {
  const scores = loadDailyScores();
  if (scores.length === 0) return 0;
  const dates = new Set(scores.map((s) => s.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
