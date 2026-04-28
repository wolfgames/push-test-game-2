/**
 * HudRenderer — renders the HUD top band and bottom band on the GPU canvas.
 *
 * Top band (HUD_H=120px):
 *   - Evidence Meter bar (center, proportional fill)
 *   - Move counter text (right)
 *   - Chapter location text (left)
 *   - Companion portrait area (left of meter)
 *
 * Bottom band (BOTTOM_BAND_H=80px):
 *   - Pause button (bottom-left, 44px+ target)
 *   - Hint button (bottom-right, 44px+ target)
 *   - Coin counter (center-bottom)
 *
 * Renderer contract: init → update* → destroy
 * No DOM. No game state writes. No Math.random().
 */

import { Container, Graphics, Text, type TextStyle } from 'pixi.js';
import gsap from 'gsap';
import {
  SCREEN_W,
  SCREEN_H,
  HUD_H,
  BOTTOM_BAND_H,
  DOM_RESERVED_BOTTOM,
  BOARD_OFFSET_X,
} from '~/game/clue-connect/config/layout';

// ── Layout helpers ────────────────────────────────────────────────────

const BOTTOM_BAND_Y = SCREEN_H - DOM_RESERVED_BOTTOM - BOTTOM_BAND_H; // 708
const METER_X = SCREEN_W * 0.2;
const METER_Y = 28;
const METER_W = SCREEN_W * 0.6;
const METER_H = 18;
const METER_RADIUS = 9;

// ── Text styles ───────────────────────────────────────────────────────

const MOVE_STYLE: Partial<TextStyle> = {
  fontSize: 28,
  fontWeight: '700',
  fill: '#FFFFFF',
  align: 'right',
};

const CHAPTER_STYLE: Partial<TextStyle> = {
  fontSize: 14,
  fill: '#C0A0FF',
  align: 'left',
};

const COIN_STYLE: Partial<TextStyle> = {
  fontSize: 16,
  fill: '#FFD700',
  align: 'center',
};

const BUTTON_LABEL_STYLE: Partial<TextStyle> = {
  fontSize: 14,
  fill: '#FFFFFF',
  align: 'center',
};

// ── Callbacks ─────────────────────────────────────────────────────────

export interface HudCallbacks {
  onPause: () => void;
  onHint: () => void;
}

export class HudRenderer {
  private container: Container = new Container();
  private topBand: Container = new Container();
  private bottomBand: Container = new Container();
  private meterBg: Graphics = new Graphics();
  private meterFill: Graphics = new Graphics();
  private moveCountText!: Text;
  private chapterText!: Text;
  private coinText!: Text;
  private initialised = false;

  /** Initialize. Adds HUD to parent container. */
  init(parentContainer: Container, callbacks: HudCallbacks): void {
    if (this.initialised) return;
    this.initialised = true;

    this.container.eventMode = 'passive';
    parentContainer.addChild(this.container);

    this._initTopBand();
    this._initBottomBand(callbacks);
  }

  private _initTopBand(): void {
    this.topBand.eventMode = 'none';
    this.container.addChild(this.topBand);

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, SCREEN_W, HUD_H);
    bg.fill({ color: 0x0D0520, alpha: 0.92 });
    this.topBand.addChild(bg);

    // Chapter label (top-left)
    this.chapterText = new Text({ text: 'Chapter 1 — Ravenswood', style: CHAPTER_STYLE });
    this.chapterText.position.set(BOARD_OFFSET_X, 8);
    this.topBand.addChild(this.chapterText);

    // Evidence meter background bar
    this.meterBg.roundRect(METER_X, METER_Y, METER_W, METER_H, METER_RADIUS);
    this.meterBg.fill({ color: 0x3A1A5E, alpha: 1 });
    this.topBand.addChild(this.meterBg);

    // Evidence meter fill bar (starts at 0 width)
    this.topBand.addChild(this.meterFill);
    this._drawMeterFill(0);

    // Move counter (top-right)
    this.moveCountText = new Text({ text: '20', style: MOVE_STYLE });
    this.moveCountText.anchor.set(1, 0);
    this.moveCountText.position.set(SCREEN_W - BOARD_OFFSET_X, 8);
    this.topBand.addChild(this.moveCountText);

