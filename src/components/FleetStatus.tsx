import { isShipSunk } from "../game/board";
import type { Board } from "../game/types";

interface FleetStatusProps {
  title: string;
  board: Board;
}

/**
 * Compact per-ship status: shows each ship in the fleet with size pips and a
 * struck-through "sunk" state. Reveals only sunk/afloat status, never the
 * enemy's positions.
 */
export default function FleetStatus({ title, board }: FleetStatusProps) {
  if (board.ships.length === 0) return null;
  return (
    <div className="fleet">
      <h3 className="fleet__title">{title}</h3>
      <ul className="fleet__list">
        {board.ships.map((ship) => {
          const sunk = isShipSunk(ship);
          return (
            <li
              key={ship.id}
              className={`fleet__ship${sunk ? " fleet__ship--sunk" : ""}`}
            >
              <span className="fleet__name">{ship.name}</span>
              <span className="fleet__pips" aria-hidden="true">
                {ship.hits.map((hit, i) => (
                  <span
                    key={i}
                    className={`pip${hit ? " pip--hit" : ""}`}
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
