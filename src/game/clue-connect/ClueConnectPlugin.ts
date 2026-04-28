/**
 * ClueConnectPlugin — ECS source of truth for Mystery Inc. Mash: Clue Connect.
 *
 * Property order MUST be: components → resources → archetypes → transactions → actions → systems.
 * (No services, computed used at core pass.)
 *
 * No Pixi imports. No Math.random(). No DOM reads.
 * All randomness is passed via action args (seeded RNG).
 */

import { Database } from '@adobe/data/ecs';
import { COLS, ROWS } from './config/layout';
import { TILE_KINDS, type TileKind, type BoardPhase } from './state/types';

// ── Plugin Definition ─────────────────────────────────────────────────

export const clueConnectPlugin = Database.Plugin.create({
  // 1. components — board cell entity shape
  components: {
    row:      { type: 'number', default: 0 } as const,
    col:      { type: 'number', default: 0 } as const,
    tileKind: { type: 'string', default: 'footprint' } as const,
    tileId:   { type: 'number', default: 0 } as const,
    // Blocker / overlay flags (used in batch 7; present now for schema completeness)
    isBlocked:  { type: 'boolean', default: false } as const,
    isMystery:  { type: 'boolean', default: false } as const,
    isKey:      { type: 'boolean', default: false } as const,
  },

  // 2. resources — game-wide mutable state
  resources: {
    score:               { default: 0 as number },
    movesRemaining:      { default: 20 as number },
    evidenceMeterValue:  { default: 0 as number },
    evidenceTarget:      { default: 100 as number },
    starsEarned:         { default: 0 as number },
    boardPhase:          { default: 'IDLE' as BoardPhase },
    snoopCoins:          { default: 0 as number },
    currentLevel:        { default: 1 as number },
    currentChapter:      { default: 1 as number },
    /** Next tileId to assign — monotonically increasing for stable identity. */
    nextTileId:          { default: 1 as number },
  },

  // 3. archetypes
  archetypes: {
    Block: ['row', 'col', 'tileKind', 'tileId', 'isBlocked', 'isMystery', 'isKey'],
  },

  // 4. transactions — atomic mutations
  transactions: {
    replaceBoard(store, args: { cells: Array<{ row: number; col: number; tileKind: string; tileId: number }> }) {
      // Clear all existing block entities
      for (const entity of store.select(['tileId'])) {
        store.delete(entity);
      }
      // Insert new board state
      for (const cell of args.cells) {
        store.archetypes.Block.insert({
          row: cell.row,
          col: cell.col,
          tileKind: cell.tileKind as TileKind,
          tileId: cell.tileId,
          isBlocked: false,
          isMystery: false,
          isKey: false,
        });
      }
    },

    addScore(store, args: { amount: number }) {
      store.resources.score += args.amount;
    },

    decrementMoves(store) {
      if (store.resources.movesRemaining > 0) {
        store.resources.movesRemaining -= 1;
      }
    },

    addEvidence(store, args: { amount: number }) {
      store.resources.evidenceMeterValue = Math.min(
        store.resources.evidenceMeterValue + args.amount,
        store.resources.evidenceTarget * 2, // allow overflow for star calculation
      );
    },

    setPhase(store, args: { phase: BoardPhase }) {
      store.resources.boardPhase = args.phase;
    },

    addCoins(store, args: { amount: number }) {
      store.resources.snoopCoins = Math.max(0, store.resources.snoopCoins + args.amount);
    },

    setStars(store, args: { stars: number }) {
      store.resources.starsEarned = args.stars;
    },

    setMoves(store, args: { moves: number }) {
      store.resources.movesRemaining = args.moves;
    },

    setLevel(store, args: { chapter: number; level: number; moveLimit: number; evidenceTarget: number }) {
      store.resources.currentChapter = args.chapter;
      store.resources.currentLevel = args.level;
      store.resources.movesRemaining = args.moveLimit;
      store.resources.evidenceTarget = args.evidenceTarget;
      store.resources.score = 0;
      store.resources.evidenceMeterValue = 0;
      store.resources.starsEarned = 0;
      store.resources.boardPhase = 'IDLE';
    },
  },

  // 5. actions — return animation metadata; no Pixi/DOM side effects
  actions: {
    /**
     * Populate the board with randomized tiles.
     * @param rng — seeded RNG function; () => [0,1). Must NOT use Math.random.
     */
    initBoard(db, args: { rng: () => number; moveLimit?: number; evidenceTarget?: number }) {
      const { rng, moveLimit = 20, evidenceTarget = 100 } = args;
      const cells: Array<{ row: number; col: number; tileKind: string; tileId: number }> = [];

      let nextId = db.store.resources.nextTileId;
      db.store.resources.movesRemaining = moveLimit;
      db.store.resources.evidenceTarget = evidenceTarget;
      db.store.resources.score = 0;
      db.store.resources.evidenceMeterValue = 0;
      db.store.resources.starsEarned = 0;
      db.store.resources.boardPhase = 'IDLE';

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const kindIndex = Math.floor(rng() * TILE_KINDS.length);
          cells.push({
            row: r,
            col: c,
            tileKind: TILE_KINDS[kindIndex],
            tileId: nextId++,
          });
        }
      }

      db.store.resources.nextTileId = nextId;
      db.transactions.replaceBoard({ cells });

      return { cellCount: cells.length };
    },

    /**
     * Execute a confirmed chain (2+ tiles).
     * Returns animation metadata; controller drives GSAP.
     * No Math.random — uses passed rng for refill tile kinds.
     */
    executeChain(
      db,
      args: {
        chain: Array<{ row: number; col: number; tileId: number; kind: TileKind }>;
        rng: () => number;
      },
    ) {
      const { chain, rng } = args;
      if (chain.length < 2) return { cleared: [], movements: [], refills: [] };

      const clearedTileIds = chain.map((c) => c.tileId);

      // Decrement moves and update phase
      db.transactions.decrementMoves();
      db.transactions.setPhase({ phase: 'ANIMATING' });

      // Return metadata for the controller to animate
      // (gravity + scoring are computed in scoringLogic / gravityLogic — batch 2&3)
      return {
        cleared: clearedTileIds,
        chainLength: chain.length,
        movements: [] as Array<{ tileId: number; fromRow: number; toRow: number; col: number }>,
        refills: [] as Array<{ row: number; col: number; tileKind: TileKind; tileId: number }>,
      };
    },
  },
});

// ── Type exports ──────────────────────────────────────────────────────

export type ClueConnectDatabase = Database.FromPlugin<typeof clueConnectPlugin>;
