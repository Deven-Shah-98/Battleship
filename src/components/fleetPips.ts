import { isShipSunk } from "../game/board";
import type { Ship } from "../game/types";

/**
 * Decide which of a ship's pips should render as "hit". Damage is shown when
 * `revealHits` is true (the player's own fleet) or once the ship has sunk;
 * otherwise hits stay hidden so the enemy panel doesn't leak per-ship damage.
 */
export function visiblePipHits(ship: Ship, revealHits: boolean): boolean[] {
  const sunk = isShipSunk(ship);
  return ship.hits.map((hit) => hit && (revealHits || sunk));
}
