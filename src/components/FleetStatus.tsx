import { isShipSunk } from "../game/board";
import type { Board } from "../game/types";
import { visiblePipHits } from "./fleetPips";

interface FleetStatusProps {
  title: string;
  board: Board;
  /**
   * Whether to color individual hit pips before a ship is sunk. Use `true` for
   * the player's own fleet (full damage feedback) and `false` for the enemy
   * fleet, where canonical Battleship hides which ship a non-sinking hit struck
   * until that ship is fully sunk.
   */
  revealHits?: boolean;
}

/**
 * Compact per-ship status: lists each ship in the fleet with size pips and a
 * struck-through "sunk" state. Never reveals ship positions. When
 * `revealHits` is false, per-ship damage is hidden until the ship is sunk, so
 * the enemy panel only shows afloat/sunk status.
 */
export default function FleetStatus({
  title,
  board,
  revealHits = true,
}: FleetStatusProps) {
  if (board.ships.length === 0) return null;
  return (
    <div className="fleet">
      <h3 className="fleet__title">{title}</h3>
      <ul className="fleet__list">
        {board.ships.map((ship) => {
          const sunk = isShipSunk(ship);
          const pips = visiblePipHits(ship, revealHits);
          return (
            <li
              key={ship.id}
              className={`fleet__ship${sunk ? " fleet__ship--sunk" : ""}`}
            >
              <span className="fleet__name">{ship.name}</span>
              <span className="fleet__pips" aria-hidden="true">
                {pips.map((showHit, i) => (
                  <span
                    key={i}
                    className={`pip${showHit ? " pip--hit" : ""}`}
                  />
                ))}
              </span>
              <span className="fleet__state">{sunk ? "SUNK" : ""}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
