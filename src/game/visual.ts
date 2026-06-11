/**
 * Visual & Immersion systems:
 * - Day/Night Cycle
 * - Dynamic Lighting
 * - Animated Ship Sprites
 * - Damage States
 * - Board Skins
 * - Cinematic Replay Export
 * - Weather Particle Effects
 * - Tactical Overlay
 * - Underwater View
 * - Win Probability Display
 */

/* ─── Day/Night Cycle ─── */

export type TimeOfDay = "dawn" | "morning" | "midday" | "afternoon" | "dusk" | "night";

export interface DayNightState {
  currentTime: TimeOfDay;
  turnCount: number;
  transitionDuration: number; // CSS transition time
}

const TIME_SEQUENCE: TimeOfDay[] = ["dawn", "morning", "midday", "afternoon", "dusk", "night"];

export function createDayNightState(): DayNightState {
  return { currentTime: "dawn", turnCount: 0, transitionDuration: 2000 };
}

export function advanceDayNight(state: DayNightState): DayNightState {
  const newTurnCount = state.turnCount + 1;
  // Change time every 8 turns
  const timeIndex = Math.floor(newTurnCount / 8) % TIME_SEQUENCE.length;
  return { ...state, turnCount: newTurnCount, currentTime: TIME_SEQUENCE[timeIndex] };
}

export function getTimeColors(time: TimeOfDay): { bg: string; sky: string; water: string; visibility: number } {
  switch (time) {
    case "dawn": return { bg: "#1a1a2e", sky: "#ff6b6b", water: "#1e3a5f", visibility: 0.7 };
    case "morning": return { bg: "#16213e", sky: "#87ceeb", water: "#1e5f8f", visibility: 0.9 };
    case "midday": return { bg: "#0f3460", sky: "#4fc3f7", water: "#1565c0", visibility: 1.0 };
    case "afternoon": return { bg: "#1a237e", sky: "#42a5f5", water: "#0d47a1", visibility: 0.95 };
    case "dusk": return { bg: "#1a1a2e", sky: "#ff7043", water: "#1a237e", visibility: 0.6 };
    case "night": return { bg: "#0a0a1a", sky: "#1a1a2e", water: "#0a0a2e", visibility: 0.4 };
  }
}

/* ─── Dynamic Lighting ─── */

export interface LightEffect {
  id: string;
  type: "explosion" | "fire" | "ambient";
  coord: { row: number; col: number };
  radius: number;
  intensity: number;
  color: string;
  duration: number;
  startTime: number;
}

export function createExplosionLight(coord: { row: number; col: number }): LightEffect {
  return {
    id: `light-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "explosion",
    coord,
    radius: 3,
    intensity: 1,
    color: "#ff6600",
    duration: 800,
    startTime: Date.now(),
  };
}

export function createFireLight(coord: { row: number; col: number }): LightEffect {
  return {
    id: `fire-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "fire",
    coord,
    radius: 2,
    intensity: 0.6,
    color: "#ff4400",
    duration: 5000,
    startTime: Date.now(),
  };
}

export function isLightExpired(light: LightEffect): boolean {
  return Date.now() - light.startTime > light.duration;
}

/* ─── Damage States ─── */

export type DamageLevel = "pristine" | "light" | "moderate" | "heavy" | "critical" | "sinking";

export function getShipDamageLevel(hits: boolean[]): DamageLevel {
  const hitCount = hits.filter(h => h).length;
  const ratio = hitCount / hits.length;
  if (ratio === 0) return "pristine";
  if (ratio < 0.25) return "light";
  if (ratio < 0.5) return "moderate";
  if (ratio < 0.75) return "heavy";
  if (ratio < 1) return "critical";
  return "sinking";
}

export function getDamageCSS(level: DamageLevel): string {
  switch (level) {
    case "pristine": return "";
    case "light": return "ship-damage-light";
    case "moderate": return "ship-damage-moderate";
    case "heavy": return "ship-damage-heavy";
    case "critical": return "ship-damage-critical";
    case "sinking": return "ship-damage-sinking";
  }
}

/* ─── Board Skins ─── */

export type BoardSkin = "ocean" | "tropical" | "arctic" | "deep_space" | "lava" | "void";

export interface BoardSkinConfig {
  id: BoardSkin;
  name: string;
  description: string;
  waterColor: string;
  cellBorder: string;
  hitColor: string;
  missColor: string;
  bgGradient: string;
  particleType: string;
}

