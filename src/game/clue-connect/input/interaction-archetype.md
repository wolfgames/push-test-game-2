# Interaction Archetype — Clue Connect

**Game:** Mystery Inc. Mash: Clue Connect
**Pass:** core
**Required by:** `condition-core-interaction` exit criterion — must exist before implementation

---

## Which Interaction Type

**Swipe-Select** — player draws a continuous path through adjacent matching tiles.

One gesture: finger-down on a tile → drag through neighbors → finger-up to confirm.

---

## Pointer Sequence

```
pointerdown (on tileLayer)
  → hit-test board-local coords to (row, col)
  → if tile found AND phase is IDLE or SELECTING:
      set phase SELECTING
      chainHandler.start(tile)
      chainRenderer.syncChain(chain)

pointermove (on tileLayer)
  → if chainHandler.isActive():
      hit-test to (row, col)
      if tile found:
        chainHandler.tryExtend(tile)  // includes unwind logic
        chainRenderer.syncChain(chain)

pointerup (on tileLayer)
  → result = chainHandler.commit()
  → chainRenderer.clear()
  → if !result.confirmed (1 tile or no chain):
        set phase IDLE — cancel silently, no move consumed
  → if result.confirmed (2+ tiles):
        animate clear → compute gravity → animate fall → set phase IDLE
        check win/loss
```

---

## Adjacency Detection

**Chebyshev distance ≤ 1** — orthogonal and diagonal neighbors both count.

```
Chebyshev(a, b) = max(|a.row - b.row|, |a.col - b.col|)
Adjacent if Chebyshev == 1.
```

Computed in `ChainInputHandler.isAdjacent()`.

---

## Chain Unwind

If the pointer re-enters the **second-to-last** tile in the chain, the last tile is popped. This allows the player to "undo" the last extension by crossing back. The chain shortens to the re-entered tile.

---

## Cancel Behavior

- **1 tile selected, finger lifted** → cancel silently. No move consumed. Board returns to IDLE. No visual state change.
- **0 tiles (pointerdown missed board)** → no chain starts.
- **Phase is WON, LOST, or PAUSED** → input blocked entirely; chainHandler.start() is a no-op.

---

## Invalid Gesture Feedback

| Situation | Feedback |
|---|---|
| Single-tile lift | Silent cancel — no animation, no message |
| Attempt to chain a Red Herring | Shake animation on the tile (300ms, 2 oscillations) via GSAP |
| Attempt to chain a Cobweb-trapped tile | No extension; no visual reject (tile is visually dimmed already) |

The single-tile cancel is silent per GDD specification ("Finger-up on 1 tile cancels, no move consumed"). All other invalid inputs produce visible feedback.

---

## Feel Description

**Fluid and continuous.** The chain trail follows the finger in real time. Tile highlights snap on immediately (≤100ms). The chain extends with no threshold — any pointer-enter on an adjacent matching tile extends the chain. Release is instant: tiles dissolve and gravity begins within one frame of finger-up.

The interaction is designed to feel like drawing a path, not making discrete taps. Speed and fluidity are prioritized over deliberate deliberation.

---

## Pointer Capture

Pixi's `pointermove` fires globally on the stage when `eventMode='static'` is set on the tileLayer container. The tileLayer captures pointer events for the full board area. No explicit `setPointerCapture()` call is needed — Pixi manages this internally when `eventMode='static'` is active on a container.

---

## Touch Constraints

Applied to the canvas element in `gameController.ts`:
- `canvas.style.touchAction = 'none'` — prevents native scroll/pinch-zoom during play
- `canvas.style.userSelect = 'none'` — prevents text selection on long-press
