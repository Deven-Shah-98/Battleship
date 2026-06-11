/**
 * Narrative & World-Building systems:
 * - Captain's Log (auto-generated diary)
 * - War Correspondent (newspaper articles)
 * - Radio Intercepts (enemy position hints)
 * - Ship Naming Ceremony
 * - Memorial Wall (honor roll)
 * - Nemesis System (AI memory)
 */

import type { Coord, Ship } from "./types";

/* ─── Captain's Log ─── */

export interface LogEntry {
  turn: number;
  text: string;
  timestamp: number;
  mood: "neutral" | "excited" | "tense" | "somber" | "triumphant";
}

const OPENING_LINES = [
  "The sea is calm as we begin our hunt.",
  "Dawn breaks over hostile waters.",
  "Command has given the order. The enemy fleet is near.",
  "We raise anchor and prepare for battle.",
  "The fog lifts. Somewhere out there, the enemy waits.",
];

const HIT_LINES = [
  "Direct hit! Our gunners are sharp today.",
  "Explosion confirmed on the enemy vessel!",
  "We've struck true — smoke rises from the target.",
  "Our shells found their mark. The crew cheers.",
  "A satisfying boom echoes across the water.",
];

const MISS_LINES = [
  "Splash. Nothing but open water.",
  "Our shells hit empty sea. We recalibrate.",
  "A miss. The enemy remains elusive.",
  "Water erupts harmlessly. We must adjust our aim.",
  "No contact. The search continues.",
];

const SINK_LINES = [
  "She's going down! The enemy {ship} slips beneath the waves.",
  "The {ship} breaks apart — another victory for our fleet!",
  "Confirmed kill on the enemy {ship}. One less threat.",
  "The {ship} is no more. Our dominance grows.",
  "Down she goes! The enemy {ship} sinks to Davy Jones.",
];

const TAKE_HIT_LINES = [
  "We've been hit! Damage reports incoming.",
  "Enemy shells find us. The crew scrambles to respond.",
  "Our hull shudders under enemy fire.",
  "An explosion rocks the ship. We hold steady.",
  "They've scored a hit on us. Morale wavers briefly.",
];

const WIN_LINES = [
  "Victory is ours! The enemy fleet lies scattered across the ocean floor.",
  "All enemy vessels destroyed. We sail home as heroes.",
  "The battle is won. Our fleet stands triumphant.",
  "Mission accomplished. Not a single enemy ship remains.",
];

const LOSS_LINES = [
  "Our fleet... gone. The sea claims us today.",
  "Defeat. The enemy was too cunning this time.",
  "We fought bravely, but the battle is lost.",
  "Our last ship sinks. We must regroup and return stronger.",
];

