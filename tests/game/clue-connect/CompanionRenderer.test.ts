/**
 * Batch 6: Companion System — dialogue triggers and portrait rotation
 * Tests: level-start fires Scooby dialogue; chapter-appropriate portrait;
 *        positive chain fires positive reaction
 */

import { describe, it, expect } from 'vitest';
import {
  getCompanionForChapter,
  getReactionForEvent,
  getLevelStartDialogue,
  type CompanionEvent,
} from '~/game/clue-connect/state/companionLogic';

describe('companion system — dialogue triggers', () => {
  it('level-start fires Scooby dialogue line', () => {
    const dialogue = getLevelStartDialogue('scooby');
    expect(typeof dialogue).toBe('string');
    expect(dialogue.length).toBeGreaterThan(0);
    // Scooby lines should have Scooby-isms
    expect(dialogue.toLowerCase()).toMatch(/scooby|mystery|clue|ruh|gang/i);
  });

  it('chapter 1 shows Velma portrait; chapter 2 shows Shaggy portrait', () => {
    expect(getCompanionForChapter(1)).toBe('velma');
    expect(getCompanionForChapter(2)).toBe('shaggy');
    expect(getCompanionForChapter(3)).toBe('fred');
    expect(getCompanionForChapter(4)).toBe('daphne');
  });

  it('chain-cleared fires positive or happy reaction (≥4 tiles = happy)', () => {
    const event: CompanionEvent = 'chain-cleared';
    // Short chain (2-3 tiles) → positive
    const shortReaction = getReactionForEvent(event, { chainLength: 2, movesRemaining: 10 });
    expect(shortReaction).toBe('positive');
    // Long chain (4+ tiles) → happy
    const longReaction = getReactionForEvent(event, { chainLength: 5, movesRemaining: 10 });
    expect(longReaction).toBe('happy');
  });

  it('low moves (≤2) fires worried reaction', () => {
    const event: CompanionEvent = 'moves-low';
    const reaction = getReactionForEvent(event, { chainLength: 2, movesRemaining: 2 });
    expect(reaction).toBe('worried');
  });

  it('win fires happy reaction', () => {
    const event: CompanionEvent = 'level-won';
    const reaction = getReactionForEvent(event, { chainLength: 0, movesRemaining: 5 });
    expect(reaction).toBe('happy');
  });
});
