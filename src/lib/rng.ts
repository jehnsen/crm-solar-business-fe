/**
 * Deterministic pseudo-random source for fixture generation.
 *
 * Fixtures need to look organic (production curves, scores, dates) but must be
 * byte-identical on every render — otherwise server and client markup diverge
 * and React hydration complains. A seeded generator gives both.
 */

export function makeRng(seed: number) {
  // mulberry32
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Pick one element. */
  pick<T>(items: readonly T[]): T;
  /** True with the given probability. */
  chance(p: number): boolean;
  /** Rounded to `decimals`. */
  round(min: number, max: number, decimals: number): number;
}

export function rngFrom(seed: number): Rng {
  const next = makeRng(seed);
  return {
    float: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
    round: (min, max, decimals) => {
      const v = min + next() * (max - min);
      const f = 10 ** decimals;
      return Math.round(v * f) / f;
    },
  };
}
