import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BoardGrid from "./components/BoardGrid";
import FleetStatus from "./components/FleetStatus";
import Confetti from "./components/Confetti";
import PassDevice from "./components/PassDevice";
import PowerUpBar from "./components/PowerUpBar";
import MatchHistoryPanel from "./components/MatchHistory";
import ThemeSwitcher from "./components/ThemeSwitcher";
import GameOverOverlay from "./components/GameOverOverlay";
import ShipDock from "./components/ShipDock";
import AchievementPanel from "./components/AchievementPanel";
import PlayerProfile from "./components/PlayerProfile";
import PostGameAnalysis from "./components/PostGameAnalysis";
import Tutorial from "./components/Tutorial";
import CampaignPanel from "./components/CampaignPanel";
import ReplayViewer from "./components/ReplayViewer";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import { addMatch, loadHistory } from "./utils/matchHistory";
import { applyTheme, loadTheme, saveTheme, recordThemeUsed, THEMES } from "./utils/theme";
import {
  allShipsSunk,
  canPlaceShip,
  coordKey,
  createEmptyBoard,
  placeShip,
  placeShipsRandomly,
  receiveAttack,
  remainingShips,
  shipCells,
} from "./game/board";
import {
  chooseAIMove,
  createAIState,
  updateAIAfterResult,
  choosePersonalityMove,
  getHint,
  getProgressiveDifficulty,
  type AIState,
  type Difficulty,
} from "./game/ai";
import { COLUMN_LABELS, DEFAULT_POWERUPS, SHIP_DEFS, BOARD_SIZES, AI_SPEEDS } from "./game/constants";
import type {
  Board,
  Coord,
  GameMode,
  MatchRecord,
  Orientation,
  PlayerMode,
  PowerUpKind,
  PowerUpState,
  ThemeName,
  AIPersonality,
  WeatherType,
  ShipDef,
} from "./game/types";
import { playSound, setMuted, startMusic, stopMusic, updateMusicIntensity, narratorSpeak, setNarratorEnabled } from "./sound";
import { seededRng, randomSeedString } from "./game/seed";
import {
  airstrikeTargets,
  canUsePowerUp,
  radarScan,
  sonarPing,
  spendPowerUp,
} from "./game/powerups";
import { checkGameAchievements, ACHIEVEMENTS, unlockAchievement } from "./game/achievements";
import { addGameXP, loadXP, getTitle } from "./game/xp";
import { WEATHER_EFFECTS, rollWeather, applyWeatherScatter } from "./game/weather";
import { createReplayRecorder, recordMove, finalizeReplay, saveReplay, type ReplayRecorder } from "./game/replay";
import { generateShareCard, copyToClipboard } from "./game/shareCard";
// Daily challenge available via imports if needed
// import { getTodayChallenge, completeDailyChallenge, getDailyStreak } from "./game/dailyChallenge";

type Phase = "setup" | "setup-p2" | "playing" | "gameover";
type Turn = "player" | "ai" | "p1" | "p2";
type Winner = "player" | "ai" | "p1" | "p2" | null;

interface GameRecord {
  wins: number;
  losses: number;
}

const RECORD_KEY = "battleship.record";
const MUTE_KEY = "battleship.muted";
const AUTOSAVE_KEY = "battleship.autosave";
const TUTORIAL_KEY = "battleship.tutorial.done";

const DIFFICULTY_INFO: Record<Difficulty, string> = {
  easy: "Fires at random \u2014 good for a relaxed game.",
  medium: "Hunts on a grid, then chases hits.",
  hard: "Probability-density targeting \u2014 plays to win.",
  admiral: "Enhanced heatmap with miss analysis \u2014 ruthless.",
};

const coordLabel = (c: Coord): string => `${COLUMN_LABELS[c.col]}${c.row + 1}`;

function loadRecord(): GameRecord {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    if (!raw) return { wins: 0, losses: 0 };
    const parsed = JSON.parse(raw) as Partial<GameRecord>;
    return { wins: parsed.wins ?? 0, losses: parsed.losses ?? 0 };
  } catch {
    return { wins: 0, losses: 0 };
  }
}

function countShots(board: Board): { shots: number; hits: number } {
  let shots = 0;
  let hits = 0;
  for (const result of Object.values(board.shots)) {
    shots += 1;
    if (result === "hit") hits += 1;
  }
  return { shots, hits };
}

