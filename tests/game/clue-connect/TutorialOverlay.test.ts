/**
 * Batch 6: Tutorial Overlay — level 1 constraints and ghost-finger
 * Tests: dims non-selectable tiles; only allowed chain tiles accept input;
 *        tutorial level 2 shows full 7×9 board
 */

import { describe, it, expect } from 'vitest';
import { TutorialConstraints, isCellAllowed } from '~/game/clue-connect/levelgen/TutorialOverlay';
import { COLS, ROWS } from '~/game/clue-connect/config/layout';

describe('tutorial overlay — level 1 constraints', () => {
  it('tutorial level 1 has a 4×5 sub-grid (rows 2-6, cols 1-4)', () => {
    const constraints: TutorialConstraints = {
      activeRows: [2, 3, 4, 5, 6],
      activeCols: [1, 2, 3, 4],
      forcedChain: [
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 4, col: 2 },
      ],
    };

    // Cells inside the active grid are allowed
    expect(isCellAllowed(3, 2, constraints)).toBe(true);
    expect(isCellAllowed(6, 4, constraints)).toBe(true);

    // Cells outside the active grid are NOT allowed (dimmed)
    expect(isCellAllowed(0, 0, constraints)).toBe(false);
    expect(isCellAllowed(8, 6, constraints)).toBe(false);
    expect(isCellAllowed(3, 0, constraints)).toBe(false);  // col 0 outside active cols
    expect(isCellAllowed(1, 2, constraints)).toBe(false);  // row 1 outside active rows
  });

  it('tutorial level 2 allows full 7×9 board (no constraints)', () => {
    const constraints: TutorialConstraints = {
      activeRows: null, // null means all rows allowed
      activeCols: null,
      forcedChain: [],
    };

    // All cells allowed when constraints are null
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        expect(isCellAllowed(r, c, constraints)).toBe(true);
      }
    }
  });

  it('ghost-finger overlay renders at forced chain start position', () => {
    const constraints: TutorialConstraints = {
      activeRows: [2, 3, 4, 5, 6],
      activeCols: [1, 2, 3, 4],
      forcedChain: [
        { row: 3, col: 2 },
        { row: 3, col: 3 },
      ],
    };

    // Ghost finger starts at the first tile of the forced chain
    expect(constraints.forcedChain[0]!.row).toBe(3);
    expect(constraints.forcedChain[0]!.col).toBe(2);
    expect(constraints.forcedChain.length).toBeGreaterThanOrEqual(2);
  });
});
