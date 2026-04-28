/**
 * BoardRenderer — renders the 7×9 game board on the GPU canvas.
 *
 * Renderer contract:
 *   init(container, layout)    — create visuals; wire cell containers
 *   syncBoard(cells)           — sync tile positions to ECS state
 *   destroy()                  — cleanup: tweens → listeners → removeChild → destroy
 *
 * No DOM. No game state writes. No Math.random().
 */

import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import {
  COLS,
  ROWS,
  CELL_SIZE,
  CELL_GAP,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  GRID_W,
  GRID_H,
} from '~/game/clue-connect/config/layout';
import { createTileView, type TileView } from './TileRenderer';
import type { TileKind } from '~/game/clue-connect/state/types';

export interface BoardCellData {
  row: number;
  col: number;
  tileKind: TileKind;
  tileId: number;
}

/**
 * BoardRenderer — owns the grid container and a pool of TileViews keyed by tileId.
 */
export class BoardRenderer {
  private container: Container = new Container();
  private bgLayer: Container = new Container();
  private tileLayer: Container = new Container();
  private tileViews: Map<number, TileView> = new Map();
  private cellContainers: Container[][] = [];
  private initialised = false;

  /** Initialize the board renderer. Adds itself to the given parent container. */
  init(parentContainer: Container): void {
    if (this.initialised) return;
    this.initialised = true;

    this.container.position.set(BOARD_OFFSET_X, BOARD_OFFSET_Y);
    this.container.eventMode = 'passive'; // allows child pointertap
    parentContainer.addChild(this.container);

    // Background grid
    this.container.addChild(this.bgLayer);
    this.container.addChild(this.tileLayer);

    this.drawBackground();
    this.createCellContainers();
  }

  private drawBackground(): void {
    const bg = new Graphics();
    // Dark semi-transparent board background
    bg.roundRect(-4, -4, GRID_W + 8, GRID_H + 8, 8);
    bg.fill({ color: 0x1A0A2E, alpha: 0.85 });
    this.bgLayer.addChild(bg);
  }

  private createCellContainers(): void {
    for (let r = 0; r < ROWS; r++) {
      this.cellContainers[r] = [];
      for (let c = 0; c < COLS; c++) {
        const cell = new Container();
        cell.position.set(
          c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
          r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
        );
        cell.eventMode = 'static'; // receives pointertap
        this.tileLayer.addChild(cell);
        this.cellContainers[r]![c] = cell;
      }
    }
  }

  /** Returns the cell container at (row, col) — used by input handler for pointer routing. */
  getCellContainer(row: number, col: number): Container | null {
    return this.cellContainers[row]?.[col] ?? null;
  }

  /** Returns the tileLayer container for pointer event routing. */
  getTileLayer(): Container {
    return this.tileLayer;
  }

  /** Returns the outer container — used for alpha tweens (dim on LOST). */
  getContainer(): Container {
    return this.container;
  }

