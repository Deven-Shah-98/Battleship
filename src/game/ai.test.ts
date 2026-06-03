import { describe, it, expect } from "vitest";
import {
  chooseAIMove,
  computeHeatmap,
  createAIState,
  updateAIAfterResult,
} from "./ai";
import {
  allShipsSunk,
  coordKey,
  placeShipsRandomly,
  receiveAttack,
} from "./board";
import { createEmptyBoard, placeShip } from "./board";

describe("chooseAIMove", () => {
  it("only fires at untried cells", () => {
    let board = placeShipsRandomly();
    let state = createAIState();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const { move, state: next } = chooseAIMove(board, state);
      expect(coordKey(move) in board.shots).toBe(false);
      expect(seen.has(coordKey(move))).toBe(false);
      seen.add(coordKey(move));
      board = receiveAttack(board, move).board;
      state = next;
    }
  });

  it("prefers queued target cells after a hit", () => {
    const board = createEmptyBoard();
    const state = { targetQueue: [{ row: 4, col: 4 }] };
    const { move } = chooseAIMove(board, state);
    expect(move).toEqual({ row: 4, col: 4 });
  });

  it("skips queued cells that were already fired at", () => {
    let board = createEmptyBoard();
    board = receiveAttack(board, { row: 4, col: 4 }).board;
    const state = {
      targetQueue: [
        { row: 0, col: 0 },
        { row: 4, col: 4 },
      ],
    };
    const { move } = chooseAIMove(board, state);
    expect(move).toEqual({ row: 0, col: 0 });
  });
});

describe("updateAIAfterResult", () => {
  it("queues orthogonal neighbours after a non-sinking hit", () => {
    const board = createEmptyBoard();
    const state = updateAIAfterResult(
      createAIState(),
      board,
      { row: 5, col: 5 },
      "hit",
      false,
    );
    const keys = state.targetQueue.map(coordKey).sort();
    expect(keys).toEqual(["4,5", "5,4", "5,6", "6,5"].sort());
  });

  it("does not queue neighbours on a miss", () => {
    const state = updateAIAfterResult(
      createAIState(),
      createEmptyBoard(),
      { row: 5, col: 5 },
      "miss",
      false,
    );
    expect(state.targetQueue).toHaveLength(0);
  });

  it("does not queue neighbours when the hit sinks a ship", () => {
    const state = updateAIAfterResult(
      createAIState(),
      createEmptyBoard(),
      { row: 5, col: 5 },
      "hit",
      true,
    );
    expect(state.targetQueue).toHaveLength(0);
  });

  it("excludes out-of-bounds and already-fired neighbours", () => {
    let board = createEmptyBoard();
    board = receiveAttack(board, { row: 0, col: 1 }).board;
    const state = updateAIAfterResult(
      createAIState(),
      board,
      { row: 0, col: 0 },
      "hit",
      false,
    );
    const keys = state.targetQueue.map(coordKey).sort();
    // (0,0) corner: neighbours are (0,1) [already fired] and (1,0).
    expect(keys).toEqual(["1,0"]);
  });
});

describe("AI can finish a game", () => {
  it("eventually sinks a small fleet", () => {
    let board = createEmptyBoard();
    board = placeShip(board, { name: "Destroyer", size: 2 }, { row: 0, col: 0 }, "horizontal");
    board = placeShip(board, { name: "Cruiser", size: 3 }, { row: 5, col: 5 }, "vertical");
    let state = createAIState();

    for (let i = 0; i < 200 && !allShipsSunk(board); i++) {
      const { move, state: next } = chooseAIMove(board, state);
      const { board: nb, result, sunkShip } = receiveAttack(board, move);
      board = nb;
      state = updateAIAfterResult(next, board, move, result, !!sunkShip);
    }
    expect(allShipsSunk(board)).toBe(true);
  });
});

describe("difficulty levels", () => {
  it("easy fires only at untried cells", () => {
    let board = placeShipsRandomly();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const { move } = chooseAIMove(board, createAIState(), "easy");
      expect(coordKey(move) in board.shots).toBe(false);
      expect(seen.has(coordKey(move))).toBe(false);
      seen.add(coordKey(move));
      board = receiveAttack(board, move).board;
    }
  });

  it("hard never fires at a known miss or repeats a shot", () => {
    let board = placeShipsRandomly();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const { move } = chooseAIMove(board, createAIState(), "hard");
      const key = coordKey(move);
      expect(board.shots[key]).toBeUndefined();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      board = receiveAttack(board, move).board;
    }
  });

  it("hard sinks a small fleet faster than random on average", () => {
    const play = (difficulty: "easy" | "hard"): number => {
      let total = 0;
      const games = 12;
      for (let g = 0; g < games; g++) {
        let board = createEmptyBoard();
        board = placeShip(board, { name: "Cruiser", size: 3 }, { row: 2, col: 2 }, "horizontal");
        board = placeShip(board, { name: "Destroyer", size: 2 }, { row: 6, col: 7 }, "vertical");
        let state = createAIState();
        let shots = 0;
        for (let i = 0; i < 200 && !allShipsSunk(board); i++) {
          const { move, state: next } = chooseAIMove(board, state, difficulty);
          const { board: nb, result, sunkShip } = receiveAttack(board, move);
          board = nb;
          state = updateAIAfterResult(next, board, move, result, !!sunkShip);
          shots += 1;
        }
        total += shots;
      }
      return total / games;
    };
    expect(play("hard")).toBeLessThan(play("easy"));
  });
});

describe("computeHeatmap", () => {
  it("boosts cells in line with an unresolved hit", () => {
    let board = createEmptyBoard();
    board = placeShip(board, { name: "Cruiser", size: 3 }, { row: 4, col: 3 }, "horizontal");
    // Register a hit at the middle of the cruiser without sinking it.
    board = receiveAttack(board, { row: 4, col: 4 }).board;

    const heat = computeHeatmap(board);
    // Neighbours of the hit should outscore a far-away corner cell.
    expect(heat[4][3]).toBeGreaterThan(heat[0][0]);
    expect(heat[4][5]).toBeGreaterThan(heat[0][0]);
  });

  it("assigns zero probability to cells boxed in by misses", () => {
    let board = createEmptyBoard();
    board = placeShip(board, { name: "Cruiser", size: 3 }, { row: 5, col: 5 }, "horizontal");
    // Surround the (0,0) corner with misses so no ship of size >= 2 can cover it.
    board = { ...board, shots: { "0,1": "miss", "1,0": "miss" } };
    const heat = computeHeatmap(board);
    expect(heat[0][0]).toBe(0);
  });
});
