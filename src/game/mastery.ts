/** Per-difficulty mastery system — Bronze/Silver/Gold tiers */

export interface MasteryData {
  easy: MasteryTier;
  medium: MasteryTier;
  hard: MasteryTier;
  admiral: MasteryTier;
}

export interface MasteryTier {
  wins: number;
  tier: "none" | "bronze" | "silver" | "gold" | "platinum";
}

const STORAGE_KEY = "battleship.mastery";

const TIER_THRESHOLDS = {
  bronze: 5,
  silver: 15,
  gold: 30,
  platinum: 50,
};

function computeTier(wins: number): MasteryTier["tier"] {
  if (wins >= TIER_THRESHOLDS.platinum) return "platinum";
  if (wins >= TIER_THRESHOLDS.gold) return "gold";
  if (wins >= TIER_THRESHOLDS.silver) return "silver";
  if (wins >= TIER_THRESHOLDS.bronze) return "bronze";
  return "none";
}

export function loadMastery(): MasteryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MasteryData;
  } catch { /* ignore */ }
  return {
    easy: { wins: 0, tier: "none" },
    medium: { wins: 0, tier: "none" },
    hard: { wins: 0, tier: "none" },
    admiral: { wins: 0, tier: "none" },
  };
}

export function saveMastery(data: MasteryData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function recordMasteryWin(difficulty: string): MasteryData {
  const data = loadMastery();
  const key = difficulty as keyof MasteryData;
  if (data[key]) {
    data[key].wins += 1;
    data[key].tier = computeTier(data[key].wins);
  }
  saveMastery(data);
  return data;
}

export function getMasteryDisplay(tier: MasteryTier["tier"]): { label: string; color: string } {
  switch (tier) {
    case "bronze": return { label: "Bronze", color: "#cd7f32" };
    case "silver": return { label: "Silver", color: "#c0c0c0" };
    case "gold": return { label: "Gold", color: "#ffd700" };
    case "platinum": return { label: "Platinum", color: "#e5e4e2" };
    default: return { label: "—", color: "#666" };
  }
}
