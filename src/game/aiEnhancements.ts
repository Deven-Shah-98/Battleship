/**
 * AI & Intelligence enhancements:
 * - AI Coach (post-game suggestions)
 * - Dynamic Difficulty Mid-Game
 * - Shot Pattern Recognition
 * - AI Personality Dialogue
 * - Learning AI (cross-game memory)
 * - Challenge AI (overpowered)
 * - AI Mentor Mode (reasoning)
 * - Heatmap Playback
 */

import type { Coord, Ship } from "./types";

/* ─── AI Coach ─── */

export interface CoachSuggestion {
  category: "opening" | "midgame" | "endgame" | "general";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export function generateCoachSuggestions(
  shots: Coord[],
  hits: number,
  misses: number,
  boardSize: number,
  shipsRemaining: number,
  totalShots: number
): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = [];
  const accuracy = totalShots > 0 ? hits / totalShots : 0;

  // Opening analysis (first 10 shots)
  if (shots.length >= 10) {
    const first10 = shots.slice(0, 10);
    // Check if player uses parity (checkerboard)
    const parityCount = first10.filter(s => (s.row + s.col) % 2 === 0).length;
    if (parityCount < 3 || parityCount > 7) {
      suggestions.push({
        category: "opening",
        title: "Try Parity Strategy",
        description: "Firing on a checkerboard pattern (every other cell) can help you find ships faster since every ship is at least 2 cells long.",
        priority: "high",
      });
    }

    // Check if shots are too clustered in opening
    const center = boardSize / 2;
    const centerCount = first10.filter(s => Math.abs(s.row - center) <= 2 && Math.abs(s.col - center) <= 2).length;
    if (centerCount >= 7) {
      suggestions.push({
        category: "opening",
        title: "Spread Your Opening",
        description: "Your opening shots are too concentrated in the center. Try spreading across the board to maximize information.",
        priority: "medium",
      });
    }
  }

  // Accuracy feedback
  if (accuracy < 0.2 && totalShots > 15) {
    suggestions.push({
      category: "general",
      title: "Follow Up on Hits",
      description: "Your accuracy is below 20%. When you get a hit, immediately fire at adjacent cells to find the rest of the ship.",
      priority: "high",
    });
  }

  // Endgame strategy
  if (shipsRemaining <= 2 && misses > hits * 3) {
    suggestions.push({
      category: "endgame",
      title: "Use Process of Elimination",
      description: "With few ships left, focus on areas you haven't explored. Ships can't be where you've already fired.",
      priority: "medium",
    });
  }

  // Check for repeated patterns
  if (shots.length >= 20) {
    const last10 = shots.slice(-10);
    const allRow = last10.every(s => s.row === last10[0].row);
    const allCol = last10.every(s => s.col === last10[0].col);
    if (allRow || allCol) {
      suggestions.push({
        category: "midgame",
        title: "Vary Your Approach",
        description: "You've been firing along the same line. Mix up your targeting to cover more area.",
        priority: "low",
      });
    }
  }

  return suggestions;
}

/* ─── Dynamic Difficulty ─── */

export interface DynamicDifficultyState {
  adjustmentLevel: number; // -3 to +3
  recentResults: ("win" | "lose")[];
  currentModifier: number; // accuracy modifier applied to AI
}

export function createDynamicDifficulty(): DynamicDifficultyState {
  return { adjustmentLevel: 0, recentResults: [], currentModifier: 0 };
}

export function updateDynamicDifficulty(
  state: DynamicDifficultyState,
  playerShipsRemaining: number,
  aiShipsRemaining: number,
  totalPlayerShips: number,
  totalAIShips: number
): DynamicDifficultyState {
  const playerHealth = playerShipsRemaining / totalPlayerShips;
  const aiHealth = aiShipsRemaining / totalAIShips;
  const delta = playerHealth - aiHealth;

  let adjustment = state.adjustmentLevel;
  // If player is dominating, increase AI difficulty
  if (delta > 0.4) adjustment = Math.min(3, adjustment + 1);
  // If AI is dominating, decrease AI difficulty
  else if (delta < -0.4) adjustment = Math.max(-3, adjustment - 1);

  // Modifier: negative = easier AI, positive = harder AI
  const modifier = adjustment * 0.1; // ±30% max

  return { ...state, adjustmentLevel: adjustment, currentModifier: modifier };
}

export function recordDynamicResult(state: DynamicDifficultyState, won: boolean): DynamicDifficultyState {
  const results = [...state.recentResults, won ? "win" as const : "lose" as const].slice(-5);
  const wins = results.filter(r => r === "win").length;
  const losses = results.filter(r => r === "lose").length;

  let adjustment = state.adjustmentLevel;
  if (wins >= 4) adjustment = Math.min(3, adjustment + 1);
  else if (losses >= 4) adjustment = Math.max(-3, adjustment - 1);

  return { ...state, recentResults: results, adjustmentLevel: adjustment, currentModifier: adjustment * 0.1 };
}

/* ─── AI Personality Dialogue ─── */