export default function App() {
  /* ─── Settings ─── */
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [playerMode, setPlayerMode] = useState<PlayerMode>("vs-ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [enablePowerUps, setEnablePowerUps] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [useSeed, setUseSeed] = useState(false);
  const [activeSeed, setActiveSeed] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState(10);
  const [fleet, setFleet] = useState<ShipDef[]>(SHIP_DEFS);
  const [aiSpeed, setAiSpeed] = useState<string>("normal");
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>("balanced");
  const [enableWeather, setEnableWeather] = useState(false);
  const [timedTurns, setTimedTurns] = useState(0); // 0 = unlimited
  const [enableNarrator, setEnableNarrator] = useState(false);

  /* ─── Game state ─── */
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerBoard, setPlayerBoard] = useState<Board>(() => createEmptyBoard());
  const [aiBoard, setAiBoard] = useState<Board>(() => createEmptyBoard());
  const [p2Board, setP2Board] = useState<Board>(() => createEmptyBoard());
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [hover, setHover] = useState<Coord | null>(null);
  const [turn, setTurn] = useState<Turn>("player");
  const [aiState, setAiState] = useState<AIState>(() => createAIState());
  const [winner, setWinner] = useState<Winner>(null);
  const [log, setLog] = useState<string[]>([]);
  const [muted, setMutedState] = useState<boolean>(() => {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
  });
  const [record, setRecord] = useState<GameRecord>(() => loadRecord());
  const [lastPlayerShot, setLastPlayerShot] = useState<Coord | null>(null);
  const [lastAIShot, setLastAIShot] = useState<Coord | null>(null);
  const [theme, setThemeState] = useState<ThemeName>(() => loadTheme());
  const [aiThinking, setAiThinking] = useState(false);
  const gameStartRef = useRef<number>(0);

  /* ─── Power-ups ─── */
  const [powerUps, setPowerUps] = useState<PowerUpState>({ ...DEFAULT_POWERUPS });
  const [activePowerUp, setActivePowerUp] = useState<PowerUpKind | null>(null);
  const [radarCells, setRadarCells] = useState<Set<string>>(new Set());
  const [sonarOverlay, setSonarOverlay] = useState<{ center: Coord; count: number } | null>(null);
  const [airstrikeCells, setAirstrikeCells] = useState<Set<string>>(new Set());

  /* ─── Salvo mode ─── */
  const [salvoShotsRemaining, setSalvoShotsRemaining] = useState(0);
  const [salvoShotsTotal, setSalvoShotsTotal] = useState(0);

  /* ─── Hotseat ─── */
  const [showPassDevice, setShowPassDevice] = useState(false);

  /* ─── Confetti ─── */
  const [showConfetti, setShowConfetti] = useState(false);

  /* ─── UI modals ─── */
  const [showHistory, setShowHistory] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showReplays, setShowReplays] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  /* ─── Weather ─── */
  const [currentWeather, setCurrentWeather] = useState<WeatherType>("clear");
  const [weatherTurnsLeft, setWeatherTurnsLeft] = useState(0);

  /* ─── Timer ─── */
  const [turnTimer, setTurnTimer] = useState(0);
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Replay ─── */
  const replayRef = useRef<ReplayRecorder | null>(null);

  /* ─── Achievements ─── */
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ xp: number; level: number } | null>(null);
  const hitStreakRef = useRef(0);
  const sunkOrderRef = useRef<string[]>([]);
  const usedPowerUpsRef = useRef<Set<string>>(new Set());

  /* ─── Hint ─── */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hintCell, setHintCell] = useState<Coord | null>(null);

  /* ─── Last game XP for overlay ─── */
  const [lastGameXP, setLastGameXP] = useState(0);

  /* ─── Effective difficulty (progressive AI) ─── */
  const [effectiveDifficulty, setEffectiveDifficulty] = useState<Difficulty>("medium");

  /* ─── Board setup tracking ─── */
  const [placementHistory, setPlacementHistory] = useState<Board[]>([]);

  const currentFleet = fleet;
  const nextDef = currentFleet[playerBoard.ships.length] ?? null;
  const allPlaced = playerBoard.ships.length === currentFleet.length;
  const nextDefP2 = currentFleet[p2Board.ships.length] ?? null;
  const allPlacedP2 = p2Board.ships.length === currentFleet.length;

  const playerStats = useMemo(() => {
    if (playerMode === "hotseat") {
      const board = winner === "p2" ? playerBoard : p2Board;
      return countShots(board);
    }
    return countShots(aiBoard);
  }, [aiBoard, playerBoard, p2Board, playerMode, winner]);
  const accuracy = playerStats.shots === 0 ? 0 : Math.round((playerStats.hits / playerStats.shots) * 100);

  const aiDelayMs = AI_SPEEDS[aiSpeed] ?? 650;

  // Apply theme on mount and change
  useEffect(() => { applyTheme(theme); }, [theme]);

  const changeTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    saveTheme(t);
    const used = recordThemeUsed(t);
    if (used.size >= Object.keys(THEMES).length) unlockAchievement("all_themes");
  }, []);

  // Sync mute and narrator
  useEffect(() => {
    setMuted(muted);
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* */ }
  }, [muted]);

  useEffect(() => { setNarratorEnabled(enableNarrator); }, [enableNarrator]);

  // Show tutorial on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);
    } catch { /* */ }
  }, []);

  // Auto-save restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.playerBoard && saved.aiBoard) {
        setPlayerBoard(saved.playerBoard);
        setAiBoard(saved.aiBoard);
        setTurn(saved.turn ?? "player");
        setAiState(saved.aiState ?? createAIState());
        setLog(saved.log ?? []);
        setDifficulty(saved.difficulty ?? "medium");
        setGameMode(saved.mode ?? saved.gameMode ?? "classic");
        setEnablePowerUps(saved.enablePowerUps ?? false);
        setPowerUps(saved.powerUps ?? { ...DEFAULT_POWERUPS });
        setActiveSeed(saved.activeSeed ?? null);
        setSalvoShotsRemaining(saved.salvoShotsRemaining ?? 0);
        setSalvoShotsTotal(saved.salvoShotsTotal ?? 0);
        setBoardSize(saved.boardSize ?? 10);
        setFleet(saved.fleet ?? SHIP_DEFS);
        setAiSpeed(saved.aiSpeed ?? "normal");
        setAiPersonality(saved.aiPersonality ?? "balanced");
        setCurrentWeather(saved.currentWeather ?? "clear");
        setWeatherTurnsLeft(saved.weatherTurnsLeft ?? 0);
        gameStartRef.current = saved.gameStart ?? Date.now();
        setPhase("playing");
        addLog("Game restored from auto-save.");
      }
    } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on state changes during play
  useEffect(() => {
    if (phase !== "playing" || playerMode === "hotseat") return;
    try {
      const state = {
        playerBoard, aiBoard, turn, aiState, log, difficulty, gameMode,
        enablePowerUps, powerUps, activeSeed, salvoShotsRemaining,
        salvoShotsTotal, boardSize, fleet, aiSpeed, aiPersonality,
        currentWeather, weatherTurnsLeft, gameStart: gameStartRef.current,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch { /* */ }
  }, [phase, playerBoard, aiBoard, turn, aiState, log, difficulty, gameMode,
    enablePowerUps, powerUps, activeSeed, salvoShotsRemaining, salvoShotsTotal,
    boardSize, fleet, aiSpeed, aiPersonality, playerMode, currentWeather, weatherTurnsLeft]);

  // Turn timer — use refs to avoid stale closures in salvo mode
  const timerExpiredRef = useRef(false);
  const handleFireRef = useRef<(coord: Coord) => void>(() => {});
  useEffect(() => {
    if (phase !== "playing" || timedTurns <= 0) return;
    if (turn === "ai") return;

    timerExpiredRef.current = false;
    setTurnTimer(timedTurns);
    turnTimerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          if (!timerExpiredRef.current) {
            timerExpiredRef.current = true;
            setTimeout(() => { handleFireRef.current({ row: -1, col: -1 }); }, 0);
          }
          return 0;
        }
        if (prev <= 5) playSound("countdown");
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [phase, turn, timedTurns]);

  const addLog = useCallback((message: string) => {
    setLog((prev) => [message, ...prev].slice(0, 60));
  }, []);

  const recordResult = useCallback(
    (won: boolean, finalBoard?: Board) => {
      setRecord((prev) => {
        const next = won ? { ...prev, wins: prev.wins + 1 } : { ...prev, losses: prev.losses + 1 };
        try { localStorage.setItem(RECORD_KEY, JSON.stringify(next)); } catch { /* */ }
        return next;
      });

      const duration = (Date.now() - gameStartRef.current) / 1000;
      const stats = countShots(finalBoard ?? aiBoard);
      const acc = stats.shots === 0 ? 0 : Math.round((stats.hits / stats.shots) * 100);
      const matchRecord: MatchRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        won,
        difficulty,
        mode: gameMode,
        playerMode,
        shots: stats.shots,
        hits: stats.hits,
        accuracy: acc,
        duration,
        seed: activeSeed,
        boardSize,
      };
      addMatch(matchRecord);

      // XP & Achievements
      const history = loadHistory();
      const newAchievements = checkGameAchievements(matchRecord, history, playerBoard, {
        hitStreak: hitStreakRef.current,
        sunkShipsOrder: sunkOrderRef.current,
        usedAllPowerUps: usedPowerUpsRef.current.size >= 3,
        boardSize,
        isBlitz: boardSize <= 6,
      });

      let achievementXP = 0;
      for (const id of newAchievements) {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (ach) {
          achievementXP += ach.xp;
          setAchievementToast(ach.name);
          playSound("achievement");
          setTimeout(() => setAchievementToast(null), 3000);
        }
      }

      const prevXP = loadXP();
      const xpResult = addGameXP(matchRecord, achievementXP);
      const xpEarned = xpResult.totalXP - prevXP.totalXP;
      setLastGameXP(xpEarned);
      if (xpResult.level > prevXP.level) {
        setXpToast({ xp: xpEarned, level: xpResult.level });
        playSound("levelup");
        setTimeout(() => setXpToast(null), 4000);
      }

      // Level-based achievements
      if (xpResult.level >= 10) unlockAchievement("level_10");
      if (xpResult.level >= 25) unlockAchievement("level_25");

      matchRecord.xpEarned = xpEarned;
      matchRecord.achievementsUnlocked = newAchievements;

      // Finalize replay
      if (replayRef.current) {
        const replay = finalizeReplay(replayRef.current, won ? "player" : "ai");
        saveReplay(replay);
        replayRef.current = null;
      }

      // Clear autosave
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
    },
    [aiBoard, difficulty, gameMode, playerMode, activeSeed, boardSize, playerBoard],
  );

  // Toggle orientation with the R key during setup
  useEffect(() => {
    if (phase !== "setup" && phase !== "setup-p2") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
      }
      if (e.key === "u" || e.key === "U") handleUndo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, placementHistory]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      if (e.key === "m" || e.key === "M") {
        if (!e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
          setMutedState((m) => !m);
        }
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowAchievements(false);
        setShowProfile(false);
        setShowAnalysis(false);
        setShowTutorial(false);
        setShowCampaign(false);
        setShowReplays(false);
        setShowHistory(false);
      }
      if (e.key === "h" || e.key === "H") {
        if (phase === "playing" && turn === "player" && playerMode === "vs-ai" && !(e.target instanceof HTMLInputElement)) {
          handleHint();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn, playerMode]);

  const activeBoard = phase === "setup-p2" ? p2Board : playerBoard;
  const activeNextDef = phase === "setup-p2" ? nextDefP2 : nextDef;

  const previewCells: Coord[] =
    (phase === "setup" || phase === "setup-p2") && activeNextDef && hover
      ? shipCells(hover, activeNextDef.size, orientation) : [];
  const previewValid =
    !!activeNextDef && !!hover && canPlaceShip(activeBoard, activeNextDef.size, hover, orientation);

  const handlePlace = (coord: Coord) => {
    if (phase === "setup") {
      if (!nextDef) return;
      if (!canPlaceShip(playerBoard, nextDef.size, coord, orientation)) return;
      setPlacementHistory((prev) => [...prev, playerBoard]);
      setPlayerBoard((b) => placeShip(b, nextDef, coord, orientation));
      playSound("place");
    } else if (phase === "setup-p2") {
      if (!nextDefP2) return;
      if (!canPlaceShip(p2Board, nextDefP2.size, coord, orientation)) return;
      setPlacementHistory((prev) => [...prev, p2Board]);
      setP2Board((b) => placeShip(b, nextDefP2, coord, orientation));
      playSound("place");
    }
  };

  const handleShipDrop = (coord: Coord) => { handlePlace(coord); };

  const handleUndo = () => {
    if (placementHistory.length === 0) return;
    const prev = placementHistory[placementHistory.length - 1];
    if (phase === "setup") {
      setPlayerBoard(prev);
    } else if (phase === "setup-p2") {
      setP2Board(prev);
    }
    setPlacementHistory((h) => h.slice(0, -1));
    playSound("click");
  };

  const handleRandomFill = () => {
    if (phase === "setup") {
      setPlayerBoard(placeShipsRandomly(currentFleet, boardSize));
    } else if (phase === "setup-p2") {
      setP2Board(placeShipsRandomly(currentFleet, boardSize));
    }
  };

  const handleResetPlacement = () => {
    if (phase === "setup") {
      setPlayerBoard(createEmptyBoard(boardSize));
      setPlacementHistory([]);
    } else if (phase === "setup-p2") {
      setP2Board(createEmptyBoard(boardSize));
      setPlacementHistory([]);
    }
  };

  const rotate = () => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    const preset = BOARD_SIZES.find((b) => b.size === newSize);
    if (preset) setFleet([...preset.fleet]);
    setPlayerBoard(createEmptyBoard(newSize));
    setPlacementHistory([]);
  };

  const handleHint = () => {
    if (phase !== "playing" || turn !== "player" || playerMode !== "vs-ai") return;
    const hint = getHint(aiBoard);
    if (hint) {
      setHintCell(hint);
      addLog(`Hint: try ${coordLabel(hint)}`);
      playSound("ability");
      unlockAchievement("hint_used");
      setTimeout(() => setHintCell(null), 3000);
    }
  };

  const startGame = () => {
    if (playerMode === "hotseat") {
      if (phase === "setup" && allPlaced) {
        setPhase("setup-p2");
        setOrientation("horizontal");
        setHover(null);
        setPlacementHistory([]);
        return;
      }
      if (phase === "setup-p2" && allPlacedP2) {
        setTurn("p1");
        setWinner(null);
        setLastPlayerShot(null);
        setLastAIShot(null);
        const p1Shots = gameMode === "salvo" ? remainingShips(playerBoard) : 1;
        setSalvoShotsRemaining(p1Shots);
        setSalvoShotsTotal(p1Shots);
        setLog(["Game on! Pass-and-play mode. Player 1 fires first."]);
        setPhase("playing");
        gameStartRef.current = Date.now();
        setShowPassDevice(true);
        return;
      }
      return;
    }

    if (!allPlaced) return;
    const rng = useSeed && seedInput ? seededRng(seedInput) : undefined;
    const seed = useSeed && seedInput ? seedInput : randomSeedString();
    setActiveSeed(seed);
    const enemyBoard = rng
      ? placeShipsRandomly(currentFleet, boardSize, rng)
      : placeShipsRandomly(currentFleet, boardSize);
    setAiBoard(enemyBoard);
    setAiState(createAIState());
    setTurn("player");
    setWinner(null);
    setLastPlayerShot(null);
    setLastAIShot(null);
    setPowerUps({ ...DEFAULT_POWERUPS });
    setActivePowerUp(null);
    setRadarCells(new Set());
    setSonarOverlay(null);
    setAirstrikeCells(new Set());
    setShowConfetti(false);
    setHintCell(null);
    hitStreakRef.current = 0;
    sunkOrderRef.current = [];
    usedPowerUpsRef.current = new Set();

    // Weather
    if (enableWeather) {
      const w = rollWeather();
      setCurrentWeather(w.type);
      setWeatherTurnsLeft(w.duration);
      if (w.type !== "clear") addLog(`Weather: ${w.label} \u2014 ${w.description}`);
    } else {
      setCurrentWeather("clear");
      setWeatherTurnsLeft(0);
    }

    // Progressive AI
    const history = loadHistory();
    const totalGames = history.length;
    const wonGames = history.filter((r) => r.won).length;
    const winRate = totalGames > 0 ? wonGames / totalGames : 0.5;
    const progressiveDiff = getProgressiveDifficulty(winRate, difficulty);
    setEffectiveDifficulty(progressiveDiff);
    if (progressiveDiff !== difficulty) {
      addLog(`Progressive AI adjusted difficulty to ${progressiveDiff}!`);
    }

    const salvoCount = gameMode === "salvo" ? remainingShips(playerBoard) : 0;
    setSalvoShotsRemaining(salvoCount);
    setSalvoShotsTotal(salvoCount);

    // Replay recorder
    const { recorder } = createReplayRecorder(
      seed, difficulty, gameMode, boardSize,
      playerBoard.ships.map((s) => ({ name: s.name, cells: s.cells })),
      enemyBoard.ships.map((s) => ({ name: s.name, cells: s.cells })),
    );
    replayRef.current = recorder;

    setLog([
      `Game on! ${gameMode === "salvo" ? "Salvo" : "Classic"} mode, ${difficulty} AI${aiPersonality !== "balanced" ? ` (${aiPersonality})` : ""}. Board: ${boardSize}x${boardSize}.${useSeed && seedInput ? ` Seed: ${seed}` : ""}`,
    ]);
    setPhase("playing");
    gameStartRef.current = Date.now();

    // Music
    startMusic(0);
    narratorSpeak("gameStart");
  };

  const newGame = () => {
    setPlayerBoard(createEmptyBoard(boardSize));
    setAiBoard(createEmptyBoard(boardSize));
    setP2Board(createEmptyBoard(boardSize));
    setOrientation("horizontal");
    setHover(null);
    setTurn("player");
    setAiState(createAIState());
    setWinner(null);
    setLastPlayerShot(null);
    setLastAIShot(null);
    setLog([]);
    setPhase("setup");
    setPowerUps({ ...DEFAULT_POWERUPS });
    setActivePowerUp(null);
    setRadarCells(new Set());
    setSonarOverlay(null);
    setAirstrikeCells(new Set());
    setSalvoShotsRemaining(0);
    setSalvoShotsTotal(0);
    setShowConfetti(false);
    setShowPassDevice(false);
    setAiThinking(false);
    setHintCell(null);
    setPlacementHistory([]);
    setCurrentWeather("clear");
    setWeatherTurnsLeft(0);
    stopMusic();
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
  };

  /* ─── Power-up usage ─── */
  const applyPowerUp = (coord: Coord) => {
    if (!activePowerUp || !enablePowerUps) return false;
    if (currentWeather === "storm" && enableWeather) {
      addLog("Power-ups are disabled during storms!");
      setActivePowerUp(null);
      return false;
    }
    if (!canUsePowerUp(powerUps, activePowerUp)) return false;

    usedPowerUpsRef.current.add(activePowerUp);

    if (activePowerUp === "radar") {
      const result = radarScan(aiBoard, coord);
      const keys = new Set(result.cells.filter((c) => c.hasShip).map((c) => coordKey(c.coord)));
      setRadarCells(keys);
      setPowerUps(spendPowerUp(powerUps, "radar"));
      playSound("radar");
      addLog(`Radar scan at ${coordLabel(coord)}: ${keys.size} ship segment(s) detected.`);
      setActivePowerUp(null);
      setTimeout(() => setRadarCells(new Set()), 3000);
      return true;
    }

    if (activePowerUp === "sonar") {
      const result = sonarPing(aiBoard, coord);
      setSonarOverlay({ center: coord, count: result.count });
      setPowerUps(spendPowerUp(powerUps, "sonar"));
      playSound("sonar");
      addLog(`Sonar ping at ${coordLabel(coord)}: ${result.count} ship segment(s) nearby.`);
      setActivePowerUp(null);
      setTimeout(() => setSonarOverlay(null), 3000);
      return true;
    }

    if (activePowerUp === "airstrike") {
      const rowTargets = airstrikeTargets(aiBoard, "row", coord.row);
      const colTargets = airstrikeTargets(aiBoard, "col", coord.col);
      const targets = rowTargets.length >= colTargets.length ? rowTargets : colTargets;
      const axis = rowTargets.length >= colTargets.length ? "row" : "col";

      let currentBoard = aiBoard;
      const hitKeys = new Set<string>();
      for (const t of targets) {
        const { board: nb, result, sunkShip } = receiveAttack(currentBoard, t);
        if (result !== "already") {
          currentBoard = nb;
          hitKeys.add(coordKey(t));
          if (result === "hit" && sunkShip) {
            addLog(`Airstrike sank ${sunkShip.name} at ${coordLabel(t)}!`);
            sunkOrderRef.current.push(sunkShip.name);
          }
        }
      }
      setAiBoard(currentBoard);
      setAirstrikeCells(hitKeys);
      setPowerUps(spendPowerUp(powerUps, "airstrike"));
      playSound("airstrike");
      addLog(`Airstrike on ${axis} ${axis === "row" ? coord.row + 1 : COLUMN_LABELS[coord.col]}: ${targets.length} cells bombed.`);
      setActivePowerUp(null);
      setTimeout(() => setAirstrikeCells(new Set()), 2000);

      if (allShipsSunk(currentBoard)) {
        setWinner("player");
        setPhase("gameover");
        addLog("Victory! You destroyed the enemy fleet.");
        playSound("win");
        narratorSpeak("win");
        recordResult(true, currentBoard);
        setShowConfetti(true);
        return true;
      }

      if (gameMode === "classic") {
        setTurn("ai");
        setAiThinking(true);
      }
      return true;
    }

    return false;
  };

  /* ─── Fire handler ─── */
  const handleFire = (coord: Coord) => {
    // Timer auto-fire sentinel: pick a random un-hit cell
    if (coord.row === -1 && coord.col === -1) {
      const targetBoard = playerMode === "hotseat" ? (turn === "p1" ? p2Board : playerBoard) : aiBoard;
      const available: Coord[] = [];
      for (let r = 0; r < targetBoard.size; r++) {
        for (let c = 0; c < targetBoard.size; c++) {
          const key = coordKey({ row: r, col: c });
          if (!targetBoard.shots[key]) available.push({ row: r, col: c });
        }
      }
      if (available.length === 0) return;
      const randomCell = available[Math.floor(Math.random() * available.length)];
      addLog(`Time's up! Auto-firing at ${coordLabel(randomCell)}.`);
      handleFire(randomCell);
      return;
    }
    if (phase !== "playing") return;

    if (activePowerUp && enablePowerUps && playerMode === "vs-ai") {
      if ((turn === "player") || (gameMode === "salvo" && salvoShotsRemaining > 0)) {
        applyPowerUp(coord);
        return;
      }
    }

    if (playerMode === "hotseat") {
      handleHotseatFire(coord);
      return;
    }

    if (turn !== "player") return;

    // Weather scatter
    let targetCoord = coord;
    if (currentWeather !== "clear" && enableWeather) {
      targetCoord = applyWeatherScatter(coord, currentWeather, boardSize);
      if (targetCoord.row !== coord.row || targetCoord.col !== coord.col) {
        addLog(`Weather scattered shot from ${coordLabel(coord)} to ${coordLabel(targetCoord)}!`);
      }
    }

    const { board, result, sunkShip } = receiveAttack(aiBoard, targetCoord);
    if (result === "already") return;
    setAiBoard(board);
    setLastPlayerShot(targetCoord);
    setHintCell(null);

    // Record replay move
    if (replayRef.current) {
      replayRef.current = recordMove(replayRef.current, "player", targetCoord, result, sunkShip?.name);
    }

    if (result === "hit") {
      hitStreakRef.current++;
      playSound(sunkShip ? "sink" : "hit");
      narratorSpeak(sunkShip ? "sink" : "hit");
      if (sunkShip) sunkOrderRef.current.push(sunkShip.name);
      addLog(
        sunkShip
          ? `You sank the enemy ${sunkShip.name}! (${coordLabel(targetCoord)})`
          : `Hit at ${coordLabel(targetCoord)}.`,
      );
    } else {
      hitStreakRef.current = 0;
      playSound("miss");
      narratorSpeak("miss");
      addLog(`You missed at ${coordLabel(targetCoord)}.`);
    }

    // Music intensity
    const sunkCount = board.ships.filter((s) => s.hits.every(Boolean)).length;
    updateMusicIntensity(sunkCount / board.ships.length);

    if (allShipsSunk(board)) {
      setWinner("player");
      setPhase("gameover");
      addLog("Victory! You destroyed the enemy fleet.");
      playSound("win");
      narratorSpeak("win");
      recordResult(true, board);
      setShowConfetti(true);
      return;
    }

    if (gameMode === "salvo") {
      const remaining = salvoShotsRemaining - 1;
      setSalvoShotsRemaining(remaining);
      if (remaining > 0) {
        addLog(`${remaining} shot(s) remaining this turn.`);
        return;
      }
    }

    // Weather update
    let effectiveWeather = currentWeather;
    if (enableWeather && weatherTurnsLeft > 0) {
      const newTurns = weatherTurnsLeft - 1;
      setWeatherTurnsLeft(newTurns);
      if (newTurns <= 0) {
        const w = rollWeather();
        setCurrentWeather(w.type);
        setWeatherTurnsLeft(w.duration);
        effectiveWeather = w.type;
        if (w.type !== "clear") {
          addLog(`Weather changed: ${w.label} \u2014 ${w.description}`);
          playSound("weather");
        }
      }
    }

    // Calm weather bonus shot: player gets an extra shot before AI turn
    if (effectiveWeather === "calm" && enableWeather && gameMode !== "salvo") {
      addLog("Calm seas grant a bonus shot!");
      return;
    }

    setTurn("ai");
    setAiThinking(true);
  };

  // Keep handleFireRef in sync so the timer always calls the latest version
  handleFireRef.current = handleFire;

  /* ─── Hotseat fire ─── */
  const handleHotseatFire = (coord: Coord) => {
    if (turn === "p1") {
      const { board, result, sunkShip } = receiveAttack(p2Board, coord);
      if (result === "already") return;
      setP2Board(board);
      setLastPlayerShot(coord);
      if (result === "hit") {
        playSound(sunkShip ? "sink" : "hit");
        addLog(sunkShip ? `P1 sank P2's ${sunkShip.name}! (${coordLabel(coord)})` : `P1 hit at ${coordLabel(coord)}.`);
      } else {
        playSound("miss");
        addLog(`P1 missed at ${coordLabel(coord)}.`);
      }
      if (allShipsSunk(board)) {
        setWinner("p1");
        setPhase("gameover");
        addLog("Player 1 wins!");
        playSound("win");
        setShowConfetti(true);
        return;
      }
      if (gameMode === "salvo") {
        const remaining = salvoShotsRemaining - 1;
        setSalvoShotsRemaining(remaining);
        if (remaining > 0) return;
      }
      const p2shots = gameMode === "salvo" ? remainingShips(board) : 1;
      setSalvoShotsRemaining(p2shots);
      setSalvoShotsTotal(p2shots);
      setTurn("p2");
      setLastPlayerShot(null);
      setLastAIShot(null);
      setShowPassDevice(true);
    } else if (turn === "p2") {
      const { board, result, sunkShip } = receiveAttack(playerBoard, coord);
      if (result === "already") return;
      setPlayerBoard(board);
      setLastPlayerShot(coord);
      if (result === "hit") {
        playSound(sunkShip ? "sink" : "hit");
        addLog(sunkShip ? `P2 sank P1's ${sunkShip.name}! (${coordLabel(coord)})` : `P2 hit at ${coordLabel(coord)}.`);
      } else {
        playSound("miss");
        addLog(`P2 missed at ${coordLabel(coord)}.`);
      }
      if (allShipsSunk(board)) {
        setWinner("p2");
        setPhase("gameover");
        addLog("Player 2 wins!");
        playSound("win");
        setShowConfetti(true);
        return;
      }
      if (gameMode === "salvo") {
        const remaining = salvoShotsRemaining - 1;
        setSalvoShotsRemaining(remaining);
        if (remaining > 0) return;
      }
      const p1shots = gameMode === "salvo" ? remainingShips(board) : 1;
      setSalvoShotsRemaining(p1shots);
      setSalvoShotsTotal(p1shots);
      setTurn("p1");
      setLastPlayerShot(null);
      setLastAIShot(null);
      setShowPassDevice(true);
    }
  };

  // AI takes its turn
  useEffect(() => {
    if (phase !== "playing" || playerMode === "hotseat") return;
    if (turn !== "ai") return;

    const aiShotsCount = gameMode === "salvo" ? remainingShips(aiBoard) : 1;
    let shotsFired = 0;
    let currentBoard = playerBoard;
    let currentAiState = aiState;
    let activeTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const fireNextShot = () => {
      if (cancelled) return;
      if (shotsFired >= aiShotsCount) {
        setAiThinking(false);
        const pSalvo = gameMode === "salvo" ? remainingShips(currentBoard) : 1;
        setSalvoShotsRemaining(pSalvo);
        setSalvoShotsTotal(pSalvo);
        if (gameMode === "salvo") addLog(`Your turn: ${pSalvo} shot(s).`);
        setTurn("player");
        playSound("turn");
        return;
      }

      activeTimer = setTimeout(() => {
        if (cancelled) return;
        let moveResult;
        if (aiPersonality !== "balanced") {
          moveResult = choosePersonalityMove(currentBoard, currentAiState, aiPersonality, effectiveDifficulty);
        } else {
          moveResult = chooseAIMove(currentBoard, currentAiState, effectiveDifficulty);
        }
        const { move, state } = moveResult;
        const { board: nextBoard, result, sunkShip } = receiveAttack(currentBoard, move);
        currentBoard = nextBoard;
        currentAiState = updateAIAfterResult(state, nextBoard, move, result, !!sunkShip);
        shotsFired++;

        setPlayerBoard(nextBoard);
        setLastAIShot(move);
        setAiState(currentAiState);

        // Record replay
        if (replayRef.current) {
          replayRef.current = recordMove(replayRef.current, "ai", move, result, sunkShip?.name);
        }

        if (result === "hit") {
          playSound(sunkShip ? "sink" : "hit");
          addLog(sunkShip
            ? `Enemy sank your ${sunkShip.name}! (${coordLabel(move)})`
            : `Enemy hit your fleet at ${coordLabel(move)}.`);
        } else {
          playSound("miss");
          addLog(`Enemy missed at ${coordLabel(move)}.`);
        }

        if (allShipsSunk(nextBoard)) {
          setWinner("ai");
          setPhase("gameover");
          addLog("Defeat! The enemy sank your fleet.");
          playSound("lose");
          narratorSpeak("lose");
          recordResult(false);
          setAiThinking(false);
          return;
        }

        // Check player ship health for narrator
        const aliveCount = nextBoard.ships.filter((s) => !s.hits.every(Boolean)).length;
        if (aliveCount <= 2 && aliveCount > 0) narratorSpeak("lowHealth");

        if (shotsFired < aiShotsCount && gameMode === "salvo") {
          addLog(`Enemy has ${aiShotsCount - shotsFired} shot(s) remaining.`);
        }

        fireNextShot();
      }, shotsFired === 0 ? aiDelayMs : Math.min(350, aiDelayMs));
    };

    fireNextShot();
    return () => {
      cancelled = true;
      if (activeTimer) clearTimeout(activeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* */ }
    unlockAchievement("tutorial_complete");
  };

  const handleShare = () => {
    const stats = countShots(aiBoard);
    const acc = stats.shots === 0 ? 0 : Math.round((stats.hits / stats.shots) * 100);
    const matchRecord: MatchRecord = {
      id: "", date: "", won: winner === "player",
      difficulty, mode: gameMode, playerMode,
      shots: stats.shots, hits: stats.hits, accuracy: acc,
      duration: (Date.now() - gameStartRef.current) / 1000,
      seed: activeSeed,
    };
    const card = generateShareCard(matchRecord, aiBoard);
    copyToClipboard(card);
    unlockAchievement("share_result");
  };

  const winnerLabel =
    winner === "player" || winner === "p1"
      ? playerMode === "hotseat" ? "Player 1 wins!" : "You win!"
      : winner === "p2" ? "Player 2 wins!" : "You lose.";

  const turnLabel = (() => {
    if (phase === "gameover") return winnerLabel;
    if (playerMode === "hotseat") {
      return turn === "p1" ? "Player 1's turn" : "Player 2's turn";
    }
    if (aiThinking) return "Enemy is analyzing...";
    if (turn === "player") {
      let label = "";
      if (gameMode === "salvo" && salvoShotsRemaining > 0) {
        label = `Your turn \u2014 ${salvoShotsRemaining}/${salvoShotsTotal} shots remaining`;
      } else {
        label = "Your turn \u2014 fire at enemy waters.";
      }
      if (timedTurns > 0 && turnTimer > 0) {
        label += ` (${turnTimer}s)`;
      }
      return label;
    }
    return "Enemy is taking aim\u2026";
  })();

  const leftBoard = (playerMode === "hotseat" && turn === "p2") || phase === "setup-p2" ? p2Board : playerBoard;
  const rightBoard = playerMode === "hotseat"
    ? turn === "p1" ? p2Board : playerBoard
    : aiBoard;

  const gameDuration = phase === "gameover" ? (Date.now() - gameStartRef.current) / 1000 : 0;
  const xpState = loadXP();

  return (
    <div className="app">
      <Confetti active={showConfetti} />

      {/* Toasts */}
      {achievementToast && (
        <div className="toast toast--achievement">
          Achievement Unlocked: {achievementToast}
        </div>
      )}
      {xpToast && (
        <div className="toast toast--levelup">
          Level Up! Level {xpToast.level}
        </div>
      )}

      {/* Weather indicator */}
      {phase === "playing" && enableWeather && currentWeather !== "clear" && (
        <div className="weather-indicator">
          {WEATHER_EFFECTS[currentWeather]?.label ?? currentWeather}
          {weatherTurnsLeft > 0 && ` (${weatherTurnsLeft} turns)`}
        </div>
      )}

      {phase === "gameover" && (
        <GameOverOverlay
          won={winner === "player" || winner === "p1" || winner === "p2"}
          label={winnerLabel}
          shots={playerStats.shots}
          hits={playerStats.hits}
          accuracy={accuracy}
          duration={gameDuration}
          xpEarned={lastGameXP}
          onPlayAgain={newGame}
          onShowAnalysis={playerMode === "vs-ai" ? () => setShowAnalysis(true) : undefined}
          onShare={playerMode === "vs-ai" ? handleShare : undefined}
          onViewReplay={() => setShowReplays(true)}
        />
      )}

      {showPassDevice && playerMode === "hotseat" && phase === "playing" && (
        <PassDevice
          playerName={turn === "p1" ? "Player 1" : "Player 2"}
          onReady={() => setShowPassDevice(false)}
        />
      )}

      <header className="app__header">
        <div className="app__titles">
          <h1>Battleship</h1>
          <p className="app__subtitle">
            {playerMode === "hotseat" ? "Pass & Play" : "Human vs AI"}
            {xpState.level > 1 && ` \u2014 ${getTitle(xpState.level)} (Lv.${xpState.level})`}
          </p>
        </div>
        <div className="app__meta">
          {playerMode === "vs-ai" && (
            <span className="record" title="Wins\u2013Losses">W {record.wins} \u00B7 L {record.losses}</span>
          )}
          <button type="button" className="icon-btn" onClick={() => setShowProfile(true)} title="Profile">
            Profile
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowAchievements(true)} title="Achievements">
            Achievements
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowHistory(true)} title="Stats">
            Stats
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowCampaign(true)} title="Campaign">
            Campaign
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowReplays(true)} title="Replays">
            Replays
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowShortcuts(true)} title="Shortcuts (?)">
            ?
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={muted}
            onClick={() => setMutedState((m) => !m)}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "Muted" : "Sound"}
          </button>
        </div>
      </header>

      {(phase === "setup" || phase === "setup-p2") && (
        <section className="panel" aria-label="Setup">
          <div className="panel__controls">
            <div>
              <strong>
                {phase === "setup-p2" ? "Player 2: Place your fleet" : "Place your fleet"}
              </strong>
              <p className="hint">
                {activeNextDef
                  ? `Placing: ${activeNextDef.name} (${activeNextDef.size}). Click your grid or drag from the dock.`
                  : "All ships placed. Ready to start!"}
              </p>
              <p className="hint">
                Orientation: <strong>{orientation}</strong> \u2014 press <kbd>R</kbd> or tap Rotate. <kbd>U</kbd> to undo.
              </p>

              {phase === "setup" && (
                <>
                  {/* Board size */}
                  <div className="settings-row">
                    <span className="settings-label">Board:</span>
                    <div className="settings-options" role="radiogroup" aria-label="Board size">
                      {BOARD_SIZES.map((b) => (
                        <button
                          key={b.size}
                          type="button"
                          role="radio"
                          aria-checked={boardSize === b.size}
                          className={`chip${boardSize === b.size ? " chip--active" : ""}`}
                          onClick={() => handleBoardSizeChange(b.size)}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game mode */}
                  <div className="settings-row">
                    <span className="settings-label">Mode:</span>
                    <div className="settings-options" role="radiogroup" aria-label="Game mode">
                      {(["classic", "salvo"] as GameMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={gameMode === m}
                          className={`chip${gameMode === m ? " chip--active" : ""}`}
                          onClick={() => setGameMode(m)}
                        >
                          {m === "classic" ? "Classic" : "Salvo"}
                        </button>
                      ))}
                    </div>
                    <span className="hint">
                      {gameMode === "salvo" ? "Fire one shot per surviving ship each turn." : "One shot per turn."}
                    </span>
                  </div>

                  {/* Player mode */}
                  <div className="settings-row">
                    <span className="settings-label">Players:</span>
                    <div className="settings-options" role="radiogroup" aria-label="Player mode">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={playerMode === "vs-ai"}
                        className={`chip${playerMode === "vs-ai" ? " chip--active" : ""}`}
                        onClick={() => setPlayerMode("vs-ai")}
                      >
                        vs AI
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={playerMode === "hotseat"}
                        className={`chip${playerMode === "hotseat" ? " chip--active" : ""}`}
                        onClick={() => setPlayerMode("hotseat")}
                      >
                        2-Player
                      </button>
                    </div>
                  </div>

                  {/* Difficulty */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <span className="settings-label">AI difficulty:</span>
                      <div className="settings-options" role="radiogroup" aria-label="AI difficulty">
                        {(["easy", "medium", "hard", "admiral"] as Difficulty[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={difficulty === d}
                            className={`chip${difficulty === d ? " chip--active" : ""}`}
                            onClick={() => setDifficulty(d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <span className="hint">{DIFFICULTY_INFO[difficulty]}</span>
                    </div>
                  )}

                  {/* AI Personality */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <span className="settings-label">AI style:</span>
                      <div className="settings-options" role="radiogroup" aria-label="AI personality">
                        {(["balanced", "aggressive", "cautious", "chaotic", "methodical"] as AIPersonality[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            role="radio"
                            aria-checked={aiPersonality === p}
                            className={`chip${aiPersonality === p ? " chip--active" : ""}`}
                            onClick={() => setAiPersonality(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Speed */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <span className="settings-label">Speed:</span>
                      <div className="settings-options" role="radiogroup" aria-label="AI speed">
                        {Object.keys(AI_SPEEDS).map((s) => (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={aiSpeed === s}
                            className={`chip${aiSpeed === s ? " chip--active" : ""}`}
                            onClick={() => setAiSpeed(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toggles */}
                  <div className="settings-row settings-toggles">
                    {playerMode === "vs-ai" && (
                      <label className="toggle-label">
                        <input type="checkbox" checked={enablePowerUps} onChange={(e) => setEnablePowerUps(e.target.checked)} />
                        Power-ups
                      </label>
                    )}
                    <label className="toggle-label">
                      <input type="checkbox" checked={enableWeather} onChange={(e) => setEnableWeather(e.target.checked)} />
                      Weather
                    </label>
                    <label className="toggle-label">
                      <input type="checkbox" checked={enableNarrator} onChange={(e) => setEnableNarrator(e.target.checked)} />
                      Narrator
                    </label>
                  </div>

                  {/* Timed turns */}
                  <div className="settings-row">
                    <span className="settings-label">Timer:</span>
                    <div className="settings-options" role="radiogroup" aria-label="Turn timer">
                      {[0, 10, 30, 60].map((t) => (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={timedTurns === t}
                          className={`chip${timedTurns === t ? " chip--active" : ""}`}
                          onClick={() => setTimedTurns(t)}
                        >
                          {t === 0 ? "Off" : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seed */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <label className="toggle-label">
                        <input type="checkbox" checked={useSeed} onChange={(e) => setUseSeed(e.target.checked)} />
                        Use game seed
                      </label>
                      {useSeed && (
                        <input
                          type="text"
                          className="seed-input"
                          placeholder="Enter seed (e.g. AB34)"
                          value={seedInput}
                          onChange={(e) => setSeedInput(e.target.value.toUpperCase())}
                          maxLength={12}
                          aria-label="Game seed"
                        />
                      )}
                    </div>
                  )}

                  {/* Theme */}
                  <div className="settings-row">
                    <span className="settings-label">Theme:</span>
                    <ThemeSwitcher current={theme} onChange={changeTheme} />
                  </div>
                </>
              )}
            </div>
            <div className="panel__buttons">
              <button type="button" onClick={rotate}>Rotate (R)</button>
              <button type="button" onClick={handleUndo} disabled={placementHistory.length === 0}>Undo (U)</button>
              <button type="button" onClick={handleRandomFill}>Random</button>
              <button type="button" onClick={handleResetPlacement}>Reset</button>
              <button
                type="button"
                className="btn-primary"
                disabled={phase === "setup" ? !allPlaced : !allPlacedP2}
                onClick={startGame}
              >
                {phase === "setup" && playerMode === "hotseat" ? "Next: P2 Setup" : "Start game"}
              </button>
            </div>
          </div>

          <ShipDock
            shipDefs={currentFleet}
            placedCount={phase === "setup-p2" ? p2Board.ships.length : playerBoard.ships.length}
            currentOrientation={orientation}
          />
        </section>
      )}

      {phase !== "setup" && phase !== "setup-p2" && (
        <section className="panel" aria-label="Game status">
          <div className="status">
            <span
              className={`status__msg${aiThinking ? " status__msg--thinking" : ""}`}
              role="status"
              aria-live="polite"
            >
              {turnLabel}
            </span>
            {playerMode === "vs-ai" && (
              <span className="status__stats">
                Shots {playerStats.shots} \u00B7 Hits {playerStats.hits} \u00B7 Accuracy {accuracy}%
              </span>
            )}
            <span className="status__ships">
              {playerMode === "hotseat" ? (
                <>P1: {remainingShips(playerBoard)} left \u00B7 P2: {remainingShips(p2Board)} left</>
              ) : (
                <>You: {remainingShips(playerBoard)} left \u00B7 Enemy: {remainingShips(aiBoard)} left</>
              )}
            </span>
            {activeSeed && playerMode === "vs-ai" && (
              <span className="status__seed" title="Game seed">Seed: {activeSeed}</span>
            )}
            {phase === "playing" && turn === "player" && playerMode === "vs-ai" && (
              <button type="button" className="hint-btn" onClick={handleHint} title="Get a hint (H)">
                Hint
              </button>
            )}
            {phase === "gameover" && (
              <button type="button" className="btn-primary" onClick={newGame}>Play again</button>
            )}
          </div>

          {enablePowerUps && playerMode === "vs-ai" && phase === "playing" && (
            <PowerUpBar
              powerUps={powerUps}
              activePowerUp={activePowerUp}
              onSelect={setActivePowerUp}
              disabled={turn !== "player"}
            />
          )}
        </section>
      )}

      <main className="boards">
        <div className="board-wrap">
          <h2>
            {playerMode === "hotseat"
              ? turn === "p2" ? "Your waters (P2)" : "Your waters (P1)"
              : "Your waters"}
          </h2>
          <BoardGrid
            board={leftBoard}
            mode="own"
            showShips
            disabled={phase !== "setup" && phase !== "setup-p2"}
            onCellClick={phase === "setup" || phase === "setup-p2" ? handlePlace : undefined}
            onCellHover={phase === "setup" || phase === "setup-p2" ? setHover : undefined}
            previewCells={previewCells}
            previewValid={previewValid}
            lastShot={phase === "playing" ? lastAIShot : null}
            onShipDrop={phase === "setup" || phase === "setup-p2" ? handleShipDrop : undefined}
          />
          {phase !== "setup" && phase !== "setup-p2" && (
            <FleetStatus
              title={playerMode === "hotseat" && turn === "p2" ? "P2 fleet" : "Your fleet"}
              board={leftBoard}
            />
          )}
        </div>

        <div className="board-wrap">
          <h2>
            {playerMode === "hotseat"
              ? turn === "p1" ? "P2 waters" : "P1 waters"
              : "Enemy waters"}
          </h2>
          <BoardGrid
            board={rightBoard}
            mode="tracking"
            showShips={phase === "gameover"}
            disabled={
              phase !== "playing" ||
              (playerMode === "vs-ai" && turn !== "player") ||
              showPassDevice
            }
            onCellClick={handleFire}
            lastShot={phase === "playing" ? lastPlayerShot : null}
            radarCells={radarCells.size > 0 ? radarCells : undefined}
            airstrikeCells={airstrikeCells.size > 0 ? airstrikeCells : undefined}
            sonarOverlay={sonarOverlay}
          />
          {phase !== "setup" && phase !== "setup-p2" && (
            <FleetStatus
              title={
                playerMode === "hotseat"
                  ? turn === "p1" ? "P2 fleet" : "P1 fleet"
                  : "Enemy fleet"
              }
              board={rightBoard}
              revealHits={false}
            />
          )}
        </div>
      </main>

      <section className="log" aria-live="polite" aria-label="Battle log">
        <h2>Battle log</h2>
        <ul>
          {log.map((entry, i) => (
            <li key={`${i}-${entry}`}>{entry}</li>
          ))}
        </ul>
      </section>

      <footer className="app__footer">
        <a href="https://github.com/Deven-Shah-98/battleship" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
        <button type="button" className="icon-btn" onClick={() => setShowTutorial(true)}>Tutorial</button>
      </footer>

      {/* Modals */}
      <MatchHistoryPanel open={showHistory} onClose={() => setShowHistory(false)} />
      <AchievementPanel open={showAchievements} onClose={() => setShowAchievements(false)} />
      <PlayerProfile open={showProfile} onClose={() => setShowProfile(false)} />
      {showAnalysis && phase === "gameover" && (
        <PostGameAnalysis
          open={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          playerBoard={playerBoard}
          enemyBoard={aiBoard}
          won={winner === "player"}
          shots={playerStats.shots}
          hits={playerStats.hits}
          accuracy={accuracy}
          duration={gameDuration}
        />
      )}
      <Tutorial
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />
      <CampaignPanel open={showCampaign} onClose={() => setShowCampaign(false)} onStartMission={() => { setShowCampaign(false); }} />
      <ReplayViewer open={showReplays} onClose={() => { setShowReplays(false); unlockAchievement("replay_watched"); }} />
      <KeyboardShortcuts open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
