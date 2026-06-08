import { describe, it, expect } from "vitest";
import { visiblePipHits } from "./fleetPips";
import type { Ship } from "../game/types";

/** Build a Destroyer-sized (2) ship with the given hit pattern. */
function shipWithHits(hits: boolean[]): Ship {
  return {
    id: "test",
    name: "Destroyer",
    size: hits.length,
    cells: hits.map((_, i) => ({ row: 0, col: i })),
    hits,
  };
}

describe("visiblePipHits", () => {
  it("reveals individual hits for the player's own fleet (revealHits=true)", () => {
    const ship = shipWithHits([true, false]);
    expect(visiblePipHits(ship, true)).toEqual([true, false]);
  });

  it("hides enemy per-ship damage before the ship is sunk (revealHits=false)", () => {
    const ship = shipWithHits([true, false]); // one hit, not sunk
    expect(visiblePipHits(ship, false)).toEqual([false, false]);
  });

  it("reveals all pips for a sunk enemy ship even when revealHits=false", () => {
    const ship = shipWithHits([true, true]); // fully sunk
    expect(visiblePipHits(ship, false)).toEqual([true, true]);
  });

  it("shows no hits for an undamaged ship in either mode", () => {
    const ship = shipWithHits([false, false]);
    expect(visiblePipHits(ship, true)).toEqual([false, false]);
    expect(visiblePipHits(ship, false)).toEqual([false, false]);
  });
});
