import { useCallback, useEffect, useState } from "react";
import BoardGrid from "./components/BoardGrid";
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
} from "./game/ai";
import { COLUMN_LABELS, SHIP_DEFS } from "./game/constants";
import type { Board, Coord, Orientation } from "./game/types";

type Phase = "setup" | "playing" | "gameover";
type Turn = "player" | "ai";
type Winner = "player" | "ai" | null;

const AI_DELAY_MS = 650;

const coordLabel = (c: Coord): string => `${COLUMN_LABELS[c.col]}${c.row + 1}`;

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

  const nextDef = SHIP_DEFS[playerBoard.ships.length] ?? null;
  const allPlaced = playerBoard.ships.length === SHIP_DEFS.length;

  const addLog = useCallback((message: string) => {
    setLog((prev) => [message, ...prev].slice(0, 50));
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

  const startGame = () => {
    if (!allPlaced) return;
    setAiBoard(placeShipsRandomly());
    setAiState(createAIState());
    setTurn("player");
    setWinner(null);
    setLog(["Game on! Fire at the enemy waters."]);
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
    setLog([]);
    setPhase("setup");
  };

  const handleFire = (coord: Coord) => {
    if (phase !== "playing" || turn !== "player") return;
    const { board, result, sunkShip } = receiveAttack(aiBoard, coord);
    if (result === "already") return;
    setAiBoard(board);
    if (result === "hit") {
      addLog(
        sunkShip
          ? `You sank the enemy ${sunkShip.name}! (${coordLabel(coord)})`
          : `Hit at ${coordLabel(coord)}.`,
      );
    } else {
      addLog(`You missed at ${coordLabel(coord)}.`);
    }

    if (allShipsSunk(board)) {
      setWinner("player");
      setPhase("gameover");
      addLog("Victory! You destroyed the enemy fleet.");
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
      const { move, state } = chooseAIMove(playerBoard, aiState);
      const { board: nextBoard, result, sunkShip } = receiveAttack(
        playerBoard,
        move,
      );
      setPlayerBoard(nextBoard);
      setAiState(updateAIAfterResult(state, nextBoard, move, result, !!sunkShip));

      if (result === "hit") {
        addLog(
          sunkShip
            ? `Enemy sank your ${sunkShip.name}! (${coordLabel(move)})`
            : `Enemy hit your fleet at ${coordLabel(move)}.`,
        );
      } else {
        addLog(`Enemy missed at ${coordLabel(move)}.`);
      }

      if (allShipsSunk(nextBoard)) {
        setWinner("ai");
        setPhase("gameover");
        addLog("Defeat! The enemy sank your fleet.");
      } else {
        setTurn("player");
      }
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, turn, playerBoard, aiState, addLog]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Battleship</h1>
        <p className="app__subtitle">Human vs AI</p>
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
            </div>
            <div className="panel__buttons">
              <button
                type="button"
                onClick={() =>
                  setOrientation((o) =>
                    o === "horizontal" ? "vertical" : "horizontal",
                  )
                }
              >
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
            <span>
              {phase === "gameover"
                ? winner === "player"
                  ? "You win! 🎉"
                  : "You lose."
                : turn === "player"
                  ? "Your turn — fire at enemy waters."
                  : "Enemy is taking aim…"}
            </span>
            <span>
              Your ships left: {remainingShips(playerBoard)} · Enemy ships left:{" "}
              {remainingShips(aiBoard)}
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
          />
        </div>

        <div className="board-wrap">
          <h2>Enemy waters</h2>
          <BoardGrid
            board={aiBoard}
            mode="tracking"
            showShips={phase === "gameover"}
            disabled={phase !== "playing" || turn !== "player"}
            onCellClick={handleFire}
          />
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
