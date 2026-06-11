/**
 * Accessibility & Inclusivity systems:
 * - Screen Reader Battle Narration
 * - One-Switch Mode
 * - Dyslexia-Friendly Font
 * - High Contrast Tactical Mode
 * - Text Size Presets
 * - Simplified Mode
 */

const A11Y_KEY = "battleship.accessibility";

export interface AccessibilitySettings {
  screenReaderNarration: boolean;
  oneSwitchMode: boolean;
  dyslexiaFont: boolean;
  highContrastTactical: boolean;
  textSize: "small" | "medium" | "large" | "xl";
  simplifiedMode: boolean;
  reduceMotion: boolean;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

export const DEFAULT_A11Y: AccessibilitySettings = {
  screenReaderNarration: false,
  oneSwitchMode: false,
  dyslexiaFont: false,
  highContrastTactical: false,
  textSize: "medium",
  simplifiedMode: false,
  reduceMotion: false,
  colorBlindMode: "none",
};

export function loadA11ySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(A11Y_KEY);
    if (raw) return { ...DEFAULT_A11Y, ...JSON.parse(raw) };
  } catch { /* */ }
  return { ...DEFAULT_A11Y };
}

export function saveA11ySettings(settings: AccessibilitySettings): void {
  localStorage.setItem(A11Y_KEY, JSON.stringify(settings));
}

export function applyA11yToDOM(settings: AccessibilitySettings): void {
  const root = document.documentElement;

  // Dyslexia font
  root.classList.toggle("dyslexia-font", settings.dyslexiaFont);

  // High contrast
  root.classList.toggle("high-contrast-tactical", settings.highContrastTactical);

  // Text size
  const sizes = { small: "14px", medium: "16px", large: "18px", xl: "22px" };
  root.style.setProperty("--base-font-size", sizes[settings.textSize]);

  // Simplified mode
  root.classList.toggle("simplified-mode", settings.simplifiedMode);

  // Reduce motion
  root.classList.toggle("reduce-motion", settings.reduceMotion);

  // Color blind mode
  root.setAttribute("data-color-blind", settings.colorBlindMode);

  // One-switch mode
  root.classList.toggle("one-switch-mode", settings.oneSwitchMode);
}

/* ─── Screen Reader Narration ─── */

let narrationQueue: string[] = [];
let narrating = false;

export function announceToScreenReader(message: string): void {
  narrationQueue.push(message);
  processNarrationQueue();
}

function processNarrationQueue(): void {
  if (narrating || narrationQueue.length === 0) return;
  narrating = true;
  const message = narrationQueue.shift()!;

  // Create or update ARIA live region
  let liveRegion = document.getElementById("sr-narration");
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "sr-narration";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "assertive");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.style.position = "absolute";
    liveRegion.style.width = "1px";
    liveRegion.style.height = "1px";
    liveRegion.style.overflow = "hidden";
    liveRegion.style.clip = "rect(0, 0, 0, 0)";
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = message;

  setTimeout(() => {
    narrating = false;
    processNarrationQueue();
  }, 1000);
}

export function narrateGameEvent(
  event: "fire" | "hit" | "miss" | "sink" | "take_hit" | "your_turn" | "ai_turn" | "win" | "lose",
  details?: string
): string {
  const messages: Record<string, string> = {
    fire: `You fired at ${details ?? "unknown"}`,
    hit: `Hit! ${details ?? "Direct hit on enemy vessel"}`,
    miss: `Miss at ${details ?? "target"}. No enemy ships there.`,
    sink: `Ship sunk! ${details ?? "Enemy vessel destroyed"}`,
    take_hit: `Alert! ${details ?? "Your ship has been hit"}`,
    your_turn: "It's your turn. Select a target on the enemy board.",
    ai_turn: "Enemy is taking their turn...",
    win: "Victory! You've destroyed the entire enemy fleet!",
    lose: "Defeat. Your fleet has been destroyed.",
  };
  const msg = messages[event] ?? event;
  announceToScreenReader(msg);
  return msg;
}

/* ─── One-Switch Mode ─── */

export interface OneSwitchState {
  currentRow: number;
  currentCol: number;
  scanning: boolean;
  scanDirection: "row" | "col";
  scanSpeed: number; // ms between moves
  intervalId: ReturnType<typeof setInterval> | null;
}

export function createOneSwitchState(scanSpeed: number = 800): OneSwitchState {
  return {
    currentRow: 0,
    currentCol: 0,
    scanning: true,
    scanDirection: "row",
    scanSpeed,
    intervalId: null,
  };
}

export function advanceOneSwitch(state: OneSwitchState, boardSize: number): OneSwitchState {
  const newState = { ...state };
  if (state.scanDirection === "row") {
    newState.currentRow = (state.currentRow + 1) % boardSize;
  } else {
    newState.currentCol = (state.currentCol + 1) % boardSize;
  }
  return newState;
}

export function confirmOneSwitch(state: OneSwitchState): OneSwitchState {
  if (state.scanDirection === "row") {
    return { ...state, scanDirection: "col" };
  }
  // Both row and col confirmed — fire at current position
  return { ...state, scanDirection: "row" };
}

/* ─── Battle Narration Templates ─── */

export function generateBattleNarration(
  event: string,
  coord?: { row: number; col: number },
  shipName?: string,
  _boardSize?: number
): string {
  const colLabel = coord ? String.fromCharCode(65 + coord.col) : "";
  const rowLabel = coord ? String(coord.row + 1) : "";
  const cell = coord ? `${colLabel}${rowLabel}` : "";

  switch (event) {
    case "player_hit":
      return `Direct hit at ${cell}! ${shipName ? `The enemy ${shipName} takes damage.` : "Enemy vessel hit."}`;
    case "player_miss":
      return `Shot at ${cell} splashes into empty water. No contact.`;
    case "player_sink":
      return `The enemy ${shipName ?? "ship"} at ${cell} is sinking! She's going down!`;
    case "ai_hit":
      return `Incoming! The enemy hits our ${shipName ?? "ship"} at ${cell}!`;
    case "ai_miss":
      return `Enemy shell lands at ${cell}. A miss — our fleet is safe for now.`;
    case "ai_sink":
      return `Our ${shipName ?? "ship"} has been destroyed at ${cell}! All hands lost.`;
    default:
      return event;
  }
}
