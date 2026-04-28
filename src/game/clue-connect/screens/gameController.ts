/**
 * Clue Connect Game Controller — wires ECS, Pixi, renderers, and input.
 *
 * Init order (GameController contract):
 *   1. ECS DB created from ClueConnectPlugin → setActiveDb(db) → bridgeEcsToSignals(db)
 *   2. Pixi Application initialized → layers created (bg, board, hud, ui)
 *   3. Renderers instantiated with stage layers and layout bounds
 *   4. Input routed from boardRenderer.tileLayer via pointer events
 *
 * Destroy order:
 *   GSAP tweens → Pixi app → ECS bridge → setActiveDb(null) → ecsDb = null
 */

import { createSignal } from 'solid-js';
import gsap from 'gsap';
import { Application, Container } from 'pixi.js';
import { Database } from '@adobe/data/ecs';
import { setActiveDb } from '~/core/systems/ecs';
import type { SetupGame, GameController, GameControllerDeps } from '~/game/mygame-contract';
import { clueConnectPlugin, type ClueConnectDatabase } from '~/game/clue-connect/ClueConnectPlugin';
import { bridgeEcsToSignals } from '~/game/clue-connect/state/bridgeEcsToSignals';
import { BoardRenderer } from '~/game/clue-connect/renderers/BoardRenderer';
import { HudRenderer } from '~/game/clue-connect/renderers/HudRenderer';
import { ChainRenderer } from '~/game/clue-connect/renderers/ChainRenderer';
import { gameState } from '~/game/state';
import { COLS, ROWS, CELL_SIZE, CELL_GAP } from '~/game/clue-connect/config/layout';
import {
  computeStars,
  computeCoins,
  computeScore,
  evidenceFillAmount,
} from '~/game/clue-connect/state/scoringLogic';
import { ChainInputHandler } from '~/game/clue-connect/input/ChainInputHandler';
import type { ChainItem, TileKind } from '~/game/clue-connect/state/types';
import { generateLevel } from '~/game/clue-connect/levelgen/LevelGenerator';
import { SeededRng } from '~/game/clue-connect/levelgen/SeededRng';
import { CompanionRenderer } from '~/game/clue-connect/renderers/CompanionRenderer';
import { getCompanionForChapter } from '~/game/clue-connect/state/companionLogic';
import { boardAfterGravity } from '~/game/clue-connect/state/gravityLogic';

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('Mystery Inc. Mash: Clue Connect');

  let app: Application | null = null;
  let ecsDb: ClueConnectDatabase | null = null;
  let cleanupObserve: (() => void) | null = null;
  let boardRenderer: BoardRenderer | null = null;
  let hudRenderer: HudRenderer | null = null;
  let chainRenderer: ChainRenderer | null = null;
  let companionRenderer: CompanionRenderer | null = null;
  let chainHandler: ChainInputHandler | null = null;

  // Resolve chapter/level from screen data (passed by ResultsScreen handleNextLevel)
  const screenData = deps.screenData ?? {};
  const adMockContinue = Boolean(screenData.adMockContinue);
  const bonusMoves = typeof screenData.bonusMoves === 'number' ? screenData.bonusMoves : 5;

  // Current level/chapter — advance if coming from Next Level
  let currentChapter = typeof screenData.chapter === 'number' ? screenData.chapter : 1;
  let currentLevel = typeof screenData.level === 'number' ? screenData.level : gameState.level();

  // Input state
  let isDestroyed = false;
  const gotoFn = deps.goto ?? null;

  // ── Win/Loss sequences ───────────────────────────────────────────────

  function winSequence() {
    if (!ecsDb || !hudRenderer) return;

    // 1. Meter shimmer (400ms)
    hudRenderer.animateMeterFull();

    // 2. Compute stars and coins
    const meter = ecsDb.store.resources.evidenceMeterValue;
    const target = ecsDb.store.resources.evidenceTarget;
    const stars = computeStars(meter, target);
    const coins = computeCoins(stars);

    ecsDb.transactions.setStars({ stars });
    ecsDb.transactions.addCoins({ amount: coins });

    const score = ecsDb.store.resources.score;
    const snoopCoins = ecsDb.store.resources.snoopCoins;

    // 3. Navigate to results after sequence completes (meter shimmer=400ms + companion=600ms + slide=300ms)
    gsap.delayedCall(1.4, () => {
      if (isDestroyed) return;
      setAriaText('Level complete! Clue collected!');
      gotoFn?.('results', {
        outcome: 'win',
        banner: 'Clue collected!',
        stars,
        coinsEarned: coins,
        totalCoins: snoopCoins,
        score,
        // Pass chapter/level so ResultsScreen can route to the next level
        chapter: currentChapter,
        level: currentLevel,
        nextChapter: currentLevel >= 10 ? currentChapter + 1 : currentChapter,
        nextLevel: currentLevel >= 10 ? 1 : currentLevel + 1,
      });
    });
  }

  function lossSequence() {
    if (!ecsDb || !hudRenderer || !boardRenderer) return;

    hudRenderer.updateMoves(0);

    // Board dims to 60% opacity after move counter flash (300ms) + meter shake (200ms) + droop (500ms)
    gsap.delayedCall(1.0, () => {
      if (isDestroyed) return;
      boardRenderer?.dimBoard(0.6);
    });

    const score = ecsDb.store.resources.score;
    const snoopCoins = ecsDb.store.resources.snoopCoins;
    const evidenceMeterValue = ecsDb.store.resources.evidenceMeterValue;

    // Navigate to results after: move flash(300ms) + shake(200ms) + droop(500ms) + dim(300ms) + slide(300ms)
    gsap.delayedCall(1.6, () => {
      if (isDestroyed) return;
      setAriaText('Out of moves. So close, gang!');
      gotoFn?.('results', {
        outcome: 'loss',
        banner: 'So close, gang!',
        stars: 0,
        coinsEarned: 0,
        totalCoins: snoopCoins,
        score,
        movesGrantedOnContinue: 5, // Watch Ad mock: +5 moves
        chapter: currentChapter,
        level: currentLevel,
        evidenceMeterValue, // so Watch Ad can restore progress
      });
    });
  }

  // ── Check win/loss conditions ────────────────────────────────────────

  function checkWinLoss() {
    if (!ecsDb) return;
    const phase = ecsDb.store.resources.boardPhase;
    if (phase === 'WON' || phase === 'LOST') return; // already resolved

    const meter = ecsDb.store.resources.evidenceMeterValue;
    const target = ecsDb.store.resources.evidenceTarget;
    const moves = ecsDb.store.resources.movesRemaining;

    if (meter >= target) {
      ecsDb.transactions.setPhase({ phase: 'WON' });
      winSequence();
    } else if (moves <= 0) {
      ecsDb.transactions.setPhase({ phase: 'LOST' });
      lossSequence();
    }
  }

  return {
    gameMode: 'pixi',

    async init(container: HTMLDivElement) {
      setAriaText('Clue Connect — loading…');

      // ── 1. ECS DB ──────────────────────────────────────────────────────
      ecsDb = Database.create(clueConnectPlugin);
      setActiveDb(ecsDb as any);
      cleanupObserve = bridgeEcsToSignals(ecsDb, gameState as any);

      // ── 2. Pixi Application ────────────────────────────────────────────
      app = new Application();
      await app.init({
        resizeTo: container,
        background: '#1A0A2E',
        resolution: Math.min(window.devicePixelRatio, 2),
        antialias: false,
      });
      container.appendChild(app.canvas as HTMLCanvasElement);

      // Apply touch-action:none to canvas for mobile (per mobile-constraints rule)
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';

      // ── 3. Layers ──────────────────────────────────────────────────────
      app.stage.eventMode = 'static';

      const bgLayer = new Container();
      bgLayer.eventMode = 'none';
      app.stage.addChild(bgLayer);

      const boardLayer = new Container();
      boardLayer.eventMode = 'passive';
      app.stage.addChild(boardLayer);

      const hudLayer = new Container();
      hudLayer.eventMode = 'passive';
      app.stage.addChild(hudLayer);

      const uiLayer = new Container();
      uiLayer.eventMode = 'passive';
      app.stage.addChild(uiLayer);

      // ── 4. Renderers ───────────────────────────────────────────────────
      boardRenderer = new BoardRenderer();
      boardRenderer.init(boardLayer);

      chainRenderer = new ChainRenderer();
      chainRenderer.init(boardLayer);

      companionRenderer = new CompanionRenderer();
      companionRenderer.init(hudLayer);
      companionRenderer.setCompanion(getCompanionForChapter(currentChapter));

      hudRenderer = new HudRenderer();
      hudRenderer.init(hudLayer, {
        onPause: () => {
          if (!ecsDb) return;
          const phase = ecsDb.store.resources.boardPhase;
          if (phase === 'IDLE' || phase === 'SELECTING') {
            ecsDb.transactions.setPhase({ phase: 'PAUSED' });
          } else if (phase === 'PAUSED') {
            ecsDb.transactions.setPhase({ phase: 'IDLE' });
          }
        },
        onHint: () => {
          if (!ecsDb) return;
          const phase = ecsDb.store.resources.boardPhase;
          if (phase !== 'IDLE' && phase !== 'SELECTING') return;

          // Hint costs 1 Scooby Snack coin
          if (ecsDb.store.resources.snoopCoins < 1) {
            return;
          }
          ecsDb.transactions.addCoins({ amount: -1 });
          hudRenderer?.updateCoins(ecsDb.store.resources.snoopCoins);
        },
      });

      // ── 5. Chain input (full wiring) ───────────────────────────────────
      chainHandler = new ChainInputHandler();
      const tileLayer = boardRenderer.getTileLayer();
      tileLayer.eventMode = 'static';

      // Hit-test helper: map pointer world coords to (row, col)
      const hitTestCell = (e: { global: { x: number; y: number } }): ChainItem | null => {
        if (!boardRenderer || !ecsDb) return null;
        // Convert global coords to board-local coords
        const boardContainer = boardRenderer.getContainer();
        const local = boardContainer.toLocal(e.global);
        const col = Math.floor(local.x / (CELL_SIZE + CELL_GAP));
        const row = Math.floor(local.y / (CELL_SIZE + CELL_GAP));
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;

        // Find tileId in ECS for this cell
        for (const entity of ecsDb.store.select(['tileId', 'row', 'col', 'tileKind'])) {
          if (entity.row === row && entity.col === col) {
            return { row, col, tileId: entity.tileId, kind: entity.tileKind as TileKind };
          }
        }
        return null;
      };

      tileLayer.on('pointerdown', (e) => {
        if (!ecsDb || !chainHandler) return;
        const phase = ecsDb.store.resources.boardPhase;
        if (phase !== 'IDLE' && phase !== 'SELECTING') return;

        const tile = hitTestCell(e);
        if (!tile) return;
        ecsDb.transactions.setPhase({ phase: 'SELECTING' });
        chainHandler.setPhase('SELECTING');
        chainHandler.start(tile);
        chainRenderer?.syncChain(chainHandler.getChain());
      });

      tileLayer.on('pointermove', (e) => {
        if (!ecsDb || !chainHandler || !chainHandler.isActive()) return;
        const tile = hitTestCell(e);
        if (!tile) return;
        const extended = chainHandler.tryExtend(tile);
        if (extended) chainRenderer?.syncChain(chainHandler.getChain());
      });

      tileLayer.on('pointerup', async () => {
        if (!ecsDb || !chainHandler) return;
        const result = chainHandler.commit();
        chainRenderer?.clear();

        if (!result.confirmed) {
          // Single tile — cancel silently, return to IDLE
          ecsDb.transactions.setPhase({ phase: 'IDLE' });
          chainHandler.setPhase('IDLE');
          return;
        }

        // Confirmed chain — animate clear, then gravity, then check win/loss
        const clearedIdSet = new Set(result.chain.map((c) => c.tileId));
        const clearedIdArray = result.chain.map((c) => c.tileId);

        chainRenderer?.animateConfirm(result.chain);

        // Score + evidence
        const chainLen = result.chain.length;
        const scoreGain = computeScore(chainLen);
        ecsDb.transactions.addScore({ amount: scoreGain });
        ecsDb.transactions.addEvidence({ amount: evidenceFillAmount(chainLen) });
        ecsDb.transactions.decrementMoves();

        // Score popup at center of cleared chain
        if (scoreGain > 0 && result.chain.length > 0) {
          const midIdx = Math.floor(result.chain.length / 2);
          const midTile = result.chain[midIdx]!;
          boardRenderer?.showScorePopup(midTile.row, midTile.col, scoreGain);
        }
        ecsDb.transactions.setPhase({ phase: 'ANIMATING' });
        chainHandler.setPhase('ANIMATING');

        // Animate clear
        const clearDuration = await boardRenderer!.animateClear(clearedIdArray);

        // Sync HUD after clear
        hudRenderer?.updateMoves(ecsDb.store.resources.movesRemaining);
        hudRenderer?.updateMeter(
          ecsDb.store.resources.evidenceMeterValue,
          ecsDb.store.resources.evidenceTarget,
        );

        // Build current board snapshot from ECS for gravity computation
        const currentBoard: import('~/game/clue-connect/state/types').BoardCell[][] = [];
        for (let r = 0; r < 9; r++) {
          currentBoard[r] = [];
          for (let c = 0; c < 7; c++) {
            currentBoard[r]![c] = { row: r, col: c, tileKind: 'footprint', tileId: 0 };
          }
        }
        for (const entity of ecsDb.store.select(['tileId', 'row', 'col', 'tileKind'])) {
          if (currentBoard[entity.row]) {
            currentBoard[entity.row]![entity.col] = {
              row: entity.row,
              col: entity.col,
              tileKind: entity.tileKind as TileKind,
              tileId: entity.tileId,
            };
          }
        }

        const seedRng = new SeededRng(ecsDb.store.resources.nextTileId ?? Date.now());
        const gravityResult = boardAfterGravity(currentBoard, clearedIdSet, () => seedRng.next());
        ecsDb.transactions.replaceBoard({ cells: gravityResult.newBoard.flat() });

        // Animate gravity fall
        const fallDuration = boardRenderer!.animateGravity(gravityResult.movements);
        boardRenderer!.syncBoard(
          gravityResult.newBoard.flat().map((cell) => ({
            row: cell.row,
            col: cell.col,
            tileKind: cell.tileKind as any,
            tileId: cell.tileId,
          })),
        );

        // Wait for longest animation before returning to IDLE
        const totalMs = Math.max(clearDuration * 1000 + 250, fallDuration * 1000 + 100);
        await new Promise<void>((resolve) => gsap.delayedCall(totalMs / 1000, resolve));

        ecsDb.transactions.setPhase({ phase: 'IDLE' });
        chainHandler.setPhase('IDLE');
        checkWinLoss();
      });

      // ── 6. Initial board (Level Generator) ────────────────────────────
      const MOVE_LIMIT = 20;
      const generated = generateLevel({ chapter: currentChapter, level: currentLevel });

      const flatCells = generated.board.flat();
      ecsDb.transactions.setLevel({
        chapter: currentChapter,
        level: currentLevel,
        moveLimit: MOVE_LIMIT,
        evidenceTarget: 100,
      });
      ecsDb.transactions.replaceBoard({ cells: flatCells });

      // Sync board to renderer
      const cells = flatCells.map((cell) => ({
        row: cell.row,
        col: cell.col,
        tileKind: cell.tileKind as any,
        tileId: cell.tileId,
      }));
      boardRenderer.syncBoard(cells);

      // If returning from Watch Ad, grant bonus moves on same board
      if (adMockContinue) {
        ecsDb.transactions.setMoves({ moves: bonusMoves });
        hudRenderer.updateMoves(bonusMoves);
        // Preserve prior evidence (not reset — player continues same board)
        // evidenceMeterValue was reset by setLevel; restore it from screenData if available
        const priorEvidence = typeof screenData.evidenceMeterValue === 'number'
          ? screenData.evidenceMeterValue : 0;
        if (priorEvidence > 0) {
          ecsDb.transactions.addEvidence({ amount: priorEvidence });
        }
      }

      // Sync HUD
      hudRenderer.updateMoves(ecsDb.store.resources.movesRemaining);
      hudRenderer.updateMeter(ecsDb.store.resources.evidenceMeterValue, ecsDb.store.resources.evidenceTarget);

      // Level-start companion dialogue
      gsap.delayedCall(0.5, () => {
        if (!isDestroyed) companionRenderer?.showLevelStartDialogue();
      });

      setAriaText('Clue Connect — connect matching clues to solve the mystery!');
    },

    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;

      // Destroy order: GSAP tweens → Pixi → ECS bridge → setActiveDb(null)
      gsap.killTweensOf(boardRenderer?.getContainer());
      gsap.killTweensOf(hudRenderer);
      gsap.globalTimeline.clear();

      chainRenderer?.destroy();
      chainRenderer = null;

      boardRenderer?.destroy();
      boardRenderer = null;

      hudRenderer?.destroy();
      hudRenderer = null;

      companionRenderer?.destroy();
      companionRenderer = null;

      chainHandler = null;

      app?.destroy(true, { children: true });
      app = null;

      cleanupObserve?.();
      cleanupObserve = null;

      setActiveDb(null);
      ecsDb = null;
    },

    ariaText,
  };
};