export interface AIDialogue {
  onGameStart: string[];
  onHit: string[];
  onMiss: string[];
  onSink: string[];
  onTakeHit: string[];
  onLosing: string[];
  onWinning: string[];
  onWin: string[];
  onLose: string[];
}

const PERSONALITY_DIALOGUES: Record<string, AIDialogue> = {
  balanced: {
    onGameStart: ["Good luck, Captain.", "May the best strategist win.", "Ready for engagement."],
    onHit: ["Good shot.", "Confirmed hit.", "Well aimed."],
    onMiss: ["The sea is vast.", "Nothing there.", "Missed."],
    onSink: ["Excellent. Ship destroyed.", "Down she goes.", "Another one to the depths."],
    onTakeHit: ["A hit on my fleet...", "You found one.", "Noted."],
    onLosing: ["You're performing well.", "I underestimated you.", "Adjusting strategy..."],
    onWinning: ["I have the advantage.", "Your fleet is dwindling.", "Time is on my side."],
    onWin: ["Well played, but I emerge victorious.", "The sea favors the prepared."],
    onLose: ["Congratulations, Captain. A well-earned victory.", "You outmaneuvered me today."],
  },
  aggressive: {
    onGameStart: ["I will CRUSH your fleet!", "Prepare to be destroyed!", "No mercy today!"],
    onHit: ["HA! Got you!", "BURN!", "Take that!"],
    onMiss: ["Tch. Lucky.", "You won't dodge forever!", "Next one won't miss!"],
    onSink: ["DESTROYED! Who's next?!", "Another one DEMOLISHED!", "PATHETIC defense!"],
    onTakeHit: ["Is that all you've got?!", "That tickled.", "You'll pay for that!"],
    onLosing: ["IMPOSSIBLE!", "I'm NOT losing to you!", "RAAAGH!"],
    onWinning: ["HAHAHAHA! TOO EASY!", "Your fleet is MINE!", "Just give up already!"],
    onWin: ["TOTAL DOMINATION!", "Never stood a chance!"],
    onLose: ["This isn't over! I'll be back!", "Enjoy it while it lasts!"],
  },
  cautious: {
    onGameStart: ["Let's proceed carefully.", "Analyzing the situation...", "Every shot must count."],
    onHit: ["As calculated.", "Probability confirmed.", "Expected outcome."],
    onMiss: ["Hmm, recalculating...", "Adjusting parameters.", "Interesting data point."],
    onSink: ["Target eliminated. Moving to next.", "Efficient. One less variable.", "Proceeding as planned."],
    onTakeHit: ["Unfortunate but manageable.", "Adjusting defensive posture.", "Within acceptable losses."],
    onLosing: ["This requires a new approach.", "Re-evaluating strategy...", "Concerning, but not critical."],
    onWinning: ["Proceeding as calculated.", "The math is in my favor.", "Steady progress."],
    onWin: ["A calculated victory.", "Efficiency prevails."],
    onLose: ["Your strategy was... superior. I must study it.", "An unexpected outcome. Fascinating."],
  },
  chaotic: {
    onGameStart: ["WHEEE let's gooo!", "I have NO IDEA what I'm doing!", "Random is a strategy, right?"],
    onHit: ["Wait I HIT something?!", "YOLO WORKS!", "Even I'm surprised!"],
    onMiss: ["Oopsie daisy!", "I meant to do that!", "The ocean needed a splash!"],
    onSink: ["BOOM BABY!", "Did... did I plan that?!", "CHAOS REIGNS!"],
    onTakeHit: ["WHOA that was close to my... wait.", "Owie!", "Hey, rude!"],
    onLosing: ["This is FINE! Everything is FINE!", "I'm not losing, I'm having FUN!", "CHAOS!"],
    onWinning: ["HOW AM I WINNING?!", "Random supremacy!", "I can't believe this is working!"],
    onWin: ["WAIT I WON?! HOW?!", "Chaos always wins eventually!"],
    onLose: ["That was FUN though, right?!", "Again again again!"],
  },
  methodical: {
    onGameStart: ["Initiating systematic scan.", "Grid search protocol engaged.", "Sector by sector."],
    onHit: ["Contact confirmed. Expanding search radius.", "Target acquired. Mapping adjacent cells.", "Hit logged. Continuing scan."],
    onMiss: ["Sector clear. Moving to next.", "No contact. Eliminated possibility.", "Data point recorded."],
    onSink: ["Target neutralized. Updating kill list.", "Ship destroyed. Recalculating remaining fleet.", "Eliminated. Proceeding to next target."],
    onTakeHit: ["Damage sustained. Continuing mission.", "Hit absorbed. Mission parameters unchanged.", "Noted. Prioritizing offense."],
    onLosing: ["Increasing scan frequency.", "Adapting protocol.", "Recalculating optimal approach."],
    onWinning: ["Systematic approach proven effective.", "Efficiency rating: high.", "On schedule for total elimination."],
    onWin: ["Mission complete. All targets neutralized.", "Systematic approach: validated."],
    onLose: ["Mission failed. Analyzing tactical errors.", "Defeat logged. Adjusting parameters for next engagement."],
  },
};