  /** Returns cell pixel center (relative to board container origin). */
  getCellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      y: row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    };
  }

  /**
   * Show a floating score popup at the given cell position.
   * The text rises and fades over ~700ms.
   *
   * @param row     Board row (0-based)
   * @param col     Board column (0-based)
   * @param score   Score delta to display (e.g. "+150")
   */
  showScorePopup(row: number, col: number, score: number): void {
    const center = this.getCellCenter(row, col);
    const label = new Text({
      text: `+${score}`,
      style: {
        fontSize: 18,
        fontWeight: '700',
        fill: '#FFD700',
        dropShadow: true,
      },
    });
    label.anchor.set(0.5, 1);
    label.position.set(center.x, center.y);
    label.alpha = 1;
    this.tileLayer.addChild(label);

    gsap.to(label, {
      y: center.y - 48,
      alpha: 0,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => {
        label.parent?.removeChild(label);
        label.destroy();
      },
    });
  }

  /**
   * Sync the board to a new state. Creates new TileViews for unseen tileIds,
   * repositions existing ones (preserving stable identity), removes missing ones.
   */
  syncBoard(cells: BoardCellData[]): void {
    const seenIds = new Set<number>();

    for (const cell of cells) {
      seenIds.add(cell.tileId);
      let view = this.tileViews.get(cell.tileId);

      if (!view) {
        // New tile: create and add to layer
        view = createTileView(cell.kind, cell.tileId, cell.row, cell.col);
        this.tileViews.set(cell.tileId, view);
        const cellContainer = this.cellContainers[cell.row]?.[cell.col];
        if (cellContainer) {
          cellContainer.addChild(view.container);
        }
      } else {
        // Existing tile: move cell container to new position (gravity)
        const newCell = this.cellContainers[cell.row]?.[cell.col];
        if (newCell && view.container.parent !== newCell) {
          view.container.parent?.removeChild(view.container);
          newCell.addChild(view.container);
        }
      }
    }

    // Remove tiles no longer in board state
    for (const [tileId, view] of this.tileViews) {
      if (!seenIds.has(tileId)) {
        view.destroy();
        this.tileViews.delete(tileId);
      }
    }
  }

  /** Animate tiles falling to new positions (gravity). Returns duration. */
  animateGravity(
    movements: Array<{ tileId: number; fromRow: number; toRow: number; col: number }>,
  ): number {
    const FALL_MS_PER_ROW = 80;
    let maxDuration = 0;

    for (const move of movements) {
      const view = this.tileViews.get(move.tileId);
      if (!view) continue;

      const fallRows = move.toRow - move.fromRow;
      const duration = (fallRows * FALL_MS_PER_ROW) / 1000;
      if (duration > maxDuration) maxDuration = duration;

      const destCell = this.cellContainers[move.toRow]?.[move.col];
      if (!destCell) continue;

      // Move tile into new cell container but animate from old visual position
      const oldY = view.container.y;
      view.container.parent?.removeChild(view.container);
      destCell.addChild(view.container);
      // Start at old visual offset then tween to 0,0 within cell
      const dropPx = fallRows * (CELL_SIZE + CELL_GAP);
      view.container.y = -dropPx;

      gsap.to(view.container, {
        y: 0,
        duration,
        ease: 'bounce.out',
        overwrite: 'auto',
      });
    }

    return maxDuration;
  }

  /** Highlight the tiles in the given chain. */
  setChainHighlight(tileIds: Set<number>, on: boolean): void {
    for (const [tileId, view] of this.tileViews) {
      view.setHighlight(on && tileIds.has(tileId));
    }
  }

  /** Dim the board (LOST state). */
  dimBoard(alpha: number, durationMs = 300): void {
    gsap.to(this.container, {
      pixi: { alpha },
      duration: durationMs / 1000,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  /** Animate tiles clearing (dissolve + scale down). */
  animateClear(tileIds: number[]): Promise<void> {
    return new Promise((resolve) => {
      let remaining = tileIds.length;
      if (remaining === 0) { resolve(); return; }

      for (const tileId of tileIds) {
        const view = this.tileViews.get(tileId);
        if (!view) { remaining--; if (remaining === 0) resolve(); continue; }

        gsap.to(view.container, {
          pixi: { scale: 0.1, alpha: 0 },
          duration: 0.25,
          ease: 'back.in(1.7)',
          onComplete: () => {
            view.destroy();
            this.tileViews.delete(tileId);
            remaining--;
            if (remaining === 0) resolve();
          },
        });
      }
    });
  }

  destroy(): void {
    // Kill all tweens before destroying anything
    gsap.killTweensOf(this.container);
    for (const [, view] of this.tileViews) {
      gsap.killTweensOf(view.container);
    }

    // Destroy all tile views
    for (const [, view] of this.tileViews) {
      view.destroy();
    }
    this.tileViews.clear();

    // Destroy cell containers
    for (const row of this.cellContainers) {
      for (const cell of row) {
        cell.removeAllListeners();
        cell.destroy({ children: true });
      }
    }
    this.cellContainers = [];

    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