function pick<T>(arr: T[], seed?: number): T {
  const idx = seed !== undefined ? Math.abs(seed) % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export function generateLogEntry(
  event: "start" | "hit" | "miss" | "sink" | "take_hit" | "win" | "lose",
  turn: number,
  shipName?: string
): LogEntry {
  let text: string;
  let mood: LogEntry["mood"];
  switch (event) {
    case "start":
      text = pick(OPENING_LINES, turn);
      mood = "neutral";
      break;
    case "hit":
      text = pick(HIT_LINES, turn);
      mood = "excited";
      break;
    case "miss":
      text = pick(MISS_LINES, turn);
      mood = "neutral";
      break;
    case "sink":
      text = pick(SINK_LINES, turn).replace("{ship}", shipName ?? "ship");
      mood = "triumphant";
      break;
    case "take_hit":
      text = pick(TAKE_HIT_LINES, turn);
      mood = "tense";
      break;
    case "win":
      text = pick(WIN_LINES, turn);
      mood = "triumphant";
      break;
    case "lose":
      text = pick(LOSS_LINES, turn);
      mood = "somber";
      break;
  }
  return { turn, text, timestamp: Date.now(), mood };
}

/* ─── War Correspondent ─── */

export interface NewsArticle {
  headline: string;
  body: string;
  date: string;
}

export function generateNewsArticle(
  won: boolean,
  shots: number,
  hits: number,
  shipsSunk: string[],
  duration: number,
  difficulty: string
): NewsArticle {
  const acc = shots > 0 ? Math.round((hits / shots) * 100) : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const headline = won
    ? pick([
        "FLEET VICTORIOUS: Enemy Armada Destroyed!",
        "TRIUMPH AT SEA: Complete Naval Dominance",
        "BREAKING: All Enemy Vessels Sunk in Decisive Battle",
        "HEROES OF THE DEEP: Our Fleet Prevails",
      ])
    : pick([
        "DEFEAT AT SEA: Our Fleet Lost",
        "DARK DAY: Enemy Claims Victory",
        "NAVAL SETBACK: All Ships Lost in Battle",
      ]);

  const body = won
    ? `In a ${timeStr} engagement against ${difficulty}-class opposition, our fleet achieved complete victory. ` +
      `Naval gunners recorded ${hits} hits from ${shots} salvos (${acc}% accuracy), ` +
      `sending ${shipsSunk.length} enemy vessels to the depths: ${shipsSunk.join(", ")}. ` +
      `Command commends all hands for their exemplary service.`
    : `After a hard-fought ${timeStr} battle against ${difficulty}-class forces, our fleet was overwhelmed. ` +
      `Despite landing ${hits} hits from ${shots} shots (${acc}% accuracy), the enemy proved too formidable. ` +
      `A moment of silence for our brave sailors.`;

  return { headline, body, date: new Date().toLocaleDateString() };
}

/* ─── Radio Intercepts ─── */

export interface RadioIntercept {
  message: string;
  hint: { type: "row" | "col" | "quadrant"; value: number | string };
  turn: number;
}

export function generateRadioIntercept(
  enemyShips: Ship[],
  _boardSize: number,
  currentTurn: number,
  _existingShots: Record<string, string>
): RadioIntercept | null {
  // Only generate intercepts every 5-8 turns
  if (currentTurn < 3 || currentTurn % (5 + (currentTurn % 4)) !== 0) return null;

  // Find a ship that hasn't been sunk yet
  const aliveShips = enemyShips.filter(s => !s.hits.every(h => h));
  if (aliveShips.length === 0) return null;

  const ship = aliveShips[Math.floor(Math.random() * aliveShips.length)];
  const cell = ship.cells[0];
  const hintType = Math.random() > 0.5 ? "row" : "col";

  const messages = [
    `*static* ...coordinates suggest activity near ${hintType === "row" ? `row ${cell.row + 1}` : `column ${String.fromCharCode(65 + cell.col)}`}... *static*`,
    `Intercepted transmission: "Move to ${hintType === "row" ? `sector ${cell.row + 1}` : `grid ${String.fromCharCode(65 + cell.col)}`}"`,
    `Enemy radio chatter detected near ${hintType === "row" ? `latitude ${cell.row + 1}` : `longitude ${String.fromCharCode(65 + cell.col)}`}`,
  ];

  return {
    message: pick(messages),
    hint: { type: hintType, value: hintType === "row" ? cell.row : cell.col },
    turn: currentTurn,
  };
}

/* ─── Ship Naming ─── */

const SHIP_NAME_KEY = "battleship.shipNames";

export interface ShipNameEntry {
  shipType: string;
  customName: string;
  gamesPlayed: number;
  totalKills: number;
  dateNamed: string;
}

export function loadShipNames(): ShipNameEntry[] {
  try {
    const raw = localStorage.getItem(SHIP_NAME_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveShipName(entry: ShipNameEntry): void {
  const names = loadShipNames();
  const existing = names.findIndex(n => n.shipType === entry.shipType);
  if (existing >= 0) names[existing] = entry;
  else names.push(entry);
  localStorage.setItem(SHIP_NAME_KEY, JSON.stringify(names));
}

export function getCustomName(shipType: string): string | null {
  const names = loadShipNames();
  return names.find(n => n.shipType === shipType)?.customName ?? null;
}

/* ─── Memorial Wall ─── */

const MEMORIAL_KEY = "battleship.memorial";

export interface MemorialEntry {
  shipName: string;
  customName?: string;
  kills: number;
  gamesServed: number;
  longestSurvival: number; // turns survived in a single game
  dateRetired: string;
  heroicDeath: boolean; // was it the last ship standing?
}

export function loadMemorial(): MemorialEntry[] {
  try {
    const raw = localStorage.getItem(MEMORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToMemorial(entry: MemorialEntry): void {
  const memorial = loadMemorial();
  memorial.push(entry);
  // Keep top 50 entries sorted by kills
  memorial.sort((a, b) => b.kills - a.kills);
  if (memorial.length > 50) memorial.length = 50;
  localStorage.setItem(MEMORIAL_KEY, JSON.stringify(memorial));
}

/* ─── Nemesis System ─── */

const NEMESIS_KEY = "battleship.nemesis";

export interface NemesisData {
  gamesPlayed: number;
  playerWins: number;
  aiWins: number;
  favoritePlayerPlacements: Record<string, number>; // "row,col" -> count
  lastResult: "player_win" | "ai_win" | null;
  grudgeLevel: number; // 0-5, increases on AI losses
  personalityTraits: string[];
  taunts: string[];
}

export function loadNemesis(): NemesisData {
  try {
    const raw = localStorage.getItem(NEMESIS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {
    gamesPlayed: 0,
    playerWins: 0,
    aiWins: 0,
    favoritePlayerPlacements: {},
    lastResult: null,
    grudgeLevel: 0,
    personalityTraits: [],
    taunts: [],
  };
}

export function updateNemesis(won: boolean, playerShipCells: Coord[]): NemesisData {
  const nemesis = loadNemesis();
  nemesis.gamesPlayed += 1;
  if (won) {
    nemesis.playerWins += 1;
    nemesis.grudgeLevel = Math.min(5, nemesis.grudgeLevel + 1);
    nemesis.lastResult = "player_win";
  } else {
    nemesis.aiWins += 1;
    nemesis.grudgeLevel = Math.max(0, nemesis.grudgeLevel - 1);
    nemesis.lastResult = "ai_win";
  }

  // Track player placement patterns
  for (const cell of playerShipCells) {
    const key = `${cell.row},${cell.col}`;
    nemesis.favoritePlayerPlacements[key] = (nemesis.favoritePlayerPlacements[key] ?? 0) + 1;
  }

  // Generate taunts based on grudge level
  const newTaunts: string[] = [];
  if (nemesis.grudgeLevel >= 3) {
    newTaunts.push("I remember your last victory. It won't happen again.");
  }
  if (nemesis.grudgeLevel >= 5) {
    newTaunts.push("You've humiliated me for the last time, Admiral.");
  }
  if (nemesis.aiWins > nemesis.playerWins) {
    newTaunts.push("The odds are in my favor. As always.");
  }
  nemesis.taunts = newTaunts;

  localStorage.setItem(NEMESIS_KEY, JSON.stringify(nemesis));
  return nemesis;
}

export function getNemesisTaunt(): string | null {
  const nemesis = loadNemesis();
  if (nemesis.taunts.length === 0) return null;
  return nemesis.taunts[Math.floor(Math.random() * nemesis.taunts.length)];
}

/* ─── Crew System ─── */

const CREW_KEY = "battleship.crew";

export interface CrewMember {
  id: string;
  name: string;
  role: "navigator" | "gunner" | "engineer" | "lookout" | "medic";
  level: number;
  xp: number;
  bonus: string;
  bonusValue: number;
}

const CREW_ROLES: Record<string, { bonus: string; baseValue: number; perLevel: number }> = {
  navigator: { bonus: "Move range +1", baseValue: 1, perLevel: 0.5 },
  gunner: { bonus: "Accuracy boost", baseValue: 3, perLevel: 2 },
  engineer: { bonus: "Repair efficiency", baseValue: 1, perLevel: 1 },
  lookout: { bonus: "Scout range +1", baseValue: 1, perLevel: 0.5 },
  medic: { bonus: "Shield recharge", baseValue: 5, perLevel: 3 },
};

const CREW_NAMES = [
  "Rodriguez", "Chen", "Okafor", "Petrov", "Hansen",
  "Yamamoto", "Torres", "Singh", "O'Brien", "Mueller",
  "Kim", "Andersen", "Costa", "Nakamura", "Williams",
];

export function loadCrew(): CrewMember[] {
  try {
    const raw = localStorage.getItem(CREW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCrew(crew: CrewMember[]): void {
  localStorage.setItem(CREW_KEY, JSON.stringify(crew));
}

export function hireCrew(role: CrewMember["role"]): CrewMember {
  const crew = loadCrew();
  const roleInfo = CREW_ROLES[role];
  const member: CrewMember = {
    id: `crew-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: CREW_NAMES[Math.floor(Math.random() * CREW_NAMES.length)],
    role,
    level: 1,
    xp: 0,
    bonus: roleInfo.bonus,
    bonusValue: roleInfo.baseValue,
  };
  crew.push(member);
  saveCrew(crew);
  return member;
}

export function addCrewXP(crewId: string, xp: number): CrewMember | null {
  const crew = loadCrew();
  const member = crew.find(c => c.id === crewId);
  if (!member) return null;
  member.xp += xp;
  const xpNeeded = member.level * 100;
  if (member.xp >= xpNeeded) {
    member.level += 1;
    member.xp -= xpNeeded;
    const roleInfo = CREW_ROLES[member.role];
    member.bonusValue = roleInfo.baseValue + roleInfo.perLevel * (member.level - 1);
  }
  saveCrew(crew);
  return member;
}

export function getCrewBonuses(crew: CrewMember[]): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const member of crew) {
    bonuses[member.role] = (bonuses[member.role] ?? 0) + member.bonusValue;
  }
  return bonuses;
}

/* ─── Fleet Lore Cards ─── */

const LORE_KEY = "battleship.lore";

export interface LoreCard {
  shipType: string;
  title: string;
  story: string;
  unlocked: boolean;
  unlockedDate?: string;
}

const LORE_DATA: Record<string, { title: string; story: string }> = {
  Carrier: {
    title: "The Iron Leviathan",
    story: "Launched in 1943, this floating fortress carries 90 aircraft and 3,000 crew. Her flight deck stretches 300 meters — a city on the sea.",
  },
  Battleship: {
    title: "Thunder of the Deep",
    story: "Nine 16-inch guns capable of hurling 2,700-pound shells over 20 miles. When she fires a broadside, the ocean itself trembles.",
  },
  Cruiser: {
    title: "The Swift Predator",
    story: "Fast and heavily armed, she hunts submarines and escorts convoys. Her radar can detect a periscope at 15 nautical miles.",
  },
  Submarine: {
    title: "Shadow Beneath",
    story: "Silent and deadly, she strikes from below. Nuclear-powered, she can remain submerged for months, invisible to surface vessels.",
  },
  Destroyer: {
    title: "The Shield Bearer",
    story: "Small but fierce, she screens the fleet from torpedo attacks. Her depth charges have sent countless submarines to the abyss.",
  },
};

export function loadLoreCards(): LoreCard[] {
  try {
    const raw = localStorage.getItem(LORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return Object.entries(LORE_DATA).map(([shipType, data]) => ({
    shipType,
    title: data.title,
    story: data.story,
    unlocked: false,
  }));
}

export function unlockLoreCard(shipType: string): LoreCard[] {
  const cards = loadLoreCards();
  const card = cards.find(c => c.shipType === shipType);
  if (card && !card.unlocked) {
    card.unlocked = true;
    card.unlockedDate = new Date().toLocaleDateString();
  }
  localStorage.setItem(LORE_KEY, JSON.stringify(cards));
  return cards;
}

/* ─── Factions ─── */

export type Faction = "navy" | "pirates" | "aliens";

export interface FactionInfo {
  id: Faction;
  name: string;
  description: string;
  shipPrefix: string;
  specialAbility: string;
  bonuses: { type: string; value: number }[];
}

export const FACTIONS: Record<Faction, FactionInfo> = {
  navy: {
    id: "navy",
    name: "Royal Navy",
    description: "Disciplined and precise. Bonus accuracy and radar range.",
    shipPrefix: "HMS",
    specialAbility: "Precision Strike: First shot each turn has +10% accuracy",
    bonuses: [
      { type: "accuracy", value: 5 },
      { type: "radar_range", value: 1 },
    ],
  },
  pirates: {
    id: "pirates",
    name: "Corsair Fleet",
    description: "Unpredictable raiders. Bonus power-ups and evasion.",
    shipPrefix: "SS",
    specialAbility: "Plunder: Gain a random power-up when sinking an enemy ship",
    bonuses: [
      { type: "extra_powerups", value: 1 },
      { type: "evasion", value: 10 },
    ],
  },
  aliens: {
    id: "aliens",
    name: "Xeno Armada",
    description: "Advanced technology. Bonus shields and energy weapons.",
    shipPrefix: "XA",
    specialAbility: "Phase Shift: Ships can dodge one hit per game",
    bonuses: [
      { type: "shield_strength", value: 2 },
      { type: "energy_damage", value: 1 },
    ],
  },
};

const FACTION_KEY = "battleship.faction";

export function loadFaction(): Faction {
  try {
    return (localStorage.getItem(FACTION_KEY) as Faction) ?? "navy";
  } catch {
    return "navy";
  }
}

export function saveFaction(faction: Faction): void {
  localStorage.setItem(FACTION_KEY, faction);
}
