/** Voice Commands — fire shots via Web Speech API */

import { COLUMN_LABELS } from "./constants";
import type { Coord } from "./types";

export interface VoiceCommandResult {
  success: boolean;
  coord?: Coord;
  raw?: string;
  error?: string;
}

/** Parse a voice command like "Fire B4" or "B 4" into a coordinate */
export function parseVoiceCommand(text: string, boardSize: number): VoiceCommandResult {
  const cleaned = text.trim().toUpperCase().replace(/^FIRE\s+/i, "").replace(/^SHOOT\s+/i, "");

  // Try to match letter + number pattern (e.g., "B4", "B 4", "BRAVO 4")
  const letterMatch = cleaned.match(/^([A-Z])\s*(\d+)$/);
  if (letterMatch) {
    const col = COLUMN_LABELS.indexOf(letterMatch[1]);
    const row = parseInt(letterMatch[2], 10) - 1;
    if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
      return { success: true, coord: { row, col }, raw: text };
    }
  }

  // NATO phonetic alphabet
  const natoMap: Record<string, string> = {
    ALFA: "A", ALPHA: "A", BRAVO: "B", CHARLIE: "C", DELTA: "D",
    ECHO: "E", FOXTROT: "F", GOLF: "G", HOTEL: "H", INDIA: "I",
    JULIET: "J", KILO: "K", LIMA: "L", MIKE: "M", NOVEMBER: "N",
    OSCAR: "O", PAPA: "P", QUEBEC: "Q", ROMEO: "R", SIERRA: "S",
    TANGO: "T",
  };

  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    const letter = natoMap[words[0]] || words[0];
    const number = parseInt(words[words.length - 1], 10);
    if (letter.length === 1) {
      const col = COLUMN_LABELS.indexOf(letter);
      const row = number - 1;
      if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
        return { success: true, coord: { row, col }, raw: text };
      }
    }
  }

  return { success: false, raw: text, error: `Could not parse "${text}"` };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Start voice recognition (one-shot) */
export function startVoiceRecognition(
  boardSize: number,
  onResult: (result: VoiceCommandResult) => void,
): { stop: () => void } | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    onResult({ success: false, error: "Speech recognition not supported" });
    return null;
  }

  const recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    onResult(parseVoiceCommand(transcript, boardSize));
  };

  recognition.onerror = (event: any) => {
    onResult({ success: false, error: event.error });
  };

  recognition.start();
  return { stop: () => recognition.stop() };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
