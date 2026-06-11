/** Battle Pass — weekly missions for bonus XP */

export interface BattlePassMission {
  id: string;
  description: string;
  target: number;
  type: "wins" | "shots" | "sinks" | "accuracy" | "games";
  xpReward: number;
}

export interface BattlePassProgress {
  weekStart: string;
  missions: Record<string, { progress: number; claimed: boolean }>;
}

const STORAGE_KEY = "battleship.battlePass";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

const WEEKLY_MISSIONS: BattlePassMission[] = [
  { id: "bp_win3", description: "Win 3 games", target: 3, type: "wins", xpReward: 150 },
  { id: "bp_sink10", description: "Sink 10 ships", target: 10, type: "sinks", xpReward: 100 },
  { id: "bp_fire50", description: "Fire 50 shots", target: 50, type: "shots", xpReward: 75 },
  { id: "bp_acc60", description: "Win with 60%+ accuracy", target: 60, type: "accuracy", xpReward: 200 },
  { id: "bp_play5", description: "Play 5 games", target: 5, type: "games", xpReward: 50 },
];

export function getWeeklyMissions(): BattlePassMission[] {
  return WEEKLY_MISSIONS;
}

export function loadBattlePass(): BattlePassProgress {
  const weekStart = getWeekStart();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as BattlePassProgress;
      if (data.weekStart === weekStart) return data;
    }
  } catch { /* ignore */ }
  return { weekStart, missions: {} };
}

function saveBattlePass(data: BattlePassProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function updateBattlePassProgress(
  won: boolean,
  shots: number,
  sinks: number,
  accuracy: number,
): { xpEarned: number; completed: string[] } {
  const bp = loadBattlePass();
  let xpEarned = 0;
  const completed: string[] = [];

  for (const mission of WEEKLY_MISSIONS) {
    if (!bp.missions[mission.id]) {
      bp.missions[mission.id] = { progress: 0, claimed: false };
    }
    const entry = bp.missions[mission.id];
    if (entry.claimed) continue;

    switch (mission.type) {
      case "wins": if (won) entry.progress += 1; break;
      case "shots": entry.progress += shots; break;
      case "sinks": entry.progress += sinks; break;
      case "accuracy": if (won && accuracy >= mission.target) entry.progress = mission.target; break;
      case "games": entry.progress += 1; break;
    }

    if (entry.progress >= mission.target && !entry.claimed) {
      entry.claimed = true;
      xpEarned += mission.xpReward;
      completed.push(mission.description);
    }
  }

  saveBattlePass(bp);
  return { xpEarned, completed };
}
