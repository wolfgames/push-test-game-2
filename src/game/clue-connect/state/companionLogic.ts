/**
 * companionLogic — pure companion portrait and dialogue logic.
 *
 * No Math.random(). No Pixi. No DOM.
 * Consumed by CompanionRenderer (Pixi) and HudRenderer updates.
 */

// ── Types ─────────────────────────────────────────────────────────────

export type CompanionName = 'scooby' | 'velma' | 'shaggy' | 'fred' | 'daphne';
export type CompanionReaction = 'neutral' | 'positive' | 'worried' | 'happy';
export type CompanionEvent = 'level-start' | 'chain-cleared' | 'moves-low' | 'level-won' | 'level-lost';

export interface CompanionEventContext {
  chainLength: number;
  movesRemaining: number;
}

// ── Chapter → companion mapping ───────────────────────────────────────

/**
 * Returns the gang member shown for a given chapter (1-indexed).
 * Ch1=Velma, Ch2=Shaggy, Ch3=Fred, Ch4=Daphne; loops for higher chapters.
 */
export function getCompanionForChapter(chapter: number): CompanionName {
  const companions: CompanionName[] = ['velma', 'shaggy', 'fred', 'daphne'];
  const idx = (chapter - 1) % companions.length;
  return companions[idx]!;
}

// ── Reaction mapping ──────────────────────────────────────────────────

/**
 * Returns the reaction expression for a companion event.
 */
export function getReactionForEvent(
  event: CompanionEvent,
  context: CompanionEventContext,
): CompanionReaction {
  switch (event) {
    case 'level-won':
      return 'happy';
    case 'level-lost':
      return 'worried';
    case 'moves-low':
      return 'worried';
    case 'chain-cleared':
      return context.chainLength >= 4 ? 'happy' : 'positive';
    case 'level-start':
    default:
      return 'neutral';
  }
}

// ── Dialogue lines ────────────────────────────────────────────────────

const SCOOBY_LEVEL_START: string[] = [
  "Scooby-Dooby-Doo! Let's solve this mystery, gang!",
  "Ruh-roh! Lots of clues to connect!",
  "Scooby Snacks on the line! Let's go, gang!",
  "Like, this mystery won't solve itself! Scooby, help!",
];

const COMPANION_LEVEL_START: Record<CompanionName, string[]> = {
  scooby: SCOOBY_LEVEL_START,
  velma: [
    "Jinkies! I've analyzed the evidence. Connect the clues!",
    "My glasses! Oh wait, I can see the pattern clearly.",
    "Jinkies, this is a complex one. Focus, everyone!",
  ],
  shaggy: [
    "Like, zoinks! Those clue tiles look tricky, Scoob!",
    "Like, man, I hope there are Scooby Snacks at the end!",
    "Zoinks! We've got a mystery to solve!",
  ],
  fred: [
    "Let's split up, gang! I'll handle the clue connections!",
    "Alright, team! Time to set a trap — starting with the clues!",
    "Great Scott! These clues are the key to unmasking the villain!",
  ],
  daphne: [
    "Oh my! Those clues are positively mysterious!",
    "Danger-prone Daphne is on the case!",
    "Let's uncover this mystery before the villain escapes!",
  ],
};

/**
 * Returns a level-start dialogue line for the given companion.
 * Rotates through lines based on a simple index (deterministic, no random).
 *
 * @param companion  Companion name
 * @param lineIndex  Optional index (default 0)
 */
export function getLevelStartDialogue(companion: CompanionName, lineIndex = 0): string {
  const lines = COMPANION_LEVEL_START[companion] ?? SCOOBY_LEVEL_START;
  return lines[lineIndex % lines.length]!;
}

// ── Emoji fallbacks ───────────────────────────────────────────────────

export const COMPANION_EMOJI: Record<CompanionName, string> = {
  scooby: '🐕',
  velma: '🤓',
  shaggy: '😅',
  fred: '💪',
  daphne: '💜',
};

export const REACTION_EMOJI: Record<CompanionReaction, string> = {
  neutral: '😐',
  positive: '😊',
  worried: '😰',
  happy: '🎉',
};
