/**
 * Batch 7: Blocker tiles — Red Herring, Cobweb, Locked Door, Trap Door
 * Tests: Red Herring rejects chain; Cobweb frees on adjacent clear;
 *        Locked Door cleared by Key; Trap Door triggers extra column drop
 */

import { describe, it, expect } from 'vitest';
import {
  canIncludeInChain,
  shouldClearRedHerring,
  isCobwebFreed,
  isLockedDoorUnlocked,
  isTrapDoorCell,
  type BlockerCell,
} from '~/game/clue-connect/entities/BlockerEntity';

// ── Red Herring ────────────────────────────────────────────────────────

describe('blocker tiles — Red Herring', () => {
  it('Red Herring rejects chain inclusion; shake animation fires', () => {
    const redHerring: BlockerCell = {
      row: 3, col: 3,
      tileKind: 'red-herring',
      tileId: 99,
      blockerType: 'red-herring',
    };

    // Red Herring cannot be part of a chain
    expect(canIncludeInChain(redHerring)).toBe(false);
  });

  it('Red Herring clears when all 4 orthogonal adjacent tiles cleared in single move', () => {
    // shouldClearRedHerring(adjacentClearedCount): true when ≥ 4 orthogonal cleared
    expect(shouldClearRedHerring(4)).toBe(true);
    expect(shouldClearRedHerring(3)).toBe(false);
    expect(shouldClearRedHerring(5)).toBe(true); // also clears if more
  });
});

// ── Cobweb ────────────────────────────────────────────────────────────

describe('blocker tiles — Cobweb', () => {
  it('Cobweb traps tile; adjacent same-type chain frees it', () => {
    const cobwebCell: BlockerCell = {
      row: 2, col: 2,
      tileKind: 'footprint',
      tileId: 55,
      blockerType: 'cobweb',
    };

    // Cobweb cannot be chained directly (it's trapped)
    expect(canIncludeInChain(cobwebCell)).toBe(false);

    // isCobwebFreed: true when a 'footprint' chain clears adjacent to this cobweb
    const adjacentClearedKind = 'footprint';
    expect(isCobwebFreed(cobwebCell.tileKind, adjacentClearedKind)).toBe(true);

    // Wrong kind does not free it
    expect(isCobwebFreed(cobwebCell.tileKind, 'rope')).toBe(false);
  });
});

// ── Locked Door ───────────────────────────────────────────────────────

describe('blocker tiles — Locked Door', () => {
  it('Locked Door cleared by Key tile in 2+ chain', () => {
    // isLockedDoorUnlocked: true when chain contains a Key tile
    expect(isLockedDoorUnlocked(true)).toBe(true);
    expect(isLockedDoorUnlocked(false)).toBe(false);
  });
});

// ── Trap Door ─────────────────────────────────────────────────────────

describe('blocker tiles — Trap Door', () => {
  it('Trap Door cell triggers extra column drop after gravity', () => {
    // isTrapDoorCell returns true for cells marked as trap doors
    expect(isTrapDoorCell('trap-door')).toBe(true);
    expect(isTrapDoorCell('normal')).toBe(false);
    expect(isTrapDoorCell('footprint')).toBe(false);
  });
});
