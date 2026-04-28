/**
 * TileEntity — helpers for working with board cell entities in ECS.
 *
 * No Pixi. No Math.random(). No DOM.
 */

import type { ClueConnectDatabase } from '~/game/clue-connect/ClueConnectPlugin';
import type { TileKind } from '~/game/clue-connect/state/types';
import { COLS, ROWS } from '~/game/clue-connect/config/layout';

/** Retrieves a board cell entity at the given row/col, or null if not found. */
export function getCellEntityAt(db: ClueConnectDatabase, row: number, col: number): number | null {
  const entities = db.select(['row', 'col', 'tileKind']);
  for (const e of entities) {
    if (db.get(e, 'row') === row && db.get(e, 'col') === col) {
      return e;
    }
  }
  return null;
}

/** Returns all board cell entities as an array (63 elements for 7×9). */
export function getAllCellEntities(db: ClueConnectDatabase): number[] {
  return db.select(['row', 'col', 'tileKind']) as number[];
}

/** Returns the tileKind at a given row/col, or null if cell not found. */
export function getTileKindAt(db: ClueConnectDatabase, row: number, col: number): TileKind | null {
  const entity = getCellEntityAt(db, row, col);
  if (entity === null) return null;
  return db.get(entity, 'tileKind') ?? null;
}

/** Returns the tileId at a given row/col, or null if cell not found. */
export function getTileIdAt(db: ClueConnectDatabase, row: number, col: number): number | null {
  const entity = getCellEntityAt(db, row, col);
  if (entity === null) return null;
  return db.get(entity, 'tileId') ?? null;
}

/** True if (row, col) is within the 7×9 board boundaries. */
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/** Chebyshev distance (for adjacency: ≤1 = adjacent including diagonals). */
export function chebyshevDistance(r1: number, c1: number, r2: number, c2: number): number {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}
