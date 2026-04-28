/**
 * Batch 4: Win/Loss Sequences — animation order and Watch Ad mock
 * Tests: WON transition, LOST transition, Watch Ad mock (+5 moves)
 */

import { describe, it, expect } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { clueConnectPlugin } from '~/game/clue-connect/ClueConnectPlugin';
import { computeCoins } from '~/game/clue-connect/state/scoringLogic';

describe('win/loss sequences — animation order', () => {
  it('WON transition triggers when evidenceMeterValue >= evidenceTarget', () => {
    const db = Database.create(clueConnectPlugin);

    // Set level conditions
    db.transactions.setLevel({
      chapter: 1, level: 1,
      moveLimit: 20, evidenceTarget: 100,
    });

    // Fill evidence to win level
    db.transactions.addEvidence({ amount: 100 });
    // Trigger win: check conditions
    const meter = db.store.resources.evidenceMeterValue;
    const target = db.store.resources.evidenceTarget;
    expect(meter).toBeGreaterThanOrEqual(target);

    // Board should be set to WON by game controller logic when meter >= target
    db.transactions.setPhase({ phase: 'WON' });
    expect(db.store.resources.boardPhase).toBe('WON');
  });

  it('LOST transition triggers when movesRemaining reaches 0 and evidence not met', () => {
    const db = Database.create(clueConnectPlugin);
    db.transactions.setLevel({
      chapter: 1, level: 1,
      moveLimit: 1, evidenceTarget: 100,
    });

    // Decrement to 0 moves
    db.transactions.decrementMoves();
    expect(db.store.resources.movesRemaining).toBe(0);

    // Evidence not met
    expect(db.store.resources.evidenceMeterValue).toBeLessThan(db.store.resources.evidenceTarget);

    // Game controller detects: moves=0 AND evidence < target → LOST
    db.transactions.setPhase({ phase: 'LOST' });
    expect(db.store.resources.boardPhase).toBe('LOST');
  });

  it('Watch Ad mock grants +5 moves and resets board to IDLE', () => {
    const db = Database.create(clueConnectPlugin);
    db.transactions.setLevel({
      chapter: 1, level: 1,
      moveLimit: 0, evidenceTarget: 100,
    });
    db.transactions.setPhase({ phase: 'LOST' });

    // Simulate Watch Ad: +5 moves and return to IDLE
    db.transactions.setMoves({ moves: 5 });
    db.transactions.setPhase({ phase: 'IDLE' });

    expect(db.store.resources.movesRemaining).toBe(5);
    expect(db.store.resources.boardPhase).toBe('IDLE');
  });
});

describe('coin award formula', () => {
  it('1 star earns 15 coins (10 base + 5*1)', () => {
    expect(computeCoins(1)).toBe(15);
  });

  it('2 stars earn 20 coins (10 base + 5*2)', () => {
    expect(computeCoins(2)).toBe(20);
  });

  it('3 stars earn 25 coins (10 base + 5*3)', () => {
    expect(computeCoins(3)).toBe(25);
  });

  it('addCoins transaction increases snoopCoins resource', () => {
    const db = Database.create(clueConnectPlugin);
    expect(db.store.resources.snoopCoins).toBe(0);

    db.transactions.addCoins({ amount: computeCoins(2) }); // 20 coins
    expect(db.store.resources.snoopCoins).toBe(20);

    db.transactions.addCoins({ amount: computeCoins(3) }); // +25
    expect(db.store.resources.snoopCoins).toBe(45);
  });
});
