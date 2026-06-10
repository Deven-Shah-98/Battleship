import type { Board, Coord } from "../game/types";
import { coordKey } from "../game/board";
import { COLUMN_LABELS } from "../game/constants";

interface Props {
  aiBoard: Board;
  playerBoard: Board;
  won: boolean;
  onClose: () => void;
}

export function LossAnalysis({ aiBoard, won, onClose }: Props) {
  const board = aiBoard;
  const size = board.size;

  // Build a map of ship cells for the enemy board
  const shipCells = new Map<string, string>();
  for (const ship of board.ships) {
    for (const cell of ship.cells) {
      shipCells.set(coordKey(cell), ship.name);
    }
  }

  // Find cells that were never shot at but had ships
  const missedCells: Array<{ coord: Coord; shipName: string }> = [];
  for (const ship of board.ships) {
    for (const cell of ship.cells) {
      const key = coordKey(cell);
      if (!board.shots[key]) {
        missedCells.push({ coord: cell, shipName: ship.name });
      }
    }
  }

  const getCellClass = (r: number, c: number): string => {
    const key = coordKey({ row: r, col: c });
    const isShip = shipCells.has(key);
    const wasShot = key in board.shots;
    const result = board.shots[key];

    if (wasShot && result === "hit") return "analysis-cell analysis-cell--hit";
    if (wasShot && result === "miss") return "analysis-cell analysis-cell--miss";
    if (isShip && !wasShot) return "analysis-cell analysis-cell--missed-ship";
    return "analysis-cell";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loss-analysis-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>{won ? "Battle Review" : "Where They Were Hiding"}</h2>

        <p className="analysis-subtitle">
          {won
            ? "Here's where all the enemy ships were positioned."
            : "Red cells show ship positions you missed. Use this to improve your strategy!"}
        </p>

        <div
          className="analysis-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `24px repeat(${size}, 1fr)`,
            gap: "2px",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          {/* Corner */}
          <div className="analysis-label" />
          {/* Column headers */}
          {Array.from({ length: size }, (_, c) => (
            <div key={`col-${c}`} className="analysis-label">{COLUMN_LABELS[c]}</div>
          ))}

          {Array.from({ length: size }, (_, r) => (
            <>
              <div key={`row-${r}`} className="analysis-label">{r + 1}</div>
              {Array.from({ length: size }, (_, c) => (
                <div key={`${r}-${c}`} className={getCellClass(r, c)}>
                  {board.shots[coordKey({ row: r, col: c })] === "hit" && "✶"}
                  {board.shots[coordKey({ row: r, col: c })] === "miss" && "•"}
                  {shipCells.has(coordKey({ row: r, col: c })) &&
                    !board.shots[coordKey({ row: r, col: c })] &&
                    "■"}
                </div>
              ))}
            </>
          ))}
        </div>

        <div className="analysis-legend">
          <span className="legend-item"><span className="legend-swatch legend-swatch--hit" /> Hit</span>
          <span className="legend-item"><span className="legend-swatch legend-swatch--miss" /> Miss</span>
          <span className="legend-item"><span className="legend-swatch legend-swatch--missed-ship" /> Unfound Ship</span>
        </div>

        {!won && missedCells.length > 0 && (
          <div className="analysis-tip">
            <strong>Tip:</strong> You missed {missedCells.length} ship cells.
            Try using the hint system or radar power-up to find ships faster!
          </div>
        )}
      </div>
    </div>
  );
}
