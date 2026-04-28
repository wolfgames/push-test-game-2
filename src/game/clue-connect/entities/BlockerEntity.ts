/**
 * BlockerEntity — pure logic for blocker tile behaviors.
 *
 * Covers: Red Herring, Cobweb, Locked Door, Trap Door.
 *
 * No Math.random(). No Pixi. No DOM.
 */

// ── Types ─────────────────────────────────────────────────────────────

export type BlockerType = 'red-herring' | 'cobweb' | 'locked-door' | 'trap-door' | 'normal';

export interface BlockerCell {
  row: number;
  col: number;
  tileKind: string;
  tileId: number;
  blockerType: BlockerType;
}

// ── Chain inclusion rules ──────────────────────────────────────────────

/**
 * Returns true if a blocker cell can be included in a player chain.
 *
 * - Red Herring: never includable
 * - Cobweb: trapped — cannot be included until freed
 * - Locked Door: blocks passage through it
 * - Normal / other: check tileKind match elsewhere
 */
export function canIncludeInChain(cell: BlockerCell): boolean {
  switch (cell.blockerType) {
    case 'red-herring':
      return false;
    case 'cobweb':
      return false; // trapped until freed
    case 'locked-door':
      return false; // blocks until key used
    case 'trap-door':
      return true; // trap door cell is passable; extra drop triggered after clear
    case 'normal':
    default:
      return true;
  }
}

// ── Red Herring ────────────────────────────────────────────────────────

/**
 * Returns true if the Red Herring should clear this move.
 * Condition: 4+ orthogonal adjacent tiles were cleared in the same chain.
 *
 * @param orthogonalAdjacentCleared  Number of orthogonal neighbors that were in the cleared chain
 */
export function shouldClearRedHerring(orthogonalAdjacentCleared: number): boolean {
  return orthogonalAdjacentCleared >= 4;
}

// ── Cobweb ────────────────────────────────────────────────────────────

/**
 * Returns true if the Cobweb should be freed this move.
 * Condition: an adjacent chain cleared tiles of the same kind as the trapped tile.
 *
 * @param trappedKind     The tileKind of the cobweb-trapped tile
 * @param clearedKind     The tileKind of adjacent cleared chain tiles
 */
export function isCobwebFreed(trappedKind: string, clearedKind: string): boolean {
  return trappedKind === clearedKind;
}

// ── Locked Door ───────────────────────────────────────────────────────

/**
 * Returns true if the Locked Door should unlock.
 * Condition: the chain included a Key tile (isKey=true).
 *
 * @param chainIncludesKey  Whether the player's chain included a Key tile
 */
export function isLockedDoorUnlocked(chainIncludesKey: boolean): boolean {
  return chainIncludesKey;
}

// ── Trap Door ─────────────────────────────────────────────────────────

/**
 * Returns true if the cell type is a Trap Door.
 * Trap Door cells cause extra column drop after normal gravity.
 *
 * @param cellType  The tileKind or special marker for the cell
 */
export function isTrapDoorCell(cellType: string): boolean {
  return cellType === 'trap-door';
}

/** Extra drop delay (ms per cell) for Trap Door triggered drops. */
export const TRAP_DOOR_DROP_DELAY_MS = 60;
