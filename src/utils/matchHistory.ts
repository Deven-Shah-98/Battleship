import type { MatchRecord } from "../game/types";

const HISTORY_KEY = "battleship.history";
const MAX_RECORDS = 50;

export function loadHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchRecord[];
  } catch {
    return [];
  }
}

export function saveHistory(records: MatchRecord[]): void {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(records.slice(0, MAX_RECORDS)),
    );
  } catch {
    /* ignore storage errors */
  }
}

export function addMatch(record: MatchRecord): MatchRecord[] {
  const history = [record, ...loadHistory()].slice(0, MAX_RECORDS);
  saveHistory(history);
  return history;
}
