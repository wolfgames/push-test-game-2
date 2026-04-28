/**
 * gravityLogic — pure board gravity and refill logic.
 *
 * No Math.random(). No Pixi. No DOM.
 * Seeded RNG passed in for new tile kind generation.
 *
 * Approach: column-by-column compaction.
 * 1. For each column, remove cleared tiles and compact remaining tiles downward.
 * 2. Compute movements: for each tile that moved, record (tileId, fromRow, toRow, col).
 * 3. Spawn new tiles from above to fill empty cells, recording refills.
 * 4. Return { newBoard, movements, refills }.
 *
 * Stable identity: tiles that move are repositioned, NOT recreated.
 * Only tiles that moved appear in movements[].
 */

import { COLS, ROWS } from '~/game/clue-connect/config/layout';
import { TILE_KINDS, type TileKind, type BoardCell, type BoardState } from './types';

export interface TileMovement {
  tileId: number;
  fromRow: number;
  toRow: number;
  col: number;
}

export interface TileRefill {
  row: number;
  col: number;
  tileKind: TileKind;
  tileId: number;
}

export interface GravityResult {
  newBoard: BoardState;
  movements: TileMovement[];
  refills: TileRefill[];
}

/**
 * Compute board state after gravity and refill.
 *
 * @param board         Current board (2D array [row][col])
 * @param clearedTileIds  Set of tileIds that were cleared
 * @param rng           Seeded RNG: () => [0,1); NO Math.random()
 * @param nextTileId    Starting tileId for new spawn tiles
 * @returns             { newBoard, movements, refills }
 */
export function boardAfterGravity(
  board: BoardState,
  clearedTileIds: Set<number>,
  rng: () => number,
  nextTileId = 10000,
): GravityResult {
  const movements: TileMovement[] = [];
  const refills: TileRefill[] = [];

  // Clone board to avoid mutating input
  const newBoard: BoardState = board.map((row) => row.map((cell) => ({ ...cell })));

  let spawnId = nextTileId;

  for (let c = 0; c < COLS; c++) {
    // Collect existing tiles in this column (top to bottom), excluding cleared ones
    const colTiles: Array<{ cell: BoardCell; originalRow: number }> = [];

    for (let r = 0; r < ROWS; r++) {
      const cell = board[r]![c]!;
      if (!clearedTileIds.has(cell.tileId)) {
        colTiles.push({ cell, originalRow: r });
      }
    }

    // Count how many cleared slots in this column
    const clearedCount = ROWS - colTiles.length;

    // Place surviving tiles at the bottom (gravity pulls down)
    for (let i = 0; i < colTiles.length; i++) {
      const { cell, originalRow } = colTiles[i]!;
      const newRow = ROWS - colTiles.length + i; // compact toward bottom

      newBoard[newRow]![c] = {
        row: newRow,
        col: c,
        tileKind: cell.tileKind,
        tileId: cell.tileId,
      };

      // Record movement only if row changed
      if (newRow !== originalRow) {
        movements.push({
          tileId: cell.tileId,
          fromRow: originalRow,
          toRow: newRow,
          col: c,
        });
      }
    }

    // Fill empty rows at top with new tiles
    for (let i = 0; i < clearedCount; i++) {
      const newRow = i; // new tiles appear at top
      const kindIndex = Math.floor(rng() * TILE_KINDS.length);
      const kind: TileKind = TILE_KINDS[kindIndex]!;
      const tileId = spawnId++;

      newBoard[newRow]![c] = {
        row: newRow,
        col: c,
        tileKind: kind,
        tileId,
      };

      refills.push({ row: newRow, col: c, tileKind: kind, tileId });
    }
  }

  return { newBoard, movements, refills };
}

/**
 * Flatten a 2D board into an array of cells (for ECS batch insert).
 */
export function flattenBoard(board: BoardState): BoardCell[] {
  return board.flat();
}

/**
 * Build a 2D board from ECS entity data (sorted by row/col).
 */
export function buildBoardFrom(
  cells: Array<{ row: number; col: number; tileKind: TileKind; tileId: number }>,
): BoardState {
  const board: BoardState = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      tileKind: 'footprint' as TileKind,
      tileId: -(r * COLS + c + 1),
    })),
  );

  for (const cell of cells) {
    if (cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS) {
      board[cell.row]![cell.col] = {
        row: cell.row,
        col: cell.col,
        tileKind: cell.tileKind,
        tileId: cell.tileId,
      };
    }
  }

  return board;
}
