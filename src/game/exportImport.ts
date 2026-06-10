/** Export/import all game data as JSON */

const EXPORT_KEYS = [
  "battleship.xp",
  "battleship.achievements",
  "battleship.prestige",
  "battleship.milestones",
  "battleship.record",
  "battleship.matches",
  "battleship.loadouts",
  "battleship.theme",
  "battleship.mute",
  "battleship.replays",
  "battleship.settings",
  "battleship.profile",
  "battleship.daily",
  "battleship.campaign",
] as const;

export interface ExportData {
  version: 1;
  exportDate: string;
  data: Record<string, string>;
}

export function exportSaveData(): ExportData {
  const data: Record<string, string> = {};
  for (const key of EXPORT_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  }
  // Also grab any other battleship.* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("battleship.") && !(key in data)) {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
  }
  return { version: 1, exportDate: new Date().toISOString(), data };
}

export function importSaveData(json: string): { success: boolean; error?: string; keysImported: number } {
  try {
    const parsed = JSON.parse(json) as ExportData;
    if (parsed.version !== 1) return { success: false, error: "Unknown export version", keysImported: 0 };
    if (!parsed.data || typeof parsed.data !== "object") return { success: false, error: "Invalid data format", keysImported: 0 };

    let count = 0;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key.startsWith("battleship.") && typeof value === "string") {
        localStorage.setItem(key, value);
        count++;
      }
    }
    return { success: true, keysImported: count };
  } catch {
    return { success: false, error: "Invalid JSON", keysImported: 0 };
  }
}

export function downloadExport(): void {
  const data = exportSaveData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `battleship-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
