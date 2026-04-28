# Mystery Inc. Mash: Clue Connect
**Tagline:** Every tap brings the monster's mask one step closer to falling.
**Genre:** Casual puzzle / tile-matching investigation
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
6. [Level Generation](#level-generation)

**How It Flows**
7. [Game Flow](#game-flow)

---

## Game Overview

Mystery Inc. Mash: Clue Connect is a casual tile-matching puzzle game set in the world of Scooby-Doo, where players connect matching evidence tiles across haunted locations to expose the villain behind each mystery. Scooby, Shaggy, Fred, Daphne, and Velma each appear as on-screen companions reacting to your detective work with signature humor and encouragement. Each chapter takes the gang to a new haunted locale — a creaky mansion, a foggy amusement park, a crumbling castle — and ends with a satisfying villain unmask when enough clues have been gathered.

**Setting:** Iconic Scooby-Doo haunted locations (Haunted Mansion, Coolsville Carnival, Castle Vorheim, abandoned lighthouse, etc.) — one location per chapter, richly illustrated in the classic Hanna-Barbera style.

**Core Loop:** Player connects matching clue tiles on the board -> which builds the Evidence Meter -> which, when filled within the move limit, triggers the villain unmask cutscene and unlocks the next chapter.

---

## At a Glance

| | |
|---|---|
| **Grid** | 7×9 (portrait) |
| **Input** | Tap and drag to connect |
| **Clue Tile Types** | 6 (Footprint, Magnifying Glass, Flashlight, Fingerprint, Rope, Scooby Snack) |
| **Special Tiles** | Mystery Box (wildcard), Red Herring (blocker), Trap Door (gravity modifier) |
| **Levels / Chapter** | 10 |
| **Session Target** | 2–5 min per level |
| **Move Range** | 12–30 moves |
| **Chapters at Launch** | 5 |
| **Blockers** | Red Herring (Ch. 2), Cobweb (Ch. 3), Locked Door (Ch. 4) |
| **Failure** | Yes — out of moves before Evidence Meter is filled |
| **Continue System** | Watch ad or spend Scooby Snack coins for +5 moves |
| **Star Rating** | 1–3 stars based on Evidence Meter overflow (bonus clues collected), cosmetic only |
| **Companion** | The Mystery Inc. gang reacts live; Scooby delivers level-start and unmask lines |
| **Content Cadence** | 1 chapter (10 levels) every 2–3 weeks post-launch |

---

## Core Mechanics

### Primary Input

**Input type:** Tap-and-drag (single continuous touch gesture)
**Acts on:** Adjacent matching clue tiles on the 7×9 grid
**Produces:** A chain of connected tiles that are cleared from the board when the player lifts their finger, filling the Evidence Meter and triggering a gravity-fall refill

The player touches a tile and drags through adjacent tiles of the same type (orthogonally and diagonally). A minimum chain of 2 tiles completes a valid match. The player lifts their finger to confirm — the chain clears, the meter fills, and new tiles fall from the top. One drag gesture = one move consumed.

On web (desktop), mouse-down-and-drag maps directly to this gesture. No hover mechanics are used.

### Play Surface

**Dimensions:** 7 columns × 9 rows (63 cells total)
**Orientation:** Portrait — fits within a 9:16 phone viewport
**Layout budget:**
- Top band (~15% of screen height): HUD — Evidence Meter, move counter, chapter name, companion reaction strip
- Play surface (~70% of screen height): The 7×9 grid
- Bottom band (~15% of screen height): Pause button and hint button (thumb-natural zone)

**Cell size:** Minimum 44pt × 44pt touch target per cell; visual tile art fills ~80% of cell, leaving a gap for readability on dense boards.

**Scaling:** The grid scales uniformly to fill the safe area width on any phone; tall phones gain vertical breathing room above/below the grid. Landscape is not supported — the game locks to portrait.

**Cell states:** Empty (filling), Occupied (tile present), Blocked (blocker tile present), Animating (mid-fall or mid-clear).

### Game Entities

---

**Clue Tiles (6 types)**
- *Visual:* Stylized Scooby-Doo-themed icons — Footprint (brown paw), Magnifying Glass (gold), Flashlight (yellow beam), Fingerprint (purple swirl), Rope (green coil), Scooby Snack (orange bone biscuit)
- *Behavior:* Occupy one grid cell. Can be matched in chains of 2+. Clear when chain is released. Fall downward under gravity when cells below are cleared.
- *Edge cases:* A tile at the bottom row with nothing below it stays in place. A tile partially off-screen (top row) enters from the top via a fall animation when a cell above the grid is vacated.

---

**Mystery Box (wildcard special tile)**
- *Visual:* Brown wooden crate with a "?" stencil and a glowing question mark
- *Behavior:* Acts as a matching wildcard — counts as any clue tile type. The player can include it in any chain. Connecting a chain through a Mystery Box scores a +2 bonus move reward.
- *Creation:* Appears at random when a chain of 5+ tiles is cleared in a single move (one Mystery Box spawns at the center of the cleared chain).
- *Edge cases:* Two Mystery Boxes in one chain both contribute their bonus. Mystery Box cannot be the only tile in a chain (still requires at least 1 regular clue tile).

---

**Red Herring (blocker tile)**
- *Visual:* A cartoon red fish with a suspicious grin
- *Behavior:* Occupies one cell. Cannot be matched or moved. Blocks chains from passing through it. Must be removed by clearing all 4 orthogonally adjacent tiles — when the last adjacent tile is cleared in a single move, the Red Herring "escapes" (pops off with a laugh animation) and the cell becomes empty. Introduced in Chapter 2.
- *Edge cases:* Diagonal adjacency does not count for removal. A Red Herring at a corner requires only 2 adjacent clears. Red Herrings do not fall under gravity.

---

**Cobweb (sticky blocker)**
- *Visual:* A silvery spider web overlaying a clue tile
- *Behavior:* Traps the tile beneath it — that tile cannot be included in a chain. The web is cleared by matching the trapped tile type in an adjacent chain (the trapped tile itself is freed but does not count in that chain; it becomes a free tile on the next move). Introduced in Chapter 3.
- *Edge cases:* A Cobweb on a Mystery Box traps the wildcard until freed. Cobwebs do not stack.

---

**Locked Door (immovable blocker)**
- *Visual:* A stone archway with a padlock icon
- *Behavior:* Spans one cell. Cannot be cleared by normal matching. Cleared only by collecting a Key tile (a rare special spawn, one per level that contains a Locked Door). The Key tile appears in the top row at a random column when the level starts; it falls and must be matched in any chain of 2+ to "use" the key and remove the nearest Locked Door. Introduced in Chapter 4.
- *Edge cases:* If multiple Locked Doors are present, the Key removes the lowest one first. Key tiles fall under gravity like clue tiles. A Key tile not matched before moves run out is lost (the door remains).

---

**Trap Door (gravity modifier cell)**
- *Visual:* A wooden hatch drawn on the floor of a cell — it flips open when triggered
- *Behavior:* A cell property, not a tile. When a chain is cleared and any cleared tile was in the Trap Door cell, all tiles in that column above the door drop an extra row (as if gravity doubled momentarily). Produces a satisfying cascade.
- *Edge cases:* A Trap Door cell with a Red Herring on it does not trigger (Red Herrings don't clear by chain). Trap Door cells are permanent for the level — they do not disappear.

---

### Movement & Physics Rules

All tile movement is driven by gravity fill (downward). There is no lateral sliding.

- IF a tile is cleared from the board, THEN every tile in the same column above it falls downward one cell per cleared cell below it (standard gravity fill), animated at 80ms per cell of fall distance.
- IF the top cell of a column is vacated, THEN a new tile of a randomly selected type (from the current level's active type pool) spawns above the visible grid and falls in, animated at 80ms per cell.
- IF a chain clear causes a cascade of new tiles to form another chain of 5+ (auto-match threshold does NOT apply — cascades do not auto-clear; player must make the next move), THEN the board settles and waits for player input.
- IF a Trap Door cell tile is included in a cleared chain, THEN after normal gravity resolves, all remaining tiles in that column shift down one additional cell, animated at 60ms per cell.
- IF input is received while any tile animation is playing (fall, clear, spawn), THEN the input is queued and executed immediately after the current animation completes. No input is discarded; no animation is skipped.
- IF a chain drag crosses back over a previously included tile, THEN that tile is de-selected and the chain shortens to that tile (chain can be "unwound" during the drag).
- IF the player lifts their finger on a chain of only 1 tile, THEN the move is cancelled, no tiles clear, no move is consumed.

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method

**Hybrid** — Levels 1–3 of Chapter 1 are fully hand-crafted (tutorial levels). All subsequent levels (Levels 4–10 of Chapter 1 and all levels of Chapters 2–5+) are procedurally generated using a seeded algorithm, then validated against solvability and difficulty constraints.

Hand-crafted levels live in `src/game/myscooby/data/handcrafted-levels.json`. Owned by the game design team. The procedural generator never reads or modifies this file.

### Generation Algorithm

**Step 1: Seed Initialization**
- Inputs: `chapterIndex` (1-based), `levelIndex` (1-based within chapter), `globalLevelNumber` (cumulative)
- Outputs: Initialized seeded RNG instance
- Constraints: Seed formula = `(chapterIndex * 10000) + (levelIndex * 100) + 7331`. The same seed must always produce the same level. No `Math.random()` — use only the seeded RNG.

**Step 2: Difficulty Parameter Selection**
- Inputs: `globalLevelNumber`, difficulty curve table (see below)
- Outputs: `moveLimit`, `evidenceTarget` (% of meter to fill), `activeTileTypes` (how many of the 6 types are active), `blockerCount`, `trapDoorCount`
- Constraints: Parameters must fall within the range defined for the current level band (see Difficulty Curve below). No parameter may be set outside its band range.

**Difficulty Curve:**

| Level Range | Move Limit | Evidence Target | Active Tile Types | Blocker Count |
|---|---|---|---|---|
| 1–10 (Ch. 1 generated) | 25–30 | 60% | 4 | 0 |
| 11–20 (Ch. 2) | 22–28 | 65% | 4–5 | 1–2 |
| 21–30 (Ch. 3) | 20–25 | 70% | 5 | 2–4 |
| 31–40 (Ch. 4) | 17–22 | 75% | 5–6 | 3–5 |
| 41–50 (Ch. 5) | 14–20 | 80% | 6 | 4–6 |

Early levels (Levels 1–10 post-tutorial) use the highest move limits and lowest evidence targets in their band. The generator always selects the easiest parameters within the band for these levels.

**Step 3: Initial Board Population**
- Inputs: Grid dimensions (7×9), `activeTileTypes`, seeded RNG
- Outputs: 63-cell grid with clue tiles assigned
- Constraints:
  - Tiles are assigned randomly from `activeTileTypes` only (inactive types do not appear)
  - No column may start with 5+ consecutive tiles of the same type (visual clutter rejection)
  - No row may start with 4+ consecutive tiles of the same type
  - Minimum 8 tiles of each active type must be present in the initial board (ensures all types are matchable)

**Step 4: Blocker Placement**
- Inputs: Populated board, `blockerCount`, `trapDoorCount`, `chapterIndex`, seeded RNG
- Outputs: Board with blockers inserted at valid positions
- Constraints:
  - Red Herrings may only appear if `chapterIndex >= 2`. Placed only in rows 2–8 (not top row, not bottom row). No two Red Herrings share a column.
  - Cobwebs may only appear if `chapterIndex >= 3`. Placed on any occupied non-blocker cell. No more than 2 Cobwebs per column.
  - Locked Doors may only appear if `chapterIndex >= 4`. Placed only in rows 4–7 (mid-board). Exactly 1 Key tile is added to the top row when any Locked Door is placed.
  - Trap Door cells: placed only in rows 5–8 (lower half). No two Trap Doors in the same column.
  - Total blockers (all types combined) may not exceed 20% of total cells (≤12 cells).

**Step 5: Solvability Simulation**
- Inputs: Fully populated board, `moveLimit`, `evidenceTarget`
- Outputs: Pass/fail result + simulated score at move limit
- Constraints:
  - A fast solver runs a greedy simulation: each simulated move selects the longest available chain; if no chain of 2+ exists, the level is rejected.
  - The simulation must reach `evidenceTarget` within `moveLimit` moves.
  - The simulation must never reach a dead-board state (no chains of 2+ available) before moves run out.
  - Simulation cap: 10,000 iterations max per validation run (performance guard).

### Seeding & Reproducibility

Seed formula: `seed = (chapterIndex * 10000) + (levelIndex * 100) + 7331`

The same seed always produces the same board. The seeded RNG is a pure function — no external state, no `Math.random()`. If a player replays a level (after failing), they see the identical board.

Failed seed handling: If a seed produces a board that fails solvability validation after `maxRetries` attempts (see below), the seed is incremented by 1 and the process repeats. The modified seed is stored per level so replay is still reproducible.

### Solvability Validation

**Rejection conditions (named):**
- `DEAD_BOARD` — No valid chain of 2+ tiles exists anywhere on the board at move 0 (unsolvable from the start)
- `INSUFFICIENT_TILES` — Fewer than 8 tiles of any active tile type present initially (makes some types practically unmatchable)
- `OVERCROWDED_COLUMN` — Any column has 5+ consecutive identical tiles
- `BLOCKER_SATURATION` — More than 12 cells are occupied by non-clearable blockers
- `SIMULATION_FAIL` — Greedy solver cannot reach `evidenceTarget` within `moveLimit` moves
- `CASCADE_DEADLOCK` — Solver reaches a state with 0 valid chains before moves run out

**Retry logic:** Up to 10 generation attempts per level. Each retry increments the seed by 1. On each retry, all steps (3–5) re-run from the new seed.

**Fallback chain:**
1. Attempt procedural generation (up to 10 retries)
2. If all 10 fail: use the nearest hand-crafted fallback level from `src/game/myscooby/data/fallback-levels.json` (one fallback level per chapter, designed to always be solvable)
3. If fallback file is missing or corrupt: use the emergency static board (hard-coded in the generator, guaranteed valid)

**Last-resort guarantee:** A hard-coded emergency board (7×9, 4 tile types, 25 moves, 60% evidence target, no blockers) is embedded in the generator source. It cannot fail validation. It is used only if both procedural generation and the fallback file fail.

### Hand-Crafted Levels

- **Which levels:** Chapter 1, Levels 1–3 (tutorial sequence)
- **Where data lives:** `src/game/myscooby/data/handcrafted-levels.json`
- **Who owns them:** Game design team. These levels are not modified by the generator and are not subject to procedural validation. Each hand-crafted level includes a pre-verified `isSolvable: true` flag set manually.

---

## Game Flow

### Master Flow Diagram

```
App Open
  ↓ (assets loaded, Scooby splash plays)
Title Screen  [lifecycle_phase: TITLE]
  ↓ (first launch → First-Time Intro)
  ↓ (returning player → Chapter Start Interstitial)
First-Time Intro / Cutscene  [lifecycle_phase: TITLE]
  ↓ (cutscene completes)
Tutorial Level 1 (hand-crafted, guided)  [lifecycle_phase: PLAY]
  ↓ (level complete)
Tutorial Level 2 (hand-crafted, less guidance)  [lifecycle_phase: PLAY]
  ↓ (level complete)
Chapter Start Interstitial (Ch. 1: The Haunted Mansion)  [lifecycle_phase: PROGRESSION]
  ↓ (tap "Investigate!")
Gameplay Screen (Level 1 of chapter)  [lifecycle_phase: PLAY]
  ↓ (Evidence Meter fills within move limit → WIN)
  ↓ (moves run out before meter fills → LOSS)
Level Complete Screen  [lifecycle_phase: OUTCOME]
  ↓ (last level of chapter → Chapter Complete Screen)
  ↓ (not last level → Chapter Start Interstitial with next level context)
Loss Screen  [lifecycle_phase: OUTCOME]
  ↓ (watch ad / spend coins → Gameplay Screen, +5 moves, same board)
  ↓ (decline → Gameplay Screen resets, same board, fresh move limit)
Chapter Complete / Villain Unmask Screen  [lifecycle_phase: OUTCOME]
  ↓ (tap "Next Mystery!")
Chapter Start Interstitial (next chapter)  [lifecycle_phase: PROGRESSION]
  ↓ ... (loop)
```

### Screen Breakdown

---

**Title Screen**
- *lifecycle_phase:* TITLE
- *Purpose:* Brand entry point; routes returning players to their chapter, new players to the intro.
- *Player sees:* Scooby-Doo logo, Mystery Machine illustration, "Play" button, settings gear icon. Scooby peeks in from the side with a Scooby Snack animation.
- *Player does:* Taps "Play" (44pt+ target).
- *What happens next:* First-time players → First-Time Intro. Returning players → Chapter Start Interstitial for their current chapter.
- *Expected session length:* <5 seconds.

---

**First-Time Intro / Cutscene**
- *lifecycle_phase:* TITLE
- *Purpose:* Sets up the mystery premise and introduces the connection mechanic through narration.
- *Player sees:* Short illustrated cutscene (5–7 panels, comic-book style) — Fred briefs the gang: "There's a monster at the old Ravenswood Mansion! We need clues!" Velma explains the mechanic in one line: "Connect the matching evidence to build our case — but watch your move count!"
- *Player does:* Taps to advance panels. Can skip via "Skip" button (top-right, appears after 2 seconds).
- *What happens next:* Tutorial Level 1.
- *Expected session length:* 30–60 seconds.

---

**Tutorial Level 1 (Guided)**
- *lifecycle_phase:* PLAY
- *Purpose:* Teaches tap-and-drag chain connection with a simple 4×5 sub-grid (full grid not shown yet).
- *Player sees:* A reduced board with 3 tile types, a hand-cursor overlay highlighting a chain. Velma's speech bubble: "Connect at least 2 matching clues — drag and release!" Progress bar suppressed.
- *Player does:* Follows the prompted chain. Only the correct tiles are tappable (others dimmed).
- *What happens next:* On chain clear → brief Scooby reaction animation → Tutorial Level 2.
- *Expected session length:* 60–90 seconds.

---

**Tutorial Level 2 (Semi-Guided)**
- *lifecycle_phase:* PLAY
- *Purpose:* Introduces the full 7×9 grid, the Evidence Meter, and the move counter.
- *Player sees:* Full grid with 4 tile types, Evidence Meter visible, move counter (15 moves). Shaggy's speech bubble: "Fill the meter before you run out of moves, Scoob!" Guidance arrows point to the meter and counter; no forced chain.
- *Player does:* Makes free choices. Cannot fail (the board is designed with enough slack to complete with any reasonable chain selection).
- *What happens next:* Level complete → Chapter Start Interstitial (Chapter 1).
- *Expected session length:* 2–3 minutes.

---

**Chapter Start Interstitial**
- *lifecycle_phase:* PROGRESSION
- *Purpose:* Sets scene for the chapter's haunted location; shows level progress within the chapter (e.g., "Level 3 / 10").
- *Player sees:* Full-bleed illustration of the location (Haunted Mansion, Carnival, etc.), chapter title ("Chapter 1: The Ravenswood Haunting"), a "Gather Clues!" progress ribbon showing current level, and Scooby + Shaggy peeking nervously from a corner.
- *Player does:* Taps "Investigate!" to begin the next level.
- *What happens next:* Gameplay Screen for the current level.
- *Expected session length:* 5–10 seconds.

---

**Gameplay Screen**
- *lifecycle_phase:* PLAY
- *Purpose:* Core play — tile-matching puzzle.
- *Player sees:* 7×9 grid of clue tiles, Evidence Meter (top-center), move counter (top-right), chapter location name (top-left), companion reaction strip (one gang member portrait reacts to good/bad moves), pause button (bottom-left), hint button (bottom-right, costs 1 Scooby Snack coin).
- *Player does:* Tap-and-drag to connect chains. Watches the meter fill. Uses hints sparingly.
- *What happens next:* Evidence Meter fills → Win Sequence. Moves reach 0 → Loss Sequence.
- *Expected session length:* 2–5 minutes.

---

**Level Complete Screen**
- *lifecycle_phase:* OUTCOME
- *Purpose:* Celebrates the clear and awards stars.
- *Player sees:* "Clue collected!" banner, star rating (1–3 stars based on Evidence Meter overflow), Scooby doing a happy dance, total Scooby Snack coins earned. "Next Level" button and a secondary "Chapter Map" button.
- *Player does:* Taps "Next Level" to continue or "Chapter Map" to review progress.
- *What happens next:* If chapter complete → Chapter Complete Screen. Otherwise → Chapter Start Interstitial.
- *Expected session length:* 10–15 seconds.

---

**Loss Screen**
- *lifecycle_phase:* OUTCOME
- *Purpose:* Gentle retry prompt — encourages without shaming.
- *Player sees:* "So close, gang!" banner (never "Game Over"), Scooby looking sympathetic, move counter at 0, Evidence Meter showing progress made, two buttons: "Watch Ad (+5 moves)" and "Try Again (reset)".
- *Player does:* Chooses to continue with ad bonus or retry from scratch.
- *What happens next:* "Watch Ad" → ad plays → Gameplay Screen resumes same board with +5 moves. "Try Again" → Gameplay Screen resets same board with full move limit.
- *Expected session length:* 10–20 seconds.

---

**Chapter Complete / Villain Unmask Screen**
- *lifecycle_phase:* OUTCOME
- *Purpose:* Delivers the payoff — the villain is unmasked in classic Scooby-Doo style.
- *Player sees:* Animated unmask sequence (Fred pulls off the monster mask, villain is revealed), villain's motive explained in 2–3 lines of dialogue, total stars earned for the chapter, "Next Mystery!" button.
- *Player does:* Watches the unmask (skippable after 3 seconds). Taps "Next Mystery!" to advance.
- *What happens next:* Chapter Start Interstitial for the next chapter.
- *Expected session length:* 30–60 seconds.

---

### Board States

| State | Description | Input Allowed? |
|---|---|---|
| `IDLE` | Board settled, all tiles at rest, awaiting player touch | Yes — drag to start a chain |
| `SELECTING` | Player is actively dragging a chain (finger down) | Yes — extend, unwind, or cancel the current chain only |
| `ANIMATING` | Tiles are clearing, falling, or spawning (post-chain release) | Queued — input is recorded and executed after animation completes |
| `WON` | Evidence Meter filled; win sequence triggered | No — board locked |
| `LOST` | Move counter reached 0 before meter filled; loss sequence triggered | No — board locked |
| `PAUSED` | Pause menu open | No — board locked |

Any board-state transition that mutates visible pieces (clears, gravity fills, spawns) is an animated transition — no instant state changes. All tile movement animates at 80ms per cell of travel distance.

### Win Condition

```
IF (evidenceMeterValue >= evidenceTarget) THEN level_won = true
```

Win is triggered the moment the meter reaches target, mid-animation if needed. The board locks immediately; the win sequence begins.

### Lose Condition

```
IF (movesRemaining == 0) AND (evidenceMeterValue < evidenceTarget) THEN level_lost = true
```

Loss is evaluated after each move resolves (after all animations complete). The player is never cut off mid-animation.

### Win Sequence (ordered)

1. Final chain clears — evidence fills meter — ANIMATING state completes
2. Board state transitions to `WON`; all remaining input is discarded
3. Evidence Meter plays a "full" animation (shimmer pulse, 400ms)
4. Scooby barks and jumps (companion strip expands, 600ms)
5. Level Complete Screen slides in from bottom (300ms ease-out)
6. Star rating resolves and stars animate in one by one (200ms each)
7. Coin award counter ticks up (400ms)
8. "Next Level" button appears (fade in, 200ms)

### Loss Sequence (ordered)

1. Final move resolves — move counter hits 0 — ANIMATING state completes
2. Board state transitions to `LOST`; all input is discarded
3. Move counter flashes red (300ms, 2 pulses)
4. Evidence Meter shows a "not quite" shake animation (200ms)
5. Shaggy companion portrait droops with "Zoinks..." speech bubble (500ms)
6. Board dims to 60% opacity (300ms fade)
7. Loss Screen slides in from bottom (300ms ease-out)
8. "Watch Ad" and "Try Again" buttons appear simultaneously (fade in, 200ms)
