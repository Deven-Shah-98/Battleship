import type { Achievement, AchievementProgress, MatchRecord, Board } from "./types";
import { isShipSunk } from "./board";

const STORAGE_KEY = "battleship.achievements";

export const ACHIEVEMENTS: Achievement[] = [
  // Gameplay
  { id: "first_blood", name: "First Blood", description: "Win your first game", icon: "🏆", category: "gameplay", xp: 50 },
  { id: "ten_wins", name: "Seasoned Captain", description: "Win 10 games", icon: "⚓", category: "gameplay", xp: 200 },
  { id: "fifty_wins", name: "Admiral", description: "Win 50 games", icon: "🎖️", category: "gameplay", xp: 500 },
  { id: "hundred_wins", name: "Legend of the Sea", description: "Win 100 games", icon: "👑", category: "gameplay", xp: 1000 },
  { id: "first_sink", name: "Down She Goes", description: "Sink your first ship", icon: "🚢", category: "gameplay", xp: 25 },
  { id: "clean_sweep", name: "Clean Sweep", description: "Win without losing a single ship", icon: "🧹", category: "gameplay", xp: 300 },
  { id: "comeback_kid", name: "Comeback Kid", description: "Win with only 1 ship remaining", icon: "💪", category: "gameplay", xp: 250 },
  { id: "speed_demon", name: "Speed Demon", description: "Win a game in under 30 seconds", icon: "⚡", category: "gameplay", xp: 400 },
  { id: "marathon", name: "Marathon", description: "Play a game lasting over 10 minutes", icon: "🏃", category: "gameplay", xp: 100 },
  { id: "salvo_win", name: "Broadside!", description: "Win a game in Salvo mode", icon: "💥", category: "gameplay", xp: 150 },

  // Skill
  { id: "sharpshooter", name: "Sharpshooter", description: "Achieve 50%+ accuracy in a game", icon: "🎯", category: "skill", xp: 100 },
  { id: "sniper", name: "Sniper", description: "Achieve 70%+ accuracy in a game", icon: "🔫", category: "skill", xp: 250 },
  { id: "perfect_aim", name: "Perfect Aim", description: "Achieve 90%+ accuracy in a game", icon: "💎", category: "skill", xp: 500 },
  { id: "three_in_row", name: "Hot Streak", description: "Hit 3 shots in a row", icon: "🔥", category: "skill", xp: 75 },
  { id: "five_in_row", name: "On Fire!", description: "Hit 5 shots in a row", icon: "🌟", category: "skill", xp: 200 },
  { id: "ten_in_row", name: "Unstoppable", description: "Hit 10 shots in a row", icon: "☄️", category: "skill", xp: 400 },
  { id: "no_miss_win", name: "Flawless Victory", description: "Win without missing (min 17 shots)", icon: "✨", category: "skill", xp: 1000, secret: true },
  { id: "sink_carrier_first", name: "Big Game Hunter", description: "Sink the Carrier before any other ship", icon: "🐋", category: "skill", xp: 150 },
  { id: "win_under_20", name: "Efficiency Expert", description: "Win in 20 shots or fewer", icon: "📊", category: "skill", xp: 300 },
  { id: "win_under_25", name: "Swift Victory", description: "Win in 25 shots or fewer", icon: "🏎️", category: "skill", xp: 150 },

  // Challenge
  { id: "beat_easy", name: "Training Complete", description: "Beat Easy AI", icon: "🎓", category: "challenge", xp: 25 },
  { id: "beat_medium", name: "Worthy Opponent", description: "Beat Medium AI", icon: "⚔️", category: "challenge", xp: 50 },
  { id: "beat_hard", name: "Master Tactician", description: "Beat Hard AI", icon: "🧠", category: "challenge", xp: 100 },
  { id: "beat_admiral", name: "Supreme Commander", description: "Beat Admiral AI", icon: "🏅", category: "challenge", xp: 200 },
  { id: "win_streak_3", name: "Three-peat", description: "Win 3 games in a row", icon: "3️⃣", category: "challenge", xp: 150 },
  { id: "win_streak_5", name: "Domination", description: "Win 5 games in a row", icon: "5️⃣", category: "challenge", xp: 300 },
  { id: "win_streak_10", name: "Invincible", description: "Win 10 games in a row", icon: "🔟", category: "challenge", xp: 500 },
  { id: "daily_complete", name: "Daily Warrior", description: "Complete a Daily Challenge", icon: "📅", category: "challenge", xp: 100 },
  { id: "daily_streak_7", name: "Dedicated", description: "Complete 7 Daily Challenges", icon: "📆", category: "challenge", xp: 300 },
  { id: "campaign_start", name: "Enlisted", description: "Complete your first campaign mission", icon: "🎯", category: "challenge", xp: 75 },

  // Collection
  { id: "all_difficulties", name: "Jack of All Trades", description: "Win on every difficulty level", icon: "🃏", category: "collection", xp: 200 },
  { id: "all_modes", name: "Versatile", description: "Win in Classic and Salvo modes", icon: "🔄", category: "collection", xp: 100 },
  { id: "all_themes", name: "Fashionista", description: "Try every theme", icon: "🎨", category: "collection", xp: 50 },
  { id: "use_all_powerups", name: "Arsenal", description: "Use all 3 power-up types in one game", icon: "🧰", category: "collection", xp: 75 },
  { id: "hundred_games", name: "Veteran", description: "Play 100 games total", icon: "💯", category: "collection", xp: 200 },
  { id: "five_hundred_games", name: "Obsessed", description: "Play 500 games total", icon: "🏴‍☠️", category: "collection", xp: 500 },
  { id: "try_hotseat", name: "Social Butterfly", description: "Play a 2-player hotseat game", icon: "🤝", category: "collection", xp: 50 },
  { id: "try_blitz", name: "Speed Racer", description: "Play a Blitz mode game", icon: "💨", category: "collection", xp: 50 },
  { id: "custom_fleet", name: "Fleet Architect", description: "Play with a custom fleet", icon: "🏗️", category: "collection", xp: 50 },
  { id: "big_board", name: "Grand Admiral", description: "Play on a 15x15 board", icon: "🗺️", category: "collection", xp: 75 },

  // Social
  { id: "share_result", name: "Show Off", description: "Share a game result", icon: "📤", category: "social", xp: 50 },
  { id: "use_seed", name: "Challenge Accepted", description: "Play a seeded game", icon: "🌱", category: "social", xp: 25 },
  { id: "replay_watched", name: "Film Critic", description: "Watch a game replay", icon: "🎬", category: "social", xp: 25 },
  { id: "hint_used", name: "Wise Move", description: "Use the hint system", icon: "💡", category: "social", xp: 25 },
  { id: "tutorial_complete", name: "Cadet", description: "Complete the tutorial", icon: "📖", category: "social", xp: 50 },

  // Secret
  { id: "sink_all_one_turn", name: "Nuclear Option", description: "Sink 2+ ships in a single salvo turn", icon: "☢️", category: "skill", xp: 300, secret: true },
  { id: "lose_streak_5", name: "Resilient", description: "Lose 5 games in a row then win the next", icon: "🐢", category: "challenge", xp: 200, secret: true },
  { id: "mine_hit", name: "Boom!", description: "Hit your own mine (hotseat)", icon: "💣", category: "gameplay", xp: 50, secret: true },
  { id: "level_10", name: "Rising Star", description: "Reach level 10", icon: "⭐", category: "collection", xp: 150 },
  { id: "level_25", name: "Elite", description: "Reach level 25", icon: "🌟", category: "collection", xp: 300 },
];