    // Companion area: owned by CompanionRenderer (initialised separately in gameController).
    // No stub rendered here — CompanionRenderer draws at PORTRAIT_X=8, PORTRAIT_Y=42.
  }

  private _drawMeterFill(ratio: number): void {
    this.meterFill.clear();
    if (ratio <= 0) return;
    const fillW = Math.min(ratio, 1.0) * METER_W;
    this.meterFill.roundRect(METER_X, METER_Y, fillW, METER_H, METER_RADIUS);
    this.meterFill.fill({ color: 0xFFD700, alpha: 1 });
  }

  private _initBottomBand(callbacks: HudCallbacks): void {
    this.bottomBand.position.set(0, BOTTOM_BAND_Y);
    this.bottomBand.eventMode = 'passive';
    this.container.addChild(this.bottomBand);

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, SCREEN_W, BOTTOM_BAND_H);
    bg.fill({ color: 0x0D0520, alpha: 0.92 });
    this.bottomBand.addChild(bg);

    // Pause button (bottom-left, 48×48px ≥ 44px ✓)
    const pauseBtn = this._makeButton('⏸', BOARD_OFFSET_X + 4, 16, 48, 48, callbacks.onPause);
    this.bottomBand.addChild(pauseBtn);

    // Coin counter (center)
    this.coinText = new Text({ text: '🦴 0', style: COIN_STYLE });
    this.coinText.anchor.set(0.5, 0.5);
    this.coinText.position.set(SCREEN_W / 2, BOTTOM_BAND_H / 2);
    this.bottomBand.addChild(this.coinText);

    // Hint button (bottom-right, 48×48px ≥ 44px ✓)
    const hintBtn = this._makeButton('💡', SCREEN_W - BOARD_OFFSET_X - 4 - 48, 16, 48, 48, callbacks.onHint);
    this.bottomBand.addChild(hintBtn);
  }

  private _makeButton(
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    onClick: () => void,
  ): Container {
    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill({ color: 0x5D2A8A, alpha: 0.8 });
    btn.addChild(bg);

    const txt = new Text({ text: label, style: { fontSize: 22, align: 'center' } });
    txt.anchor.set(0.5, 0.5);
    txt.position.set(w / 2, h / 2);
    btn.addChild(txt);

    btn.on('pointertap', () => {
      gsap.to(btn, { pixi: { scale: 0.9 }, duration: 0.08, yoyo: true, repeat: 1, onComplete: onClick });
    });

    return btn;
  }

  /** Update evidence meter. ratio = value / target (clamped to [0, 1]). */
  updateMeter(value: number, target: number): void {
    const ratio = target > 0 ? Math.min(value / target, 1.0) : 0;
    gsap.to(this.meterFill, {
      pixi: { scaleX: ratio },  // fallback if _drawMeterFill is not feasible via tween
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () => this._drawMeterFill(ratio),
    });
  }

  /** Animate shimmer when meter reaches 100%. */
  animateMeterFull(): void {
    gsap.to(this.meterFill, {
      pixi: { alpha: 0.5 },
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: 'power2.inOut',
      onComplete: () => { this.meterFill.alpha = 1; },
    });
  }

  /** Update move counter. Flashes red on 0. */
  updateMoves(movesRemaining: number): void {
    this.moveCountText.text = String(movesRemaining);

    if (movesRemaining === 0) {
      gsap.to(this.moveCountText, {
        pixi: { tint: 0xFF2222 },
        duration: 0.15,
        yoyo: true,
        repeat: 3,
        ease: 'power2.inOut',
        onComplete: () => { this.moveCountText.tint = 0xFFFFFF; },
      });
    }
  }

  /** Update chapter label. */
  updateChapter(chapterName: string): void {
    this.chapterText.text = chapterName;
  }

  /** Update coin count display. */
  updateCoins(coins: number): void {
    this.coinText.text = `🦴 ${coins}`;
  }

  destroy(): void {
    gsap.killTweensOf(this.container);
    gsap.killTweensOf(this.meterFill);
    gsap.killTweensOf(this.moveCountText);
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
