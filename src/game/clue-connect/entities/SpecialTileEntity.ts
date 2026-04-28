/**
 * SpecialTileEntity — pure logic for special tile behaviors.
 *
 * Covers: Mystery Box (spawn trigger, wildcard matching, +2 moves reward).
 *
 * No Math.random(). No Pixi. No DOM.
 */

// ── Mystery Box ────────────────────────────────────────────────────────

/** Minimum chain length to trigger Mystery Box spawn. */
export const MYSTERY_BOX_CHAIN_THRESHOLD = 5;

/**
 * Returns true if a chain of the given length should spawn a Mystery Box.
 */
export function shouldSpawnMysteryBox(chainLength: number): boolean {
  return chainLength >= MYSTERY_BOX_CHAIN_THRESHOLD;
}

/**
 * Returns the center tile index within a chain (floor of midpoint).
 * The Mystery Box spawns at this position.
 */
export function getMysteryBoxSpawnIndex(chainLength: number): number {
  return Math.floor(chainLength / 2);
}

/**
 * Returns true if a Mystery Box tile (isMystery=true) can be included in any chain
 * (matches any tile type — wildcard behavior).
 */
export function mysteryBoxMatchesKind(_boxKind: string, _chainKind: string): boolean {
  // Mystery Box is a wildcard — always matches
  return true;
}

/** Moves awarded when a Mystery Box is included in a cleared chain. */
export const MYSTERY_BOX_MOVE_BONUS = 2;
