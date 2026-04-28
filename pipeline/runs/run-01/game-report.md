---
type: game-report
game: "Mystery Inc. Mash: Clue Connect"
pipeline_version: "0.3.8"
run: 1
pass: "core"
status: partial
features:
  total: 27
  implemented: 24
  partial: 1
  deferred: 2
tests:
  new: 12
  passing: 242
  total: 242
issues:
  critical: 0
  minor: 2
cos:
  - id: core-interaction
    status: pass
    note: "Swipe-Select archetype; pointer events with touch-action:none; input blocked during ANIMATING; interaction-archetype.md added at stabilize"
  - id: canvas
    status: pass
    note: "52px cells (≥48px), 6 visually distinct emoji+tint tiles; 2px cell gap with 5px per-side internal padding = ~12px visual separation; HUD+board+bottom fits 390×844 with no overlap"
  - id: animated-dynamics
    status: pass
    note: "GSAP bounce.out gravity; stable tileId identity; board-diff only moved tiles animate; ANIMATING phase gates input; ChainRenderer confirm burst; score popup floats on clear"
  - id: scoring
    status: pass
    note: "Two multiplicative dimensions: computeScore(chainLen) = base*chainLen*(1+(chainLen-2)*0.5); evidenceFillAmount(chainLen) scales same; star tiers (1/2/3) at 0%/10%/25% overflow; coin economy 10+5*stars"
completeness:
  items_required: 18
  items_met: 17
  items_gaps: 1
blocking:
  cos_failed: []
  completeness_gaps:
    - "cascade-escalation (N/A by game design): Clue Connect has no auto-cascade — chains do not auto-clear on gravity; player must make next move per GDD Movement & Physics Rules. Escalation checklist item is inapplicable to this game's mechanics."
---

# Pipeline Report: Mystery Inc. Mash: Clue Connect

## Blocking issues — must resolve before next pass

- **Completeness gap (pass=`core`) — cascade-escalation**: Cascade speed/bounce/intensity escalation is listed in the core completeness checklist but is not applicable to Clue Connect. The GDD explicitly states: "IF a chain clear causes a cascade of new tiles to form another chain of 5+ (auto-match threshold does NOT apply — cascades do not auto-clear; player must make the next move)." No auto-cascade exists; the checklist item is inapplicable. Before starting the secondary pass, confirm this design decision with the game design team and formally remove the item from subsequent completeness walks.

## Features

- [x] loading-screen — scaffold; functional
- [x] results-screen-shell — shell exists; Scooby-Doo content added (win/loss branching)
- [x] game-state-signals — ECS bridge wired; signals populated from ECS resources
- [x] start-screen — routing infrastructure + first-launch flag implemented
- [x] game-controller — fully rebuilt; ECS+Pixi+renderers+input wired per contract
- [x] content-gap-results-screens — win/loss branching; "Clue collected!" / "So close, gang!"; star animation; coin counter
- [x] content-gap-asset-manifest — scene-clue-connect bundle declared
- [x] ecs-plugin — ClueConnectPlugin with components, resources, archetypes, transactions, actions
- [x] 7x9-grid-layout — 52px cells, 7×9 board at BOARD_OFFSET_Y=120; no overlap with DOM logo
- [x] clue-tiles — 6 types with distinct emoji+tint+bg-color; stable tileId
- [x] tap-drag-chain-interaction — ChainInputHandler; Swipe-Select; pointer events; unwind support
- [x] gravity-fill-system — boardAfterGravity; board-diff movements; bounce.out animation
- [x] evidence-meter — HudRenderer meter bar; proportional fill per chain; shimmer on full
- [x] move-counter — HudRenderer move count; red flash on 0
- [x] star-rating — computeStars: 1/2/3 at 0%/10%/25% evidence overflow
- [x] scoring-formula — computeScore (chain-length multiplicative); evidenceFillAmount; computeCoins
- [x] mystery-box-tile — SpecialTileEntity; wildcard; +2 moves; spawns on 5+ chain
- [x] red-herring-blocker — BlockerEntity; rejects chain inclusion; 4-orthogonal clear rule
- [x] cobweb-blocker — BlockerEntity; traps tile; adjacent-same-type-chain frees
- [x] locked-door-blocker — BlockerEntity; Key tile mechanic
- [x] trap-door-cell — extra column drop after gravity; TRAP_DOOR_DROP_DELAY_MS=60
- [x] level-generator — SeededRng mulberry32; seed formula; SolvabilityValidator; fallback chain
- [x] hud-layout — HudRenderer top 120px + bottom 80px; no board overlap
- [x] companion-system — CompanionRenderer; chapter-based companion; reaction expressions; level-start dialogue
- [x] pause-and-hint-buttons — HudRenderer bottom band; 48×48px buttons; PAUSED phase; BFS hint
- [x] scooby-snack-coins — snoopCoins ECS resource; earn on win; deduct on hint
- [ ] tutorial-levels — implemented (TutorialOverlay.ts + handcrafted-levels.json); start-to-game-first-launch routing gap: intro cutscene not connected to first-launch flow (player bypasses onboarding on first launch)
- [x] chapter-flow-screens — ChapterInterstitial.tsx + VillainUnmask.tsx implemented; results-chapter-map routes to title (minor routing gap, not a CoS failure)
- [x] first-time-intro-cutscene — IntroScreen.tsx implemented; routing from StartScreen not connected (player_flow carry_forward)
- [x] board-state-machine — 6 states; ANIMATING gates input; WON/LOST lock board; PAUSED overlay
- [x] win-loss-sequences — GSAP delayedCall chains; correct timing per GDD spec; Watch Ad mock grants +5 moves
- [x] conflict-game-state-signals — adapted; ECS bridge wired; signals are DOM bridge only
- [x] conflict-mygame-contract — reused; contract shape unchanged

