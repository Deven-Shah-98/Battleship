import { useCallback, useEffect, useMemo, useState } from "react";
import BoardGrid from "./components/BoardGrid";
import FleetStatus from "./components/FleetStatus";
import {
  allShipsSunk,
  canPlaceShip,
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
import { COLUMN_LABELS, SHIP_DEFS } from "./game/constants";
import type { Board, Coord, Orientation } from "./game/types";
import { playSound, setMuted } from "./sound";

type Phase = "setup" | "playing" | "gameover";
type Turn = "player" | "ai";
type Winner = "player" | "ai" | null;

interface GameRecord {
  wins: number;
  losses: number;
}

const AI_DELAY_MS = 650;
const RECORD_KEY = "battleship.record";
const MUTE_KEY = "battleship.muted";

const DIFFICULTY_INFO: Record<Difficulty, string> = {
  easy: "Fires at random — good for a relaxed game.",
  medium: "Hunts on a grid, then chases hits.",
  hard: "Probability-density targeting — plays to win.",
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
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerBoard, setPlayerBoard] = useState<Board>(() =>
    createEmptyBoard(),
  );
  const [aiBoard, setAiBoard] = useState<Board>(() => createEmptyBoard());
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [hover, setHover] = useState<Coord | null>(null);
  const [turn, setTurn] = useState<Turn>("player");
  const [aiState, setAiState] = useState<AIState>(() => createAIState());
  const [winner, setWinner] = useState<Winner>(null);
  const [log, setLog] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
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

  const nextDef = SHIP_DEFS[playerBoard.ships.length] ?? null;
  const allPlaced = playerBoard.ships.length === SHIP_DEFS.length;

  const playerStats = useMemo(() => countShots(aiBoard), [aiBoard]);
  const accuracy =
    playerStats.shots === 0
      ? 0
      : Math.round((playerStats.hits / playerStats.shots) * 100);

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

  const recordResult = useCallback((won: boolean) => {
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
  }, []);

  // Toggle orientation with the R key during setup.
  useEffect(() => {
    if (phase !== "setup") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const previewCells: Coord[] =
    phase === "setup" && nextDef && hover
      ? shipCells(hover, nextDef.size, orientation)
      : [];
  const previewValid =
    !!nextDef &&
    !!hover &&
    canPlaceShip(playerBoard, nextDef.size, hover, orientation);

  const handlePlace = (coord: Coord) => {
    if (phase !== "setup" || !nextDef) return;
    if (!canPlaceShip(playerBoard, nextDef.size, coord, orientation)) return;
    setPlayerBoard((b) => placeShip(b, nextDef, coord, orientation));
  };

  const handleRandomFill = () => {
    setPlayerBoard(placeShipsRandomly());
  };

  const handleResetPlacement = () => {
    setPlayerBoard(createEmptyBoard());
  };

  const rotate = () =>
    setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));

  const startGame = () => {
    if (!allPlaced) return;
    setAiBoard(placeShipsRandomly());
    setAiState(createAIState());
    setTurn("player");
    setWinner(null);
    setLastPlayerShot(null);
    setLastAIShot(null);
    setLog([`Game on! Difficulty: ${difficulty}. Fire at the enemy waters.`]);
    setPhase("playing");
  };

  const newGame = () => {
    setPlayerBoard(createEmptyBoard());
    setAiBoard(createEmptyBoard());
    setOrientation("horizontal");
    setHover(null);
    setTurn("player");
    setAiState(createAIState());
    setWinner(null);
    setLastPlayerShot(null);
    setLastAIShot(null);
    setLog([]);
    setPhase("setup");
  };

  const handleFire = (coord: Coord) => {
    if (phase !== "playing" || turn !== "player") return;
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
      return;
    }
    setTurn("ai");
  };

  // AI takes its turn whenever it becomes the AI's move during play.
  // State is read from the closure and each setter is called exactly once to
  // avoid double side effects from updater functions running more than once.
  useEffect(() => {
    if (phase !== "playing" || turn !== "ai") return;
    const timer = setTimeout(() => {
      const { move, state } = chooseAIMove(playerBoard, aiState, difficulty);
      const { board: nextBoard, result, sunkShip } = receiveAttack(
        playerBoard,
        move,
      );
      setPlayerBoard(nextBoard);
      setLastAIShot(move);
      setAiState(updateAIAfterResult(state, nextBoard, move, result, !!sunkShip));

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
      } else {
        setTurn("player");
      }
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, turn, playerBoard, aiState, difficulty, addLog, recordResult]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__titles">
          <h1>Battleship</h1>
          <p className="app__subtitle">Human vs AI</p>
        </div>
        <div className="app__meta">
          <span className="record" title="Wins–Losses on this device">
            W {record.wins} · L {record.losses}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={muted}
            onClick={() => setMutedState((m) => !m)}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇 Muted" : "🔊 Sound"}
          </button>
        </div>
      </header>

      {phase === "setup" && (
        <section className="panel">
          <div className="panel__controls">
            <div>
              <strong>Place your fleet</strong>
              <p className="hint">
                {nextDef
                  ? `Placing: ${nextDef.name} (${nextDef.size}). Click your grid to place.`
                  : "All ships placed. Ready to start!"}
              </p>
              <p className="hint">
                Orientation: <strong>{orientation}</strong> — press{" "}
                <kbd>R</kbd> or use the button to rotate.
              </p>
              <div className="difficulty">
                <span className="difficulty__label">AI difficulty:</span>
                <div
                  className="difficulty__options"
                  role="radiogroup"
                  aria-label="AI difficulty"
                >
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
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
              </div>
              <p className="hint">{DIFFICULTY_INFO[difficulty]}</p>
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
                disabled={!allPlaced}
                onClick={startGame}
              >
                Start game
              </button>
            </div>
          </div>
        </section>
      )}

      {phase !== "setup" && (
        <section className="panel">
          <div className="status">
            <span className="status__msg">
              {phase === "gameover"
                ? winner === "player"
                  ? "You win! 🎉"
                  : "You lose."
                : turn === "player"
                  ? "Your turn — fire at enemy waters."
                  : "Enemy is taking aim…"}
            </span>
            <span className="status__stats">
              Shots {playerStats.shots} · Hits {playerStats.hits} · Accuracy{" "}
              {accuracy}%
            </span>
            <span className="status__ships">
              You: {remainingShips(playerBoard)} left · Enemy:{" "}
              {remainingShips(aiBoard)} left
            </span>
            {phase === "gameover" && (
              <button type="button" className="btn-primary" onClick={newGame}>
                Play again
              </button>
            )}
          </div>
        </section>
      )}

      <main className="boards">
        <div className="board-wrap">
          <h2>Your waters</h2>
          <BoardGrid
            board={playerBoard}
            mode="own"
            showShips
            disabled={phase !== "setup"}
            onCellClick={handlePlace}
            onCellHover={setHover}
            previewCells={previewCells}
            previewValid={previewValid}
            lastShot={phase === "playing" ? lastAIShot : null}
          />
          {phase !== "setup" && (
            <FleetStatus title="Your fleet" board={playerBoard} />
          )}
        </div>

        <div className="board-wrap">
          <h2>Enemy waters</h2>
          <BoardGrid
            board={aiBoard}
            mode="tracking"
            showShips={phase === "gameover"}
            disabled={phase !== "playing" || turn !== "player"}
            onCellClick={handleFire}
            lastShot={phase === "playing" ? lastPlayerShot : null}
          />
          {phase !== "setup" && (
            <FleetStatus title="Enemy fleet" board={aiBoard} revealHits={false} />
          )}
        </div>
      </main>

      <section className="log" aria-live="polite">
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
    </div>
  );
}
