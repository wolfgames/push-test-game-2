/**
 * ChainRenderer — renders the chain trail and tile highlights during drag.
 *
 * Drawn above the board layer. Shows:
 * - A glowing line connecting selected tiles (trail)
 * - Highlight rings on selected tiles
 *
 * No game state writes. No DOM. No Math.random().
 * Destroy order: tweens → listeners → removeChild → destroy
 */

import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { ChainItem } from '~/game/clue-connect/state/types';
import { CELL_SIZE, CELL_GAP } from '~/game/clue-connect/config/layout';

/** Cell center (x, y) relative to board container origin. */
function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
  };
}

export class ChainRenderer {
  private container: Container = new Container();
  private trail: Graphics = new Graphics();
  private rings: Container = new Container();
  private initialised = false;

  init(parentContainer: Container): void {
    if (this.initialised) return;
    this.initialised = true;

    this.container.eventMode = 'none'; // pass-through; no input here
    this.container.addChild(this.trail);
    this.container.addChild(this.rings);
    parentContainer.addChild(this.container);
  }

  /** Redraw the chain trail for the current chain. */
  syncChain(chain: ChainItem[]): void {
    this.trail.clear();
    this.rings.removeChildren().forEach((c) => (c as Container).destroy({ children: true }));

    if (chain.length < 1) return;

    // Draw connecting lines between chain tiles
    if (chain.length >= 2) {
      const first = cellCenter(chain[0]!.row, chain[0]!.col);
      this.trail.moveTo(first.x, first.y);
      this.trail.setStrokeStyle({ width: 6, color: 0xFFD700, alpha: 0.8, cap: 'round', join: 'round' });

      for (let i = 1; i < chain.length; i++) {
        const pt = cellCenter(chain[i]!.row, chain[i]!.col);
        this.trail.lineTo(pt.x, pt.y);
      }
      this.trail.stroke();
    }

    // Draw highlight rings on each tile in chain
    for (const item of chain) {
      const center = cellCenter(item.row, item.col);
      const ring = new Graphics();
      ring.circle(center.x, center.y, CELL_SIZE / 2 - 2);
      ring.stroke({ width: 3, color: 0xFFD700, alpha: 0.9 });
      this.rings.addChild(ring);
    }
  }

  /** Animate a "pop" burst when chain confirms. */
  animateConfirm(chain: ChainItem[]): void {
    for (const item of chain) {
      const center = cellCenter(item.row, item.col);
      const burst = new Graphics();
      burst.circle(center.x, center.y, CELL_SIZE / 2);
      burst.fill({ color: 0xFFD700, alpha: 0.6 });
      this.container.addChild(burst);

      gsap.to(burst, {
        pixi: { scale: 1.5, alpha: 0 },
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          burst.parent?.removeChild(burst);
          burst.destroy();
        },
      });
    }
  }

  /** Clear the chain trail. */
  clear(): void {
    this.trail.clear();
    this.rings.removeChildren().forEach((c) => (c as Container).destroy({ children: true }));
  }

  destroy(): void {
    gsap.killTweensOf(this.container);
    this.clear();
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