export const BOARD_SKINS: BoardSkinConfig[] = [
  {
    id: "ocean",
    name: "Deep Ocean",
    description: "Classic deep blue waters",
    waterColor: "#0a3d62",
    cellBorder: "#1e5f8f33",
    hitColor: "#ff4444",
    missColor: "#4a90d9",
    bgGradient: "linear-gradient(180deg, #0a3d62 0%, #0c2340 100%)",
    particleType: "bubbles",
  },
  {
    id: "tropical",
    name: "Tropical Lagoon",
    description: "Clear turquoise waters with coral",
    waterColor: "#006064",
    cellBorder: "#00838f33",
    hitColor: "#ff6d00",
    missColor: "#4dd0e1",
    bgGradient: "linear-gradient(180deg, #00bcd4 0%, #006064 100%)",
    particleType: "fish",
  },
  {
    id: "arctic",
    name: "Arctic Ice",
    description: "Frozen waters with ice floes",
    waterColor: "#1a237e",
    cellBorder: "#90caf933",
    hitColor: "#ff1744",
    missColor: "#90caf9",
    bgGradient: "linear-gradient(180deg, #e3f2fd 0%, #1a237e 100%)",
    particleType: "snow",
  },
  {
    id: "deep_space",
    name: "Deep Space",
    description: "Stellar combat among the stars",
    waterColor: "#0a0a1a",
    cellBorder: "#7c4dff33",
    hitColor: "#ff1744",
    missColor: "#7c4dff",
    bgGradient: "linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)",
    particleType: "stars",
  },
  {
    id: "lava",
    name: "Lava Sea",
    description: "Ships sail on molten rock",
    waterColor: "#1a0a00",
    cellBorder: "#ff630033",
    hitColor: "#ffea00",
    missColor: "#ff6300",
    bgGradient: "linear-gradient(180deg, #bf360c 0%, #1a0a00 100%)",
    particleType: "embers",
  },
  {
    id: "void",
    name: "The Void",
    description: "An empty darkness between dimensions",
    waterColor: "#000000",
    cellBorder: "#4a148c33",
    hitColor: "#e040fb",
    missColor: "#4a148c",
    bgGradient: "linear-gradient(180deg, #12005e 0%, #000000 100%)",
    particleType: "void",
  },
];

const BOARD_SKIN_KEY = "battleship.boardSkin";

export function loadBoardSkin(): BoardSkin {
  try {
    return (localStorage.getItem(BOARD_SKIN_KEY) as BoardSkin) ?? "ocean";
  } catch {
    return "ocean";
  }
}

export function saveBoardSkin(skin: BoardSkin): void {
  localStorage.setItem(BOARD_SKIN_KEY, skin);
}

export function getBoardSkinConfig(skin: BoardSkin): BoardSkinConfig {
  return BOARD_SKINS.find(s => s.id === skin) ?? BOARD_SKINS[0];
}

/* ─── Tactical Overlay ─── */

export interface TacticalOverlayState {
  enabled: boolean;
  showProbability: boolean;
  showHistory: boolean;
  showZones: boolean;
  showShipShadows: boolean;
}

export function createTacticalOverlay(): TacticalOverlayState {
  return { enabled: false, showProbability: true, showHistory: false, showZones: false, showShipShadows: false };
}

/* ─── Weather Particles ─── */

export interface ParticleConfig {
  type: "rain" | "snow" | "ember" | "bubble" | "star" | "fog";
  count: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
}

export function getWeatherParticles(weather: string, boardSkin: BoardSkin): ParticleConfig | null {
  switch (weather) {
    case "storm":
      return { type: "rain", count: 100, speed: 8, size: 2, opacity: 0.6, color: "#90caf9" };
    case "fog":
      return { type: "fog", count: 20, speed: 1, size: 40, opacity: 0.3, color: "#ffffff" };
    case "clear":
      if (boardSkin === "arctic") return { type: "snow", count: 30, speed: 2, size: 4, opacity: 0.8, color: "#ffffff" };
      if (boardSkin === "lava") return { type: "ember", count: 40, speed: 3, size: 3, opacity: 0.7, color: "#ff6600" };
      if (boardSkin === "deep_space") return { type: "star", count: 50, speed: 0.5, size: 2, opacity: 0.9, color: "#ffffff" };
      return null;
    default:
      return null;
  }
}

/* ─── Cinematic Camera ─── */

export interface CameraState {
  zoom: number;
  panX: number;
  panY: number;
  shake: number;
  transition: string;
}

export function createCameraState(): CameraState {
  return { zoom: 1, panX: 0, panY: 0, shake: 0, transition: "0.3s ease" };
}

export function applyCameraShake(state: CameraState, intensity: number): CameraState {
  return { ...state, shake: intensity };
}

export function zoomToCell(state: CameraState, cellX: number, cellY: number): CameraState {
  return { ...state, zoom: 1.5, panX: -cellX * 0.2, panY: -cellY * 0.2, transition: "0.5s ease" };
}

export function resetCamera(state: CameraState): CameraState {
  return { ...state, zoom: 1, panX: 0, panY: 0, shake: 0, transition: "0.3s ease" };
}
