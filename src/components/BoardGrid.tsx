import { useCallback, useRef, useState } from "react";
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
  /** Cells revealed by radar scan (highlighted). */
  radarCells?: Set<string>;
  /** Cells hit by airstrike (highlighted). */
  airstrikeCells?: Set<string>;
  /** Sonar result overlay text. */
  sonarOverlay?: { center: Coord; count: number } | null;
  /** Allow drag-and-drop ship placement. */
  onShipDrop?: (coord: Coord) => void;
  /** Board annotations — mark cells with "?" or "X" for strategy. */
  annotations?: Map<string, string>;
  /** Smart assist — highlight cells guaranteed to be misses. */
  smartAssistCells?: Set<string>;
  /** Shot probability overlay values (0-1). */
  probabilityMap?: Map<string, number>;
  /** Right-click handler for annotations. */
  onCellRightClick?: (coord: Coord) => void;
  /** Hint cell to highlight on the board. */
  hintCell?: Coord | null;
}

function cellClass(
  board: Board,
  coord: Coord,
  showShips: boolean,
  previewKeys: Set<string>,
  previewValid: boolean,
  lastShotKey: string | null,
  radarCells?: Set<string>,
  airstrikeCells?: Set<string>,
  hintKey?: string | null,
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
  if (radarCells?.has(key)) classes.push("cell--radar");
  if (airstrikeCells?.has(key)) classes.push("cell--airstrike");
  if (hintKey && key === hintKey) classes.push("cell--hint");
  return classes.join(" ");
}

function cellContent(board: Board, coord: Coord): string {
  const shot = board.shots[coordKey(coord)];
  if (shot === "hit") return "\u2736";
  if (shot === "miss") return "\u2022";
  return "";
}

function cellAriaLabel(board: Board, coord: Coord, showShips: boolean): string {
  const label = `${COLUMN_LABELS[coord.col]}${coord.row + 1}`;
  const key = coordKey(coord);
  const shot = board.shots[key];
  const ship = shipAt(board, coord);
  const parts = [label];
  if (shot === "hit") parts.push("hit");
  else if (shot === "miss") parts.push("miss");
  else parts.push("unknown");
  if (showShips && ship) {
    parts.push(isShipSunk(ship) ? `${ship.name} sunk` : ship.name);
  }
  return parts.join(", ");
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
  radarCells,
  airstrikeCells,
  sonarOverlay,
  onShipDrop,
  annotations: _annotations,
  smartAssistCells: _smartAssistCells,
  probabilityMap: _probabilityMap,
  onCellRightClick: _onCellRightClick,
  hintCell,
}: BoardGridProps) {
  const previewKeys = new Set(previewCells.map(coordKey));
  const lastShotKey = lastShot ? coordKey(lastShot) : null;
  const rows = Array.from({ length: board.size }, (_, i) => i);
  const cols = Array.from({ length: board.size }, (_, i) => i);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusCoord, setFocusCoord] = useState<Coord>({ row: 0, col: 0 });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newCoord: Coord | null = null;
      switch (e.key) {
        case "ArrowUp":
          newCoord = {
            row: Math.max(0, focusCoord.row - 1),
            col: focusCoord.col,
          };
          break;
        case "ArrowDown":
          newCoord = {
            row: Math.min(board.size - 1, focusCoord.row + 1),
            col: focusCoord.col,
          };
          break;
        case "ArrowLeft":
          newCoord = {
            row: focusCoord.row,
            col: Math.max(0, focusCoord.col - 1),
          };
          break;
        case "ArrowRight":
          newCoord = {
            row: focusCoord.row,
            col: Math.min(board.size - 1, focusCoord.col + 1),
          };
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onCellClick?.(focusCoord);
          return;
        case "Home":
          newCoord = { row: focusCoord.row, col: 0 };
          break;
        case "End":
          newCoord = { row: focusCoord.row, col: board.size - 1 };
          break;
        default:
          return;
      }
      if (newCoord) {
        e.preventDefault();
        setFocusCoord(newCoord);
        const btn = gridRef.current?.querySelector(
          `[data-coord="${coordKey(newCoord)}"]`,
        ) as HTMLElement | null;
        btn?.focus();
        onCellHover?.(newCoord);
      }
    },
    [focusCoord, board.size, onCellClick, onCellHover],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!onShipDrop) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [onShipDrop],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, coord: Coord) => {
      if (!onShipDrop) return;
      e.preventDefault();
      onShipDrop(coord);
    },
    [onShipDrop],
  );

  return (
    <div
      ref={gridRef}
      className={`board board--${mode}`}
      style={{ gridTemplateColumns: `repeat(${board.size + 1}, var(--cell))` }}
      onMouseLeave={() => onCellHover?.(null)}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label={mode === "own" ? "Your waters" : "Enemy waters"}
    >
      <div className="board__corner" role="presentation" />
      {cols.map((c) => (
        <div key={`h${c}`} className="board__label" role="columnheader">
          {COLUMN_LABELS[c]}
        </div>
      ))}
      {rows.map((r) => (
        <div
          className="board__row"
          key={`row${r}`}
          style={{ display: "contents" }}
          role="row"
        >
          <div className="board__label" role="rowheader">
            {r + 1}
          </div>
          {cols.map((c) => {
            const coord = { row: r, col: c };
            const key = coordKey(coord);
            const fired = key in board.shots;
            const isFocused =
              focusCoord.row === r && focusCoord.col === c;
            return (
              <button
                key={key}
                data-coord={key}
                type="button"
                role="gridcell"
                className={cellClass(
                  board,
                  coord,
                  showShips,
                  previewKeys,
                  previewValid,
                  lastShotKey,
                  radarCells,
                  airstrikeCells,
                  hintCell ? coordKey(hintCell) : null,
                )}
                disabled={disabled || (mode === "tracking" && fired)}
                aria-label={cellAriaLabel(board, coord, showShips)}
                tabIndex={isFocused ? 0 : -1}
                onClick={() => {
                  setFocusCoord(coord);
                  onCellClick?.(coord);
                }}
                onMouseEnter={() => onCellHover?.(coord)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, coord)}
              >
                {cellContent(board, coord)}
              </button>
            );
          })}
        </div>
      ))}
      {sonarOverlay && (
        <div
          className="sonar-overlay"
          style={{
            gridRow: sonarOverlay.center.row + 2,
            gridColumn: sonarOverlay.center.col + 2,
          }}
          aria-live="polite"
        >
          {sonarOverlay.count}
        </div>
      )}
    </div>
  );
}
