import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BoardGrid from "./components/BoardGrid";
import FleetStatus from "./components/FleetStatus";
import Confetti from "./components/Confetti";
import PassDevice from "./components/PassDevice";
import PowerUpBar from "./components/PowerUpBar";
import ThemeSwitcher from "./components/ThemeSwitcher";
import GameOverOverlay from "./components/GameOverOverlay";
import ShipDock from "./components/ShipDock";
import { InfoTip } from "./components/InfoTip";
import { completeMission } from "./game/campaign";
import Sidebar from "./components/Sidebar";
/* Gameplay HUD elements (always loaded — small components used during play phase) */
import { ComboDisplay } from "./components/ComboDisplay";
import { SeasonalBanner, WinProbabilityBar, MoraleIndicator } from "./components/VisualPanel";

/* Lazy-loaded panels (only loaded when opened) */
const MatchHistoryPanel = lazy(() => import("./components/MatchHistory"));
const AchievementPanel = lazy(() => import("./components/AchievementPanel"));
const PlayerProfile = lazy(() => import("./components/PlayerProfile"));
const PostGameAnalysis = lazy(() => import("./components/PostGameAnalysis"));
const Tutorial = lazy(() => import("./components/Tutorial"));
const HelpGuide = lazy(() => import("./components/HelpGuide"));
const CampaignPanel = lazy(() => import("./components/CampaignPanel"));
const ReplayViewer = lazy(() => import("./components/ReplayViewer"));
const KeyboardShortcuts = lazy(() => import("./components/KeyboardShortcuts"));
const LazyPrestigePanel = lazy(() => import("./components/PrestigePanel").then(m => ({ default: m.PrestigePanel })));
const LazyLoadoutPanel = lazy(() => import("./components/LoadoutPanel").then(m => ({ default: m.LoadoutPanel })));
const LazyMilestonePanel = lazy(() => import("./components/MilestonePanel").then(m => ({ default: m.MilestonePanel })));
const LazyExportImportPanel = lazy(() => import("./components/ExportImportPanel").then(m => ({ default: m.ExportImportPanel })));
const LazyLossAnalysis = lazy(() => import("./components/LossAnalysis").then(m => ({ default: m.LossAnalysis })));
const LazySettingsPanel = lazy(() => import("./components/SettingsPanel").then(m => ({ default: m.SettingsPanel })));
const LazyStrategyNotes = lazy(() => import("./components/StrategyNotes").then(m => ({ default: m.StrategyNotes })));
import { createComboState, updateCombo, type ComboState } from "./game/experimental";
import { predictWinProbability } from "./game/analytics";
import { getAIDialogue, type CoachSuggestion } from "./game/aiEnhancements";
import { createDayNightState, advanceDayNight, type DayNightState } from "./game/visual";
import { createMoraleState, updateMorale, type MoraleState } from "./game/advancedGameplay";
import { generateBounties, type Bounty } from "./game/advancedGameplay";
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
import { playSound, setMuted, startMusic, stopMusic, updateMusicIntensity, narratorSpeak, setNarratorEnabled, columnToPan } from "./sound";
import { seededRng, randomSeedString } from "./game/seed";
import { recordMasteryWin } from "./game/mastery";
import { addJournalEntry } from "./game/journal";
import { updateBattlePassProgress } from "./game/battlePass";
import { updateStreak, getStreakLabel } from "./game/streaks";
import {
  airstrikeTargets,
  canUsePowerUp,
  radarScan,
  sonarPing,
  spendPowerUp,
} from "./game/powerups";
import { checkGameAchievements, ACHIEVEMENTS, unlockAchievement } from "./game/achievements";
import { addGameXP, loadXP, getTitle } from "./game/xp";
import { loadSettings, saveSettings, applySettingsToDOM, type GameSettings } from "./game/settings";
import { updateMilestones, loadMilestones } from "./game/milestones";
import { generateIslands, createShrinkState, advanceShrink, generateReefs, type ShrinkState } from "./game/variants";
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

const PERSONALITY_INFO: Record<AIPersonality, string> = {
  balanced: "Well-rounded play \u2014 mixes aggression and patience.",
  aggressive: "Immediately chases every hit \u2014 relentless but predictable.",
  cautious: "Spreads shots wide \u2014 slow but covers the board evenly.",
  chaotic: "Completely unpredictable \u2014 occasional flashes of brilliance.",
  methodical: "Scans row by row \u2014 systematic and thorough.",
};

const SPEED_INFO: Record<string, string> = {
  instant: "No delay \u2014 AI fires immediately.",
  fast: "300ms delay \u2014 quick pacing.",
  normal: "700ms delay \u2014 natural rhythm.",
  slow: "1.5s delay \u2014 time to think.",
  dramatic: "2.5s delay \u2014 suspenseful pauses.",
};