export function loadAchievements(): Record<string, AchievementProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AchievementProgress>;
  } catch {
    return {};
  }
}

export function saveAchievements(data: Record<string, AchievementProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function unlockAchievement(id: string): { unlocked: boolean; achievement: Achievement | undefined } {
  const achievement = ACHIEVEMENTS.find((a) => a.id === id);
  if (!achievement) return { unlocked: false, achievement: undefined };

  const data = loadAchievements();
  if (data[id]?.unlocked) return { unlocked: false, achievement };

  data[id] = { unlocked: true, unlockedDate: new Date().toISOString() };
  saveAchievements(data);
  return { unlocked: true, achievement };
}

export function isAchievementUnlocked(id: string): boolean {
  const data = loadAchievements();
  return data[id]?.unlocked ?? false;
}

export function getUnlockedCount(): number {
  const data = loadAchievements();
  return Object.values(data).filter((p) => p.unlocked).length;
}

export function getTotalXPFromAchievements(): number {
  const data = loadAchievements();
  return ACHIEVEMENTS.filter((a) => data[a.id]?.unlocked).reduce((sum, a) => sum + a.xp, 0);
}

/** Check and unlock achievements based on the current game state. */
export function checkGameAchievements(
  record: MatchRecord,
  history: MatchRecord[],
  playerBoard: Board,
  extraFlags: {
    usedAllPowerUps?: boolean;
    hitStreak?: number;
    sunkShipsOrder?: string[];
    maxSinksInOneTurn?: number;
    isBlitz?: boolean;
    isCustomFleet?: boolean;
    boardSize?: number;
  } = {},
): string[] {
  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string) => {
    const { unlocked } = unlockAchievement(id);
    if (unlocked) newlyUnlocked.push(id);
  };

  const totalGames = history.length;
  const totalWins = history.filter((r) => r.won).length;

  // Win-based
  if (record.won) {
    tryUnlock("first_blood");
    if (totalWins >= 10) tryUnlock("ten_wins");
    if (totalWins >= 50) tryUnlock("fifty_wins");
    if (totalWins >= 100) tryUnlock("hundred_wins");

    // Clean sweep: all player ships alive
    if (playerBoard.ships.every((s) => !isShipSunk(s))) {
      tryUnlock("clean_sweep");
    }

    // Comeback kid: only 1 ship remaining
    const aliveShips = playerBoard.ships.filter((s) => !isShipSunk(s)).length;
    if (aliveShips === 1) tryUnlock("comeback_kid");

    // Speed demon
    if (record.duration < 30) tryUnlock("speed_demon");

    // Salvo win
    if (record.mode === "salvo") tryUnlock("salvo_win");

    // Shot efficiency
    if (record.shots <= 20) tryUnlock("win_under_20");
    if (record.shots <= 25) tryUnlock("win_under_25");

    // Difficulty-based
    if (record.difficulty === "easy") tryUnlock("beat_easy");
    if (record.difficulty === "medium") tryUnlock("beat_medium");
    if (record.difficulty === "hard") tryUnlock("beat_hard");
    if (record.difficulty === "admiral") tryUnlock("beat_admiral");

    // All difficulties
    const diffs = new Set(history.filter((r) => r.won).map((r) => r.difficulty));
    if (diffs.has("easy") && diffs.has("medium") && diffs.has("hard") && diffs.has("admiral")) {
      tryUnlock("all_difficulties");
    }

    // All modes
    const modes = new Set(history.filter((r) => r.won).map((r) => r.mode));
    if (modes.has("classic") && modes.has("salvo")) {
      tryUnlock("all_modes");
    }

    // Win streaks
    let streak = 0;
    for (const r of history) {
      if (r.won) streak++;
      else break;
    }
    if (streak >= 3) tryUnlock("win_streak_3");
    if (streak >= 5) tryUnlock("win_streak_5");
    if (streak >= 10) tryUnlock("win_streak_10");
  }

  // Sinking achievements (win or lose)
  if (extraFlags.sunkShipsOrder && extraFlags.sunkShipsOrder.length > 0) {
    tryUnlock("first_sink");
  }
  if (extraFlags.maxSinksInOneTurn && extraFlags.maxSinksInOneTurn >= 2 && record.mode === "salvo") {
    tryUnlock("sink_all_one_turn");
  }

  // Lose streak → win (history is newest-first; index 0 = current game)
  if (record.won && totalGames >= 6) {
    let loseCount = 0;
    for (let i = 1; i <= 5 && i < history.length; i++) {
      if (!history[i].won) loseCount++;
      else break;
    }
    if (loseCount >= 5) tryUnlock("lose_streak_5");
  }

  // Accuracy
  if (record.accuracy >= 50) tryUnlock("sharpshooter");
  if (record.accuracy >= 70) tryUnlock("sniper");
  if (record.accuracy >= 90) tryUnlock("perfect_aim");
  if (record.accuracy === 100 && record.shots >= 17) tryUnlock("no_miss_win");

  // Duration
  if (record.duration > 600) tryUnlock("marathon");

  // Game count
  if (totalGames >= 100) tryUnlock("hundred_games");
  if (totalGames >= 500) tryUnlock("five_hundred_games");

  // Hit streak
  if (extraFlags.hitStreak && extraFlags.hitStreak >= 3) tryUnlock("three_in_row");
  if (extraFlags.hitStreak && extraFlags.hitStreak >= 5) tryUnlock("five_in_row");
  if (extraFlags.hitStreak && extraFlags.hitStreak >= 10) tryUnlock("ten_in_row");

  // Carrier first
  if (extraFlags.sunkShipsOrder && extraFlags.sunkShipsOrder[0] === "Carrier") {
    tryUnlock("sink_carrier_first");
  }

  // Power-ups
  if (extraFlags.usedAllPowerUps) tryUnlock("use_all_powerups");

  // Mode-specific
  if (record.playerMode === "hotseat") tryUnlock("try_hotseat");
  if (extraFlags.isBlitz) tryUnlock("try_blitz");
  if (extraFlags.isCustomFleet) tryUnlock("custom_fleet");
  if (extraFlags.boardSize && extraFlags.boardSize >= 15) tryUnlock("big_board");

  return newlyUnlocked;
}
