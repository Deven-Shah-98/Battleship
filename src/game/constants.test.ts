import { describe, it, expect } from "vitest";
import { BOARD_SIZE, SHIP_DEFS, COLUMN_LABELS } from "./constants";

describe("BOARD_SIZE", () => {
  it("is 10 (standard Battleship grid)", () => {
    expect(BOARD_SIZE).toBe(10);
  });
});

describe("SHIP_DEFS", () => {
  it("defines exactly 5 ships", () => {
    expect(SHIP_DEFS).toHaveLength(5);
  });

  it("includes the standard Battleship fleet", () => {
    const names = SHIP_DEFS.map((s) => s.name);
    expect(names).toContain("Carrier");
    expect(names).toContain("Battleship");
    expect(names).toContain("Cruiser");
    expect(names).toContain("Submarine");
    expect(names).toContain("Destroyer");
  });

  it("has correct ship sizes", () => {
    const sizeMap = Object.fromEntries(SHIP_DEFS.map((s) => [s.name, s.size]));
    expect(sizeMap["Carrier"]).toBe(5);
    expect(sizeMap["Battleship"]).toBe(4);
    expect(sizeMap["Cruiser"]).toBe(3);
    expect(sizeMap["Submarine"]).toBe(3);
    expect(sizeMap["Destroyer"]).toBe(2);
  });

  it("ships are ordered from largest to smallest", () => {
    for (let i = 0; i < SHIP_DEFS.length - 1; i++) {
      expect(SHIP_DEFS[i].size).toBeGreaterThanOrEqual(SHIP_DEFS[i + 1].size);
    }
  });

  it("total fleet cells equal 17", () => {
    const total = SHIP_DEFS.reduce((sum, s) => sum + s.size, 0);
    expect(total).toBe(17);
  });
});

describe("COLUMN_LABELS", () => {
  it("has exactly BOARD_SIZE labels", () => {
    expect(COLUMN_LABELS).toHaveLength(BOARD_SIZE);
  });

  it("labels are A through J", () => {
    expect(COLUMN_LABELS[0]).toBe("A");
    expect(COLUMN_LABELS[9]).toBe("J");
  });

  it("labels are sequential uppercase letters", () => {
    for (let i = 0; i < COLUMN_LABELS.length; i++) {
      expect(COLUMN_LABELS[i]).toBe(String.fromCharCode(65 + i));
    }
  });
});
