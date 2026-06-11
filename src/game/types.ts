export type Orientation = "horizontal" | "vertical";

export interface Coord {
  row: number;
  col: number;
}

/** A ship placed on a board. */
export interface Ship {
  id: string;
  name: string;
  size: number;
  /** Cells occupied by the ship, ordered from the start cell. */
  cells: Coord[];
  /** Parallel to `cells`: whether each cell has been hit. */
  hits: boolean[];
  /** Optional cosmetic skin. */
  skin?: ShipSkin;
  /** Ship special ability (if enabled). */
  ability?: ShipAbility;
  /** Whether this ship has used its ability this game. */
  abilityUsed?: boolean;
}

/** Definition of a ship type before placement. */
export interface ShipDef {
  name: string;
  size: number;
}

export type ShotResult = "hit" | "miss" | "already";

export interface AttackOutcome {
  board: Board;
  result: ShotResult;
  /** Set when the attack sank a ship. */
  sunkShip: Ship | null;
  /** True if a mine was triggered. */
  mineTriggered?: boolean;
}

export interface Board {
  size: number;
  ships: Ship[];
  /** Map of "row,col" -> shot result for every cell that has been fired at. */
  shots: Record<string, "hit" | "miss">;
  /** Mine locations as "row,col" keys. */
  mines?: Record<string, boolean>;
}

/* ─── Game mode & player mode ─── */

/** Classic = 1 shot/turn. Salvo = 1 shot per surviving ship per turn. */
export type GameMode = "classic" | "salvo";

/** vs-ai = human vs computer. hotseat = local 2-player pass-and-play. */
export type PlayerMode = "vs-ai" | "hotseat";

/* ─── Power-ups ─── */

export type PowerUpKind = "radar" | "sonar" | "airstrike";

export interface PowerUpState {
  radar: number;
  sonar: number;
  airstrike: number;
}

/** Result of a radar scan: which cells in the 3x3 grid contain a ship. */
export interface RadarResult {
  center: Coord;
  cells: { coord: Coord; hasShip: boolean }[];
}

/** Result of a sonar ping: count of ship segments in the 3x3 area. */
export interface SonarResult {
  center: Coord;
  count: number;
}

/* ─── Themes ─── */

export type ThemeName = "midnight" | "arctic" | "ember" | "ocean" | "neon";

/* ─── Match history ─── */

export interface MatchRecord {
  id: string;
  date: string;
  won: boolean;
  difficulty: string;
  mode: GameMode;
  playerMode: PlayerMode;
  shots: number;
  hits: number;
  accuracy: number;
  /** Seconds from game start to end. */
  duration: number;
  seed: string | null;
  /** Board size used. */
  boardSize?: number;
  /** XP earned this game. */
  xpEarned?: number;
  /** Achievements unlocked this game. */
  achievementsUnlocked?: string[];
}

/* ─── Seeded RNG ─── */

/** A function that returns the next pseudo-random number in [0, 1). */
export type RNG = () => number;

/* ─── AI Personality ─── */

export type AIPersonality = "balanced" | "aggressive" | "cautious" | "chaotic" | "methodical";

/* ─── Ship Abilities ─── */

export type ShipAbility = "recon" | "dive" | "depthCharge" | "emp" | "repair";

/* ─── Ship Skins ─── */

export type ShipSkin = "default" | "pirate" | "stealth" | "neon" | "gold" | "arctic";

/* ─── Weather ─── */

export type WeatherType = "clear" | "fog" | "storm" | "calm" | "wind";

export interface WeatherEffect {
  type: WeatherType;
  label: string;
  description: string;
  /** Duration in turns. */
  duration: number;
}

/* ─── Achievements ─── */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "gameplay" | "skill" | "collection" | "social" | "challenge";
  /** XP reward for unlocking. */
  xp: number;
  /** Whether this is hidden until unlocked. */
  secret?: boolean;
}

export interface AchievementProgress {
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  target?: number;
}

/* ─── XP & Leveling ─── */

export interface PlayerXP {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
}

/* ─── Campaign ─── */

export interface CampaignMission {
  id: string;
  name: string;
  description: string;
  briefing: string;
  difficulty: number;
  objectives: MissionObjective[];
  boardSize: number;
  fleet: ShipDef[];
  enemyFleet: ShipDef[];
  reward: { xp: number; skin?: ShipSkin; achievement?: string };
  weather?: WeatherType;
  specialRules?: string[];
}

export interface MissionObjective {
  type: "win" | "accuracy" | "shots" | "time" | "no_miss_streak" | "sink_first";
  target: number;
  description: string;
}

/* ─── Replay ─── */

export interface ReplayMove {
  turn: number;
  player: "player" | "ai" | "p1" | "p2";
  coord: Coord;
  result: ShotResult;
  sunkShip?: string;
  timestamp: number;
}

export interface GameReplay {
  id: string;
  date: string;
  seed: string | null;
  difficulty: string;
  mode: GameMode;
  boardSize: number;
  playerShips: { name: string; cells: Coord[] }[];
  enemyShips: { name: string; cells: Coord[] }[];
  moves: ReplayMove[];
  winner: "player" | "ai" | "p1" | "p2";
  duration: number;
}

/* ─── Daily Challenge ─── */

export interface DailyChallenge {
  date: string;
  seed: string;
  boardSize: number;
  difficulty: string;
  bestScore?: number;
  completed: boolean;
}

/* ─── Battle Pass ─── */

export interface BattlePassTier {
  level: number;
  xpRequired: number;
  reward: { type: "skin" | "achievement" | "title" | "xp_boost"; value: string };
  claimed: boolean;
}
