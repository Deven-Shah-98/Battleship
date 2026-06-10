import type { ThemeName } from "../game/types";

const THEME_KEY = "battleship.theme";

export const THEMES: Record<
  ThemeName,
  { label: string; vars: Record<string, string> }
> = {
  cognition: {
    label: "Cognition",
    vars: {
      "--bg": "#0B0E14",
      "--bg-secondary": "#111520",
      "--panel": "rgba(20, 25, 38, 0.7)",
      "--panel-solid": "#141926",
      "--panel-border": "rgba(158, 174, 233, 0.1)",
      "--sea": "rgba(30, 38, 58, 0.6)",
      "--sea-line": "rgba(158, 174, 233, 0.12)",
      "--accent": "#FA5050",
      "--accent-glow": "rgba(250, 80, 80, 0.3)",
      "--accent-secondary": "#9EAEE9",
      "--accent-secondary-glow": "rgba(158, 174, 233, 0.2)",
      "--hit": "#FA5050",
      "--miss": "#7B8397",
      "--ship": "rgba(158, 174, 233, 0.25)",
      "--ship-stroke": "rgba(158, 174, 233, 0.4)",
      "--sunk": "#E53935",
      "--ok": "#A2D1CE",
      "--text": "#EAF0F9",
      "--text-secondary": "#7B8397",
      "--text-muted": "rgba(123, 131, 151, 0.6)",
      "--gradient-start": "#0B0E14",
      "--gradient-mid": "#111520",
      "--gradient-end": "#0F131C",
      "--glass-bg": "rgba(20, 25, 38, 0.5)",
      "--glass-border": "rgba(158, 174, 233, 0.08)",
      "--glass-highlight": "rgba(255, 255, 255, 0.03)",
      "--cell-bg": "rgba(30, 38, 58, 0.4)",
      "--cell-hover": "rgba(250, 80, 80, 0.15)",
      "--cell-border": "rgba(158, 174, 233, 0.08)",
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
