/**
 * Batch 6: Start Screen — routing logic (first-launch vs returning player)
 * Tests: first-launch flag determines routing; returning player bypasses intro
 *
 * Tests the pure routing logic (localStorage-free injectable flag service).
 */

import { describe, it, expect } from 'vitest';
import { getFirstLaunchRoute, markFirstLaunchComplete, isFirstLaunch } from '~/game/clue-connect/screens/firstLaunchFlag';

describe('start screen — routing', () => {
  it('first-launch routes to intro cutscene on Play tap', () => {
    // When first-launch flag is not set, route is 'intro'
    const route = getFirstLaunchRoute(true);
    expect(route).toBe('intro');
  });

  it('returning player routes directly to game on Play tap', () => {
    const route = getFirstLaunchRoute(false);
    expect(route).toBe('game');
  });

  it('isFirstLaunch returns true when flag not set', () => {
    // In Node (no localStorage), default is first-launch
    const result = isFirstLaunch(undefined); // undefined = no stored value
    expect(result).toBe(true);
  });

  it('isFirstLaunch returns false when flag set to "done"', () => {
    const result = isFirstLaunch('done');
    expect(result).toBe(false);
  });

  it('markFirstLaunchComplete returns the storage value to write', () => {
    const value = markFirstLaunchComplete();
    expect(value).toBe('done');
  });
});
