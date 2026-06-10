/** Commander Perks — passive bonuses unlocked at level milestones */

export interface CommanderPerk {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
  effect: PerkEffect;
}

export type PerkEffect =
  | { type: "extra_radar"; charges: number }
  | { type: "accuracy_boost"; percent: number }
  | { type: "xp_boost"; percent: number }
  | { type: "auto_scout"; interval: number }
  | { type: "repair_charge"; charges: number }
  | { type: "last_stand" };

export const COMMANDER_PERKS: CommanderPerk[] = [
  {
    id: "extra_radar",
    name: "Eagle Eye",
    description: "+1 Radar charge per game",
    levelRequired: 5,
    effect: { type: "extra_radar", charges: 1 },
  },
  {
    id: "accuracy_boost",
    name: "Sharpshooter",
    description: "+5% XP bonus from accuracy",
    levelRequired: 10,
    effect: { type: "accuracy_boost", percent: 5 },
  },
  {
    id: "xp_boost",
    name: "Veteran",
    description: "+10% XP from all games",
    levelRequired: 15,
    effect: { type: "xp_boost", percent: 10 },
  },
  {
    id: "auto_scout",
    name: "Reconnaissance",
    description: "Auto-reveal a row/column every 5 turns",
    levelRequired: 20,
    effect: { type: "auto_scout", interval: 5 },
  },
  {
    id: "repair_charge",
    name: "Damage Control",
    description: "Start each game with 1 repair charge",
    levelRequired: 25,
    effect: { type: "repair_charge", charges: 1 },
  },
  {
    id: "last_stand",
    name: "Last Stand",
    description: "When down to 1 ship, gain +1 free radar scan",
    levelRequired: 30,
    effect: { type: "last_stand" },
  },
];

const STORAGE_KEY = "battleship.selectedPerks";

export function getAvailablePerks(level: number): CommanderPerk[] {
  return COMMANDER_PERKS.filter((p) => level >= p.levelRequired);
}

export function loadSelectedPerks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

export function saveSelectedPerks(perkIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perkIds));
  } catch { /* ignore */ }
}

export function getActivePerks(level: number): CommanderPerk[] {
  const selected = loadSelectedPerks();
  const available = getAvailablePerks(level);
  return available.filter((p) => selected.includes(p.id));
}
