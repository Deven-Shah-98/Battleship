/**
 * Progression & Meta (batch 2):
 * - Ship Upgrade Tree
 * - Seasonal Events
 * - Procedural Missions
 * - Achievement Rarity
 * - Post-game Interview
 * - Fleet Morale System UI data
 * - AI Coach UI data
 * - Dynamic Difficulty Presets
 */

import type { ShipDef } from "./types";

/* ─── Ship Upgrade Tree ─── */

const UPGRADES_KEY = "battleship.upgrades";

export interface ShipUpgrade {
  id: string;
  shipType: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number; // XP cost
  effect: { type: "radar_range" | "armor" | "speed" | "ability_cooldown" | "extra_shot"; value: number };
  unlocked: boolean;
}

const UPGRADE_TREES: Record<string, ShipUpgrade[]> = {
  Carrier: [
    { id: "carrier-1", shipType: "Carrier", name: "Extended Radar", description: "Radar reveals 4x4 area instead of 3x3", level: 0, maxLevel: 3, cost: 500, effect: { type: "radar_range", value: 1 }, unlocked: false },
    { id: "carrier-2", shipType: "Carrier", name: "Reinforced Hull", description: "Carrier takes 1 extra hit before sinking", level: 0, maxLevel: 2, cost: 750, effect: { type: "armor", value: 1 }, unlocked: false },
    { id: "carrier-3", shipType: "Carrier", name: "Quick Launch", description: "Reduce ability cooldown by 1 turn", level: 0, maxLevel: 2, cost: 1000, effect: { type: "ability_cooldown", value: -1 }, unlocked: false },
  ],
  Battleship: [
    { id: "bship-1", shipType: "Battleship", name: "Heavy Batteries", description: "Airstrike covers larger area", level: 0, maxLevel: 3, cost: 600, effect: { type: "extra_shot", value: 1 }, unlocked: false },
    { id: "bship-2", shipType: "Battleship", name: "Thick Armor", description: "Absorb first 2 hits", level: 0, maxLevel: 2, cost: 800, effect: { type: "armor", value: 2 }, unlocked: false },
  ],
  Cruiser: [
    { id: "cruiser-1", shipType: "Cruiser", name: "Swift Maneuvers", description: "+1 movement range", level: 0, maxLevel: 3, cost: 400, effect: { type: "speed", value: 1 }, unlocked: false },
    { id: "cruiser-2", shipType: "Cruiser", name: "Sonar Boost", description: "Sonar reveals exact count in 4x4", level: 0, maxLevel: 2, cost: 550, effect: { type: "radar_range", value: 1 }, unlocked: false },
  ],
  Submarine: [
    { id: "sub-1", shipType: "Submarine", name: "Silent Running", description: "Dive lasts 2 turns instead of 1", level: 0, maxLevel: 2, cost: 500, effect: { type: "ability_cooldown", value: 1 }, unlocked: false },
    { id: "sub-2", shipType: "Submarine", name: "Torpedo Tubes", description: "Extra torpedo charge", level: 0, maxLevel: 3, cost: 600, effect: { type: "extra_shot", value: 1 }, unlocked: false },
  ],
  Destroyer: [
    { id: "dest-1", shipType: "Destroyer", name: "Evasion Protocol", description: "20% chance to dodge incoming hit", level: 0, maxLevel: 3, cost: 350, effect: { type: "speed", value: 1 }, unlocked: false },
    { id: "dest-2", shipType: "Destroyer", name: "Depth Charges", description: "Reveal submarine positions on near-miss", level: 0, maxLevel: 2, cost: 450, effect: { type: "radar_range", value: 1 }, unlocked: false },
  ],
};

