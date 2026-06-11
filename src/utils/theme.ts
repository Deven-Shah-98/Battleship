import type { ThemeName } from "../game/types";

const THEME_KEY = "battleship.theme";

export const THEMES: Record<
  ThemeName,
  { label: string; vars: Record<string, string> }
> = {
  cognition: {
    label: "Cognition",
    vars: {
      "--bg": "#f7f6f5",
      "--bg-secondary": "#eeedeb",
      "--panel": "rgba(255, 255, 255, 0.85)",
      "--panel-solid": "#ffffff",
      "--panel-border": "rgba(0, 0, 0, 0.06)",
      "--sea": "rgba(230, 228, 225, 0.5)",
      "--sea-line": "rgba(0, 0, 0, 0.06)",
      "--accent": "#2200ff",
      "--accent-glow": "rgba(34, 0, 255, 0.15)",
      "--accent-secondary": "#191919",
      "--accent-secondary-glow": "rgba(25, 25, 25, 0.1)",
      "--hit": "#e53935",
      "--miss": "#90a4ae",
      "--ship": "rgba(34, 0, 255, 0.12)",
      "--ship-stroke": "rgba(34, 0, 255, 0.25)",
      "--sunk": "#c62828",
      "--ok": "#2e7d32",
      "--text": "#000000",
      "--text-secondary": "#555555",
      "--text-muted": "rgba(0, 0, 0, 0.4)",
      "--gradient-start": "#f7f6f5",
      "--gradient-mid": "#eeedeb",
      "--gradient-end": "#f7f6f5",
      "--glass-bg": "rgba(255, 255, 255, 0.7)",
      "--glass-border": "rgba(0, 0, 0, 0.06)",
      "--glass-highlight": "rgba(255, 255, 255, 0.9)",
      "--cell-bg": "rgba(230, 228, 225, 0.3)",
      "--cell-hover": "rgba(34, 0, 255, 0.1)",
      "--cell-border": "rgba(0, 0, 0, 0.06)",
    },
  },
  midnight: {
    label: "Midnight",
    vars: {
      "--bg": "#08080F",
      "--bg-secondary": "#0E0E1A",
      "--panel": "rgba(14, 14, 30, 0.7)",
      "--panel-solid": "#0E0E1E",
      "--panel-border": "rgba(124, 77, 255, 0.15)",
      "--sea": "rgba(26, 26, 50, 0.6)",
      "--sea-line": "rgba(124, 77, 255, 0.12)",
      "--accent": "#7C4DFF",
      "--accent-glow": "rgba(124, 77, 255, 0.3)",
      "--accent-secondary": "#B388FF",
      "--accent-secondary-glow": "rgba(179, 136, 255, 0.2)",
      "--hit": "#FF5252",
      "--miss": "#616B80",
      "--ship": "rgba(124, 77, 255, 0.2)",
      "--ship-stroke": "rgba(124, 77, 255, 0.35)",
      "--sunk": "#D32F2F",
      "--ok": "#69F0AE",
      "--text": "#E0E0F0",
      "--text-secondary": "#616B80",
      "--text-muted": "rgba(97, 107, 128, 0.6)",
      "--gradient-start": "#08080F",
      "--gradient-mid": "#0E0E1A",
      "--gradient-end": "#0A0A14",
      "--glass-bg": "rgba(14, 14, 30, 0.5)",
      "--glass-border": "rgba(124, 77, 255, 0.08)",
      "--glass-highlight": "rgba(255, 255, 255, 0.02)",
      "--cell-bg": "rgba(26, 26, 50, 0.4)",
      "--cell-hover": "rgba(124, 77, 255, 0.15)",
      "--cell-border": "rgba(124, 77, 255, 0.06)",
    },
  },
  arctic: {
    label: "Arctic",
    vars: {
      "--bg": "#F0F4F8",
      "--bg-secondary": "#E4EAF0",
      "--panel": "rgba(255, 255, 255, 0.75)",
      "--panel-solid": "#FFFFFF",
      "--panel-border": "rgba(0, 0, 0, 0.06)",
      "--sea": "rgba(200, 218, 240, 0.5)",
      "--sea-line": "rgba(0, 0, 0, 0.06)",
      "--accent": "#E53935",
      "--accent-glow": "rgba(229, 57, 53, 0.2)",
      "--accent-secondary": "#1565C0",
      "--accent-secondary-glow": "rgba(21, 101, 192, 0.15)",
      "--hit": "#E53935",
      "--miss": "#90A4AE",
      "--ship": "rgba(21, 101, 192, 0.15)",
      "--ship-stroke": "rgba(21, 101, 192, 0.25)",
      "--sunk": "#C62828",
      "--ok": "#2E7D32",
      "--text": "#1A2030",
      "--text-secondary": "#607080",
      "--text-muted": "rgba(96, 112, 128, 0.5)",
      "--gradient-start": "#F0F4F8",
      "--gradient-mid": "#E4EAF0",
      "--gradient-end": "#F0F4F8",
      "--glass-bg": "rgba(255, 255, 255, 0.6)",
      "--glass-border": "rgba(0, 0, 0, 0.04)",
      "--glass-highlight": "rgba(255, 255, 255, 0.8)",
      "--cell-bg": "rgba(200, 218, 240, 0.3)",
      "--cell-hover": "rgba(229, 57, 53, 0.1)",
      "--cell-border": "rgba(0, 0, 0, 0.04)",
    },
  },
  ember: {
    label: "Ember",
    vars: {
      "--bg": "#120A08",
      "--bg-secondary": "#1A100C",
      "--panel": "rgba(30, 16, 12, 0.7)",
      "--panel-solid": "#1A100C",
      "--panel-border": "rgba(255, 152, 0, 0.12)",
      "--sea": "rgba(40, 22, 16, 0.6)",
      "--sea-line": "rgba(255, 152, 0, 0.1)",
      "--accent": "#FF9800",
      "--accent-glow": "rgba(255, 152, 0, 0.3)",
      "--accent-secondary": "#FFCC80",
      "--accent-secondary-glow": "rgba(255, 204, 128, 0.2)",
      "--hit": "#FF1744",
      "--miss": "#8D6E63",
      "--ship": "rgba(255, 152, 0, 0.18)",
      "--ship-stroke": "rgba(255, 152, 0, 0.3)",
      "--sunk": "#C62828",
      "--ok": "#76FF03",
      "--text": "#FFF3E0",
      "--text-secondary": "#8D6E63",
      "--text-muted": "rgba(141, 110, 99, 0.5)",
      "--gradient-start": "#120A08",
      "--gradient-mid": "#1A100C",
      "--gradient-end": "#150C0A",
      "--glass-bg": "rgba(30, 16, 12, 0.5)",
      "--glass-border": "rgba(255, 152, 0, 0.06)",
      "--glass-highlight": "rgba(255, 255, 255, 0.02)",
      "--cell-bg": "rgba(40, 22, 16, 0.4)",
      "--cell-hover": "rgba(255, 152, 0, 0.12)",
      "--cell-border": "rgba(255, 152, 0, 0.06)",
    },
  },
  ocean: {
    label: "Ocean",
    vars: {
      "--bg": "#0A1628",
      "--bg-secondary": "#0E1E35",
      "--panel": "rgba(14, 30, 53, 0.7)",
      "--panel-solid": "#0E1E35",
      "--panel-border": "rgba(0, 188, 212, 0.12)",
      "--sea": "rgba(10, 40, 70, 0.6)",
      "--sea-line": "rgba(0, 188, 212, 0.1)",
      "--accent": "#00BCD4",
      "--accent-glow": "rgba(0, 188, 212, 0.3)",
      "--accent-secondary": "#80DEEA",
      "--accent-secondary-glow": "rgba(128, 222, 234, 0.2)",
      "--hit": "#FF5252",
      "--miss": "#546E7A",
      "--ship": "rgba(0, 188, 212, 0.2)",
      "--ship-stroke": "rgba(0, 188, 212, 0.35)",
      "--sunk": "#D32F2F",
      "--ok": "#69F0AE",
      "--text": "#E0F7FA",
      "--text-secondary": "#546E7A",
      "--text-muted": "rgba(84, 110, 122, 0.6)",
      "--gradient-start": "#0A1628",
      "--gradient-mid": "#0E1E35",
      "--gradient-end": "#0C1A30",
      "--glass-bg": "rgba(14, 30, 53, 0.5)",
      "--glass-border": "rgba(0, 188, 212, 0.08)",
      "--glass-highlight": "rgba(255, 255, 255, 0.02)",
      "--cell-bg": "rgba(10, 40, 70, 0.4)",
      "--cell-hover": "rgba(0, 188, 212, 0.15)",
      "--cell-border": "rgba(0, 188, 212, 0.06)",
    },
  },
  neon: {
    label: "Neon",
    vars: {
      "--bg": "#0A0A0A",
      "--bg-secondary": "#121212",
      "--panel": "rgba(18, 18, 18, 0.8)",
      "--panel-solid": "#121212",
      "--panel-border": "rgba(0, 255, 136, 0.15)",
      "--sea": "rgba(20, 20, 20, 0.6)",
      "--sea-line": "rgba(0, 255, 136, 0.08)",
      "--accent": "#00FF88",
      "--accent-glow": "rgba(0, 255, 136, 0.3)",
      "--accent-secondary": "#FF00FF",
      "--accent-secondary-glow": "rgba(255, 0, 255, 0.2)",
      "--hit": "#FF0066",
      "--miss": "#444444",
      "--ship": "rgba(0, 255, 136, 0.2)",
      "--ship-stroke": "rgba(0, 255, 136, 0.4)",
      "--sunk": "#FF0066",
      "--ok": "#00FF88",
      "--text": "#FFFFFF",
      "--text-secondary": "#888888",
      "--text-muted": "rgba(136, 136, 136, 0.6)",
      "--gradient-start": "#0A0A0A",
      "--gradient-mid": "#121212",
      "--gradient-end": "#0A0A0A",
      "--glass-bg": "rgba(18, 18, 18, 0.6)",
      "--glass-border": "rgba(0, 255, 136, 0.1)",
      "--glass-highlight": "rgba(255, 255, 255, 0.02)",
      "--cell-bg": "rgba(20, 20, 20, 0.5)",
      "--cell-hover": "rgba(0, 255, 136, 0.15)",
      "--cell-border": "rgba(0, 255, 136, 0.08)",
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
  return "cognition";
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
  root.setAttribute("data-theme", theme);
}

const THEMES_USED_KEY = "battleship.themes_used";

export function recordThemeUsed(theme: ThemeName): Set<string> {
  try {
    const raw = localStorage.getItem(THEMES_USED_KEY);
    const used = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    used.add(theme);
    localStorage.setItem(THEMES_USED_KEY, JSON.stringify([...used]));
    return used;
  } catch {
    return new Set([theme]);
  }
}

export function getAllThemesUsed(): Set<string> {
  try {
    const raw = localStorage.getItem(THEMES_USED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}
