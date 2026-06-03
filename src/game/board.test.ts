import { describe, it, expect } from "vitest";
import {
  allShipsSunk,
  canPlaceShip,
  coordKey,
  createEmptyBoard,
  inBounds,
  isShipSunk,
  placeShip,
  placeShipsRandomly,
  receiveAttack,
  remainingShips,
  shipAt,
  shipCells,
} from "./board";
import { BOARD_SIZE, SHIP_DEFS } from "./constants";
import type { Board } from "./types";

const destroyer = { name: "Destroyer", size: 2 };
const cruiser = { name: "Cruiser", size: 3 };

describe("shipCells", () => {
  it("lays cells horizontally", () => {
    expect(shipCells({ row: 1, col: 2 }, 3, "horizontal")).toEqual([
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ]);
  });

  it("lays cells vertically", () => {
    expect(shipCells({ row: 1, col: 2 }, 2, "vertical")).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
  });
});

describe("inBounds", () => {
  it("detects out of bounds", () => {
    expect(inBounds({ row: 0, col: 0 })).toBe(true);
    expect(inBounds({ row: -1, col: 0 })).toBe(false);
    expect(inBounds({ row: 0, col: BOARD_SIZE })).toBe(false);
  });
});

describe("canPlaceShip", () => {
  it("rejects placement off the edge", () => {
    const board = createEmptyBoard();
    expect(canPlaceShip(board, 3, { row: 0, col: 8 }, "horizontal")).toBe(false);
    expect(canPlaceShip(board, 3, { row: 0, col: 7 }, "horizontal")).toBe(true);
  });

  it("rejects overlapping ships", () => {
    let board = createEmptyBoard();
    board = placeShip(board, cruiser, { row: 0, col: 0 }, "horizontal");
    expect(canPlaceShip(board, 2, { row: 0, col: 1 }, "vertical")).toBe(false);
    expect(canPlaceShip(board, 2, { row: 1, col: 0 }, "horizontal")).toBe(true);
  });
});

describe("placeShip", () => {
  it("adds a ship with the right cells", () => {
    const board = placeShip(
      createEmptyBoard(),
      destroyer,
      { row: 3, col: 3 },
      "vertical",
    );
    expect(board.ships).toHaveLength(1);
    expect(board.ships[0].cells).toEqual([
      { row: 3, col: 3 },
      { row: 4, col: 3 },
    ]);
  });

  it("throws on invalid placement", () => {
    const board = createEmptyBoard();
    expect(() =>
      placeShip(board, cruiser, { row: 0, col: 9 }, "horizontal"),
    ).toThrow();
  });

  it("does not mutate the original board", () => {
    const board = createEmptyBoard();
    placeShip(board, destroyer, { row: 0, col: 0 }, "horizontal");
    expect(board.ships).toHaveLength(0);
  });
});

describe("receiveAttack", () => {
  function singleShipBoard(): Board {
    return placeShip(
      createEmptyBoard(),
      destroyer,
      { row: 0, col: 0 },
      "horizontal",
    );
  }

  it("records a miss", () => {
    const { board, result, sunkShip } = receiveAttack(singleShipBoard(), {
      row: 5,
      col: 5,
    });
    expect(result).toBe("miss");
    expect(sunkShip).toBeNull();
    expect(board.shots[coordKey({ row: 5, col: 5 })]).toBe("miss");
  });

  it("records a hit without sinking", () => {
    const { board, result, sunkShip } = receiveAttack(singleShipBoard(), {
      row: 0,
      col: 0,
    });
    expect(result).toBe("hit");
    expect(sunkShip).toBeNull();
    expect(board.ships[0].hits).toEqual([true, false]);
  });

  it("reports a ship as sunk when all cells are hit", () => {
    let board = singleShipBoard();
    board = receiveAttack(board, { row: 0, col: 0 }).board;
    const final = receiveAttack(board, { row: 0, col: 1 });
    expect(final.result).toBe("hit");
    expect(final.sunkShip).not.toBeNull();
    expect(final.sunkShip?.name).toBe("Destroyer");
    expect(isShipSunk(final.board.ships[0])).toBe(true);
  });

  it("returns 'already' for a repeated shot and does not change the board", () => {
    const first = receiveAttack(singleShipBoard(), { row: 0, col: 0 });
    const second = receiveAttack(first.board, { row: 0, col: 0 });
    expect(second.result).toBe("already");
    expect(second.board).toBe(first.board);
  });
});

describe("win conditions", () => {
  it("isShipSunk only true when every cell is hit", () => {
    const board = placeShip(
      createEmptyBoard(),
      destroyer,
      { row: 0, col: 0 },
      "horizontal",
    );
    expect(isShipSunk(board.ships[0])).toBe(false);
    const hit = receiveAttack(board, { row: 0, col: 0 }).board;
    expect(isShipSunk(hit.ships[0])).toBe(false);
  });

  it("allShipsSunk reflects the whole fleet", () => {
    let board = createEmptyBoard();
    board = placeShip(board, destroyer, { row: 0, col: 0 }, "horizontal");
    board = placeShip(board, destroyer, { row: 2, col: 0 }, "horizontal");
    expect(allShipsSunk(board)).toBe(false);
    expect(remainingShips(board)).toBe(2);

    for (const c of [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 2, col: 0 },
    ]) {
      board = receiveAttack(board, c).board;
    }
    expect(allShipsSunk(board)).toBe(false);
    expect(remainingShips(board)).toBe(1);

    board = receiveAttack(board, { row: 2, col: 1 }).board;
    expect(allShipsSunk(board)).toBe(true);
    expect(remainingShips(board)).toBe(0);
  });

  it("allShipsSunk is false for an empty board", () => {
    expect(allShipsSunk(createEmptyBoard())).toBe(false);
  });
});

describe("shipAt", () => {
  it("finds a ship at an occupied cell and null otherwise", () => {
    const board = placeShip(
      createEmptyBoard(),
      cruiser,
      { row: 4, col: 4 },
      "horizontal",
    );
    expect(shipAt(board, { row: 4, col: 5 })?.name).toBe("Cruiser");
    expect(shipAt(board, { row: 0, col: 0 })).toBeNull();
  });
});

describe("placeShipsRandomly", () => {
  it("places the full fleet without overlaps and within bounds", () => {
    const board = placeShipsRandomly();
    expect(board.ships).toHaveLength(SHIP_DEFS.length);

    const occupied = new Set<string>();
    for (const ship of board.ships) {
      expect(ship.cells).toHaveLength(ship.size);
      for (const c of ship.cells) {
        expect(inBounds(c)).toBe(true);
        const key = coordKey(c);
        expect(occupied.has(key)).toBe(false);
        occupied.add(key);
      }
    }
    const totalCells = SHIP_DEFS.reduce((sum, s) => sum + s.size, 0);
    expect(occupied.size).toBe(totalCells);
  });

  it("is deterministic given a seeded RNG", () => {
    const seeded = () => {
      // simple LCG for reproducibility
      seedState = (seedState * 1664525 + 1013904223) % 4294967296;
      return seedState / 4294967296;
    };
    let seedState = 42;
    const a = placeShipsRandomly(SHIP_DEFS, BOARD_SIZE, seeded);
    seedState = 42;
    const b = placeShipsRandomly(SHIP_DEFS, BOARD_SIZE, seeded);
    expect(a.ships.map((s) => s.cells)).toEqual(b.ships.map((s) => s.cells));
  });
});
