import type { WeatherEffect, WeatherType } from "./types";

export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: {
    type: "clear",
    label: "Clear Skies",
    description: "Normal conditions. No modifiers.",
    duration: 0,
  },
  fog: {
    type: "fog",
    label: "Dense Fog",
    description: "Misses don't reveal — you won't know if you missed or just can't see. 30% chance shots go to adjacent cell.",
    duration: 3,
  },
  storm: {
    type: "storm",
    label: "Violent Storm",
    description: "Power-ups are disabled. 15% chance each shot scatters to a random adjacent cell.",
    duration: 3,
  },
  calm: {
    type: "calm",
    label: "Calm Seas",
    description: "Bonus shot! You get an extra shot this turn.",
    duration: 2,
  },
  wind: {
    type: "wind",
    label: "Strong Winds",
    description: "All shots drift 1 cell in a random direction (if in bounds).",
    duration: 2,
  },
};

const WEATHER_TYPES: WeatherType[] = ["clear", "fog", "storm", "calm", "wind"];

/** Roll a new weather event. Returns 'clear' 40% of the time. */
export function rollWeather(rng: () => number = Math.random): WeatherEffect {
  if (rng() < 0.4) return { ...WEATHER_EFFECTS.clear };
  const idx = 1 + Math.floor(rng() * (WEATHER_TYPES.length - 1));
  const type = WEATHER_TYPES[idx];
  return { ...WEATHER_EFFECTS[type], duration: WEATHER_EFFECTS[type].duration };
}

/** Apply weather scatter to a coord. Returns the (possibly modified) coord. */
export function applyWeatherScatter(
  coord: { row: number; col: number },
  weather: WeatherType,
  boardSize: number,
  rng: () => number = Math.random,
): { row: number; col: number } {
  if (weather === "fog" && rng() < 0.3) {
    return scatterAdjacent(coord, boardSize, rng);
  }
  if (weather === "storm" && rng() < 0.15) {
    return scatterAdjacent(coord, boardSize, rng);
  }
  if (weather === "wind") {
    return scatterAdjacent(coord, boardSize, rng);
  }
  return coord;
}

function scatterAdjacent(
  coord: { row: number; col: number },
  boardSize: number,
  rng: () => number,
): { row: number; col: number } {
  const dirs = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  const dir = dirs[Math.floor(rng() * dirs.length)];
  const newRow = Math.max(0, Math.min(boardSize - 1, coord.row + dir.row));
  const newCol = Math.max(0, Math.min(boardSize - 1, coord.col + dir.col));
  return { row: newRow, col: newCol };
}