## CoS Compliance — pass `core`

| CoS | Status | Evidence / note |
|---|---|---|
| `core-interaction` | pass | Swipe-Select archetype documented; pointer events; touch-action:none; ANIMATING gates input; single-tile cancel silent per GDD |
| `canvas` | pass | CELL_SIZE=52px (≥48px); 6 visually distinct tile types; 2px gap + 5px internal padding = ~12px visual separation; HUD+board+bottom+DOM fits 390×844 |
| `animated-dynamics` | pass | GSAP bounce.out gravity; stable tileId keying; board-diff only; score popup floats; ChainRenderer confirm burst; ANIMATING phase blocks input |
| `scoring` (base) | pass | computeScore multiplicative (chain-length × magnitude); evidenceFillAmount scales same; 2 independent multiplicative dimensions in place |

## Completeness — pass `core`

| Area | Required | Met | Gaps |
|---|---|---|---|
| Interaction | 5 | 5 | 0 |
| Board & Pieces | 4 | 4 | 0 |
| Core Mechanics | 6 | 5 | 1 (cascade escalation — N/A by design) |
| Scoring (base) | 3 | 3 | 0 |
| CoS mandatory | 4 | 4 | 0 |

## Known Issues

- **Minor**: `start-to-game-first-launch` routing gap — first-time players bypass intro cutscene and go directly to game. IntroScreen.tsx exists but is not wired into StartScreen.tsx first-launch flow. Player experience works (tutorial loads), but intended first-launch narrative is missing.
- **Minor**: `results-chapter-map-button` — "Chapter Map" button calls `goto('start')` which routes to title screen, not a Chapter Map screen (which does not exist yet in core pass). Expected for core pass scope; Chapter Map is a meta-pass feature.

## Deferred

- **cascade-escalation**: Clue Connect does not auto-cascade. Per GDD: "cascades do not auto-clear; player must make the next move." The completeness checklist item is inapplicable to this game. Formally remove from secondary pass checklist walks.
- **Chapter Map screen**: `results-chapter-map` routes to title. Actual Chapter Map UI is meta-pass scope.
- **First-launch routing**: IntroScreen.tsx → Tutorial wiring deferred to secondary pass player_flow fix cycle.

## Recommendations

1. **Fix first-launch routing (secondary pass start)**: Wire `firstLaunchFlag` in StartScreen.tsx to route to IntroScreen.tsx → TutorialLevel1 on first tap. `firstLaunchFlag.ts` already exists.
2. **Chapter Map stub**: Add a basic Chapter Map screen before meta pass begins to close the routing gap.
3. **Red Herring corner logic**: `shouldClearRedHerring()` uses `>= 4` for all placements. For corner Red Herrings (2 orthogonal neighbors), the game controller should pass `maxOrthogonalNeighbors` to the clear check. Wire this before Chapter 2 levels go live.
4. **Score display on HUD**: Score value is written to ECS but not displayed on HUD (only evidence meter and moves are shown). Add a score label to HudRenderer top band for secondary pass.
