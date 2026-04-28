/**
 * Clue Connect — game entry point.
 *
 * Exports setupGame and setupStartScreen per the GameController contract
 * defined in src/game/mygame-contract.ts.
 *
 * GameScreen.tsx imports setupGame from this module's entry via the
 * scaffold's game import routing (configured in app.tsx or index.ts).
 */

export { setupGame } from './screens/gameController';
export { setupStartScreen } from './screens/startView';
export type {
  SetupGame,
  SetupStartScreen,
  GameControllerDeps,
  StartScreenDeps,
  GameController,
  StartScreenController,
  GameMode,
} from '~/game/mygame-contract';
