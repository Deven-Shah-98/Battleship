/** Game settings — persisted in localStorage */

const STORAGE_KEY = "battleship.settings";

export interface GameSettings {
  reduceMotion: boolean;
  colorBlindMode: boolean;
  leftHanded: boolean;
  fontSize: number;
  enableIslands: boolean;
  enableReefs: boolean;
  enableShrinking: boolean;
  enableShields: boolean;
  enableScoutPlane: boolean;
  enableComebackMechanic: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  reduceMotion: false,
  colorBlindMode: false,
  leftHanded: false,
  fontSize: 100,
  enableIslands: false,
  enableReefs: false,
  enableShrinking: false,
  enableShields: false,
  enableScoutPlane: false,
  enableComebackMechanic: true,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<GameSettings>;
      return { ...DEFAULT_SETTINGS, ...saved };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function applySettingsToDOM(settings: GameSettings): void {
  const root = document.documentElement;

  // Reduce motion
  if (settings.reduceMotion) {
    root.classList.add("reduce-motion");
  } else {
    root.classList.remove("reduce-motion");
  }

  // Color-blind mode
  if (settings.colorBlindMode) {
    root.classList.add("colorblind-mode");
  } else {
    root.classList.remove("colorblind-mode");
  }

  // Left-handed layout
  if (settings.leftHanded) {
    root.classList.add("left-handed");
  } else {
    root.classList.remove("left-handed");
  }

  // Font size
  root.style.fontSize = `${settings.fontSize}%`;
}