const HEADER_TOOLTIPS: Record<string, string> = {
  Profile: "View your level, rank, lifetime stats, and accuracy trends.",
  Achievements: "Browse 50+ unlockable achievements and track your progress.",
  Stats: "Match history log of your last 50 games with full details.",
  Campaign: "10 story missions with unique objectives and escalating difficulty.",
  Replays: "Watch any past game move-by-move with playback controls.",
  Prestige: "Reset your level for a prestige star and exclusive rewards.",
  Loadouts: "Save and load your favorite settings combinations.",
  Milestones: "Track lifetime stat badges (shots, sinks, wins, streaks).",
  Save: "Export/import all progress as a JSON file for backup.",
  Settings: "Board variants, accessibility, assists, and platform options.",
  Notes: "Strategy notepad for tracking patterns during play.",
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
  const [enemyFleetOverride, setEnemyFleetOverride] = useState<ShipDef[] | null>(null);
  const [aiSpeed, setAiSpeed] = useState<string>("normal");
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>("balanced");
  const [enableWeather, setEnableWeather] = useState(false);
  const [timedTurns, setTimedTurns] = useState(0); // 0 = unlimited
  const [enableNarrator, setEnableNarrator] = useState(false);
  const [activePreset, setActivePreset] = useState<"quick" | "standard" | "advanced" | null>("standard");

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
  const gameEndRef = useRef<number>(0);

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
  const [activeCampaignMissionId, setActiveCampaignMissionId] = useState<string | null>(null);
  const [showReplays, setShowReplays] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [showLoadouts, setShowLoadouts] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showLossAnalysis, setShowLossAnalysis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStrategyNotes, setShowStrategyNotes] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  /* ─── Game Settings (accessibility, board variants) ─── */
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => loadSettings());

  /* ─── Board Variants ─── */
  const [_islands, setIslands] = useState<Set<string>>(new Set());
  const [_reefs, setReefs] = useState<Set<string>>(new Set());
  const [shrinkState, setShrinkState] = useState<ShrinkState | null>(null);

  /* ─── Ship abilities ─── */
  const [shieldedShips, setShieldedShips] = useState<Set<string>>(new Set());
  const [_divedSubmarine, setDivedSubmarine] = useState(false);
  const [_repairUsed, setRepairUsed] = useState(false);
  const [_mines, setMines] = useState<Set<string>>(new Set());
  const [scoutReveal, setScoutReveal] = useState<string | null>(null);
  const [_moveShipUsed, setMoveShipUsed] = useState(false);
  const turnCountRef = useRef(0);

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
  const maxHitStreakRef = useRef(0);
  const sunkOrderRef = useRef<string[]>([]);
  const usedPowerUpsRef = useRef<Set<string>>(new Set());
  const sinksThisTurnRef = useRef(0);
  const maxSinksInOneTurnRef = useRef(0);

  /* ─── Hint ─── */
  const [hintCell, setHintCell] = useState<Coord | null>(null);

  /* ─── Last game XP for overlay ─── */
  const [lastGameXP, setLastGameXP] = useState(0);

  /* ─── Effective difficulty (progressive AI) ─── */
  const [effectiveDifficulty, setEffectiveDifficulty] = useState<Difficulty>("medium");

  /* ─── Board setup tracking ─── */
  const [placementHistory, setPlacementHistory] = useState<Board[]>([]);

  /* ─── New Feature State (100 More) ─── */
  const [_captainsLog, _setCaptainsLog] = useState<{turn:number;text:string;mood:string}[]>([]);
  const [comboState, setComboState] = useState<ComboState>(() => createComboState());
  const [_dayNightState, setDayNightState] = useState<DayNightState>(() => createDayNightState());
  const [moraleState, setMoraleState] = useState<MoraleState>(() => createMoraleState());
  const [_bounties, setBounties] = useState<Bounty[]>([]);
  const [_coachSuggestions, setCoachSuggestions] = useState<CoachSuggestion[]>([]);
  const [aiDialogue, setAiDialogue] = useState<string | null>(null);
  const [winProbability, setWinProbability] = useState(0.5);

  /* ─── Sidebar ─── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState<string | null>("core");

  const sidebarCategories = [
    {
      name: "Play",
      icon: "\u2694",
      items: [
        { label: "Campaign", icon: "\uD83C\uDFAF", onClick: () => setShowCampaign(true) },
      ],
    },
    {
      name: "Progress",
      icon: "\uD83D\uDCC8",
      items: [
        { label: "Profile", icon: "\uD83D\uDC64", onClick: () => setShowProfile(true) },
        { label: "Achievements", icon: "\uD83C\uDFC6", onClick: () => setShowAchievements(true) },
        { label: "Stats", icon: "\uD83D\uDCCA", onClick: () => setShowHistory(true) },
        { label: "Milestones", icon: "\uD83C\uDFC5", onClick: () => setShowMilestones(true) },
        { label: "Prestige", icon: "\u2B50", onClick: () => setShowPrestige(true) },
        { label: "Replays", icon: "\u23EF", onClick: () => setShowReplays(true) },
      ],
    },
    {
      name: "Settings",
      icon: "\u2699",
      items: [
        { label: "Settings", icon: "\u2699", onClick: () => setShowSettings(true) },
        { label: "Loadouts", icon: "\uD83D\uDCE6", onClick: () => setShowLoadouts(true) },
        { label: "Save / Export", icon: "\uD83D\uDCBE", onClick: () => setShowExportImport(true) },
        { label: "Notes", icon: "\uD83D\uDCDD", onClick: () => setShowStrategyNotes(true) },
        { label: "Shortcuts", icon: "\u2328", onClick: () => setShowShortcuts(true) },
      ],
    },
  ];

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

  // Apply game settings to DOM
  useEffect(() => { applySettingsToDOM(gameSettings); }, [gameSettings]);

  // Expose board column count (cells + label column) for responsive cell sizing
  useEffect(() => {
    document.documentElement.style.setProperty("--board-cols", String(boardSize + 1));
  }, [boardSize]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setGameSettings(newSettings);
    saveSettings(newSettings);
  }, []);

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
        setEffectiveDifficulty(saved.effectiveDifficulty ?? saved.difficulty ?? "medium");
        setEnableWeather(saved.enableWeather ?? false);
        setTimedTurns(saved.timedTurns ?? 0);
        setEnableNarrator(saved.enableNarrator ?? false);
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
        currentWeather, weatherTurnsLeft, effectiveDifficulty,
        enableWeather, timedTurns, enableNarrator,
        gameStart: gameStartRef.current,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch { /* */ }
  }, [phase, playerBoard, aiBoard, turn, aiState, log, difficulty, gameMode,
    enablePowerUps, powerUps, activeSeed, salvoShotsRemaining, salvoShotsTotal,
    boardSize, fleet, aiSpeed, aiPersonality, playerMode, currentWeather, weatherTurnsLeft,
    enableWeather, timedTurns, enableNarrator, effectiveDifficulty]);

  // Last Stand comeback — only fires once per game
  const lastStandRef = useRef(false);

  // Turn timer — use refs to avoid stale closures in salvo mode
  const timerExpiredRef = useRef(false);
  const handleFireRef = useRef<(coord: Coord) => void>(() => {});
  useEffect(() => {
    if (phase !== "playing" || timedTurns <= 0) return;
    if (turn === "ai") return;
    // Pause timer during hotseat pass-device screen
    if (showPassDevice) return;

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
  }, [phase, turn, timedTurns, showPassDevice]);

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
      // XP & Achievements — include current match so win counts/streaks aren't off-by-one
      const history = [matchRecord, ...loadHistory()];
      const newAchievements = checkGameAchievements(matchRecord, history, playerBoard, {
        hitStreak: maxHitStreakRef.current,
        sunkShipsOrder: sunkOrderRef.current,
        maxSinksInOneTurn: maxSinksInOneTurnRef.current,
        usedAllPowerUps: usedPowerUpsRef.current.size >= 3,
        boardSize,
        isBlitz: boardSize <= 6,
      });

      let achievementXP = 0;
      const unlockedNames: string[] = [];
      for (const id of newAchievements) {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (ach) {
          achievementXP += ach.xp;
          unlockedNames.push(ach.name);
        }
      }
      if (unlockedNames.length > 0) {
        let i = 0;
        const showNext = () => {
          if (i >= unlockedNames.length) return;
          setAchievementToast(unlockedNames[i]);
          playSound("achievement");
          i++;
          setTimeout(() => {
            setAchievementToast(null);
            setTimeout(showNext, 300);
          }, 3000);
        };
        showNext();
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

      // Save match with all fields populated
      addMatch(matchRecord);

      // Mastery + Journal
      if (won) recordMasteryWin(difficulty);
      addJournalEntry(won, matchRecord.accuracy, matchRecord.shots, matchRecord.duration, matchRecord.difficulty);

      // Battle pass progress
      const bpResult = updateBattlePassProgress(won, matchRecord.shots, sunkOrderRef.current.length, matchRecord.accuracy);
      if (bpResult.completed.length > 0) {
        addLog(`Battle Pass missions completed: ${bpResult.completed.join(", ")} (+${bpResult.xpEarned} XP)`);
      }

      // Win streak
      const streakResult = updateStreak(won);
      if (streakResult.effect) {
        addLog(`Win streak: ${streakResult.currentStreak}! ${getStreakLabel(streakResult.effect)}`);
      }

      // Campaign mission completion
      if (activeCampaignMissionId && won) {
        completeMission(activeCampaignMissionId, matchRecord.accuracy, matchRecord.shots);
        addLog(`Campaign mission completed! Stars earned based on ${matchRecord.accuracy}% accuracy.`);
        setActiveCampaignMissionId(null);
      }

      // Finalize replay
      if (replayRef.current) {
        const replay = finalizeReplay(replayRef.current, won ? "player" : "ai");
        saveReplay(replay);
        replayRef.current = null;
      }

      // Update milestones
      const milestones = loadMilestones();
      const duration2 = (Date.now() - gameStartRef.current) / 1000;
      const newMilestones = updateMilestones(milestones, {
        shots: stats.shots,
        hits: stats.hits,
        sinks: sunkOrderRef.current.length,
        won,
        duration: duration2,
        accuracy: acc,
        difficulty,
      });
      if (newMilestones.length > 0) {
        addLog(`Milestones unlocked: ${newMilestones.join(", ")}`);
      }

      // Clear autosave
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setSidebarOpen(false);
        setShowShortcuts(false);
        setShowAchievements(false);
        setShowProfile(false);
        setShowAnalysis(false);
        setShowTutorial(false);
        setShowCampaign(false);
        setShowReplays(false);
        setShowHistory(false);
        setShowPrestige(false);
        setShowLoadouts(false);
        setShowMilestones(false);
        setShowExportImport(false);
        setShowLossAnalysis(false);
        setShowSettings(false);
        setShowStrategyNotes(false);
        setShowHelpGuide(false);
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
    setAiBoard(createEmptyBoard(newSize));
    setP2Board(createEmptyBoard(newSize));
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
    const aiFleet = enemyFleetOverride ?? currentFleet;
    const enemyBoard = rng
      ? placeShipsRandomly(aiFleet, boardSize, rng)
      : placeShipsRandomly(aiFleet, boardSize);
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
    maxHitStreakRef.current = 0;
    sunkOrderRef.current = [];
    usedPowerUpsRef.current = new Set();
    sinksThisTurnRef.current = 0;
    maxSinksInOneTurnRef.current = 0;
    turnCountRef.current = 0;
    lastStandRef.current = false;

    // Board variants
    if (gameSettings.enableIslands) {
      setIslands(generateIslands(boardSize, 4));
    } else {
      setIslands(new Set());
    }
    if (gameSettings.enableReefs) {
      setReefs(generateReefs(boardSize, 3));
    } else {
      setReefs(new Set());
    }
    if (gameSettings.enableShrinking) {
      setShrinkState(createShrinkState(true));
    } else {
      setShrinkState(null);
    }

    // Ship abilities
    if (gameSettings.enableShields) {
      const shielded = new Set(currentFleet.map((s) => s.name));
      setShieldedShips(shielded);
    } else {
      setShieldedShips(new Set());
    }
    setDivedSubmarine(false);
    setRepairUsed(false);
    setMines(new Set());
    setScoutReveal(null);
    setMoveShipUsed(false);

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

    // New feature resets
    setComboState(createComboState());
    setDayNightState(createDayNightState());
    setMoraleState(createMoraleState());
    setBounties(generateBounties());
    setWinProbability(0.5);
    setAiDialogue(null);
    setCoachSuggestions([]);

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
    setEnemyFleetOverride(null);
    setActiveCampaignMissionId(null);
    lastStandRef.current = false;
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
        gameEndRef.current = Date.now();
        setPhase("gameover");
        addLog("Victory! You destroyed the enemy fleet.");
        playSound("win");
        narratorSpeak("win");
        recordResult(true, currentBoard);
        setShowConfetti(true);
        return true;
      }

      if (gameMode === "classic") {
        sinksThisTurnRef.current = 0;
        setTurn("ai");
        setAiThinking(true);
      }
      return true;
    }

    return false;
  };

  /* ─── Fire handler ─── */
  const handleFire = (coord: Coord, skipPowerUp = false) => {
    // Timer auto-fire sentinel: pick a random un-hit cell
    if (coord.row === -1 && coord.col === -1) {
      // Don't auto-fire while the pass-device screen is visible
      if (showPassDevice) return;
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
      setActivePowerUp(null);
      handleFire(randomCell, true);
      return;
    }
    if (phase !== "playing") return;

    if (!skipPowerUp && activePowerUp && enablePowerUps && playerMode === "vs-ai") {
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

    // Weather scatter (retry if scattered to already-hit cell)
    let targetCoord = coord;
    if (currentWeather !== "clear" && enableWeather) {
      const scattered = applyWeatherScatter(coord, currentWeather, boardSize);
      const scatteredKey = coordKey(scattered);
      if (aiBoard.shots[scatteredKey]) {
        addLog(`Weather scattered shot to ${coordLabel(scattered)} (already targeted) — using original ${coordLabel(coord)}.`);
      } else {
        targetCoord = scattered;
        if (targetCoord.row !== coord.row || targetCoord.col !== coord.col) {
          addLog(`Weather scattered shot from ${coordLabel(coord)} to ${coordLabel(targetCoord)}!`);
        }
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
      if (hitStreakRef.current > maxHitStreakRef.current) {
        maxHitStreakRef.current = hitStreakRef.current;
      }
      playSound(sunkShip ? "sink" : "hit", columnToPan(targetCoord.col, boardSize));
      narratorSpeak(sunkShip ? "sink" : "hit");
      if (sunkShip) {
        sunkOrderRef.current.push(sunkShip.name);
        sinksThisTurnRef.current += 1;
        if (sinksThisTurnRef.current > maxSinksInOneTurnRef.current) {
          maxSinksInOneTurnRef.current = sinksThisTurnRef.current;
        }
      }
      addLog(
        sunkShip
          ? `You sank the enemy ${sunkShip.name}! (${coordLabel(targetCoord)})`
          : `Hit at ${coordLabel(targetCoord)}.`,
      );
    } else {
      hitStreakRef.current = 0;
      playSound("miss", columnToPan(targetCoord.col, boardSize));
      narratorSpeak("miss");
      addLog(`You missed at ${coordLabel(targetCoord)}.`);
    }

    // Combo tracking
    setComboState(prev => updateCombo(prev, result === "hit"));

    // Morale update
    setMoraleState(prev => updateMorale(prev, result === "hit" ? (sunkShip ? "sink_enemy" : "hit_enemy") : "miss"));

    // Day/night cycle advancement
    setDayNightState(prev => advanceDayNight(prev));

    // Win probability update
    setWinProbability(predictWinProbability(remainingShips(playerBoard), board.ships.filter(s => !s.hits.every(Boolean)).length, accuracy, Object.keys(playerBoard.shots).length, boardSize));

    // AI dialogue on significant events
    if (sunkShip && aiPersonality) {
      const dialogue = getAIDialogue(aiPersonality, "onTakeHit");
      if (dialogue) setAiDialogue(dialogue);
    }

    // Music intensity
    const sunkCount = board.ships.filter((s) => s.hits.every(Boolean)).length;
    updateMusicIntensity(sunkCount / board.ships.length);

    if (allShipsSunk(board)) {
      setWinner("player");
      gameEndRef.current = Date.now();
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

    // Board variant: advance shrinking
    turnCountRef.current += 1;
    if (shrinkState) {
      const next = advanceShrink(shrinkState, boardSize);
      if (next.currentRing > shrinkState.currentRing) {
        addLog(`The board shrinks! Outer ring ${next.currentRing} is now blocked.`);
      }
      setShrinkState(next);
    }

    // Scout plane: every 3 turns reveal if a random row/col has ships
    if (gameSettings.enableScoutPlane && turnCountRef.current % 3 === 0) {
      const isRow = Math.random() > 0.5;
      const idx = Math.floor(Math.random() * boardSize);
      const label = isRow ? `Row ${idx + 1}` : `Col ${COLUMN_LABELS[idx]}`;
      const hasShip = board.ships.some((s) =>
        s.cells.some((c) => isRow ? c.row === idx : c.col === idx) && !s.hits.every(Boolean),
      );
      setScoutReveal(label);
      addLog(`Scout plane reports: ${label} ${hasShip ? "has ship activity!" : "is clear."}`);
      setTimeout(() => setScoutReveal(null), 3000);
    }

    sinksThisTurnRef.current = 0;
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
        gameEndRef.current = Date.now();
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
        gameEndRef.current = Date.now();
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
          gameEndRef.current = Date.now();
          setPhase("gameover");
          addLog("Defeat! The enemy sank your fleet.");
          playSound("lose");
          narratorSpeak("lose");
          recordResult(false);
          setAiThinking(false);
          return;
        }

        // Check player ship health for narrator + comeback mechanic
        const aliveCount = nextBoard.ships.filter((s) => !s.hits.every(Boolean)).length;
        if (aliveCount <= 2 && aliveCount > 0) narratorSpeak("lowHealth");
        if (aliveCount === 1 && gameSettings.enableComebackMechanic && !lastStandRef.current) {
          lastStandRef.current = true;
          addLog("Last Stand activated! +1 free Radar scan.");
          setPowerUps((prev) => ({ ...prev, radar: prev.radar + 1 }));
        }

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

  const gameDuration = phase === "gameover" ? (gameEndRef.current - gameStartRef.current) / 1000 : 0;
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
          onShowLossAnalysis={winner !== "player" && playerMode === "vs-ai" ? () => setShowLossAnalysis(true) : undefined}
          onShare={playerMode === "vs-ai" ? handleShare : undefined}
          onViewReplay={playerMode === "vs-ai" ? () => setShowReplays(true) : undefined}
        />
      )}

      {showPassDevice && playerMode === "hotseat" && phase === "playing" && (
        <PassDevice
          playerName={turn === "p1" ? "Player 1" : "Player 2"}
          onReady={() => setShowPassDevice(false)}
        />
      )}

      <a href="#main-content" className="skip-link">Skip to game</a>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={sidebarCategories}
      />

      <header className="app__header">
        <div className="app__header-left">
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <span className="hamburger-btn__line" />
            <span className="hamburger-btn__line" />
            <span className="hamburger-btn__line" />
          </button>
          <div className="app__titles">
            <h1>Battleship</h1>
            <p className="app__subtitle">
              {playerMode === "hotseat" ? "Pass & Play" : "Human vs AI"}
              {xpState.level > 1 && ` \u2014 ${getTitle(xpState.level)} (Lv.${xpState.level})`}
            </p>
          </div>
        </div>
        <div className="app__meta">
          {playerMode === "vs-ai" && (
            <span className="record" title="Wins–Losses">W {record.wins} {"\u00B7"} L {record.losses}</span>
          )}
          {xpState.level > 0 && (
            <div className="xp-bar-header" title={`${xpState.totalXP} XP total`}>
              <div className="xp-bar-header__fill" style={{ width: `${Math.min(100, ((xpState.totalXP % 1000) / 1000) * 100)}%` }} />
              <span className="xp-bar-header__label">Lv.{xpState.level}</span>
            </div>
          )}
          <button type="button" className="icon-btn icon-btn--help" onClick={() => setShowHelpGuide(true)} title="Help & Guide">
            Help
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowProfile(true)} title={HEADER_TOOLTIPS.Profile}>
            Profile
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={muted}
            onClick={() => setMutedState((m) => !m)}
            title={muted ? "Unmute sound effects and music" : "Mute all sound effects and music"}
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
                Orientation: <strong>{orientation}</strong> {"\u2014"} press <kbd>R</kbd> or tap Rotate. <kbd>U</kbd> to undo.
              </p>

              {/* Ship placement progress */}
              <div className="placement-progress">
                <div className="placement-progress__bar">
                  <div
                    className="placement-progress__fill"
                    style={{ width: `${(activeBoard.ships.length / currentFleet.length) * 100}%` }}
                  />
                </div>
                <span className="placement-progress__text">
                  {activeBoard.ships.length}/{currentFleet.length} ships placed
                </span>
              </div>

              {phase === "setup" && (
                <>
                  {/* Difficulty Presets */}
                  <div className="setup-presets">
                    <button
                      type="button"
                      className={`preset-btn${activePreset === "quick" ? " preset-btn--active" : ""}`}
                      onClick={() => { setActivePreset("quick"); handleBoardSizeChange(8); setGameMode("classic"); setDifficulty("easy"); setEnablePowerUps(false); setEnableWeather(false); setTimedTurns(0); }}
                      title="8x8, Classic, Easy AI, no extras"
                    >
                      Quick Play
                    </button>
                    <button
                      type="button"
                      className={`preset-btn${activePreset === "standard" ? " preset-btn--active" : ""}`}
                      onClick={() => { setActivePreset("standard"); handleBoardSizeChange(10); setGameMode("classic"); setDifficulty("medium"); setEnablePowerUps(false); setEnableWeather(false); setTimedTurns(0); }}
                      title="10x10, Classic, Medium AI"
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      className={`preset-btn${activePreset === "advanced" ? " preset-btn--active" : ""}`}
                      onClick={() => { setActivePreset("advanced"); handleBoardSizeChange(12); setGameMode("salvo"); setDifficulty("hard"); setEnablePowerUps(true); setEnableWeather(true); setTimedTurns(30); }}
                      title="12x12, Salvo, Hard AI, power-ups, weather, 30s timer"
                    >
                      Advanced
                    </button>
                  </div>

                  {/* Core Settings (always visible) */}
                  <div className="setup-section">
                    <button
                      type="button"
                      className={`setup-section__toggle${setupExpanded === "core" ? " setup-section__toggle--open" : ""}`}
                      onClick={() => setSetupExpanded(setupExpanded === "core" ? null : "core")}
                      aria-expanded={setupExpanded === "core"}
                    >
                      Core Settings
                      <span className="setup-section__chevron">{setupExpanded === "core" ? "\u25B4" : "\u25BE"}</span>
                    </button>
                    {setupExpanded === "core" && (
                      <div className="setup-section__body">
                        <div className="settings-row">
                          <span className="settings-label">Board: <InfoTip text={"Larger boards have more ships and take longer. 6\u00d76 is great for quick games; 15\u00d715 is for epic battles."} /></span>
                          <div className="settings-options" role="radiogroup" aria-label="Board size">
                            {BOARD_SIZES.map((b) => (
                              <button key={b.size} type="button" role="radio" aria-checked={boardSize === b.size} className={`chip${boardSize === b.size ? " chip--active" : ""}`} onClick={() => { setActivePreset(null); handleBoardSizeChange(b.size); }}>{b.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Mode: <InfoTip text={"Classic: one shot per turn. Salvo: fire one shot per surviving ship each turn \u2014 faster and more strategic!"} /></span>
                          <div className="settings-options" role="radiogroup" aria-label="Game mode">
                            {(["classic", "salvo"] as GameMode[]).map((m) => (
                              <button key={m} type="button" role="radio" aria-checked={gameMode === m} className={`chip${gameMode === m ? " chip--active" : ""}`} onClick={() => { setActivePreset(null); setGameMode(m); }}>{m === "classic" ? "Classic" : "Salvo"}</button>
                            ))}
                          </div>
                          <span className="hint">{gameMode === "salvo" ? "Fire one shot per surviving ship each turn." : "One shot per turn."}</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Players: <InfoTip text="vs AI: play against the computer. 2-Player: pass the device between two human players (hotseat mode)." /></span>
                          <div className="settings-options" role="radiogroup" aria-label="Player mode">
                            <button type="button" role="radio" aria-checked={playerMode === "vs-ai"} className={`chip${playerMode === "vs-ai" ? " chip--active" : ""}`} onClick={() => setPlayerMode("vs-ai")}>vs AI</button>
                            <button type="button" role="radio" aria-checked={playerMode === "hotseat"} className={`chip${playerMode === "hotseat" ? " chip--active" : ""}`} onClick={() => setPlayerMode("hotseat")}>2-Player</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Settings */}
                  {playerMode === "vs-ai" && (
                    <div className="setup-section">
                      <button
                        type="button"
                        className={`setup-section__toggle${setupExpanded === "ai" ? " setup-section__toggle--open" : ""}`}
                        onClick={() => setSetupExpanded(setupExpanded === "ai" ? null : "ai")}
                        aria-expanded={setupExpanded === "ai"}
                      >
                        AI Settings
                        <span className="setup-section__hint">{difficulty} / {aiPersonality}</span>
                        <span className="setup-section__chevron">{setupExpanded === "ai" ? "\u25B4" : "\u25BE"}</span>
                      </button>
                      {setupExpanded === "ai" && (
                        <div className="setup-section__body">
                          <div className="settings-row">
                            <span className="settings-label">AI difficulty: <InfoTip text={"Easy: random shots. Medium: hunts hits. Hard: probability targeting. Admiral: enhanced heatmap \u2014 the toughest."} /></span>
                            <div className="settings-options" role="radiogroup" aria-label="AI difficulty">
                              {(["easy", "medium", "hard", "admiral"] as Difficulty[]).map((d) => (
                                <button key={d} type="button" role="radio" aria-checked={difficulty === d} className={`chip${difficulty === d ? " chip--active" : ""}`} onClick={() => { setActivePreset(null); setDifficulty(d); }}>{d}</button>
                              ))}
                            </div>
                            <span className="hint">{DIFFICULTY_INFO[difficulty]}</span>
                          </div>
                          <div className="settings-row">
                            <span className="settings-label">AI style: <InfoTip text={PERSONALITY_INFO[aiPersonality]} /></span>
                            <div className="settings-options" role="radiogroup" aria-label="AI personality">
                              {(["balanced", "aggressive", "cautious", "chaotic", "methodical"] as AIPersonality[]).map((p) => (
                                <button key={p} type="button" role="radio" aria-checked={aiPersonality === p} className={`chip${aiPersonality === p ? " chip--active" : ""}`} onClick={() => setAiPersonality(p)}>{p}</button>
                              ))}
                            </div>
                          </div>
                          <div className="settings-row">
                            <span className="settings-label">Speed: <InfoTip text={SPEED_INFO[aiSpeed] || "Controls how fast the AI takes its turn."} /></span>
                            <div className="settings-options" role="radiogroup" aria-label="AI speed">
                              {Object.keys(AI_SPEEDS).map((s) => (
                                <button key={s} type="button" role="radio" aria-checked={aiSpeed === s} className={`chip${aiSpeed === s ? " chip--active" : ""}`} onClick={() => setAiSpeed(s)}>{s}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extras */}
                  <div className="setup-section">
                    <button
                      type="button"
                      className={`setup-section__toggle${setupExpanded === "extras" ? " setup-section__toggle--open" : ""}`}
                      onClick={() => setSetupExpanded(setupExpanded === "extras" ? null : "extras")}
                      aria-expanded={setupExpanded === "extras"}
                    >
                      Extras &amp; Modifiers
                      <span className="setup-section__hint">
                        {[enablePowerUps && "Power-ups", enableWeather && "Weather", enableNarrator && "Narrator", timedTurns > 0 && `${timedTurns}s timer`].filter(Boolean).join(", ") || "None"}
                      </span>
                      <span className="setup-section__chevron">{setupExpanded === "extras" ? "\u25B4" : "\u25BE"}</span>
                    </button>
                    {setupExpanded === "extras" && (
                      <div className="setup-section__body">
                        <div className="settings-row settings-toggles">
                          {playerMode === "vs-ai" && (
                            <label className="toggle-label" title="Enable Radar, Sonar, and Airstrike abilities during gameplay">
                              <input type="checkbox" checked={enablePowerUps} onChange={(e) => { setActivePreset(null); setEnablePowerUps(e.target.checked); }} />
                              Power-ups <InfoTip text={"Grants special abilities: Radar (reveal 3\u00d73 area), Sonar (count ships in area), Airstrike (bomb entire row/column). Limited uses each game."} />
                            </label>
                          )}
                          <label className="toggle-label" title="Random weather events that affect gameplay">
                            <input type="checkbox" checked={enableWeather} onChange={(e) => { setActivePreset(null); setEnableWeather(e.target.checked); }} />
                            Weather <InfoTip text="Randomly triggers Storm (power-ups disabled, shots scatter), Fog (reduced visibility), or Calm (bonus shot). Changes every few turns." />
                          </label>
                          <label className="toggle-label" title="AI narrator provides commentary on game events">
                            <input type="checkbox" checked={enableNarrator} onChange={(e) => setEnableNarrator(e.target.checked)} />
                            Narrator <InfoTip text="An AI narrator comments on game events: hits, misses, sinks, and dramatic moments. Uses text-to-speech when available." />
                          </label>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Timer: <InfoTip text="Set a countdown per turn. If time runs out, a random cell is auto-fired. Off = unlimited time to think." /></span>
                          <div className="settings-options" role="radiogroup" aria-label="Turn timer">
                            {[0, 10, 30, 60].map((t) => (
                              <button key={t} type="button" role="radio" aria-checked={timedTurns === t} className={`chip${timedTurns === t ? " chip--active" : ""}`} onClick={() => { setActivePreset(null); setTimedTurns(t); }}>{t === 0 ? "Off" : `${t}s`}</button>
                            ))}
                          </div>
                        </div>
                        {playerMode === "vs-ai" && (
                          <div className="settings-row">
                            <label className="toggle-label">
                              <input type="checkbox" checked={useSeed} onChange={(e) => setUseSeed(e.target.checked)} />
                              Use game seed <InfoTip text="A seed is a code that generates the same board layout every time. Share seeds with friends to play the exact same game and compare scores!" />
                            </label>
                            {useSeed && (
                              <input type="text" className="seed-input" placeholder="Enter seed (e.g. AB34)" value={seedInput} onChange={(e) => setSeedInput(e.target.value.toUpperCase())} maxLength={12} aria-label="Game seed" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Theme */}
                  <div className="settings-row">
                    <span className="settings-label">Theme: <InfoTip text="Visual color theme for the entire game. Midnight (purple), Arctic (light), Ember (orange), Ocean (teal), Neon (green/black)." /></span>
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
                Shots {playerStats.shots} {"\u00B7"} Hits {playerStats.hits} {"\u00B7"} Accuracy {accuracy}%
              </span>
            )}
            <span className="status__ships">
              {playerMode === "hotseat" ? (
                <>P1: {remainingShips(playerBoard)} left {"\u00B7"} P2: {remainingShips(p2Board)} left</>
              ) : (
                <>You: {remainingShips(playerBoard)} left {"\u00B7"} Enemy: {remainingShips(aiBoard)} left</>
              )}
            </span>
            {activeSeed && playerMode === "vs-ai" && (
              <span className="status__seed" title="Game seed">Seed: {activeSeed}</span>
            )}
            {scoutReveal && (
              <span className="status__scout">Scout: {scoutReveal}</span>
            )}
            {shrinkState && shrinkState.currentRing > 0 && (
              <span className="status__shrink">Board shrunk: ring {shrinkState.currentRing}</span>
            )}
            {shieldedShips.size > 0 && (
              <span className="status__shields">Shields: {shieldedShips.size} ships</span>
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
          {activePowerUp && phase === "playing" && (
            <div className="powerup-instruction" role="status" aria-live="polite">
              {activePowerUp === "radar" && "Click an enemy cell to scan a 3×3 area"}
              {activePowerUp === "sonar" && "Click an enemy cell to ping nearby ships"}
              {activePowerUp === "airstrike" && "Click an enemy cell to bomb a row/column"}
            </div>
          )}
        </section>
      )}

      <main id="main-content" className="boards">
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
            hintCell={hintCell}
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
        <button type="button" className="icon-btn" onClick={() => setShowTutorial(true)} title="Walk through all features step by step">Tutorial</button>
        <button type="button" className="icon-btn icon-btn--help" onClick={() => setShowHelpGuide(true)} title="Searchable guide to every feature">Help</button>
      </footer>

      {/* Modals — all lazy-loaded inside single Suspense boundary */}
      <Suspense fallback={null}>
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
      <CampaignPanel open={showCampaign} onClose={() => setShowCampaign(false)} onStartMission={(mission) => {
        setShowCampaign(false);
        const diffMap: Record<number, Difficulty> = { 1: "easy", 2: "medium", 3: "hard", 4: "admiral", 5: "admiral" };
        const diff = diffMap[mission.difficulty] ?? "medium";
        newGame();
        handleBoardSizeChange(mission.boardSize);
        setAiBoard(createEmptyBoard(mission.boardSize));
        setFleet([...mission.fleet]);
        setEnemyFleetOverride(mission.enemyFleet ? [...mission.enemyFleet] : null);
        setDifficulty(diff);
        if (mission.weather && mission.weather !== "clear") {
          setCurrentWeather(mission.weather);
          setWeatherTurnsLeft(99);
          setEnableWeather(true);
        } else {
          setEnableWeather(false);
        }
        setActiveCampaignMissionId(mission.id);
        addLog(`Campaign mission: ${mission.name} — ${mission.briefing}`);
      }} />
        <ReplayViewer open={showReplays} onClose={() => { setShowReplays(false); unlockAchievement("replay_watched"); }} />
        <KeyboardShortcuts open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        {showStrategyNotes && <LazyStrategyNotes open={showStrategyNotes} onClose={() => setShowStrategyNotes(false)} />}
        <HelpGuide open={showHelpGuide} onClose={() => setShowHelpGuide(false)} />
        {showPrestige && (
          <LazyPrestigePanel
            onPrestige={() => { setShowPrestige(false); newGame(); }}
            onClose={() => setShowPrestige(false)}
          />
        )}
        {showLoadouts && (
          <LazyLoadoutPanel
            currentSettings={{
              boardSize, fleet, difficulty, gameMode, aiPersonality,
              enablePowerUps, enableWeather, timedTurns, aiSpeed, theme,
            }}
            onApply={(loadout) => {
              handleBoardSizeChange(loadout.boardSize);
              setFleet([...loadout.fleet]);
              setDifficulty(loadout.difficulty as Difficulty);
              setGameMode(loadout.gameMode);
              setAiPersonality(loadout.aiPersonality);
              setEnablePowerUps(loadout.enablePowerUps);
              setEnableWeather(loadout.enableWeather);
              setTimedTurns(loadout.timedTurns);
              setAiSpeed(loadout.aiSpeed);
              if (loadout.theme && loadout.theme in THEMES) changeTheme(loadout.theme);
              setShowLoadouts(false);
            }}
            onClose={() => setShowLoadouts(false)}
          />
        )}
        {showMilestones && <LazyMilestonePanel onClose={() => setShowMilestones(false)} />}
        {showExportImport && <LazyExportImportPanel onClose={() => setShowExportImport(false)} onImport={() => setShowExportImport(false)} />}
        {showLossAnalysis && phase === "gameover" && (
          <LazyLossAnalysis aiBoard={aiBoard} won={winner === "player"} onClose={() => setShowLossAnalysis(false)} />
        )}
        {showSettings && (
          <LazySettingsPanel settings={gameSettings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
        )}
      </Suspense>

      {/* Combo display */}
      {phase === "playing" && playerMode === "vs-ai" && comboState.currentStreak >= 2 && <ComboDisplay streak={comboState.currentStreak} multiplier={comboState.multiplier} />}

      {/* Seasonal banner */}
      <SeasonalBanner />

      {/* Win probability bar */}
      {phase === "playing" && playerMode === "vs-ai" && <WinProbabilityBar probability={winProbability} />}

      {/* Morale indicator */}
      {phase === "playing" && playerMode === "vs-ai" && <MoraleIndicator morale={moraleState.morale} />}

      {/* AI Dialogue bubble */}
      {phase === "playing" && playerMode === "vs-ai" && aiDialogue && (
        <div style={{ position: "fixed", bottom: "2rem", left: "2rem", zIndex: 1000, maxWidth: "280px" }} className="glass" onClick={() => setAiDialogue(null)}>
          <div style={{ padding: "0.5rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem" }}>
            <div style={{ fontWeight: 600, fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.2rem" }}>AI Admiral</div>
            <div style={{ fontStyle: "italic" }}>{aiDialogue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
