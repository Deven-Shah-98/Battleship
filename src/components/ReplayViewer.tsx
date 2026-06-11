import { useState, useEffect, useCallback, useRef } from "react";
import type { GameReplay, Board } from "../game/types";
import { coordKey, createEmptyBoard } from "../game/board";
import { loadReplays, deleteReplay, exportReplay, importReplay } from "../game/replay";

interface ReplayViewerProps {
  open: boolean;
  onClose: () => void;
}

export default function ReplayViewer({ open, onClose }: ReplayViewerProps) {
  const [replays, setReplays] = useState<GameReplay[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<GameReplay | null>(null);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    if (open) setReplays(loadReplays());
  }, [open]);

  if (!open) return null;

  const handleDelete = (id: string) => {
    deleteReplay(id);
    setReplays(loadReplays());
    if (selectedReplay?.id === id) setSelectedReplay(null);
  };

  const handleExport = (replay: GameReplay) => {
    const encoded = exportReplay(replay);
    navigator.clipboard.writeText(encoded).catch(() => {});
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const replay = importReplay(importText.trim());
    if (replay) {
      setReplays((prev) => [replay, ...prev]);
      setSelectedReplay(replay);
      setImportText("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal replay-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Replays">
        <div className="modal__header">
          <h2>{selectedReplay ? "Replay Viewer" : "Saved Replays"}</h2>
          <button type="button" className="modal__close" onClick={() => {
            if (selectedReplay) setSelectedReplay(null);
            else onClose();
          }}>{selectedReplay ? "Back" : "\u00D7"}</button>
        </div>

        {selectedReplay ? (
          <ReplayPlayback replay={selectedReplay} />
        ) : (
          <>
            <div className="replay-import">
              <input
                type="text"
                placeholder="Paste replay code to import..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="replay-import__input"
              />
              <button type="button" className="btn-primary" onClick={handleImport}>Import</button>
            </div>

            {replays.length === 0 ? (
              <p className="replay-empty">No replays saved yet. Complete a game to record a replay.</p>
            ) : (
              <div className="replay-list">
                {replays.map((r) => (
                  <div key={r.id} className="replay-card">
                    <div className="replay-card__info">
                      <span className={`replay-card__result ${r.winner === "player" || r.winner === "p1" ? "replay-card__result--win" : "replay-card__result--loss"}`}>
                        {r.winner === "player" || r.winner === "p1" ? "W" : "L"}
                      </span>
                      <span>{r.difficulty} | {r.mode} | {r.boardSize}x{r.boardSize}</span>
                      <span>{new Date(r.date).toLocaleDateString()}</span>
                      <span>{r.moves.length} moves</span>
                    </div>
                    <div className="replay-card__actions">
                      <button type="button" onClick={() => setSelectedReplay(r)} title="Watch">Play</button>
                      <button type="button" onClick={() => handleExport(r)} title="Copy code">Share</button>
                      <button type="button" onClick={() => handleDelete(r.id)} title="Delete">Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReplayPlayback({ replay }: { replay: GameReplay }) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildBoards = useCallback((upTo: number): { playerBoard: Board; enemyBoard: Board } => {
    const pBoard = createEmptyBoard(replay.boardSize);
    const eBoard = createEmptyBoard(replay.boardSize);

    // Place ships
    for (const s of replay.playerShips) {
      pBoard.ships.push({
        id: s.name,
        name: s.name,
        size: s.cells.length,
        cells: s.cells,
        hits: s.cells.map(() => false),
      });
    }
    for (const s of replay.enemyShips) {
      eBoard.ships.push({
        id: s.name,
        name: s.name,
        size: s.cells.length,
        cells: s.cells,
        hits: s.cells.map(() => false),
      });
    }

    // Apply moves
    for (let i = 0; i < upTo; i++) {
      const move = replay.moves[i];
      const key = coordKey(move.coord);
      if (move.player === "player" || move.player === "p1") {
        eBoard.shots[key] = move.result === "hit" ? "hit" : "miss";
        if (move.result === "hit") {
          for (const ship of eBoard.ships) {
            const cellIdx = ship.cells.findIndex((c) => coordKey(c) === key);
            if (cellIdx >= 0) ship.hits[cellIdx] = true;
          }
        }
      } else {
        pBoard.shots[key] = move.result === "hit" ? "hit" : "miss";
        if (move.result === "hit") {
          for (const ship of pBoard.ships) {
            const cellIdx = ship.cells.findIndex((c) => coordKey(c) === key);
            if (cellIdx >= 0) ship.hits[cellIdx] = true;
          }
        }
      }
    }

    return { playerBoard: pBoard, enemyBoard: eBoard };
  }, [replay]);

  const { playerBoard, enemyBoard } = buildBoards(moveIndex);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setMoveIndex((prev) => {
          if (prev >= replay.moves.length) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, replay.moves.length]);

  const currentMove = moveIndex > 0 ? replay.moves[moveIndex - 1] : null;

  return (
    <div className="replay-playback">
      <div className="replay-boards">
        <div className="replay-board-section">
          <h3>Your Fleet</h3>
          <MiniBoard board={playerBoard} showShips />
        </div>
        <div className="replay-board-section">
          <h3>Enemy Fleet</h3>
          <MiniBoard board={enemyBoard} showShips={moveIndex >= replay.moves.length} />
        </div>
      </div>

      {currentMove && (
        <div className="replay-move-info">
          Move {moveIndex}: {currentMove.player} fired at {String.fromCharCode(65 + currentMove.coord.col)}{currentMove.coord.row + 1} — {currentMove.result}
          {currentMove.sunkShip ? ` (sunk ${currentMove.sunkShip})` : ""}
        </div>
      )}

      <div className="replay-controls">
        <button type="button" onClick={() => { setMoveIndex(0); setPlaying(false); }} title="Reset">⏮</button>
        <button type="button" onClick={() => setMoveIndex((p) => Math.max(0, p - 1))} title="Previous">⏪</button>
        <button type="button" onClick={() => setPlaying(!playing)} title={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" onClick={() => setMoveIndex((p) => Math.min(replay.moves.length, p + 1))} title="Next">⏩</button>
        <button type="button" onClick={() => { setMoveIndex(replay.moves.length); setPlaying(false); }} title="End">⏭</button>
      </div>

      <div className="replay-speed">
        <label>Speed:</label>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          <option value={1000}>0.5x</option>
          <option value={500}>1x</option>
          <option value={250}>2x</option>
          <option value={100}>5x</option>
        </select>
        <span className="replay-progress">{moveIndex}/{replay.moves.length}</span>
      </div>
    </div>
  );
}

function MiniBoard({ board, showShips }: { board: Board; showShips: boolean }) {
  const size = board.size;
  const shipCells = new Set<string>();
  if (showShips) {
    for (const ship of board.ships) {
      for (const cell of ship.cells) shipCells.add(coordKey(cell));
    }
  }

  return (
    <div className="mini-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          const key = coordKey({ row, col });
          const shot = board.shots[key];
          const isShip = shipCells.has(key);
          let cls = "mini-cell";
          if (shot === "hit") cls += " mini-cell--hit";
          else if (shot === "miss") cls += " mini-cell--miss";
          else if (isShip) cls += " mini-cell--ship";
          return <div key={key} className={cls} />;
        }),
      )}
    </div>
  );
}
