/**
 * Batch 1: Board layout — 7×9 grid
 * Tests: cell count, cell size, grid bounds
 */

import { describe, it, expect } from 'vitest';
import {
  COLS,
  ROWS,
  CELL_SIZE,
  BOARD_W,
  BOARD_OFFSET_Y,
  HUD_H,
  BOTTOM_BAND_H,
  DOM_RESERVED_BOTTOM,
  SCREEN_H,
  GRID_W,
} from '~/game/clue-connect/config/layout';

describe('board layout — 7×9 grid', () => {
  it('board renders 7 cols × 9 rows; cell count equals 63', () => {
    expect(COLS).toBe(7);
    expect(ROWS).toBe(9);
    expect(COLS * ROWS).toBe(63);
  });

  it('cell size is 52px; grid fits within 374px board width', () => {
    expect(CELL_SIZE).toBe(52);
    // Grid width = cols * cellSize + (cols-1) * gap — must fit in BOARD_W
    expect(GRID_W).toBeLessThanOrEqual(BOARD_W + 4); // ±4px tolerance
  });

  it('board bottom edge does not exceed screen height minus 136px reserved (56 DOM + 80 GPU bottom)', () => {
    // Board starts at BOARD_OFFSET_Y and must fit entirely within:
    //   SCREEN_H - DOM_RESERVED_BOTTOM - BOTTOM_BAND_H
    const boardBottom = BOARD_OFFSET_Y + (ROWS * CELL_SIZE + (ROWS - 1) * 2); // approx
    const availableBottom = SCREEN_H - DOM_RESERVED_BOTTOM - BOTTOM_BAND_H;
    expect(boardBottom).toBeLessThanOrEqual(availableBottom);
  });
});
