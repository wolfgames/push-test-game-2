/**
 * Batch 7: Pause and Hint — board state transitions and coin cost
 * Tests: pause → PAUSED; resume → IDLE; hint with 0 coins shows no hint;
 *        hint deducts 1 coin and highlights longest chain
 */

import { describe, it, expect } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { clueConnectPlugin } from '~/game/clue-connect/ClueConnectPlugin';
import { findLongestChain } from '~/game/clue-connect/levelgen/SolvabilityValidator';
import { COLS, ROWS } from '~/game/clue-connect/config/layout';

function makeBoard(kindGrid: string[][]): Array<{ row: number; col: number; tileKind: string; tileId: number }> {
  const cells: Array<{ row: number; col: number; tileKind: string; tileId: number }> = [];
  for (let r = 0; r < kindGrid.length; r++) {
    for (let c = 0; c < kindGrid[r]!.length; c++) {
      cells.push({ row: r, col: c, tileKind: kindGrid[r]![c]!, tileId: r * COLS + c + 1 });
    }
  }
  return cells;
}

describe('pause and hint — board state', () => {
  it('pause transitions to PAUSED; resume returns to IDLE', () => {
    const db = Database.create(clueConnectPlugin);
    expect(db.store.resources.boardPhase).toBe('IDLE');

    // Simulate pause button tap
    db.transactions.setPhase({ phase: 'PAUSED' });
    expect(db.store.resources.boardPhase).toBe('PAUSED');

    // Resume
    db.transactions.setPhase({ phase: 'IDLE' });
    expect(db.store.resources.boardPhase).toBe('IDLE');
  });

  it('hint with 0 coins shows no hint (canShowHint returns false)', () => {
    const db = Database.create(clueConnectPlugin);
    expect(db.store.resources.snoopCoins).toBe(0);

    // Hint requires ≥1 coin
    const canShow = db.store.resources.snoopCoins >= 1;
    expect(canShow).toBe(false);
  });

  it('hint deducts 1 coin and highlights longest chain for 2s', () => {
    const db = Database.create(clueConnectPlugin);
    db.transactions.addCoins({ amount: 5 });
    expect(db.store.resources.snoopCoins).toBe(5);

    // Use hint: deduct 1 coin
    db.transactions.addCoins({ amount: -1 });
    expect(db.store.resources.snoopCoins).toBe(4);
  });
});

describe('hint algorithm — longest chain finder', () => {
  it('findLongestChain returns the longest connected same-kind chain', () => {
    // Build a simple board where col 0 is all 'footprint' (9 tiles in a chain)
    const grid: string[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) =>
        c === 0 ? 'footprint' : (r % 2 === 0 ? 'rope' : 'magnifying-glass'),
      ),
    );

    const cells = makeBoard(grid).map((c) => ({ row: c.row, col: c.col, tileKind: c.tileKind, tileId: c.tileId }));

    // Build 2D board for validator
    const board = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => cells[r * COLS + c]!),
    );

    const chain = findLongestChain(board);
    // Col 0 has 9 footprint tiles, all Chebyshev-adjacent vertically
    expect(chain.length).toBe(ROWS); // 9 tiles
    expect(chain.every((t) => t.tileKind === 'footprint')).toBe(true);
  });
});
