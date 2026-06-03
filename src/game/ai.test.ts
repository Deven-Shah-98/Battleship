import { describe, it, expect } from "vitest";
import {
  chooseAIMove,
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
