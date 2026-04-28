/**
 * scoringLogic — pure scoring and evidence meter functions.
 *
 * No Math.random(). No Pixi. No DOM. No ECS imports.
 * Exported and called from ClueConnectPlugin actions/transactions.
 *
 * Scoring dimensions (multiplicative per scoring CoS):
 *   1. Chain magnitude: longer chains fill more evidence AND score more
 *   2. Evidence overflow: determines star tier (0/1/2/3 stars)
 *   3. Score formula: base * (chainLength - 1) * bonus multiplier
 */

// ── Evidence fill ─────────────────────────────────────────────────────

/**
 * How much evidence the evidence meter fills for a chain of the given length.
 *
 * Formula: base(10) * (1 + (chainLength - 2) * 1.5)
 * A chain of 2 → 10, chain of 3 → 25, chain of 5 → 55, chain of 9 → 115.
 * Multiplicative: each additional tile past 2 adds a 1.5x bonus.
 *
 * @param chainLength  Number of tiles in the cleared chain (≥ 2)
 * @returns            Evidence fill amount [0, ∞)
 */
export function evidenceFillAmount(chainLength: number): number {
  if (chainLength < 2) return 0;
  const base = 10;
  const bonus = 1 + (chainLength - 2) * 1.5;
  return base * bonus;
}

// ── Star rating ───────────────────────────────────────────────────────

/**
 * Compute star rating from evidence meter value vs target.
 *
 * Stars:
 *   0 → below target (not won)
 *   1 → value ≥ target (exactly met; 0% overflow)
 *   2 → value ≥ target * 1.10 (10% overflow)
 *   3 → value ≥ target * 1.25 (25%+ overflow)
 *
 * @param evidenceMeterValue  Current accumulated evidence
 * @param evidenceTarget      Target for win condition
 * @returns                   0–3 stars
 */
export function computeStars(evidenceMeterValue: number, evidenceTarget: number): 0 | 1 | 2 | 3 {
  if (evidenceTarget <= 0) return 0;
  if (evidenceMeterValue < evidenceTarget) return 0;
  // Use percentage overflow to avoid floating-point comparison issues
  const overflowPct = ((evidenceMeterValue - evidenceTarget) / evidenceTarget) * 100;
  if (overflowPct >= 25) return 3;
  if (overflowPct >= 10) return 2;
  return 1;
}

// ── Score formula ─────────────────────────────────────────────────────

/**
 * Compute score contribution for a chain clear.
 *
 * Formula: base(50) * chainLength * (1 + (chainLength - 2) * 0.5)
 * - Chain of 2 → 50 * 2 * 1.0 = 100
 * - Chain of 3 → 50 * 3 * 1.5 = 225
 * - Chain of 5 → 50 * 5 * 2.5 = 625
 * - Chain of 6 → 50 * 6 * 3.0 = 900
 * Chain of 6 (900) > 2 × chain of 3 (450) ✓ — multiplicative dimension
 *
 * @param chainLength  Number of tiles cleared
 * @returns            Score to add
 */
export function computeScore(chainLength: number): number {
  if (chainLength < 2) return 0;
  const base = 50;
  const multiplier = 1 + (chainLength - 2) * 0.5;
  return Math.round(base * chainLength * multiplier);
}

// ── Coin award ────────────────────────────────────────────────────────

/**
 * Compute Scooby Snack coins earned for completing a level.
 *
 * Formula: base(10) + 5 * starsEarned
 * - 1 star → 15 coins
 * - 2 stars → 20 coins
 * - 3 stars → 25 coins
 *
 * @param starsEarned  0–3 stars from the level
 * @returns            Coins to add to snoopCoins resource
 */
export function computeCoins(starsEarned: number): number {
  return 10 + 5 * Math.max(0, Math.min(3, starsEarned));
}
