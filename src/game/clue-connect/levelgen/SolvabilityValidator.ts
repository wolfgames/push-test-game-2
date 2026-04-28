/**
 * SolvabilityValidator — checks if a board has at least one valid chain.
 *
 * A valid chain is 2+ adjacent (Chebyshev ≤ 1) tiles of the same kind.
 * Uses BFS to find the longest chain from each starting cell.
 *
 * No Math.random(). No Pixi. No DOM.
 */

export interface ValidatorCell {
  row: number;
  col: number;
  tileKind: string;
  tileId: number;
}

/**
 * Returns true if the board has at least one valid 2+ chain within
 * the given move budget. Uses greedy BFS from each cell.
 *
 * @param board       2D array of board cells
 * @param minMoves    Minimum chains that must be findable (default 1)
 */
export function isBoardSolvable(board: ValidatorCell[][], minMoves = 1): boolean {
  const rows = board.length;
  if (rows === 0) return false;
  const cols = board[0]!.length;

  let chainsFound = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startCell = board[r]![c]!;
      const chain = bfsChain(board, rows, cols, startCell);
      if (chain.length >= 2) {
        chainsFound++;
        if (chainsFound >= minMoves) return true;
      }
    }
  }

  return chainsFound >= minMoves;
}

/**
 * BFS-based greedy chain finder. Finds the longest chain of same-kind
 * tiles reachable from the start cell (Chebyshev adjacency).
 */
function bfsChain(
  board: ValidatorCell[][],
  rows: number,
  cols: number,
  start: ValidatorCell,
): ValidatorCell[] {
  const inChain = new Set<number>();
  const chain: ValidatorCell[] = [start];
  inChain.add(start.tileId);

  let head = 0;
  while (head < chain.length && chain.length < rows * cols) {
    const current = chain[head]!;
    head++;

    // Chebyshev neighbors (8 directions)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = current.row + dr;
        const nc = current.col + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const neighbor = board[nr]![nc]!;
        if (inChain.has(neighbor.tileId)) continue;
        if (neighbor.tileKind !== start.tileKind) continue;
        chain.push(neighbor);
        inChain.add(neighbor.tileId);
      }
    }
  }

  return chain;
}

/**
 * Returns the longest valid chain from any starting cell on the board.
 * Used by the hint system (Batch 7).
 */
export function findLongestChain(board: ValidatorCell[][]): ValidatorCell[] {
  const rows = board.length;
  if (rows === 0) return [];
  const cols = board[0]!.length;

  let best: ValidatorCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const chain = bfsChain(board, rows, cols, board[r]![c]!);
      if (chain.length > best.length) {
        best = chain;
      }
    }
  }

  return best;
}
