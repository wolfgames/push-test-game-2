/**
 * Batch 1: Clue tiles — visual identity
 * Tests: all 6 tile types visually distinct; emoji/text fallback works
 */

import { describe, it, expect } from 'vitest';
import { TILE_KINDS, TILE_FALLBACKS, type TileKind } from '~/game/clue-connect/state/types';

describe('clue tiles — visual identity', () => {
  it('all 6 tile types have distinct visual representation', () => {
    expect(TILE_KINDS.length).toBe(6);
    // Each kind must have a unique emoji/text fallback
    const fallbackSet = new Set(TILE_KINDS.map((k) => TILE_FALLBACKS[k]));
    expect(fallbackSet.size).toBe(6);
  });

  it('tile fallback is emoji/text when atlas unavailable', () => {
    for (const kind of TILE_KINDS) {
      const fallback = TILE_FALLBACKS[kind];
      expect(typeof fallback).toBe('string');
      expect(fallback.length).toBeGreaterThan(0);
    }
  });
});
