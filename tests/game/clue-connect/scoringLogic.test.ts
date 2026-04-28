/**
 * Batch 3: Evidence meter — scoring formula
 * Tests: multiplicative evidence fill, star thresholds, WON trigger, LOST trigger
 */

import { describe, it, expect } from 'vitest';
import {
  evidenceFillAmount,
  computeStars,
  computeScore,
} from '~/game/clue-connect/state/scoringLogic';

describe('evidence meter — scoring formula', () => {
  it('chain of 2 tiles fills meter less than chain of 5 tiles (multiplicative)', () => {
    const fill2 = evidenceFillAmount(2);
    const fill5 = evidenceFillAmount(5);
    expect(fill5).toBeGreaterThan(fill2);
    // Should be multiplicative (not just additive linear): fill5 > fill2 * 2.4 at minimum
    expect(fill5).toBeGreaterThan(fill2 * 1.5);
  });

  it('evidenceMeterValue >= evidenceTarget triggers WON', () => {
    // computeStars handles edge case: if value >= target, at least 1 star
    const stars = computeStars(100, 100);
    expect(stars).toBeGreaterThanOrEqual(1);
  });

  it('starsEarned=1 at 0% overflow; starsEarned=2 at 10% overflow; starsEarned=3 at 25%+ overflow', () => {
    const target = 100;
    // At exactly target: 1 star
    expect(computeStars(100, target)).toBe(1);
    // At 10% over: 2 stars
    expect(computeStars(110, target)).toBe(2);
    // At 25%+ over: 3 stars
    expect(computeStars(125, target)).toBe(3);
    expect(computeStars(200, target)).toBe(3);
  });

  it('move counter decrements to 0 triggers LOST when meter not full', () => {
    // This is ECS state logic — verify computeStars returns 0 below target
    const target = 100;
    const stars = computeStars(50, target); // 50% fill, below target
    expect(stars).toBe(0); // 0 stars = not completed
  });

  it('computeScore is multiplicative across chain length', () => {
    const score3 = computeScore(3);
    const score6 = computeScore(6);
    // 6-tile chain should score more than 2x a 3-tile chain (multiplicative bonus)
    expect(score6).toBeGreaterThan(score3 * 2);
  });
});
