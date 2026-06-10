import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BoardGrid from "./components/BoardGrid";
import FleetStatus from "./components/FleetStatus";
import Confetti from "./components/Confetti";
import PassDevice from "./components/PassDevice";
import PowerUpBar from "./components/PowerUpBar";
import MatchHistoryPanel from "./components/MatchHistory";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { addMatch } from "./utils/matchHistory";
import { applyTheme, loadTheme, saveTheme } from "./utils/theme";
import ShipDock from "./components/ShipDock";
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
  type AIState,
  type Difficulty,
} from "./game/ai";
import { COLUMN_LABELS, DEFAULT_POWERUPS, SHIP_DEFS } from "./game/constants";
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
} from "./game/types";
import { playSound, setMuted } from "./sound";
import { seededRng, randomSeedString } from "./game/seed";
import {
  airstrikeTargets,
  canUsePowerUp,
  radarScan,
  sonarPing,
  spendPowerUp,
} from "./game/powerups";

type Phase = "setup" | "setup-p2" | "playing" | "gameover";
type Turn = "player" | "ai" | "p1" | "p2";
type Winner = "player" | "ai" | "p1" | "p2" | null;

interface GameRecord {
  wins: number;
  losses: number;
}

const AI_DELAY_MS = 650;
const RECORD_KEY = "battleship.record";
const MUTE_KEY = "battleship.muted";

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

  /* ─── Game state ─── */
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerBoard, setPlayerBoard] = useState<Board>(() =>
    createEmptyBoard(),
  );
  const [aiBoard, setAiBoard] = useState<Board>(() => createEmptyBoard());
  // Hotseat: p2 board stores player 2's ships (attacked by p1)
  const [p2Board, setP2Board] = useState<Board>(() => createEmptyBoard());
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [hover, setHover] = useState<Coord | null>(null);
  const [turn, setTurn] = useState<Turn>("player");
  const [aiState, setAiState] = useState<AIState>(() => createAIState());
  const [winner, setWinner] = useState<Winner>(null);
  const [log, setLog] = useState<string[]>([]);
  const [muted, setMutedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [record, setRecord] = useState<GameRecord>(() => loadRecord());
  const [lastPlayerShot, setLastPlayerShot] = useState<Coord | null>(null);
  const [lastAIShot, setLastAIShot] = useState<Coord | null>(null);
  const [theme, setThemeState] = useState<ThemeName>(() => loadTheme());
  const [showHistory, setShowHistory] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const gameStartRef = useRef<number>(0);

  /* ─── Power-ups ─── */
  const [powerUps, setPowerUps] = useState<PowerUpState>({
    ...DEFAULT_POWERUPS,
  });
  const [activePowerUp, setActivePowerUp] = useState<PowerUpKind | null>(null);
  const [radarCells, setRadarCells] = useState<Set<string>>(new Set());
  const [sonarOverlay, setSonarOverlay] = useState<{
    center: Coord;
    count: number;
  } | null>(null);
  const [airstrikeCells, setAirstrikeCells] = useState<Set<string>>(new Set());

  /* ─── Salvo mode ─── */
  const [salvoShotsRemaining, setSalvoShotsRemaining] = useState(0);
  const [salvoShotsTotal, setSalvoShotsTotal] = useState(0);

  /* ─── Hotseat ─── */
  const [showPassDevice, setShowPassDevice] = useState(false);

  /* ─── Confetti ─── */
  const [showConfetti, setShowConfetti] = useState(false);

  const nextDef = SHIP_DEFS[playerBoard.ships.length] ?? null;
  const allPlaced = playerBoard.ships.length === SHIP_DEFS.length;

  // For hotseat p2 setup
  const nextDefP2 = SHIP_DEFS[p2Board.ships.length] ?? null;
  const allPlacedP2 = p2Board.ships.length === SHIP_DEFS.length;

  const playerStats = useMemo(() => countShots(aiBoard), [aiBoard]);
  const accuracy =
    playerStats.shots === 0
      ? 0
      : Math.round((playerStats.hits / playerStats.shots) * 100);

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const changeTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    saveTheme(t);
  }, []);

  // Keep the sound engine's mute flag in sync and persist the preference.
  useEffect(() => {
    setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore storage errors */
    }
  }, [muted]);

  const addLog = useCallback((message: string) => {
    setLog((prev) => [message, ...prev].slice(0, 50));
  }, []);

  const recordResult = useCallback(
    (won: boolean) => {
      setRecord((prev) => {
        const next = won
          ? { ...prev, wins: prev.wins + 1 }
          : { ...prev, losses: prev.losses + 1 };
        try {
          localStorage.setItem(RECORD_KEY, JSON.stringify(next));
        } catch {
          /* ignore storage errors */
        }
        return next;
      });

      // Save to match history
      const duration = (Date.now() - gameStartRef.current) / 1000;
      const stats = countShots(aiBoard);
      const acc =
        stats.shots === 0
          ? 0
          : Math.round((stats.hits / stats.shots) * 100);
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
      };
      addMatch(matchRecord);
    },
    [aiBoard, difficulty, gameMode, playerMode, activeSeed],
  );

  // Toggle orientation with the R key during setup.
  useEffect(() => {
    if (phase !== "setup" && phase !== "setup-p2") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const activeBoard =
    phase === "setup-p2" ? p2Board : playerBoard;
  const activeNextDef =
    phase === "setup-p2" ? nextDefP2 : nextDef;

  const previewCells: Coord[] =
    (phase === "setup" || phase === "setup-p2") && activeNextDef && hover
      ? shipCells(hover, activeNextDef.size, orientation)
      : [];
  const previewValid =
    !!activeNextDef &&
    !!hover &&
    canPlaceShip(activeBoard, activeNextDef.size, hover, orientation);

  const handlePlace = (coord: Coord) => {
    if (phase === "setup") {
      if (!nextDef) return;
      if (!canPlaceShip(playerBoard, nextDef.size, coord, orientation)) return;
      setPlayerBoard((b) => placeShip(b, nextDef, coord, orientation));
      playSound("place");
    } else if (phase === "setup-p2") {
      if (!nextDefP2) return;
      if (!canPlaceShip(p2Board, nextDefP2.size, coord, orientation)) return;
      setP2Board((b) => placeShip(b, nextDefP2, coord, orientation));
      playSound("place");
    }
  };

  const handleShipDrop = (coord: Coord) => {
    handlePlace(coord);
  };

  const handleRandomFill = () => {
    if (phase === "setup") {
      setPlayerBoard(placeShipsRandomly());
    } else if (phase === "setup-p2") {
      setP2Board(placeShipsRandomly());
    }
  };

  const handleResetPlacement = () => {
    if (phase === "setup") {
      setPlayerBoard(createEmptyBoard());
    } else if (phase === "setup-p2") {
      setP2Board(createEmptyBoard());
    }
  };

  const rotate = () =>
    setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));

  const startGame = () => {
    if (playerMode === "hotseat") {
      if (phase === "setup" && allPlaced) {
        // Move to P2 setup
        setPhase("setup-p2");
        setOrientation("horizontal");
        setHover(null);
        return;
      }
      if (phase === "setup-p2" && allPlacedP2) {
        // Start hotseat game
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
    // vs-ai
    if (!allPlaced) return;
    const rng = useSeed && seedInput
      ? seededRng(seedInput)
      : undefined;
    const seed = useSeed && seedInput ? seedInput : randomSeedString();
    setActiveSeed(seed);
    setAiBoard(rng ? placeShipsRandomly(undefined, undefined, rng) : placeShipsRandomly());
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
    const salvoCount = gameMode === "salvo" ? remainingShips(playerBoard) : 0;
    setSalvoShotsRemaining(salvoCount);
    setSalvoShotsTotal(salvoCount);
    setLog([
      `Game on! ${gameMode === "salvo" ? "Salvo" : "Classic"} mode, difficulty: ${difficulty}. ${gameMode === "salvo" ? `You have ${salvoCount} shots.` : "Fire at the enemy waters."}${useSeed && seedInput ? ` Seed: ${seed}` : ""}`,
    ]);
    setPhase("playing");
    gameStartRef.current = Date.now();
  };

  const newGame = () => {
    setPlayerBoard(createEmptyBoard());
    setAiBoard(createEmptyBoard());
    setP2Board(createEmptyBoard());
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
  };

  /* ─── Power-up usage ─── */
  const applyPowerUp = (coord: Coord) => {
    if (!activePowerUp || !enablePowerUps) return false;
    if (!canUsePowerUp(powerUps, activePowerUp)) return false;

    if (activePowerUp === "radar") {
      const result = radarScan(aiBoard, coord);
      const keys = new Set(
        result.cells
          .filter((c) => c.hasShip)
          .map((c) => coordKey(c.coord)),
      );
      setRadarCells(keys);
      setPowerUps(spendPowerUp(powerUps, "radar"));
      playSound("radar");
      addLog(
        `Radar scan at ${coordLabel(coord)}: ${keys.size} ship segment(s) detected.`,
      );
      setActivePowerUp(null);
      // Clear radar overlay after 3s
      setTimeout(() => setRadarCells(new Set()), 3000);
      return true;
    }

    if (activePowerUp === "sonar") {
      const result = sonarPing(aiBoard, coord);
      setSonarOverlay({ center: coord, count: result.count });
      setPowerUps(spendPowerUp(powerUps, "sonar"));
      playSound("sonar");
      addLog(
        `Sonar ping at ${coordLabel(coord)}: ${result.count} ship segment(s) nearby.`,
      );
      setActivePowerUp(null);
      setTimeout(() => setSonarOverlay(null), 3000);
      return true;
    }

    if (activePowerUp === "airstrike") {
      // Determine axis: use row or column of clicked cell
      // Pick axis with more unshot cells
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
          if (result === "hit") {
            if (sunkShip) {
              addLog(`Airstrike sank ${sunkShip.name} at ${coordLabel(t)}!`);
            }
          }
        }
      }
      setAiBoard(currentBoard);
      setAirstrikeCells(hitKeys);
      setPowerUps(spendPowerUp(powerUps, "airstrike"));
      playSound("airstrike");
      addLog(
        `Airstrike on ${axis} ${axis === "row" ? coord.row + 1 : COLUMN_LABELS[coord.col]}: ${targets.length} cells bombed.`,
      );
      setActivePowerUp(null);
      setTimeout(() => setAirstrikeCells(new Set()), 2000);

      // Check win
      if (allShipsSunk(currentBoard)) {
        setWinner("player");
        setPhase("gameover");
        addLog("Victory! You destroyed the enemy fleet.");
        playSound("win");
        recordResult(true);
        setShowConfetti(true);
        return true;
      }

      // In salvo mode, airstrike doesn't count as a normal shot
      // but ends turn in classic mode
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
    if (phase !== "playing") return;

    // Power-up takes priority
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

    const { board, result, sunkShip } = receiveAttack(aiBoard, coord);
    if (result === "already") return;
    setAiBoard(board);
    setLastPlayerShot(coord);
    if (result === "hit") {
      playSound(sunkShip ? "sink" : "hit");
      addLog(
        sunkShip
          ? `You sank the enemy ${sunkShip.name}! (${coordLabel(coord)})`
          : `Hit at ${coordLabel(coord)}.`,
      );
    } else {
      playSound("miss");
      addLog(`You missed at ${coordLabel(coord)}.`);
    }

    if (allShipsSunk(board)) {
      setWinner("player");
      setPhase("gameover");
      addLog("Victory! You destroyed the enemy fleet.");
      playSound("win");
      recordResult(true);
      setShowConfetti(true);
      return;
    }

    if (gameMode === "salvo") {
      const remaining = salvoShotsRemaining - 1;
      setSalvoShotsRemaining(remaining);
      if (remaining > 0) {
        addLog(`${remaining} shot(s) remaining this turn.`);
        return; // Don't switch turn yet
      }
    }

    setTurn("ai");
    setAiThinking(true);
  };

  /* ─── Hotseat fire ─── */
  const handleHotseatFire = (coord: Coord) => {
    if (turn === "p1") {
      // P1 fires at P2's board
      const { board, result, sunkShip } = receiveAttack(p2Board, coord);
      if (result === "already") return;
      setP2Board(board);
      setLastPlayerShot(coord);
      if (result === "hit") {
        playSound(sunkShip ? "sink" : "hit");
        addLog(
          sunkShip
            ? `P1 sank P2's ${sunkShip.name}! (${coordLabel(coord)})`
            : `P1 hit at ${coordLabel(coord)}.`,
        );
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
      // Switch to P2
      const p2shots = gameMode === "salvo" ? remainingShips(board) : 1;
      setSalvoShotsRemaining(p2shots);
      setSalvoShotsTotal(p2shots);
      setTurn("p2");
      setLastPlayerShot(null);
      setLastAIShot(null);
      setShowPassDevice(true);
    } else if (turn === "p2") {
      // P2 fires at P1's board
      const { board, result, sunkShip } = receiveAttack(playerBoard, coord);
      if (result === "already") return;
      setPlayerBoard(board);
      setLastAIShot(coord);
      if (result === "hit") {
        playSound(sunkShip ? "sink" : "hit");
        addLog(
          sunkShip
            ? `P2 sank P1's ${sunkShip.name}! (${coordLabel(coord)})`
            : `P2 hit at ${coordLabel(coord)}.`,
        );
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

  // AI takes its turn whenever it becomes the AI's move during play.
  useEffect(() => {
    if (phase !== "playing" || playerMode === "hotseat") return;
    if (turn !== "ai") return;

    const aiShotsCount =
      gameMode === "salvo" ? remainingShips(aiBoard) : 1;
    let shotsFired = 0;
    let currentBoard = playerBoard;
    let currentAiState = aiState;
    const fireNextShot = () => {
      if (shotsFired >= aiShotsCount) {
        // AI done
        setAiThinking(false);
        const pSalvo =
          gameMode === "salvo" ? remainingShips(currentBoard) : 1;
        setSalvoShotsRemaining(pSalvo);
        setSalvoShotsTotal(pSalvo);
        if (gameMode === "salvo") {
          addLog(`Your turn: ${pSalvo} shot(s).`);
        }
        setTurn("player");
        playSound("turn");
        return;
      }

      const timer = setTimeout(
        () => {
          const { move, state } = chooseAIMove(
            currentBoard,
            currentAiState,
            difficulty,
          );
          const { board: nextBoard, result, sunkShip } = receiveAttack(
            currentBoard,
            move,
          );
          currentBoard = nextBoard;
          currentAiState = updateAIAfterResult(
            state,
            nextBoard,
            move,
            result,
            !!sunkShip,
          );
          shotsFired++;

          setPlayerBoard(nextBoard);
          setLastAIShot(move);
          setAiState(currentAiState);

          if (result === "hit") {
            playSound(sunkShip ? "sink" : "hit");
            addLog(
              sunkShip
                ? `Enemy sank your ${sunkShip.name}! (${coordLabel(move)})`
                : `Enemy hit your fleet at ${coordLabel(move)}.`,
            );
          } else {
            playSound("miss");
            addLog(`Enemy missed at ${coordLabel(move)}.`);
          }

          if (allShipsSunk(nextBoard)) {
            setWinner("ai");
            setPhase("gameover");
            addLog("Defeat! The enemy sank your fleet.");
            playSound("lose");
            recordResult(false);
            setAiThinking(false);
            return;
          }

          if (shotsFired < aiShotsCount && gameMode === "salvo") {
            addLog(
              `Enemy has ${aiShotsCount - shotsFired} shot(s) remaining.`,
            );
          }

          fireNextShot();
        },
        shotsFired === 0 ? AI_DELAY_MS : 350,
      );
      return timer;
    };

    const _timer = fireNextShot();
    return () => {
      if (_timer) clearTimeout(_timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn]);

  const winnerLabel =
    winner === "player" || winner === "p1"
      ? playerMode === "hotseat"
        ? "Player 1 wins!"
        : "You win!"
      : winner === "p2"
        ? "Player 2 wins!"
        : "You lose.";

  const turnLabel = (() => {
    if (phase === "gameover") return winnerLabel;
    if (playerMode === "hotseat") {
      if (turn === "p1") return "Player 1's turn";
      return "Player 2's turn";
    }
    if (aiThinking) return "Enemy is analyzing...";
    if (turn === "player") {
      if (gameMode === "salvo" && salvoShotsRemaining > 0) {
        return `Your turn \u2014 ${salvoShotsRemaining}/${salvoShotsTotal} shots remaining`;
      }
      return "Your turn \u2014 fire at enemy waters.";
    }
    return "Enemy is taking aim\u2026";
  })();

  /* ─── Hotseat board selection ─── */
  // In hotseat, show the current player's board on the left (own) and the
  // opponent's board on the right (tracking).
  const leftBoard = playerMode === "hotseat" && turn === "p2" ? p2Board : playerBoard;
  const rightBoard = playerMode === "hotseat"
    ? turn === "p1"
      ? p2Board
      : playerBoard
    : aiBoard;

  return (
    <div className="app">
      <Confetti active={showConfetti} />

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
            {playerMode === "hotseat" ? "Pass \u0026 Play" : "Human vs AI"}
          </p>
        </div>
        <div className="app__meta">
          {playerMode === "vs-ai" && (
            <span className="record" title="Wins\u2013Losses on this device">
              W {record.wins} \u00B7 L {record.losses}
            </span>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowHistory(true)}
            title="Match History"
          >
            \uD83D\uDCCA Stats
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={muted}
            onClick={() => setMutedState((m) => !m)}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "\uD83D\uDD07 Muted" : "\uD83D\uDD0A Sound"}
          </button>
        </div>
      </header>

      {(phase === "setup" || phase === "setup-p2") && (
        <section className="panel" aria-label="Setup">
          <div className="panel__controls">
            <div>
              <strong>
                {phase === "setup-p2"
                  ? "Player 2: Place your fleet"
                  : "Place your fleet"}
              </strong>
              <p className="hint">
                {activeNextDef
                  ? `Placing: ${activeNextDef.name} (${activeNextDef.size}). Click your grid or drag from the dock.`
                  : "All ships placed. Ready to start!"}
              </p>
              <p className="hint">
                Orientation: <strong>{orientation}</strong> \u2014 press{" "}
                <kbd>R</kbd> or tap Rotate.
              </p>

              {phase === "setup" && (
                <>
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
                      {gameMode === "salvo"
                        ? "Fire one shot per surviving ship each turn."
                        : "One shot per turn."}
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

                  {/* Difficulty (AI only) */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <span className="settings-label">AI difficulty:</span>
                      <div
                        className="settings-options"
                        role="radiogroup"
                        aria-label="AI difficulty"
                      >
                        {(
                          ["easy", "medium", "hard", "admiral"] as Difficulty[]
                        ).map((d) => (
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

                  {/* Power-ups toggle */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={enablePowerUps}
                          onChange={(e) => setEnablePowerUps(e.target.checked)}
                        />
                        Enable power-ups (Radar, Sonar, Airstrike)
                      </label>
                    </div>
                  )}

                  {/* Seed */}
                  {playerMode === "vs-ai" && (
                    <div className="settings-row">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={useSeed}
                          onChange={(e) => setUseSeed(e.target.checked)}
                        />
                        Use game seed
                      </label>
                      {useSeed && (
                        <input
                          type="text"
                          className="seed-input"
                          placeholder="Enter seed (e.g. AB34)"
                          value={seedInput}
                          onChange={(e) =>
                            setSeedInput(e.target.value.toUpperCase())
                          }
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
              <button type="button" onClick={rotate}>
                Rotate (R)
              </button>
              <button type="button" onClick={handleRandomFill}>
                Random
              </button>
              <button type="button" onClick={handleResetPlacement}>
                Reset
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={phase === "setup" ? !allPlaced : !allPlacedP2}
                onClick={startGame}
              >
                {phase === "setup" && playerMode === "hotseat"
                  ? "Next: P2 Setup"
                  : "Start game"}
              </button>
            </div>
          </div>

          {/* Ship dock for drag-and-drop */}
          <ShipDock
            shipDefs={SHIP_DEFS}
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
                Shots {playerStats.shots} \u00B7 Hits {playerStats.hits}{" "}
                \u00B7 Accuracy {accuracy}%
              </span>
            )}
            <span className="status__ships">
              {playerMode === "hotseat" ? (
                <>
                  P1: {remainingShips(playerBoard)} left \u00B7 P2:{" "}
                  {remainingShips(p2Board)} left
                </>
              ) : (
                <>
                  You: {remainingShips(playerBoard)} left \u00B7 Enemy:{" "}
                  {remainingShips(aiBoard)} left
                </>
              )}
            </span>
            {activeSeed && playerMode === "vs-ai" && (
              <span className="status__seed" title="Game seed (share to challenge a friend)">
                Seed: {activeSeed}
              </span>
            )}
            {phase === "gameover" && (
              <button type="button" className="btn-primary" onClick={newGame}>
                Play again
              </button>
            )}
          </div>

          {/* Power-up bar */}
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
              ? turn === "p2"
                ? "Your waters (P2)"
                : "Your waters (P1)"
              : "Your waters"}
          </h2>
          <BoardGrid
            board={leftBoard}
            mode="own"
            showShips
            disabled={phase !== "setup" && phase !== "setup-p2"}
            onCellClick={
              phase === "setup" || phase === "setup-p2" ? handlePlace : undefined
            }
            onCellHover={
              phase === "setup" || phase === "setup-p2" ? setHover : undefined
            }
            previewCells={previewCells}
            previewValid={previewValid}
            lastShot={phase === "playing" ? lastAIShot : null}
            onShipDrop={
              phase === "setup" || phase === "setup-p2"
                ? handleShipDrop
                : undefined
            }
          />
          {phase !== "setup" && phase !== "setup-p2" && (
            <FleetStatus
              title={
                playerMode === "hotseat" && turn === "p2"
                  ? "P2 fleet"
                  : "Your fleet"
              }
              board={leftBoard}
            />
          )}
        </div>

        <div className="board-wrap">
          <h2>
            {playerMode === "hotseat"
              ? turn === "p1"
                ? "P2 waters"
                : "P1 waters"
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
            airstrikeCells={
              airstrikeCells.size > 0 ? airstrikeCells : undefined
            }
            sonarOverlay={sonarOverlay}
          />
          {phase !== "setup" && phase !== "setup-p2" && (
            <FleetStatus
              title={
                playerMode === "hotseat"
                  ? turn === "p1"
                    ? "P2 fleet"
                    : "P1 fleet"
                  : "Enemy fleet"
              }
              board={rightBoard}
              revealHits={playerMode === "hotseat" ? false : false}
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
        <a
          href="https://github.com/Deven-Shah-98/battleship"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </footer>

      <MatchHistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
