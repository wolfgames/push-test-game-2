/**
 * TutorialOverlay — pure logic for tutorial level constraints.
 *
 * Determines which cells are active/selectable in tutorial mode.
 * GPU rendering is handled by TutorialRenderer (Pixi) — this module is pure.
 *
 * No Math.random(). No Pixi. No DOM.
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface TutorialConstraints {
  /** Active rows (indices). null = all rows active (no restriction). */
  activeRows: number[] | null;
  /** Active cols (indices). null = all cols active (no restriction). */
  activeCols: number[] | null;
  /** Forced chain — cells player must connect to complete this tutorial step. */
  forcedChain: Array<{ row: number; col: number }>;
}

// ── Pure logic ────────────────────────────────────────────────────────

/**
 * Returns true if the cell at (row, col) is selectable given the tutorial constraints.
 *
 * @param row         Row index
 * @param col         Column index
 * @param constraints Tutorial constraints (activeRows/activeCols as whitelist)
 */
export function isCellAllowed(row: number, col: number, constraints: TutorialConstraints): boolean {
  if (constraints.activeRows !== null && !constraints.activeRows.includes(row)) return false;
  if (constraints.activeCols !== null && !constraints.activeCols.includes(col)) return false;
  return true;
}

/**
 * Tutorial level 1 constraints: 4×5 sub-grid (rows 2-6, cols 1-4).
 */
export const TUTORIAL_1_CONSTRAINTS: TutorialConstraints = {
  activeRows: [2, 3, 4, 5, 6],
  activeCols: [1, 2, 3, 4],
  forcedChain: [
    { row: 3, col: 2 },
    { row: 3, col: 3 },
    { row: 4, col: 3 },
    { row: 4, col: 2 },
  ],
};

/**
 * Tutorial level 2 constraints: full 7×9 board.
 */
export const TUTORIAL_2_CONSTRAINTS: TutorialConstraints = {
  activeRows: null,
  activeCols: null,
  forcedChain: [],
};
