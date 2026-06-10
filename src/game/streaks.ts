/** Lucky Streak Bonuses — cosmetic effects for win streaks */

export interface StreakStatus {
  currentStreak: number;
  effect: StreakEffect | null;
}

export type StreakEffect = "golden_shots" | "flame_trail" | "rainbow_trail" | "electric_shots";

const STORAGE_KEY = "battleship.winStreak";

export function loadStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseInt(raw, 10) || 0;
  } catch { /* ignore */ }
  return 0;
}

export function updateStreak(won: boolean): StreakStatus {
  let streak = loadStreak();
  if (won) {
    streak += 1;
  } else {
    streak = 0;
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(streak));
  } catch { /* ignore */ }

  return {
    currentStreak: streak,
    effect: getStreakEffect(streak),
  };
}

export function getStreakEffect(streak: number): StreakEffect | null {
  if (streak >= 10) return "electric_shots";
  if (streak >= 7) return "rainbow_trail";
  if (streak >= 5) return "flame_trail";
  if (streak >= 3) return "golden_shots";
  return null;
}

export function getStreakLabel(effect: StreakEffect): string {
  switch (effect) {
    case "golden_shots": return "Golden Shots (3+ wins)";
    case "flame_trail": return "Flame Trail (5+ wins)";
    case "rainbow_trail": return "Rainbow Trail (7+ wins)";
    case "electric_shots": return "Electric Shots (10+ wins)";
  }
}
