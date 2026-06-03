import { COLUMN_LABELS } from "../game/constants";
import { coordKey, isShipSunk, shipAt } from "../game/board";
import type { Board, Coord } from "../game/types";

export type BoardMode = "own" | "tracking";

interface BoardGridProps {
  board: Board;
  mode: BoardMode;
  /** Reveal ship outlines (own board, or tracking board on game over). */
  showShips: boolean;
  disabled?: boolean;
  onCellClick?: (coord: Coord) => void;
  onCellHover?: (coord: Coord | null) => void;
  /** Cells to highlight as a placement preview. */
  previewCells?: Coord[];
  previewValid?: boolean;
  /** Most recent shot fired on this board, ringed for visibility. */
  lastShot?: Coord | null;
}

function cellClass(
  board: Board,
  coord: Coord,
  showShips: boolean,
  previewKeys: Set<string>,
  previewValid: boolean,
  lastShotKey: string | null,
): string {
  const key = coordKey(coord);
  const shot = board.shots[key];
  const ship = shipAt(board, coord);

  const classes = ["cell"];
  if (previewKeys.has(key)) {
    classes.push(previewValid ? "cell--preview" : "cell--preview-invalid");
  }
  if (showShips && ship) {
    classes.push(isShipSunk(ship) ? "cell--sunk" : "cell--ship");
  }
  if (shot === "hit") classes.push("cell--hit");
  if (shot === "miss") classes.push("cell--miss");
  if (lastShotKey && key === lastShotKey) classes.push("cell--last");
  return classes.join(" ");
}

function cellContent(board: Board, coord: Coord): string {
  const shot = board.shots[coordKey(coord)];
  if (shot === "hit") return "✶";
  if (shot === "miss") return "•";
  return "";
}

export default function BoardGrid({
  board,
  mode,
  showShips,
  disabled = false,
  onCellClick,
  onCellHover,
  previewCells = [],
  previewValid = true,
  lastShot = null,
}: BoardGridProps) {
  const previewKeys = new Set(previewCells.map(coordKey));
  const lastShotKey = lastShot ? coordKey(lastShot) : null;
  const rows = Array.from({ length: board.size }, (_, i) => i);
  const cols = Array.from({ length: board.size }, (_, i) => i);

  return (
    <div
      className={`board board--${mode}`}
      onMouseLeave={() => onCellHover?.(null)}
    >
      <div className="board__corner" />
      {cols.map((c) => (
        <div key={`h${c}`} className="board__label">
          {COLUMN_LABELS[c]}
        </div>
      ))}
      {rows.map((r) => (
        <div className="board__row" key={`row${r}`} style={{ display: "contents" }}>
          <div className="board__label">{r + 1}</div>
          {cols.map((c) => {
            const coord = { row: r, col: c };
            const fired = coordKey(coord) in board.shots;
            return (
              <button
                key={coordKey(coord)}
                type="button"
                className={cellClass(
                  board,
                  coord,
                  showShips,
                  previewKeys,
                  previewValid,
                  lastShotKey,
                )}
                disabled={disabled || (mode === "tracking" && fired)}
                aria-label={`${COLUMN_LABELS[c]}${r + 1}`}
                onClick={() => onCellClick?.(coord)}
                onMouseEnter={() => onCellHover?.(coord)}
              >
                {cellContent(board, coord)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
