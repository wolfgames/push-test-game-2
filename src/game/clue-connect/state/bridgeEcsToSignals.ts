/**
 * bridgeEcsToSignals — wires ECS resources to SolidJS signals via Observe.
 *
 * Called once after ECS DB is created and Pixi app is initialized.
 * Returns a cleanup function — call it before ECS DB is destroyed.
 *
 * NO Pixi imports. NO DOM reads. Observable subscriptions only.
 */

import type { ClueConnectDatabase } from '~/game/clue-connect/ClueConnectPlugin';
import type { GameState } from '~/game/state';

export interface ExtendedGameState extends GameState {
  movesRemaining?: () => number;
  setMovesRemaining?: (v: number) => void;
  evidenceMeterValue?: () => number;
  setEvidenceMeterValue?: (v: number) => void;
  starsEarned?: () => number;
  setStarsEarned?: (v: number) => void;
  snoopCoins?: () => number;
  setSnoopCoins?: (v: number) => void;
  boardPhase?: () => string;
  setBoardPhase?: (v: string) => void;
}

/**
 * Subscribes ECS resources to SolidJS signals so DOM screens stay reactive.
 *
 * @param db  ClueConnect ECS database
 * @param gs  gameState from ~/game/state (extended with clue-connect signals)
 * @returns   cleanup function — call on destroy
 */
export function bridgeEcsToSignals(db: ClueConnectDatabase, gs: ExtendedGameState): () => void {
  const unobservers: Array<() => void> = [];

  // score → gameState.setScore
  unobservers.push(
    db.observe.resources.score((v) => gs.setScore(v)),
  );

  // level → gameState.setLevel
  unobservers.push(
    db.observe.resources.currentLevel((v) => gs.setLevel(v)),
  );

  // movesRemaining
  if (gs.setMovesRemaining) {
    unobservers.push(
      db.observe.resources.movesRemaining((v) => gs.setMovesRemaining!(v)),
    );
  }

  // evidenceMeterValue
  if (gs.setEvidenceMeterValue) {
    unobservers.push(
      db.observe.resources.evidenceMeterValue((v) => gs.setEvidenceMeterValue!(v)),
    );
  }

  // starsEarned
  if (gs.setStarsEarned) {
    unobservers.push(
      db.observe.resources.starsEarned((v) => gs.setStarsEarned!(v)),
    );
  }

  // snoopCoins
  if (gs.setSnoopCoins) {
    unobservers.push(
      db.observe.resources.snoopCoins((v) => gs.setSnoopCoins!(v)),
    );
  }

  // boardPhase
  if (gs.setBoardPhase) {
    unobservers.push(
      db.observe.resources.boardPhase((v) => gs.setBoardPhase!(v)),
    );
  }

  return () => {
    for (const unobserve of unobservers) unobserve();
  };
}