export function getAIDialogue(personality: string, event: keyof AIDialogue): string {
  const dialogue = PERSONALITY_DIALOGUES[personality] ?? PERSONALITY_DIALOGUES.balanced;
  const lines = dialogue[event];
  return lines[Math.floor(Math.random() * lines.length)];
}

/* ─── Learning AI ─── */

const LEARNING_KEY = "battleship.aiLearning";

export interface LearningAIData {
  playerPlacementFrequency: Record<string, number>; // "row,col" -> times used
  playerOpeningShots: Coord[][]; // first 5 shots of each game
  gamesAnalyzed: number;
  hotZones: { row: number; col: number; weight: number }[];
}

export function loadLearningAI(): LearningAIData {
  try {
    const raw = localStorage.getItem(LEARNING_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { playerPlacementFrequency: {}, playerOpeningShots: [], gamesAnalyzed: 0, hotZones: [] };
}

export function recordPlayerGame(
  playerShips: Ship[],
  playerShots: Coord[]
): void {
  const data = loadLearningAI();
  data.gamesAnalyzed += 1;

  // Record placement frequency
  for (const ship of playerShips) {
    for (const cell of ship.cells) {
      const key = `${cell.row},${cell.col}`;
      data.playerPlacementFrequency[key] = (data.playerPlacementFrequency[key] ?? 0) + 1;
    }
  }

  // Record opening shots
  data.playerOpeningShots.push(playerShots.slice(0, 5));
  if (data.playerOpeningShots.length > 20) data.playerOpeningShots.shift();

  // Calculate hot zones (where player tends to place ships)
  const entries = Object.entries(data.playerPlacementFrequency);
  data.hotZones = entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col, weight: count / data.gamesAnalyzed };
    });

  localStorage.setItem(LEARNING_KEY, JSON.stringify(data));
}

export function getLearningAIBias(boardSize: number): number[][] {
  const data = loadLearningAI();
  if (data.gamesAnalyzed < 3) return Array.from({ length: boardSize }, () => Array(boardSize).fill(0));

  // Create bias map from player placement patterns
  const bias: number[][] = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  for (const zone of data.hotZones) {
    if (zone.row < boardSize && zone.col < boardSize) {
      bias[zone.row][zone.col] = zone.weight * 10;
    }
  }
  return bias;
}

/* ─── AI Mentor Mode ─── */

export interface MentorExplanation {
  turn: number;
  coord: Coord;
  reasoning: string;
  confidence: number;
  alternatives: { coord: Coord; reason: string }[];
}

export function generateMentorExplanation(
  coord: Coord,
  boardSize: number,
  shots: Record<string, "hit" | "miss">,
  turn: number
): MentorExplanation {
  const adjacentHits: Coord[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    const r = coord.row + dr;
    const c = coord.col + dc;
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      if (shots[`${r},${c}`] === "hit") adjacentHits.push({ row: r, col: c });
    }
  }

  let reasoning: string;
  let confidence: number;

  if (adjacentHits.length >= 2) {
    reasoning = "I'm targeting this cell because it's between two confirmed hits — highly likely to be part of the same ship.";
    confidence = 0.9;
  } else if (adjacentHits.length === 1) {
    reasoning = "A hit was detected nearby. I'm checking adjacent cells to determine the ship's orientation.";
    confidence = 0.7;
  } else {
    // Check if it's a high-probability cell (center, parity)
    const isCenterArea = Math.abs(coord.row - boardSize / 2) <= 2 && Math.abs(coord.col - boardSize / 2) <= 2;
    const isParity = (coord.row + coord.col) % 2 === 0;
    if (isCenterArea) {
      reasoning = "Center cells have the highest probability of containing ships due to more possible placements.";
      confidence = 0.4;
    } else if (isParity) {
      reasoning = "Using parity strategy — checking every other cell to efficiently find ship segments.";
      confidence = 0.35;
    } else {
      reasoning = "Selecting based on overall probability distribution of remaining ship placements.";
      confidence = 0.3;
    }
  }

  return {
    turn,
    coord,
    reasoning,
    confidence,
    alternatives: [],
  };
}

/* ─── Heatmap Playback ─── */

export interface HeatmapFrame {
  turn: number;
  probabilities: number[][];
  shotCoord: Coord;
  result: "hit" | "miss";
}

export function recordHeatmapFrame(
  turn: number,
  probabilities: number[][],
  coord: Coord,
  result: "hit" | "miss"
): HeatmapFrame {
  return { turn, probabilities: probabilities.map(row => [...row]), shotCoord: coord, result };
}

const HEATMAP_REPLAY_KEY = "battleship.heatmapReplay";

export function saveHeatmapReplay(frames: HeatmapFrame[]): void {
  // Keep only last game's heatmap
  localStorage.setItem(HEATMAP_REPLAY_KEY, JSON.stringify(frames));
}

export function loadHeatmapReplay(): HeatmapFrame[] {
  try {
    const raw = localStorage.getItem(HEATMAP_REPLAY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
