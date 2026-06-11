import type { CampaignMission, ShipDef } from "./types";

const STANDARD_FLEET: ShipDef[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

const SMALL_FLEET: ShipDef[] = [
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

const LARGE_FLEET: ShipDef[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
  { name: "Destroyer", size: 2 },
];

export const CAMPAIGN_MISSIONS: CampaignMission[] = [
  {
    id: "m01",
    name: "First Contact",
    description: "A routine patrol turns deadly. Engage the enemy fleet.",
    briefing: "Welcome, Commander. This is your first engagement. The enemy has a small fleet. Destroy them all.",
    difficulty: 1,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
    ],
    boardSize: 8,
    fleet: SMALL_FLEET,
    enemyFleet: SMALL_FLEET,
    reward: { xp: 100 },
  },
  {
    id: "m02",
    name: "Sharp Shooter",
    description: "Prove your accuracy against a small enemy fleet.",
    briefing: "Intelligence reports a small enemy squadron. HQ demands efficiency — maintain at least 40% accuracy.",
    difficulty: 1,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
      { type: "accuracy", target: 40, description: "Achieve 40%+ accuracy" },
    ],
    boardSize: 8,
    fleet: SMALL_FLEET,
    enemyFleet: SMALL_FLEET,
    reward: { xp: 150 },
  },
  {
    id: "m03",
    name: "Standard Engagement",
    description: "Full fleet battle on a standard board.",
    briefing: "Both sides have deployed full fleets. This is a standard engagement. Good luck, Commander.",
    difficulty: 2,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
    ],
    boardSize: 10,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 200 },
  },
  {
    id: "m04",
    name: "Blitz Assault",
    description: "Quick strike — destroy the enemy in under 30 shots.",
    briefing: "Time is critical. We need a swift victory. Sink all enemy ships in 30 shots or fewer.",
    difficulty: 2,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
      { type: "shots", target: 30, description: "Win in 30 shots or fewer" },
    ],
    boardSize: 10,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 250, achievement: "win_under_25" },
  },
  {
    id: "m05",
    name: "Storm Warning",
    description: "Navigate treacherous weather to find and destroy the enemy.",
    briefing: "A massive storm is moving in. Visibility is poor and shots may scatter. Adapt your strategy accordingly.",
    difficulty: 3,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
    ],
    boardSize: 10,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 300 },
    weather: "storm",
  },
  {
    id: "m06",
    name: "Foggy Waters",
    description: "Thick fog blankets the sea. Trust your instruments.",
    briefing: "Dense fog has rolled in. Your shots may drift and misses are harder to confirm. Use sonar wisely.",
    difficulty: 3,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
      { type: "accuracy", target: 35, description: "Maintain 35%+ accuracy despite fog" },
    ],
    boardSize: 10,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 300 },
    weather: "fog",
  },
  {
    id: "m07",
    name: "Admiral's Challenge",
    description: "Face the Admiral AI on a large board.",
    briefing: "The Admiral is our most cunning opponent. A large theater of operations means more places to hide — and to be found.",
    difficulty: 4,
    objectives: [
      { type: "win", target: 1, description: "Defeat the Admiral AI" },
    ],
    boardSize: 12,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 400, achievement: "beat_admiral" },
  },
  {
    id: "m08",
    name: "David vs Goliath",
    description: "Your small fleet vs a large enemy armada.",
    briefing: "We're outnumbered. The enemy has deployed a reinforced fleet. Use every advantage you have.",
    difficulty: 4,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy armada" },
    ],
    boardSize: 12,
    fleet: SMALL_FLEET,
    enemyFleet: LARGE_FLEET,
    reward: { xp: 500 },
  },
  {
    id: "m09",
    name: "Grand Battle",
    description: "Epic battle with large fleets on the biggest board.",
    briefing: "This is the ultimate engagement. Both sides have brought everything they have to a massive theater.",
    difficulty: 5,
    objectives: [
      { type: "win", target: 1, description: "Defeat the enemy fleet" },
      { type: "time", target: 300, description: "Win within 5 minutes" },
    ],
    boardSize: 15,
    fleet: LARGE_FLEET,
    enemyFleet: LARGE_FLEET,
    reward: { xp: 600 },
  },
  {
    id: "m10",
    name: "Perfect Storm",
    description: "The ultimate challenge: Admiral AI, storm weather, accuracy required.",
    briefing: "Every skill will be tested. The Admiral awaits in a raging storm. Only perfection will prevail.",
    difficulty: 5,
    objectives: [
      { type: "win", target: 1, description: "Defeat the Admiral AI" },
      { type: "accuracy", target: 45, description: "Achieve 45%+ accuracy" },
    ],
    boardSize: 12,
    fleet: STANDARD_FLEET,
    enemyFleet: STANDARD_FLEET,
    reward: { xp: 750, achievement: "beat_admiral" },
    weather: "storm",
  },
];

const CAMPAIGN_KEY = "battleship.campaign";

export interface CampaignProgress {
  completedMissions: Record<string, { stars: number; bestAccuracy: number; bestShots: number }>;
}

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (raw) return JSON.parse(raw) as CampaignProgress;
  } catch { /* ignore */ }
  return { completedMissions: {} };
}

export function saveCampaignProgress(progress: CampaignProgress): void {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(progress));
  } catch { /* ignore */ }
}

export function completeMission(
  missionId: string,
  accuracy: number,
  shots: number,
): CampaignProgress {
  const progress = loadCampaignProgress();
  const existing = progress.completedMissions[missionId];
  const stars = accuracy >= 70 ? 3 : accuracy >= 50 ? 2 : 1;
  progress.completedMissions[missionId] = {
    stars: Math.max(stars, existing?.stars ?? 0),
    bestAccuracy: Math.max(accuracy, existing?.bestAccuracy ?? 0),
    bestShots: existing ? Math.min(shots, existing.bestShots) : shots,
  };
  saveCampaignProgress(progress);
  return progress;
}

export function isMissionUnlocked(missionId: string): boolean {
  const idx = CAMPAIGN_MISSIONS.findIndex((m) => m.id === missionId);
  if (idx <= 0) return true;
  const prevId = CAMPAIGN_MISSIONS[idx - 1].id;
  const progress = loadCampaignProgress();
  return prevId in progress.completedMissions;
}
