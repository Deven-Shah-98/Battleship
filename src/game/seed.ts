import type { RNG } from "./types";

/** Hash a string into a 32-bit unsigned integer (djb2). */
export function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Mulberry32 PRNG — returns a function that yields numbers in [0, 1). */
export function mulberry32(seed: number): RNG {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Create an RNG from a string seed. */
export function seededRng(seed: string): RNG {
  return mulberry32(hashSeed(seed));
}

/** Generate a random human-readable seed (4 alphanumeric chars). */
export function randomSeedString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}
