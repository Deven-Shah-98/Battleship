import { describe, it, expect } from "vitest";
import { hashSeed, mulberry32, seededRng, randomSeedString } from "./seed";

describe("hashSeed", () => {
  it("produces consistent hashes", () => {
    expect(hashSeed("test")).toBe(hashSeed("test"));
    expect(hashSeed("abc")).not.toBe(hashSeed("xyz"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const h = hashSeed("hello");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("mulberry32", () => {
  it("produces deterministic sequences", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("seededRng", () => {
  it("same seed gives same sequence", () => {
    const r1 = seededRng("HELLO");
    const r2 = seededRng("HELLO");
    expect(Array.from({ length: 5 }, () => r1())).toEqual(
      Array.from({ length: 5 }, () => r2()),
    );
  });
});

describe("randomSeedString", () => {
  it("returns a 4-character alphanumeric string", () => {
    const s = randomSeedString();
    expect(s).toHaveLength(4);
    expect(s).toMatch(/^[A-Z0-9]+$/);
  });
});
