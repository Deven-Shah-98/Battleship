/** Game Journal — auto-generated summaries of notable games */

export interface JournalEntry {
  id: string;
  date: string;
  summary: string;
  highlights: string[];
  difficulty: string;
  won: boolean;
  shots: number;
  accuracy: number;
  duration: number;
}

const STORAGE_KEY = "battleship.journal";
const MAX_ENTRIES = 50;

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JournalEntry[];
  } catch { /* ignore */ }
  return [];
}

function saveJournal(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* ignore */ }
}

function generateHighlights(
  won: boolean,
  accuracy: number,
  shots: number,
  duration: number,
  difficulty: string,
): string[] {
  const highlights: string[] = [];

  if (won && accuracy >= 80) highlights.push("Sharpshooter performance!");
  if (won && shots <= 25) highlights.push("Speed run — minimal shots!");
  if (won && duration <= 60) highlights.push("Lightning victory under 1 minute!");
  if (!won && accuracy >= 50) highlights.push("Close game — good accuracy despite the loss.");
  if (difficulty === "admiral" && won) highlights.push("Defeated the Admiral AI!");
  if (accuracy === 100) highlights.push("PERFECT — 100% accuracy!");
  if (shots >= 80) highlights.push("Epic-length battle.");

  if (highlights.length === 0) {
    highlights.push(won ? "Another victory in the books." : "A tough fight.");
  }

  return highlights;
}

function generateSummary(
  won: boolean,
  accuracy: number,
  shots: number,
  difficulty: string,
): string {
  const result = won ? "Victory" : "Defeat";
  const acc = `${accuracy}% accuracy`;
  const desc = shots <= 30 ? "quick" : shots <= 60 ? "standard" : "prolonged";
  return `${result} against ${difficulty} AI in a ${desc} battle (${shots} shots, ${acc}).`;
}

export function addJournalEntry(
  won: boolean,
  accuracy: number,
  shots: number,
  duration: number,
  difficulty: string,
): JournalEntry {
  const entry: JournalEntry = {
    id: `journal_${Date.now()}`,
    date: new Date().toISOString(),
    summary: generateSummary(won, accuracy, shots, difficulty),
    highlights: generateHighlights(won, accuracy, shots, duration, difficulty),
    difficulty,
    won,
    shots,
    accuracy,
    duration,
  };

  const entries = loadJournal();
  entries.unshift(entry);
  saveJournal(entries);
  return entry;
}
