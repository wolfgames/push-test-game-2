/**
 * ChainInputHandler — manages the tap-and-drag chain selection state.
 *
 * Pure state management (no Pixi, no DOM). Input events are translated to
 * chain operations by the GameController and fed in here.
 *
 * Interaction archetype: Swipe-Select (continuous drag over matching tiles).
 * - pointerdown on a tile → start chain
 * - pointermove to adjacent same-type tile → extend chain
 * - cross back to previous tile → unwind (pop last tile)
 * - pointerup with 1 tile → cancel silently, no move consumed
 * - pointerup with 2+ tiles → confirm chain, move consumed
 *
 * Input is QUEUED (not discarded) during ANIMATING phase.
 */

import type { TileKind, ChainItem, BoardPhase } from '~/game/clue-connect/state/types';

export interface ChainResult {
  confirmed: boolean;
  chain: ChainItem[];
}

/** Chebyshev distance ≤ 1 = adjacent (including diagonals). */
export function isAdjacent(
  a: { row: number; col: number },
  b: { row: number; col: number },
): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

/**
 * Returns true if the candidate tile can be added to the chain:
 * - Same tile kind as head of chain
 * - Adjacent (Chebyshev ≤ 1) to head of chain
 * - Not already in the chain
 */
export function canExtendChain(
  chain: ChainItem[],
  candidate: ChainItem,
): boolean {
  if (chain.length === 0) return true;
  const head = chain[chain.length - 1]!;

  // Different kind
  if (candidate.kind !== head.kind) return false;

  // Not adjacent
  if (!isAdjacent(head, candidate)) return false;

  // Already in chain
  if (chain.some((c) => c.tileId === candidate.tileId)) return false;

  return true;
}

/**
 * ChainInputHandler — call start() on pointerdown, tryExtend() on pointermove,
 * commit() on pointerup.
 */
export class ChainInputHandler {
  private chain: ChainItem[] = [];
  private active = false;
  private phase: BoardPhase = 'IDLE';
  private pendingStart: ChainItem | null = null;

  /** Current board phase — set by game controller to gate input. */
  setPhase(phase: BoardPhase): void {
    this.phase = phase;
    if (phase === 'IDLE' && this.pendingStart) {
      // Drain queued start when animation completes
      this.start(this.pendingStart);
      this.pendingStart = null;
    }
  }

  /** Begin a new chain. Queued if phase === ANIMATING. */
  start(tile: ChainItem): void {
    if (this.phase === 'ANIMATING' || this.phase === 'WON' || this.phase === 'LOST' || this.phase === 'PAUSED') {
      // Queue the start for when animation ends (ANIMATING only)
      if (this.phase === 'ANIMATING') {
        this.pendingStart = tile;
      }
      return;
    }

    this.chain = [tile];
    this.active = true;
  }

  /** Attempt to extend the chain with a new tile. Returns true if added. */
  tryExtend(tile: ChainItem): boolean {
    if (!this.active || this.phase !== 'IDLE') return false;

    // Unwind: if candidate is the second-to-last in chain, pop the last
    if (this.chain.length >= 2) {
      const secondToLast = this.chain[this.chain.length - 2]!;
      if (secondToLast.tileId === tile.tileId) {
        this.chain.pop();
        return true;
      }
    }

    if (canExtendChain(this.chain, tile)) {
      this.chain.push(tile);
      return true;
    }
    return false;
  }

  /**
   * Commit the chain on finger-up.
   * - 1 tile → cancel silently (confirmed=false)
   * - 2+ tiles → confirm (confirmed=true)
   * Resets handler state in both cases.
   */
  commit(): ChainResult {
    if (!this.active) {
      return { confirmed: false, chain: [] };
    }

    const result: ChainResult =
      this.chain.length >= 2
        ? { confirmed: true, chain: [...this.chain] }
        : { confirmed: false, chain: [] };

    this.reset();
    return result;
  }

  /** Cancel the current chain without committing. */
  cancel(): void {
    this.reset();
  }

  private reset(): void {
    this.chain = [];
    this.active = false;
  }

  /** Returns a copy of the current chain. */
  getChain(): ChainItem[] {
    return [...this.chain];
  }

  /** True if a chain is currently in progress. */
  isActive(): boolean {
    return this.active;
  }

  /** Returns the current chain head (last item), or null if chain is empty. */
  getHead(): ChainItem | null {
    return this.chain.length > 0 ? this.chain[this.chain.length - 1]! : null;
  }
}
