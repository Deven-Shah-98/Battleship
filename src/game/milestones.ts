/** Statistics milestones — lifetime progress tracking */

const STORAGE_KEY = "battleship.milestones";

export interface MilestoneTracker {
  totalShots: number;
  totalHits: number;
  totalSinks: number;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalPlayTime: number; // seconds
  longestWinStreak: number;
  currentWinStreak: number;
  bestAccuracy: number;
  fastestWin: number; // seconds
  totalXPEarned: number;
  shipmostSunk: Record<string, number>;
  gamesPerDifficulty: Record<string, number>;
  winsPerDifficulty: Record<string, number>;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (t: MilestoneTracker) => boolean;
}

export const MILESTONES: Milestone[] = [
  { id: "shots_100", name: "Centurion", description: "Fire 100 shots", icon: "💯", check: (t) => t.totalShots >= 100 },
  { id: "shots_500", name: "Cannoneer", description: "Fire 500 shots", icon: "🔫", check: (t) => t.totalShots >= 500 },
  { id: "shots_1000", name: "Artillery Master", description: "Fire 1,000 shots", icon: "💥", check: (t) => t.totalShots >= 1000 },
  { id: "shots_5000", name: "Bombardier", description: "Fire 5,000 shots", icon: "🎆", check: (t) => t.totalShots >= 5000 },
  { id: "hits_100", name: "Marksman", description: "Land 100 hits", icon: "🎯", check: (t) => t.totalHits >= 100 },
  { id: "hits_500", name: "Sharpshooter", description: "Land 500 hits", icon: "🏹", check: (t) => t.totalHits >= 500 },
  { id: "sinks_50", name: "Fleet Destroyer", description: "Sink 50 ships", icon: "⚓", check: (t) => t.totalSinks >= 50 },
  { id: "sinks_200", name: "Sea Scourge", description: "Sink 200 ships", icon: "🏴‍☠️", check: (t) => t.totalSinks >= 200 },
  { id: "games_50", name: "Regular", description: "Play 50 games", icon: "🎮", check: (t) => t.totalGames >= 50 },
  { id: "games_200", name: "Dedicated", description: "Play 200 games", icon: "🕹️", check: (t) => t.totalGames >= 200 },
  { id: "wins_25", name: "Winner", description: "Win 25 games", icon: "🏆", check: (t) => t.totalWins >= 25 },
  { id: "wins_100", name: "Champion", description: "Win 100 games", icon: "👑", check: (t) => t.totalWins >= 100 },
  { id: "streak_5", name: "Hot Streak", description: "Win 5 in a row", icon: "🔥", check: (t) => t.longestWinStreak >= 5 },
  { id: "streak_10", name: "Unstoppable", description: "Win 10 in a row", icon: "☄️", check: (t) => t.longestWinStreak >= 10 },
  { id: "playtime_1h", name: "Invested", description: "Play for 1 hour total", icon: "⏱️", check: (t) => t.totalPlayTime >= 3600 },
  { id: "playtime_10h", name: "Obsessed", description: "Play for 10 hours total", icon: "⏰", check: (t) => t.totalPlayTime >= 36000 },
  { id: "acc_80", name: "Eagle Eye", description: "Achieve 80%+ accuracy in a game", icon: "🦅", check: (t) => t.bestAccuracy >= 80 },
  { id: "fast_60", name: "Speedster", description: "Win a game in under 60 seconds", icon: "⚡", check: (t) => t.fastestWin <= 60 && t.fastestWin > 0 },
];

export function loadMilestones(): MilestoneTracker {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MilestoneTracker;
  } catch { /* ignore */ }
  return createEmptyTracker();
}

export function saveMilestones(data: MilestoneTracker): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function createEmptyTracker(): MilestoneTracker {
  return {
    totalShots: 0,
    totalHits: 0,
    totalSinks: 0,
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalPlayTime: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    bestAccuracy: 0,
    fastestWin: 0,
    totalXPEarned: 0,
    shipmostSunk: {},
    gamesPerDifficulty: {},
    winsPerDifficulty: {},
  };
}

export function updateMilestones(
  _existingTracker: MilestoneTracker,
  params: {
    shots: number;
    hits: number;
    sinks: number;
    won: boolean;
    duration: number;
    accuracy: number;
    difficulty: string;
    sunkShipNames?: string[];
  },
): string[] {
  const { shots, hits, sinks, won, duration, accuracy, difficulty, sunkShipNames = [] } = params;
  const data = loadMilestones();
  data.totalShots += shots;
  data.totalHits += hits;
  data.totalSinks += sinks;
  data.totalGames += 1;
  data.totalPlayTime += duration;

  if (won) {
    data.totalWins += 1;
    data.currentWinStreak += 1;
    if (data.currentWinStreak > data.longestWinStreak) {
      data.longestWinStreak = data.currentWinStreak;
    }
    if (duration > 0 && (data.fastestWin === 0 || duration < data.fastestWin)) {
      data.fastestWin = duration;
    }
  } else {
    data.totalLosses += 1;
    data.currentWinStreak = 0;
  }

  if (accuracy > data.bestAccuracy) data.bestAccuracy = accuracy;

  data.gamesPerDifficulty[difficulty] = (data.gamesPerDifficulty[difficulty] ?? 0) + 1;
  if (won) {
    data.winsPerDifficulty[difficulty] = (data.winsPerDifficulty[difficulty] ?? 0) + 1;
  }

  for (const name of sunkShipNames) {
    data.shipmostSunk[name] = (data.shipmostSunk[name] ?? 0) + 1;
  }

  // Check newly completed milestones
  const prevData = loadMilestones();
  saveMilestones(data);

  const newlyCompleted: string[] = [];
  for (const m of MILESTONES) {
    if (m.check(data) && !m.check(prevData)) {
      newlyCompleted.push(m.id);
    }
  }
  return newlyCompleted;
}
