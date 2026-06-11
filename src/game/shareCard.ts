import type { Board, MatchRecord } from "./types";
import { coordKey } from "./board";

/** Generate a Wordle-style text share card for a completed game. */
export function generateShareCard(
  record: MatchRecord,
  board: Board,
  title: string = "Battleship",
): string {
  const result = record.won ? "Victory" : "Defeat";
  const emoji = record.won ? "🏆" : "💀";
  const stars = record.accuracy >= 70 ? "⭐⭐⭐" : record.accuracy >= 50 ? "⭐⭐" : "⭐";

  // Build emoji grid (10 most recent shots)
  const shotKeys = Object.keys(board.shots);
  const recentShots = shotKeys.slice(-20);
  const grid = recentShots.map((key) => {
    const result = board.shots[key];
    if (result === "hit") return "🟥";
    return "🟦";
  });

  // Format as rows of 5
  const rows: string[] = [];
  for (let i = 0; i < grid.length; i += 5) {
    rows.push(grid.slice(i, i + 5).join(""));
  }

  const lines = [
    `${emoji} ${title} — ${result}`,
    `📊 ${record.shots} shots | ${record.accuracy}% accuracy | ${stars}`,
    `🎯 ${record.difficulty} | ${record.mode}`,
    "",
    ...rows,
    "",
    record.seed ? `🌱 Seed: ${record.seed}` : "",
    "Play: https://dist-iqfiorvc.devinapps.com",
  ];

  return lines.filter((l) => l !== undefined).join("\n");
}

/** Generate a minimal grid visualization of all shots on a board. */
export function generateShotGrid(board: Board): string {
  const size = board.size;
  const lines: string[] = [];
  for (let row = 0; row < size; row++) {
    let line = "";
    for (let col = 0; col < size; col++) {
      const key = coordKey({ row, col });
      const shot = board.shots[key];
      if (shot === "hit") line += "🟥";
      else if (shot === "miss") line += "🟦";
      else line += "⬜";
    }
    lines.push(line);
  }
  return lines.join("\n");
}

/** Copy text to clipboard. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
