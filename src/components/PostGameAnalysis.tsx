import { coordKey } from "../game/board";
import { computeHeatmap } from "../game/ai";
import type { Board } from "../game/types";

interface PostGameAnalysisProps {
  open: boolean;
  onClose: () => void;
  playerBoard: Board;
  enemyBoard: Board;
  won: boolean;
  shots: number;
  hits: number;
  accuracy: number;
  duration: number;
}

export default function PostGameAnalysis({
  open,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  playerBoard: _playerBoard,
  enemyBoard,
  won,
  shots,
  hits,
  accuracy,
  duration,
}: PostGameAnalysisProps) {
  if (!open) return null;

  // Build shot sequence
  const shotOrder = Object.keys(enemyBoard.shots);
  const totalCells = enemyBoard.size * enemyBoard.size;
  const coverage = Math.round((shotOrder.length / totalCells) * 100);

  // Calculate optimal shots (minimum to hit all ship cells)
  const totalShipCells = enemyBoard.ships.reduce((sum, s) => sum + s.size, 0);
  const efficiency = totalShipCells > 0 ? Math.round((totalShipCells / shots) * 100) : 0;

  // Build heatmap of where ships actually were
  const shipCellSet = new Set<string>();
  for (const ship of enemyBoard.ships) {
    for (const cell of ship.cells) {
      shipCellSet.add(coordKey(cell));
    }
  }

  // Find wasted shots (misses in low-probability areas)
  const heatAtStart = computeHeatmap({ ...enemyBoard, shots: {}, ships: enemyBoard.ships.map(s => ({ ...s, hits: s.hits.map(() => false) })) });
  let wastedShots = 0;
  const missedKeys = Object.entries(enemyBoard.shots)
    .filter(([, r]) => r === "miss")
    .map(([k]) => k);
  for (const key of missedKeys) {
    const [r, c] = key.split(",").map(Number);
    if (heatAtStart[r]?.[c] === 0) wastedShots++;
  }

  // Rating
  const rating = accuracy >= 70 ? "S" : accuracy >= 55 ? "A" : accuracy >= 40 ? "B" : accuracy >= 25 ? "C" : "D";
  const ratingColor = { S: "#FFD700", A: "#69F0AE", B: "#00BCD4", C: "#FF9800", D: "#FF5252" }[rating];

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal analysis-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Post-Game Analysis">
        <div className="modal__header">
          <h2>Post-Game Analysis</h2>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="analysis-rating">
          <span className="analysis-rating__grade" style={{ color: ratingColor }}>{rating}</span>
          <span className="analysis-rating__label">Performance Rating</span>
        </div>

        <div className="analysis-stats">
          <div className="analysis-stat">
            <span className="analysis-stat__value">{shots}</span>
            <span className="analysis-stat__label">Total Shots</span>
          </div>
          <div className="analysis-stat">
            <span className="analysis-stat__value">{hits}</span>
            <span className="analysis-stat__label">Hits</span>
          </div>
          <div className="analysis-stat">
            <span className="analysis-stat__value">{accuracy}%</span>
            <span className="analysis-stat__label">Accuracy</span>
          </div>
          <div className="analysis-stat">
            <span className="analysis-stat__value">{efficiency}%</span>
            <span className="analysis-stat__label">Efficiency</span>
          </div>
          <div className="analysis-stat">
            <span className="analysis-stat__value">{coverage}%</span>
            <span className="analysis-stat__label">Board Coverage</span>
          </div>
          <div className="analysis-stat">
            <span className="analysis-stat__value">{formatDuration(duration)}</span>
            <span className="analysis-stat__label">Duration</span>
          </div>
        </div>

        <div className="analysis-section">
          <h3>Shot Heatmap</h3>
          <div className="analysis-grid" style={{ gridTemplateColumns: `repeat(${enemyBoard.size}, 1fr)` }}>
            {Array.from({ length: enemyBoard.size }, (_, row) =>
              Array.from({ length: enemyBoard.size }, (_, col) => {
                const key = coordKey({ row, col });
                const shot = enemyBoard.shots[key];
                const isShip = shipCellSet.has(key);
                let cls = "analysis-cell";
                if (shot === "hit") cls += " analysis-cell--hit";
                else if (shot === "miss") cls += " analysis-cell--miss";
                else if (isShip) cls += " analysis-cell--unshot-ship";
                return <div key={key} className={cls} title={`${String.fromCharCode(65 + col)}${row + 1}: ${shot ?? "unshot"}${isShip ? " (ship)" : ""}`} />;
              }),
            )}
          </div>
          <div className="analysis-legend">
            <span><span className="analysis-cell analysis-cell--hit" /> Hit</span>
            <span><span className="analysis-cell analysis-cell--miss" /> Miss</span>
            <span><span className="analysis-cell analysis-cell--unshot-ship" /> Ship (unshot)</span>
          </div>
        </div>

        <div className="analysis-insights">
          <h3>Insights</h3>
          <ul>
            {won && <li className="insight--positive">Victory! You destroyed the enemy fleet.</li>}
            {!won && <li className="insight--negative">Defeat. The enemy destroyed your fleet first.</li>}
            {accuracy >= 60 && <li className="insight--positive">Excellent accuracy ({accuracy}%) — sharp shooting!</li>}
            {accuracy < 30 && <li className="insight--negative">Low accuracy ({accuracy}%) — try using the hint system for guidance.</li>}
            {efficiency >= 80 && <li className="insight--positive">High efficiency — minimal wasted shots.</li>}
            {wastedShots > 5 && <li className="insight--negative">{wastedShots} shots fired at very low-probability cells.</li>}
            <li>Minimum possible shots to win: {totalShipCells}. You took {shots}.</li>
            <li>Board coverage: {coverage}% of cells fired upon.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
