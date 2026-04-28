/**
 * CompanionRenderer — renders the companion portrait and dialogue in the HUD.
 *
 * Displays companion emoji in the HUD companion area (left side, row 2).
 * Dialogue text rendered as GPU Text below the portrait.
 * Reaction expressions swap emoji via tint/text update.
 *
 * Renderer contract: init → update* → destroy
 * No DOM. No game state writes. No Math.random().
 */

import { Container, Graphics, Text, type TextStyle } from 'pixi.js';
import gsap from 'gsap';
import {
  BOARD_OFFSET_X,
  HUD_H,
} from '~/game/clue-connect/config/layout';
import {
  type CompanionName,
  type CompanionReaction,
  COMPANION_EMOJI,
  REACTION_EMOJI,
  getLevelStartDialogue,
} from '~/game/clue-connect/state/companionLogic';

// ── Layout constants ──────────────────────────────────────────────────

const PORTRAIT_X = BOARD_OFFSET_X;
const PORTRAIT_Y = 42;
const PORTRAIT_W = 60;
const PORTRAIT_H = 60;
const PORTRAIT_RADIUS = 8;
const DIALOGUE_X = BOARD_OFFSET_X + PORTRAIT_W + 8;
const DIALOGUE_Y = 48;
const MAX_DIALOGUE_W = 160;

// ── Text styles ───────────────────────────────────────────────────────

const DIALOGUE_STYLE: Partial<TextStyle> = {
  fontSize: 11,
  fill: '#E0D0FF',
  wordWrap: true,
  wordWrapWidth: MAX_DIALOGUE_W,
  align: 'left',
};

export class CompanionRenderer {
  private container: Container = new Container();
  private portraitBg: Graphics = new Graphics();
  private portraitText!: Text;
  private dialogueText!: Text;
  private initialised = false;
  private currentCompanion: CompanionName = 'scooby';

  /** Initialize. Adds companion area to parent container. */
  init(parentContainer: Container): void {
    if (this.initialised) return;
    this.initialised = true;

    this.container.eventMode = 'none';
    parentContainer.addChild(this.container);

    // Portrait background
    this.portraitBg.roundRect(PORTRAIT_X, PORTRAIT_Y, PORTRAIT_W, PORTRAIT_H, PORTRAIT_RADIUS);
    this.portraitBg.fill({ color: 0x5D2A8A, alpha: 0.6 });
    this.container.addChild(this.portraitBg);

    // Portrait emoji text
    this.portraitText = new Text({
      text: COMPANION_EMOJI.scooby,
      style: { fontSize: 28, align: 'center' },
    });
    this.portraitText.anchor.set(0.5, 0.5);
    this.portraitText.position.set(PORTRAIT_X + PORTRAIT_W / 2, PORTRAIT_Y + PORTRAIT_H / 2);
    this.container.addChild(this.portraitText);

    // Dialogue text
    this.dialogueText = new Text({
      text: '',
      style: DIALOGUE_STYLE,
    });
    this.dialogueText.position.set(DIALOGUE_X, DIALOGUE_Y);
    this.dialogueText.alpha = 0;
    this.container.addChild(this.dialogueText);
  }

  /** Update companion portrait for a chapter (chapter 1-indexed). */
  setCompanion(companion: CompanionName): void {
    this.currentCompanion = companion;
    this.portraitText.text = COMPANION_EMOJI[companion];
  }

  /** Show a dialogue line with fade-in / auto-hide. */
  showDialogue(text: string, duration = 3.0): void {
    this.dialogueText.text = text;
    gsap.killTweensOf(this.dialogueText);
    gsap.fromTo(this.dialogueText,
      { pixi: { alpha: 0 } },
      { pixi: { alpha: 1 }, duration: 0.3, ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.dialogueText, {
            pixi: { alpha: 0 }, duration: 0.4,
            delay: duration, ease: 'power2.in',
          });
        },
      },
    );
  }

  /** Show level-start dialogue for current companion. */
  showLevelStartDialogue(): void {
    const line = getLevelStartDialogue(this.currentCompanion);
    this.showDialogue(line);
  }

  /** Update the portrait expression for a reaction. */
  setReaction(reaction: CompanionReaction): void {
    const emoji = REACTION_EMOJI[reaction];
    gsap.to(this.portraitText, {
      pixi: { scale: 1.2 },
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.portraitText.text = COMPANION_EMOJI[this.currentCompanion] + emoji;
      },
    });
    // Reset after 1s
    gsap.delayedCall(1.0, () => {
      if (this.portraitText && this.initialised) {
        this.portraitText.text = COMPANION_EMOJI[this.currentCompanion];
      }
    });
  }

  destroy(): void {
    gsap.killTweensOf(this.portraitText);
    gsap.killTweensOf(this.dialogueText);
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
    this.initialised = false;
  }
}
