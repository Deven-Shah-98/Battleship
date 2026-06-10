import { describe, it, expect } from "vitest";
import { placeShip, createEmptyBoard } from "./board";
import { radarScan, sonarPing, airstrikeTargets, canUsePowerUp, spendPowerUp } from "./powerups";
import type { PowerUpState } from "./types";

function boardWithShip() {
  let board = createEmptyBoard();
  board = placeShip(board, { name: "Destroyer", size: 2 }, { row: 0, col: 0 }, "horizontal");
  return board;
}

describe("radarScan", () => {
  it("detects ship segments in 3x3 area", () => {
    const board = boardWithShip();
    const result = radarScan(board, { row: 0, col: 0 });
    const shipCells = result.cells.filter((c) => c.hasShip);
    expect(shipCells.length).toBe(2);
  });

  it("handles edge of board", () => {
    const board = boardWithShip();
    const result = radarScan(board, { row: 0, col: 0 });
    // 3x3 clamped to bounds: (0,0)-(1,1) = 4 cells
    expect(result.cells.length).toBe(4);
  });
});

describe("sonarPing", () => {
  it("counts ship segments in 3x3 area", () => {
    const board = boardWithShip();
    const result = sonarPing(board, { row: 0, col: 0 });
    expect(result.count).toBe(2);
  });

  it("returns 0 for empty area", () => {
    const board = boardWithShip();
    const result = sonarPing(board, { row: 9, col: 9 });
    expect(result.count).toBe(0);
  });
});

describe("airstrikeTargets", () => {
  it("returns up to 5 unshot cells in a row", () => {
    const board = boardWithShip();
    const targets = airstrikeTargets(board, "row", 5);
    expect(targets.length).toBeLessThanOrEqual(5);
    for (const t of targets) {
      expect(t.row).toBe(5);
    }
  });

  it("returns up to 5 unshot cells in a column", () => {
    const board = boardWithShip();
    const targets = airstrikeTargets(board, "col", 3);
    expect(targets.length).toBeLessThanOrEqual(5);
    for (const t of targets) {
      expect(t.col).toBe(3);
    }
  });
});

describe("canUsePowerUp / spendPowerUp", () => {
  it("checks availability correctly", () => {
    const ps: PowerUpState = { radar: 1, sonar: 0, airstrike: 2 };
    expect(canUsePowerUp(ps, "radar")).toBe(true);
    expect(canUsePowerUp(ps, "sonar")).toBe(false);
    expect(canUsePowerUp(ps, "airstrike")).toBe(true);
  });

  it("decrements usage", () => {
    const ps: PowerUpState = { radar: 1, sonar: 2, airstrike: 1 };
    const next = spendPowerUp(ps, "radar");
    expect(next.radar).toBe(0);
    expect(next.sonar).toBe(2);
  });

  it("does not go below 0", () => {
    const ps: PowerUpState = { radar: 0, sonar: 0, airstrike: 0 };
    const next = spendPowerUp(ps, "radar");
    expect(next.radar).toBe(0);
  });
});
