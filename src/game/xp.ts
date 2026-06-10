import type { PlayerXP, MatchRecord } from "./types";
import { getTotalXPFromAchievements } from "./achievements";

const STORAGE_KEY = "battleship.xp";

/** XP required for each level. Exponential curve. */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function calculateLevel(totalXP: number): PlayerXP {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return {
    totalXP,
    level,
    currentLevelXP: remaining,
    nextLevelXP: xpForLevel(level),
  };
}

export function loadXP(): PlayerXP {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const totalXP = JSON.parse(raw) as number;
      return calculateLevel(totalXP);
    }
  } catch { /* ignore */ }
  return calculateLevel(0);
}

export function saveXP(totalXP: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(totalXP));
  } catch { /* ignore */ }
}

/** Calculate XP earned for a game. */
export function calculateGameXP(record: MatchRecord): number {
  let xp = 10; // base XP for playing

  if (record.won) {
    xp += 25; // win bonus
    // Difficulty bonus
    const diffBonus: Record<string, number> = { easy: 5, medium: 15, hard: 30, admiral: 50 };
    xp += diffBonus[record.difficulty] ?? 10;
    // Accuracy bonus
    xp += Math.floor(record.accuracy * 0.5);
    // Speed bonus (under 2 min)
    if (record.duration < 120) xp += 20;
    if (record.duration < 60) xp += 20;
  }

  return xp;
}

/** Add XP from a completed game + achievements and return new state. */
export function addGameXP(record: MatchRecord, achievementXP: number): PlayerXP {
  const current = loadXP();
  const gameXP = calculateGameXP(record);
  const totalXP = current.totalXP + gameXP + achievementXP;
  saveXP(totalXP);
  return calculateLevel(totalXP);
}

/** Recalculate total XP from achievements (for consistency). */
export function syncXP(): PlayerXP {
  const achievementXP = getTotalXPFromAchievements();
  const current = loadXP();
  // Only add achievement XP if not already counted
  const total = Math.max(current.totalXP, achievementXP);
  saveXP(total);
  return calculateLevel(total);
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Recruit",
  5: "Ensign",
  10: "Lieutenant",
  15: "Commander",
  20: "Captain",
  25: "Rear Admiral",
  30: "Vice Admiral",
  35: "Admiral",
  40: "Fleet Admiral",
  50: "Grand Admiral",
};

export function getTitle(level: number): string {
  let title = "Recruit";
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= Number(lvl)) title = t;
  }
  return title;
}