export function loadUpgrades(): Record<string, ShipUpgrade[]> {
  try {
    const raw = localStorage.getItem(UPGRADES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { ...UPGRADE_TREES };
}

export function purchaseUpgrade(shipType: string, upgradeId: string, availableXP: number): { success: boolean; remainingXP: number; upgrades: Record<string, ShipUpgrade[]> } {
  const upgrades = loadUpgrades();
  const tree = upgrades[shipType];
  if (!tree) return { success: false, remainingXP: availableXP, upgrades };

  const upgrade = tree.find(u => u.id === upgradeId);
  if (!upgrade || upgrade.level >= upgrade.maxLevel || availableXP < upgrade.cost) {
    return { success: false, remainingXP: availableXP, upgrades };
  }

  upgrade.level += 1;
  upgrade.unlocked = true;
  const remaining = availableXP - upgrade.cost;
  localStorage.setItem(UPGRADES_KEY, JSON.stringify(upgrades));
  return { success: true, remainingXP: remaining, upgrades };
}

export function getUpgradeEffects(shipType: string): { type: string; value: number }[] {
  const upgrades = loadUpgrades();
  const tree = upgrades[shipType] ?? [];
  return tree
    .filter(u => u.level > 0)
    .map(u => ({ type: u.effect.type, value: u.effect.value * u.level }));
}

/* ─── Seasonal Events ─── */

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startMonth: number;
  endMonth: number;
  theme: string;
  specialShips: ShipDef[];
  bonusXP: number;
  boardSkin: string;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "halloween",
    name: "Ghost Fleet",
    description: "Ghost ships haunt the seas! Extra decoys and spooky effects.",
    startMonth: 10,
    endMonth: 10,
    theme: "halloween",
    specialShips: [{ name: "Ghost Ship", size: 3 }, { name: "Phantom", size: 2 }],
    bonusXP: 50,
    boardSkin: "void",
  },
  {
    id: "winter",
    name: "Arctic Warfare",
    description: "Ice floes block paths. Ships slide on frozen waters!",
    startMonth: 12,
    endMonth: 1,
    theme: "winter",
    specialShips: [{ name: "Icebreaker", size: 4 }, { name: "Snow Cruiser", size: 3 }],
    bonusXP: 40,
    boardSkin: "arctic",
  },
  {
    id: "summer",
    name: "Tropical Storm",
    description: "Storms are more frequent! Navigate dangerous waters.",
    startMonth: 6,
    endMonth: 8,
    theme: "summer",
    specialShips: [{ name: "Yacht", size: 2 }, { name: "Surfboard", size: 1 }],
    bonusXP: 30,
    boardSkin: "tropical",
  },
  {
    id: "space",
    name: "Stellar Conflict",
    description: "Take the battle to space! Lasers instead of shells.",
    startMonth: 3,
    endMonth: 3,
    theme: "space",
    specialShips: [{ name: "Star Cruiser", size: 5 }, { name: "Fighter", size: 2 }],
    bonusXP: 60,
    boardSkin: "deep_space",
  },
];

export function getCurrentSeasonalEvent(): SeasonalEvent | null {
  const month = new Date().getMonth() + 1;
  return SEASONAL_EVENTS.find(e => {
    if (e.startMonth <= e.endMonth) return month >= e.startMonth && month <= e.endMonth;
    return month >= e.startMonth || month <= e.endMonth; // wraps around year (e.g., Dec-Jan)
  }) ?? null;
}

/* ─── Procedural Missions ─── */

export interface ProceduralMission {
  id: string;
  name: string;
  description: string;
  objectives: { type: string; target: number; description: string }[];
  constraints: string[];
  reward: number;
  difficulty: number;
  seed: string;
}

const MISSION_TEMPLATES = [
  { prefix: "Stealth", constraint: "No power-ups allowed", bonus: "accuracy" },
  { prefix: "Blitz", constraint: "Complete in under 30 shots", bonus: "speed" },
  { prefix: "Precision", constraint: "Maintain 40%+ accuracy", bonus: "accuracy" },
  { prefix: "Endurance", constraint: "Survive with 1 ship remaining", bonus: "survival" },
  { prefix: "Domination", constraint: "Sink all ships without losing any", bonus: "flawless" },
];

const MISSION_OBJECTIVES = [
  { type: "sink_all", target: 5, description: "Destroy all enemy ships" },
  { type: "accuracy", target: 40, description: "Maintain 40%+ accuracy" },
  { type: "under_shots", target: 40, description: "Complete in under 40 shots" },
  { type: "sink_first", target: 1, description: "Sink the first ship within 10 shots" },
  { type: "no_loss", target: 0, description: "Don't lose any ships" },
];

export function generateProceduralMission(day: number = Date.now()): ProceduralMission {
  const seed = `mission-${new Date().toISOString().split("T")[0]}-${day}`;
  const seedNum = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const template = MISSION_TEMPLATES[seedNum % MISSION_TEMPLATES.length];
  const obj1 = MISSION_OBJECTIVES[seedNum % MISSION_OBJECTIVES.length];
  const obj2 = MISSION_OBJECTIVES[(seedNum + 3) % MISSION_OBJECTIVES.length];

  const difficulty = 1 + (seedNum % 5);

  return {
    id: `proc-${seed}`,
    name: `${template.prefix} Operation ${String.fromCharCode(65 + (seedNum % 26))}`,
    description: `Complete this mission with the constraint: ${template.constraint}`,
    objectives: [obj1, obj2],
    constraints: [template.constraint],
    reward: 100 * difficulty,
    difficulty,
    seed,
  };
}

/* ─── Achievement Rarity ─── */

const RARITY_KEY = "battleship.achievementRarity";

