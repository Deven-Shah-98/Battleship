/** Fleet Customization — name your ships */

const STORAGE_KEY = "battleship.shipNames";

export function loadShipNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  return {};
}

export function saveShipNames(names: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch { /* ignore */ }
}

export function getShipDisplayName(shipName: string): string {
  const custom = loadShipNames();
  return custom[shipName] || shipName;
}
