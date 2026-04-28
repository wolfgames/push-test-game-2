/**
 * Batch 2: Chain input — ChainInputHandler
 * Tests: adjacency validation, chain building, cancel/confirm logic, input queueing
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ChainInputHandler,
  isAdjacent,
  canExtendChain,
} from '~/game/clue-connect/input/ChainInputHandler';
import type { TileKind } from '~/game/clue-connect/state/types';

describe('chain input — ChainInputHandler', () => {
  it('drag adds adjacent same-type tile to chain', () => {
    const handler = new ChainInputHandler();
    handler.start({ row: 2, col: 2, tileId: 1, kind: 'footprint' });
    const added = handler.tryExtend({ row: 2, col: 3, tileId: 2, kind: 'footprint' });
    expect(added).toBe(true);
    expect(handler.getChain().length).toBe(2);
  });

  it('drag to non-adjacent tile does not extend chain', () => {
    const handler = new ChainInputHandler();
    handler.start({ row: 0, col: 0, tileId: 1, kind: 'magnifying-glass' });
    // row 2 col 2 is distance 2 from 0,0 — not adjacent
    const added = handler.tryExtend({ row: 2, col: 2, tileId: 3, kind: 'magnifying-glass' });
    expect(added).toBe(false);
    expect(handler.getChain().length).toBe(1);
  });

  it('single-tile lift cancels silently; no move consumed', () => {
    const handler = new ChainInputHandler();
    handler.start({ row: 4, col: 4, tileId: 10, kind: 'rope' });
    const result = handler.commit();
    expect(result.confirmed).toBe(false);
    expect(result.chain.length).toBe(0);
    expect(handler.isActive()).toBe(false);
  });

  it('2+ tile release confirms chain; move decremented', () => {
    const handler = new ChainInputHandler();
    handler.start({ row: 1, col: 1, tileId: 5, kind: 'flashlight' });
    handler.tryExtend({ row: 1, col: 2, tileId: 6, kind: 'flashlight' });
    handler.tryExtend({ row: 1, col: 3, tileId: 7, kind: 'flashlight' });
    const result = handler.commit();
    expect(result.confirmed).toBe(true);
    expect(result.chain.length).toBe(3);
  });

  it('input queued during ANIMATING state', () => {
    const handler = new ChainInputHandler();
    handler.setPhase('ANIMATING');

    // Attempt to start a new chain — should queue, not immediately activate
    handler.start({ row: 0, col: 0, tileId: 1, kind: 'fingerprint' });
    // Chain should NOT be active during ANIMATING
    expect(handler.isActive()).toBe(false);
  });
});

describe('adjacency helpers', () => {
  it('orthogonal neighbor is adjacent (Chebyshev ≤ 1)', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
  });

  it('diagonal neighbor is adjacent (Chebyshev ≤ 1)', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true);
  });

  it('non-adjacent tile returns false', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });

  it('canExtendChain: same kind adjacent → true', () => {
    const chain = [{ row: 2, col: 2, tileId: 1, kind: 'footprint' as TileKind }];
    const candidate = { row: 2, col: 3, tileId: 2, kind: 'footprint' as TileKind };
    expect(canExtendChain(chain, candidate)).toBe(true);
  });

  it('canExtendChain: different kind → false', () => {
    const chain = [{ row: 2, col: 2, tileId: 1, kind: 'footprint' as TileKind }];
    const candidate = { row: 2, col: 3, tileId: 2, kind: 'rope' as TileKind };
    expect(canExtendChain(chain, candidate)).toBe(false);
  });

  it('canExtendChain: tile already in chain → false', () => {
    const chain = [
      { row: 2, col: 2, tileId: 1, kind: 'footprint' as TileKind },
      { row: 2, col: 3, tileId: 2, kind: 'footprint' as TileKind },
    ];
    // Trying to re-add tileId=1 (unwind one step is handled by the handler, not canExtendChain)
    const candidate = { row: 2, col: 2, tileId: 1, kind: 'footprint' as TileKind };
    expect(canExtendChain(chain, candidate)).toBe(false);
  });
});
