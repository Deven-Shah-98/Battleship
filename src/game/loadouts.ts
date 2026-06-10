/** Loadout presets — save/load fleet + settings combos */
import type { ShipDef, GameMode, ThemeName, AIPersonality } from "./types";

const STORAGE_KEY = "battleship.loadouts";

export interface Loadout {
  id: string;
  name: string;
  boardSize: number;
  fleet: ShipDef[];
  difficulty: string;
  gameMode: GameMode;
  aiPersonality: AIPersonality;
  enablePowerUps: boolean;
  enableWeather: boolean;
  timedTurns: number;
  aiSpeed: string;
  theme?: ThemeName;
}

export function loadLoadouts(): Loadout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Loadout[];
  } catch { /* ignore */ }
  return getDefaultLoadouts();
}

export function saveLoadouts(loadouts: Loadout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
  } catch { /* ignore */ }
}

export function addLoadout(loadout: Omit<Loadout, "id">): Loadout {
  const all = loadLoadouts();
  const newLoadout: Loadout = { ...loadout, id: `lo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  all.push(newLoadout);
  saveLoadouts(all);
  return newLoadout;
}

export function deleteLoadout(id: string): void {
  const all = loadLoadouts().filter((l) => l.id !== id);
  saveLoadouts(all);
}

export function getDefaultLoadouts(): Loadout[] {
  return [
    {
      id: "preset-blitz",
      name: "⚡ Blitz Rush",
      boardSize: 6,
      fleet: [
        { name: "Cruiser", size: 3 },
        { name: "Submarine", size: 3 },
        { name: "Destroyer", size: 2 },
      ],
      difficulty: "medium",
      gameMode: "classic",
      aiPersonality: "aggressive",
      enablePowerUps: false,
      enableWeather: false,
      timedTurns: 10,
      aiSpeed: "fast",
    },
    {
      id: "preset-classic",
      name: "🚢 Classic Battle",
      boardSize: 10,
      fleet: [
        { name: "Carrier", size: 5 },
        { name: "Battleship", size: 4 },
        { name: "Cruiser", size: 3 },
        { name: "Submarine", size: 3 },
        { name: "Destroyer", size: 2 },
      ],
      difficulty: "medium",
      gameMode: "classic",
      aiPersonality: "balanced",
      enablePowerUps: false,
      enableWeather: false,
      timedTurns: 0,
      aiSpeed: "normal",
    },
    {
      id: "preset-chaos",
      name: "🌊 Chaos Mode",
      boardSize: 12,
      fleet: [
        { name: "Carrier", size: 5 },
        { name: "Battleship", size: 4 },
        { name: "Cruiser", size: 3 },
        { name: "Submarine", size: 3 },
        { name: "Destroyer", size: 2 },
        { name: "Patrol Boat", size: 2 },
      ],
      difficulty: "hard",
      gameMode: "salvo",
      aiPersonality: "chaotic",
      enablePowerUps: true,
      enableWeather: true,
      timedTurns: 15,
      aiSpeed: "normal",
    },
    {
      id: "preset-admiral",
      name: "🏅 Admiral's Trial",
      boardSize: 15,
      fleet: [
        { name: "Carrier", size: 5 },
        { name: "Battleship", size: 4 },
        { name: "Cruiser", size: 3 },
        { name: "Submarine", size: 3 },
        { name: "Destroyer", size: 2 },
        { name: "Patrol Boat", size: 2 },
        { name: "Frigate", size: 3 },
      ],
      difficulty: "admiral",
      gameMode: "classic",
      aiPersonality: "methodical",
      enablePowerUps: true,
      enableWeather: true,
      timedTurns: 30,
      aiSpeed: "dramatic",
    },
  ];
}
