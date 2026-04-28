/**
 * Type definitions for Clue Connect game state.
 * No Pixi imports. No DOM. Pure types and constants.
 */

// ── Tile kinds ────────────────────────────────────────────────────────

export const TILE_KINDS = [
  'footprint',
  'magnifying-glass',
  'flashlight',
  'fingerprint',
  'rope',
  'scooby-snack',
] as const;

export type TileKind = typeof TILE_KINDS[number];

/** Emoji/text fallback for each tile type (displayed when atlas unavailable). */
export const TILE_FALLBACKS: Record<TileKind, string> = {
  'footprint': '🐾',
  'magnifying-glass': '🔍',
  'flashlight': '🔦',
  'fingerprint': '👆',
  'rope': '🪢',
  'scooby-snack': '🦴',
};

/** Human-readable label for each tile type. */
export const TILE_LABELS: Record<TileKind, string> = {
  'footprint': 'Footprint',
  'magnifying-glass': 'Magnifying Glass',
  'flashlight': 'Flashlight',
  'fingerprint': 'Fingerprint',
  'rope': 'Rope',
  'scooby-snack': 'Scooby Snack',
};

// ── Board phase ───────────────────────────────────────────────────────

export type BoardPhase = 'IDLE' | 'SELECTING' | 'ANIMATING' | 'WON' | 'LOST' | 'PAUSED';

// ── Chain item ────────────────────────────────────────────────────────

export interface ChainItem {
  row: number;
  col: number;
  tileId: number;
  kind: TileKind;
}

// ── Board cell ────────────────────────────────────────────────────────

export interface BoardCell {
  row: number;
  col: number;
  tileKind: TileKind;
  tileId: number;
}

// ── BoardState (flat 2D array of cells) ──────────────────────────────

export type BoardState = BoardCell[][];
