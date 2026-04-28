/**
 * Layout constants for Mystery Inc. Mash: Clue Connect.
 *
 * All values derived from viewport budget in implementation-plan.yml.
 * Portrait target: 390×844 (iPhone reference).
 * DOM logo reserved at bottom: 56px.
 *
 * Do not import Pixi/DOM here — pure numeric constants only.
 */

// ── Screen dimensions ─────────────────────────────────────────────────
export const SCREEN_W = 390;
export const SCREEN_H = 844;

// ── Reserved areas ────────────────────────────────────────────────────
export const DOM_RESERVED_BOTTOM = 56;  // WolfGamesLogo
export const DOM_RESERVED_TOP = 0;

// ── HUD top band ─────────────────────────────────────────────────────
/** GPU HUD height: Evidence Meter + move counter + companion strip */
export const HUD_H = 120;

// ── Bottom band ───────────────────────────────────────────────────────
/** Pause + hint buttons; ≥44px targets */
export const BOTTOM_BAND_H = 80;

// ── Board origin ──────────────────────────────────────────────────────
export const BOARD_OFFSET_Y = HUD_H;                          // 120
export const BOARD_OFFSET_X = 8;                              // 8px side padding

// ── Board dimensions ─────────────────────────────────────────────────
export const BOARD_W = 374;                                   // 390 - 8*2 = 374
export const BOARD_H = 580;                                   // 844 - 120 - 80 - 56 = 588 → 580

// ── Grid ─────────────────────────────────────────────────────────────
export const COLS = 7;
export const ROWS = 9;
export const CELL_GAP = 2;                                    // px between cells
export const CELL_SIZE = 52;                                  // (374 - 2*6) / 7 ≈ 51.7 → 52
export const TILE_ART_SIZE = 42;                              // ~80% of cell; icon floor ≥24 ✓
export const MIN_TOUCH_TARGET = 52;                           // ≥44px ✓

/** Total grid width: COLS * CELL_SIZE + (COLS-1) * CELL_GAP */
export const GRID_W = COLS * CELL_SIZE + (COLS - 1) * CELL_GAP; // 364 + 12 = 376

/** Total grid height: ROWS * CELL_SIZE + (ROWS-1) * CELL_GAP */
export const GRID_H = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP; // 468 + 16 = 484
