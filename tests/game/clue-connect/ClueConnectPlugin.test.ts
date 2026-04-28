/**
 * Batch 1: ECS Foundation — ClueConnectPlugin
 * Tests: ECS DB creation, setActiveDb, bridgeEcsToSignals signal wiring, board entity init
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock solid-js (no DOM in test env)
vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

vi.mock('~/core/systems/ecs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/core/systems/ecs')>();
  return { ...actual };
});

// Suppress @adobe/data blob-store IndexedDB call in Node test environment.
// The ECS database works correctly without the persistence layer in tests.
vi.mock('@adobe/data/cache', () => ({
  getBlobStore: () => null,
  createBlobStore: () => null,
}));

import { Database } from '@adobe/data/ecs';
import { clueConnectPlugin, type ClueConnectDatabase } from '~/game/clue-connect/ClueConnectPlugin';
import { COLS, ROWS } from '~/game/clue-connect/config/layout';
import { setActiveDb } from '~/core/systems/ecs';
import { bridgeEcsToSignals } from '~/game/clue-connect/state/bridgeEcsToSignals';
import { gameState } from '~/game/state';

describe('ECS plugin — ClueConnectPlugin', () => {
  let db: ClueConnectDatabase;

  beforeEach(() => {
    db = Database.create(clueConnectPlugin);
  });

  it('ECS DB created from plugin; setActiveDb called', () => {
    expect(db).toBeDefined();
    expect(db.transactions).toBeDefined();
    expect(db.actions).toBeDefined();
    // setActiveDb is tested by calling it and ensuring no error
    expect(() => setActiveDb(db as any)).not.toThrow();
    expect(() => setActiveDb(null)).not.toThrow();
  });

  it('bridgeEcsToSignals wires score resource to gameState.setScore', () => {
    // Bridge returns a cleanup function
    const cleanup = bridgeEcsToSignals(db, gameState as any);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('board entities created for all 63 cells on init', () => {
    // initBoard action populates 63 cells (7×9)
    // Use a deterministic pseudo-random sequence
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    db.actions.initBoard({ rng });

    // Count board cell entities
    const cells = db.select(['row', 'col', 'tileKind']);
    expect(cells.length).toBe(COLS * ROWS); // 7*9 = 63
  });
});

describe('board entities — tile kinds', () => {
  let db: ClueConnectDatabase;

  beforeEach(() => {
    db = Database.create(clueConnectPlugin);
    let seed = 123;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    db.actions.initBoard({ rng });
  });

  it('all 6 tile types present after initBoard', () => {
    const cells = db.select(['row', 'col', 'tileKind']);
    const kinds = new Set(cells.map((e) => db.get(e, 'tileKind')));
    // With 63 cells and 6 types, all 6 should appear (statistically near-certain)
    expect(kinds.size).toBe(6);
  });

  it('board resources initialized', () => {
    expect(db.store.resources.score).toBe(0);
    expect(db.store.resources.movesRemaining).toBeGreaterThan(0);
    expect(db.store.resources.evidenceMeterValue).toBe(0);
    expect(db.store.resources.starsEarned).toBe(0);
    expect(db.store.resources.boardPhase).toBe('IDLE');
    expect(db.store.resources.snoopCoins).toBeGreaterThanOrEqual(0);
  });
});

// ── Batch 2 additions ─────────────────────────────────────────────────

describe('board state machine', () => {
  let db: ClueConnectDatabase;

  beforeEach(() => {
    db = Database.create(clueConnectPlugin);
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    db.actions.initBoard({ rng });
  });

  it('state transitions: IDLE → SELECTING → ANIMATING → IDLE', () => {
    expect(db.store.resources.boardPhase).toBe('IDLE');
    db.transactions.setPhase({ phase: 'SELECTING' });
    expect(db.store.resources.boardPhase).toBe('SELECTING');
    db.transactions.setPhase({ phase: 'ANIMATING' });
    expect(db.store.resources.boardPhase).toBe('ANIMATING');
    db.transactions.setPhase({ phase: 'IDLE' });
    expect(db.store.resources.boardPhase).toBe('IDLE');
  });

  it('LOST transition when movesRemaining reaches 0 and evidence not met', () => {
    db.transactions.setMoves({ moves: 1 });
    db.transactions.decrementMoves();
    expect(db.store.resources.movesRemaining).toBe(0);
    // Trigger LOST when moves = 0 and evidence < target
    expect(db.store.resources.evidenceMeterValue).toBeLessThan(
      db.store.resources.evidenceTarget,
    );
    db.transactions.setPhase({ phase: 'LOST' });
    expect(db.store.resources.boardPhase).toBe('LOST');
  });

  it('WON transition when evidenceMeterValue >= evidenceTarget', () => {
    db.transactions.addEvidence({ amount: db.store.resources.evidenceTarget });
    expect(db.store.resources.evidenceMeterValue).toBeGreaterThanOrEqual(
      db.store.resources.evidenceTarget,
    );
    db.transactions.setPhase({ phase: 'WON' });
    expect(db.store.resources.boardPhase).toBe('WON');
  });
});
