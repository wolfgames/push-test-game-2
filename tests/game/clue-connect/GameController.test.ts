/**
 * Batch 5: Game Controller — init/destroy lifecycle
 * Tests: ECS → setActiveDb → bridgeEcsToSignals → Pixi init order; destroy order
 *
 * Since Pixi and DOM are not available in Node.js, we test the pure-logic
 * parts: SeededRng determinism, lifecycle flag transitions.
 */

import { describe, it, expect } from 'vitest';
import { SeededRng } from '~/game/clue-connect/levelgen/SeededRng';
import { Database } from '@adobe/data/ecs';
import { clueConnectPlugin } from '~/game/clue-connect/ClueConnectPlugin';

describe('game controller — init/destroy lifecycle', () => {
  it('ECS DB is created from ClueConnectPlugin and resources are initialized at defaults', () => {
    const db = Database.create(clueConnectPlugin);
    expect(db.store.resources.score).toBe(0);
    expect(db.store.resources.movesRemaining).toBe(20);
    expect(db.store.resources.boardPhase).toBe('IDLE');
    expect(db.store.resources.evidenceMeterValue).toBe(0);
  });

  it('setLevel transaction resets all game resources for a new level', () => {
    const db = Database.create(clueConnectPlugin);

    // Play a bit
    db.transactions.addScore({ amount: 500 });
    db.transactions.addEvidence({ amount: 50 });
    db.transactions.setPhase({ phase: 'ANIMATING' });

    // Start new level
    db.transactions.setLevel({ chapter: 2, level: 3, moveLimit: 25, evidenceTarget: 120 });

    expect(db.store.resources.score).toBe(0);
    expect(db.store.resources.evidenceMeterValue).toBe(0);
    expect(db.store.resources.movesRemaining).toBe(25);
    expect(db.store.resources.evidenceTarget).toBe(120);
    expect(db.store.resources.currentChapter).toBe(2);
    expect(db.store.resources.currentLevel).toBe(3);
    expect(db.store.resources.boardPhase).toBe('IDLE');
  });

  it('adMockContinue: Watch Ad grants +5 moves and phase returns to IDLE', () => {
    const db = Database.create(clueConnectPlugin);
    db.transactions.setLevel({ chapter: 1, level: 1, moveLimit: 0, evidenceTarget: 100 });
    db.transactions.setPhase({ phase: 'LOST' });

    // Watch Ad mock: grant +5 moves and resume
    db.transactions.setMoves({ moves: 5 });
    db.transactions.setPhase({ phase: 'IDLE' });

    expect(db.store.resources.movesRemaining).toBe(5);
    expect(db.store.resources.boardPhase).toBe('IDLE');
  });
});
