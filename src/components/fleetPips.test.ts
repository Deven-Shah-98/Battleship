import { describe, it, expect } from "vitest";
import { visiblePipHits } from "./fleetPips";
import type { Ship } from "../game/types";

function makeShip(hits: boolean[]): Ship {
  return {
    id: "test-ship-1",
    name: "Cruiser",
    size: hits.length,
    cells: hits.map((_, i) => ({ row: 0, col: i })),
    hits,
  };
}

describe("visiblePipHits", () => {
  it("reveals all hits when revealHits is true (own board)", () => {
    const ship = makeShip([true, false, true]);
    expect(visiblePipHits(ship, true)).toEqual([true, false, true]);
  });

  it("hides hits when revealHits is false and ship is not sunk", () => {
    const ship = makeShip([true, false, true]);
    expect(visiblePipHits(ship, false)).toEqual([false, false, false]);
  });

  it("reveals all hits once ship is sunk, regardless of revealHits", () => {
    const ship = makeShip([true, true, true]);
    expect(visiblePipHits(ship, false)).toEqual([true, true, true]);
  });

  it("returns all false for an undamaged ship", () => {
    const ship = makeShip([false, false, false]);
    expect(visiblePipHits(ship, false)).toEqual([false, false, false]);
    expect(visiblePipHits(ship, true)).toEqual([false, false, false]);
  });

  it("handles a single-cell ship", () => {
    const ship = makeShip([true]);
    // Single hit = sunk, so visible regardless
    expect(visiblePipHits(ship, false)).toEqual([true]);
    expect(visiblePipHits(ship, true)).toEqual([true]);
  });

  it("handles a 5-cell carrier with partial damage", () => {
    const ship: Ship = {
      id: "carrier-1",
      name: "Carrier",
      size: 5,
      cells: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
      ],
      hits: [true, false, true, false, true],
    };
    // Own board: see the damage
    expect(visiblePipHits(ship, true)).toEqual([true, false, true, false, true]);
    // Enemy board: damage hidden until sunk
    expect(visiblePipHits(ship, false)).toEqual([false, false, false, false, false]);
  });
});
