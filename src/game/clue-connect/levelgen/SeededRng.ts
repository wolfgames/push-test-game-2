/**
 * SeededRng — deterministic pseudo-random number generator.
 *
 * Algorithm: mulberry32 — fast, simple, good distribution for game use.
 * Produces values in [0, 1).
 *
 * No Math.random(). No DOM. No Pixi.
 */

export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0; // treat as unsigned 32-bit integer
  }

  /** Returns a value in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = (z ^ (z >>> 14)) >>> 0;
    return z / 4294967296;
  }

  /** Returns a random integer in [min, max). */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Returns a random element from an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length)]!;
  }

  /** Creates a () => number function from this rng (for compatibility with gravityLogic). */
  asFunction(): () => number {
    return () => this.next();
  }
}
