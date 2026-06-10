import type { ThemeName } from "../game/types";

const THEME_KEY = "battleship.theme";

export const THEMES: Record<
  ThemeName,
  { label: string; vars: Record<string, string> }
> = {
  ocean: {
    label: "Ocean",
    vars: {
      "--bg": "#0b1d2a",
      "--panel": "#11293a",
      "--sea": "#16384f",
      "--sea-line": "#1f4a66",
      "--accent": "#36c5f0",
      "--hit": "#e4572e",
      "--miss": "#9fb3c8",
      "--ship": "#5a6b7b",
      "--sunk": "#c2410c",
      "--ok": "#2ecc71",
      "--text": "#e6f0f6",
    },
  },
  dark: {
    label: "Midnight",
    vars: {
      "--bg": "#0a0a0f",
      "--panel": "#141420",
      "--sea": "#1a1a2e",
      "--sea-line": "#2a2a44",
      "--accent": "#7c4dff",
      "--hit": "#ff5252",
      "--miss": "#78909c",
      "--ship": "#4a4a6a",
      "--sunk": "#d32f2f",
      "--ok": "#00e676",
      "--text": "#e0e0e0",
    },
  },
  light: {
    label: "Light",
    vars: {
      "--bg": "#e8f0f8",
      "--panel": "#ffffff",
      "--sea": "#b3d4e8",
      "--sea-line": "#90bbd4",
      "--accent": "#0277bd",
      "--hit": "#d32f2f",
      "--miss": "#607d8b",
      "--ship": "#78909c",
      "--sunk": "#b71c1c",
      "--ok": "#2e7d32",
      "--text": "#1a1a2e",
    },
  },
  sunset: {
    label: "Sunset",
    vars: {
      "--bg": "#1a0a1e",
      "--panel": "#2a1532",
      "--sea": "#3a1f42",
      "--sea-line": "#5a3060",
      "--accent": "#ff9800",
      "--hit": "#ff1744",
      "--miss": "#b39ddb",
      "--ship": "#6a4a7a",
      "--sunk": "#c62828",
      "--ok": "#76ff03",
      "--text": "#f3e5f5",
    },
  },
};

export function loadTheme(): ThemeName {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw && raw in THEMES) return raw as ThemeName;
  } catch {
    /* ignore */
  }
  return "ocean";
}

export function saveTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  const vars = THEMES[theme].vars;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  document.body.style.background =
    theme === "light"
      ? "radial-gradient(circle at top, #d0e8f8, var(--bg))"
      : "radial-gradient(circle at top, #103248, var(--bg))";
}
