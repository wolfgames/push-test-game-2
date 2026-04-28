/**
 * TileRenderer — renders individual clue tiles on the GPU canvas.
 *
 * Uses emoji/text fallback when atlas is unavailable (core pass).
 * Pixi only: no DOM, no CSS.
 *
 * Destroy order: gsap.killTweensOf → removeAllListeners → removeChild → destroy({children:true})
 */

import { Container, Text, type TextStyle } from 'pixi.js';
import gsap from 'gsap';
import {
  TILE_KINDS,
  TILE_FALLBACKS,
  type TileKind,
} from '~/game/clue-connect/state/types';
import { CELL_SIZE, TILE_ART_SIZE } from '~/game/clue-connect/config/layout';

// ── Tile color map (tint per kind, distinct at a glance) ──────────────

const TILE_COLORS: Record<TileKind, number> = {
  'footprint':        0xA0522D, // brown
  'magnifying-glass': 0xFFD700, // gold
  'flashlight':       0xFFEB00, // yellow-beam
  'fingerprint':      0x9B59B6, // purple
  'rope':             0x2ECC71, // green
  'scooby-snack':     0xFF8C00, // orange
};

// ── Tile background colors (backing circle per kind) ──────────────────

const TILE_BG_COLORS: Record<TileKind, number> = {
  'footprint':        0x5D2E0C,
  'magnifying-glass': 0x8B6914,
  'flashlight':       0x998700,
  'fingerprint':      0x5D2A8A,
  'rope':             0x1A6B3A,
  'scooby-snack':     0x994A00,
};

/** A rendered tile: container + label text. */
export interface TileView {
  container: Container;
  tileId: number;
  kind: TileKind;
  row: number;
  col: number;
  /** Call to highlight (on chain select). */
  setHighlight(on: boolean): void;
  /** Call to dim (tutorial non-selectable). */
  setDimmed(on: boolean): void;
  destroy(): void;
}

/**
 * Create a single tile view for the given kind.
 * Caller must add container to the board layer.
 */
export function createTileView(
  kind: TileKind,
  tileId: number,
  row: number,
  col: number,
): TileView {
  const container = new Container();

  // Background circle using Graphics
  const { Graphics } = require('pixi.js') as typeof import('pixi.js');
  const bg = new Graphics();
  const radius = CELL_SIZE / 2 - 1;
  bg.circle(0, 0, radius);
  bg.fill({ color: TILE_BG_COLORS[kind], alpha: 0.85 });
  container.addChild(bg);

  // Emoji label
  const textStyle: Partial<TextStyle> = {
    fontSize: TILE_ART_SIZE * 0.6,
    align: 'center',
  };
  const label = new Text({ text: TILE_FALLBACKS[kind], style: textStyle });
  label.anchor.set(0.5, 0.5);
  container.addChild(label);

  let highlighted = false;
  let dimmed = false;

  return {
    container,
    tileId,
    kind,
    row,
    col,

    setHighlight(on: boolean) {
      highlighted = on;
      gsap.to(container, {
        pixi: { scale: on ? 1.12 : 1, alpha: on ? 1.0 : (dimmed ? 0.4 : 1.0) },
        duration: 0.12,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    },

    setDimmed(on: boolean) {
      dimmed = on;
      gsap.to(container, {
        pixi: { alpha: on ? 0.35 : 1.0 },
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    },

    destroy() {
      gsap.killTweensOf(container);
      container.removeAllListeners();
      container.parent?.removeChild(container);
      container.destroy({ children: true });
    },
  };
}
