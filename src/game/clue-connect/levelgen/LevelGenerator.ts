/**
 * LevelGenerator — generates a solvable 7×9 board for a given chapter + level.
 *
 * Seed formula: chapter * 10000 + level * 100 + 7331
 * Solvability: validated by SolvabilityValidator (greedy BFS, 1 valid chain required).
 * Fallback: if 10 retries fail, returns from fallback-levels.json.
 *
 * No Math.random(). No Pixi. No DOM.
 */

import { SeededRng } from './SeededRng';
import { isBoardSolvable } from './SolvabilityValidator';
import { COLS, ROWS } from '~/game/clue-connect/config/layout';
import { TILE_KINDS, type TileKind } from '~/game/clue-connect/state/types';
import fallbackData from '~/game/clue-connect/data/fallback-levels.json';

// ── Types ─────────────────────────────────────────────────────────────

export interface LevelCell {
  row: number;
  col: number;
  tileKind: string;
  tileId: number;
}

export interface GeneratedLevel {
  board: LevelCell[][];
  solvable: boolean;
  usedFallback: boolean;
  seed: number;
}

export interface GenerateLevelOptions {
  chapter: number;
  level: number;
  /** Override options for testing. */
  forceFallback?: boolean;
  maxRetries?: number;
}

// ── Seed formula ──────────────────────────────────────────────────────

/** Returns the base seed for a chapter + level. */
export function LEVEL_SEED_FORMULA(chapter: number, level: number): number {
  return chapter * 10000 + level * 100 + 7331;
}

// ── Fallback board ────────────────────────────────────────────────────

function getFallbackBoard(): LevelCell[][] {
  const fallback = fallbackData.levels[0]!;
  const board: LevelCell[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      tileKind: (fallback.board[r]![c] as string) ?? 'footprint',
      tileId: r * COLS + c + 1,
    })),
  );
  return board;
}

// ── Board generator ───────────────────────────────────────────────────

function generateBoard(rng: SeededRng): LevelCell[][] {
  let tileId = 1;
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      tileKind: rng.pick(TILE_KINDS) as string,
      tileId: tileId++,
    })),
  );
}

// ── Main export ───────────────────────────────────────────────────────

/**
 * Generate a solvable level board.
 *
 * Retry loop: seed → generate → validate; on failure seed+1 up to maxRetries.
 * Falls back to fallback-levels.json on exhaustion.
 */
export function generateLevel(options: GenerateLevelOptions): GeneratedLevel {
  const { chapter, level, forceFallback = false, maxRetries = 10 } = options;
  const baseSeed = LEVEL_SEED_FORMULA(chapter, level);

  if (forceFallback) {
    return {
      board: getFallbackBoard(),
      solvable: true,
      usedFallback: true,
      seed: baseSeed,
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const seed = baseSeed + attempt;
    const rng = new SeededRng(seed);
    const board = generateBoard(rng);

    if (isBoardSolvable(board, 1)) {
      return { board, solvable: true, usedFallback: false, seed };
    }
  }

  // All retries failed — use fallback
  return {
    board: getFallbackBoard(),
    solvable: true,
    usedFallback: true,
    seed: baseSeed,
  };
}
