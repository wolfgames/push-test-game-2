/**
 * firstLaunchFlag — injectable first-launch detection for start screen routing.
 *
 * Uses localStorage in browser, injectable for tests.
 * No Math.random(). No Pixi. No DOM reads in pure functions.
 */

const STORAGE_KEY = 'clue-connect-first-launch';

// ── Pure functions (injectable / testable) ─────────────────────────────

/**
 * Returns 'intro' for first-launch, 'game' for returning players.
 *
 * @param isFirstLaunchFlag  Whether this is the first launch
 */
export function getFirstLaunchRoute(isFirstLaunchFlag: boolean): 'intro' | 'game' {
  return isFirstLaunchFlag ? 'intro' : 'game';
}

/**
 * Pure check: isFirstLaunch given a stored value (from localStorage or undefined).
 *
 * @param storedValue  Value from localStorage.getItem(STORAGE_KEY), or undefined if not set
 */
export function isFirstLaunch(storedValue: string | null | undefined): boolean {
  return storedValue !== 'done';
}

/**
 * Returns the value to write to localStorage to mark first launch as complete.
 */
export function markFirstLaunchComplete(): string {
  return 'done';
}

// ── Browser-aware helpers (not called in tests) ───────────────────────

/**
 * Reads the first-launch flag from localStorage.
 * Safe to call in browser; returns true in any environment without localStorage.
 */
export function readFirstLaunchFlag(): boolean {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : undefined;
    return isFirstLaunch(stored);
  } catch {
    return true; // assume first launch on error
  }
}

/**
 * Persists the first-launch-complete flag to localStorage.
 */
export function writeFirstLaunchComplete(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, markFirstLaunchComplete());
    }
  } catch {
    // ignore storage errors
  }
}
