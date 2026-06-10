/** Prestige system — reset XP/level for cosmetic bonuses */
import { calculateLevel } from "../game/xp";
import type { PlayerXP } from "../game/types";

const STORAGE_KEY = "battleship.prestige";

export interface PrestigeData {
  stars: number;
  totalLifetimeXP: number;
  bonusXPPercent: number;
}

export function loadPrestige(): PrestigeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrestigeData;
  } catch { /* ignore */ }
  return { stars: 0, totalLifetimeXP: 0, bonusXPPercent: 0 };
}

export function savePrestige(data: PrestigeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function canPrestige(xp: PlayerXP): boolean {
  return xp.level >= 25;
}

export function performPrestige(currentXP: PlayerXP): { prestige: PrestigeData; newXP: PlayerXP } {
  const prestige = loadPrestige();
  prestige.stars += 1;
  prestige.totalLifetimeXP += currentXP.totalXP;
  prestige.bonusXPPercent = Math.min(prestige.stars * 10, 100);
  savePrestige(prestige);
  localStorage.setItem("battleship.xp", JSON.stringify(0));
  return { prestige, newXP: calculateLevel(0) };
}
