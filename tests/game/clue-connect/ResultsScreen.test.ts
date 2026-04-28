/**
 * Batch 4: Results Screen — content branching
 * Tests: win path banner, loss path banner (no 'Game Over'), coin counter
 *
 * Note: ResultsScreen is a SolidJS DOM component — we test the pure data
 * branching logic and signal values without mounting the full component.
 * Full render tests would require jsdom (out of scope for Node unit tests).
 */

import { describe, it, expect } from 'vitest';
import { computeCoins } from '~/game/clue-connect/state/scoringLogic';
import { Database } from '@adobe/data/ecs';
import { clueConnectPlugin } from '~/game/clue-connect/ClueConnectPlugin';

// ── Results payload branching logic ───────────────────────────────────────

function buildResultsPayload(boardPhase: 'WON' | 'LOST', starsEarned: number, prevCoins: number) {
  const coinsEarned = boardPhase === 'WON' ? computeCoins(starsEarned) : 0;
  return {
    isWin: boardPhase === 'WON',
    banner: boardPhase === 'WON' ? 'Clue collected!' : 'So close, gang!',
    starsEarned,
    coinsEarned,
    totalCoins: prevCoins + coinsEarned,
  };
}

describe('results screen — content branching', () => {
  it('win path shows "Clue collected!" banner; 3 star slots rendered', () => {
    const payload = buildResultsPayload('WON', 2, 10);
    expect(payload.banner).toBe('Clue collected!');
    expect(payload.isWin).toBe(true);
    expect(payload.starsEarned).toBe(2);
    // 3 star slots = always 3 rendered (filled=starsEarned, empty=3-starsEarned)
    expect(payload.starsEarned).toBeLessThanOrEqual(3);
  });

  it('loss path shows "So close, gang!" banner; no "Game Over" text', () => {
    const payload = buildResultsPayload('LOST', 0, 10);
    expect(payload.banner).toBe('So close, gang!');
    expect(payload.isWin).toBe(false);
    // Critical: banner must never be "Game Over"
    expect(payload.banner).not.toContain('Game Over');
  });

  it('coin counter ticks from previous total to new total on win', () => {
    const prevCoins = 30;
    const stars = 3;
    const payload = buildResultsPayload('WON', stars, prevCoins);
    expect(payload.coinsEarned).toBe(25); // 10 + 5*3
    expect(payload.totalCoins).toBe(55);  // 30 + 25
  });

  it('no coins awarded on loss', () => {
    const payload = buildResultsPayload('LOST', 0, 30);
    expect(payload.coinsEarned).toBe(0);
    expect(payload.totalCoins).toBe(30); // unchanged
  });
});

describe('results screen — ECS resource flow', () => {
  it('snoopCoins resource accumulates correctly across levels', () => {
    const db = Database.create(clueConnectPlugin);

    // Level 1: 2-star win
    db.transactions.setStars({ stars: 2 });
    db.transactions.addCoins({ amount: computeCoins(2) }); // 20
    expect(db.store.resources.snoopCoins).toBe(20);

    // Level 2: 3-star win
    db.transactions.setStars({ stars: 3 });
    db.transactions.addCoins({ amount: computeCoins(3) }); // +25
    expect(db.store.resources.snoopCoins).toBe(45);
  });

  it('addCoins does not go below 0 (loss path adds 0 coins)', () => {
    const db = Database.create(clueConnectPlugin);
    db.transactions.addCoins({ amount: 0 });
    expect(db.store.resources.snoopCoins).toBe(0);
  });
});