export interface AchievementRarity {
  achievementId: string;
  totalPlayers: number; // simulated
  playersUnlocked: number;
  percentage: number;
}

export function loadAchievementRarities(): AchievementRarity[] {
  try {
    const raw = localStorage.getItem(RARITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  // Simulate rarity data (since we don't have a backend)
  return [
    { achievementId: "first_win", totalPlayers: 1000, playersUnlocked: 850, percentage: 85 },
    { achievementId: "first_sink", totalPlayers: 1000, playersUnlocked: 900, percentage: 90 },
    { achievementId: "speed_demon", totalPlayers: 1000, playersUnlocked: 200, percentage: 20 },
    { achievementId: "hot_streak", totalPlayers: 1000, playersUnlocked: 350, percentage: 35 },
    { achievementId: "perfect_game", totalPlayers: 1000, playersUnlocked: 15, percentage: 1.5 },
    { achievementId: "all_themes", totalPlayers: 1000, playersUnlocked: 120, percentage: 12 },
    { achievementId: "admiral_slayer", totalPlayers: 1000, playersUnlocked: 80, percentage: 8 },
    { achievementId: "marathon", totalPlayers: 1000, playersUnlocked: 50, percentage: 5 },
    { achievementId: "comeback_king", totalPlayers: 1000, playersUnlocked: 180, percentage: 18 },
  ];
}

export function getRarityLabel(percentage: number): { label: string; color: string } {
  if (percentage <= 1) return { label: "Legendary", color: "#ff6600" };
  if (percentage <= 5) return { label: "Epic", color: "#9c27b0" };
  if (percentage <= 15) return { label: "Rare", color: "#2196f3" };
  if (percentage <= 40) return { label: "Uncommon", color: "#4caf50" };
  return { label: "Common", color: "#9e9e9e" };
}

/* ─── Post-game Interview ─── */

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  type: "strategy" | "decision" | "reflection";
}

export function generateInterviewQuestions(
  shots: { coord: { row: number; col: number }; result: string }[],
  won: boolean,
  accuracy: number
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Ask about key decisions
  if (shots.length > 5) {
    const firstHit = shots.find(s => s.result === "hit");
    if (firstHit) {
      questions.push({
        id: "q1",
        question: `Your first hit was at ${String.fromCharCode(65 + firstHit.coord.col)}${firstHit.coord.row + 1}. What was your strategy for finding the first ship?`,
        context: `First hit came on shot #${shots.indexOf(firstHit) + 1}`,
        type: "strategy",
      });
    }
  }

  if (accuracy < 30) {
    questions.push({
      id: "q2",
      question: "Your accuracy was below 30%. Would you try a different approach next time?",
      context: `Accuracy: ${accuracy}%`,
      type: "reflection",
    });
  }

  if (won) {
    questions.push({
      id: "q3",
      question: "What do you think was the turning point of this battle?",
      context: "Victory achieved",
      type: "decision",
    });
  } else {
    questions.push({
      id: "q4",
      question: "If you could replay this game, what would you do differently?",
      context: "Defeat",
      type: "reflection",
    });
  }

  questions.push({
    id: "q5",
    question: "Rate your ship placement this game (1-5). Do you think it was predictable?",
    context: "Self-assessment",
    type: "strategy",
  });

  return questions;
}

/* ─── Dynamic Difficulty Presets ─── */

export interface DifficultyPreset {
  id: string;
  name: string;
  description: string;
  aiAccuracyMod: number;
  aiDelay: number;
  powerUpsEnabled: boolean;
  weatherEnabled: boolean;
  hints: boolean;
}

export const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  { id: "story", name: "Story Mode", description: "Relaxed gameplay with hints and easy AI", aiAccuracyMod: -0.3, aiDelay: 1500, powerUpsEnabled: true, weatherEnabled: false, hints: true },
  { id: "casual", name: "Casual", description: "Balanced fun without stress", aiAccuracyMod: -0.1, aiDelay: 1000, powerUpsEnabled: true, weatherEnabled: false, hints: false },
  { id: "standard", name: "Standard", description: "Fair challenge for everyone", aiAccuracyMod: 0, aiDelay: 650, powerUpsEnabled: true, weatherEnabled: true, hints: false },
  { id: "veteran", name: "Veteran", description: "Tough AI with dynamic weather", aiAccuracyMod: 0.15, aiDelay: 400, powerUpsEnabled: false, weatherEnabled: true, hints: false },
  { id: "nightmare", name: "Nightmare", description: "Brutal AI that learns your patterns", aiAccuracyMod: 0.3, aiDelay: 200, powerUpsEnabled: false, weatherEnabled: true, hints: false },
];
