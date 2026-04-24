import { makeSeed, mulberry32, shuffle } from "../random";

export const N = 4;
export type Grid = number[];

export interface TowersPuzzle {
  seed: string;
  solution: Grid;
  clues: number[];
  givens: Map<number, number>;
}

export interface TowersValidation {
  rowErrors: Set<number>;
  colErrors: Set<number>;
  clueErrors: Set<number>;
  clueSatisfied: Set<number>;
  complete: boolean;
  valid: boolean;
}

export function countVisible(line: number[]): number {
  let best = 0;
  let count = 0;
  for (const value of line) {
    if (value > best) {
      best = value;
      count += 1;
    }
  }
  return count;
}

export function computeClues(grid: Grid): number[] {
  const clues: number[] = [];
  for (let c = 0; c < N; c += 1) clues.push(countVisible([0, 1, 2, 3].map((r) => grid[r * N + c])));
  for (let c = 0; c < N; c += 1) clues.push(countVisible([3, 2, 1, 0].map((r) => grid[r * N + c])));
  for (let r = 0; r < N; r += 1) clues.push(countVisible([0, 1, 2, 3].map((c) => grid[r * N + c])));
  for (let r = 0; r < N; r += 1) clues.push(countVisible([3, 2, 1, 0].map((c) => grid[r * N + c])));
  return clues;
}

export function generateTowersPuzzle(seed: string, givenCount = 4): TowersPuzzle {
  const rng = mulberry32(makeSeed(seed));
  const rows = shuffle(rng, [0, 1, 2, 3]);
  const cols = shuffle(rng, [0, 1, 2, 3]);
  const labels = shuffle(rng, [1, 2, 3, 4]);
  const solution: Grid = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      solution.push(labels[(rows[r] + cols[c]) % N]);
    }
  }

  const givens = new Map<number, number>();
  const order = shuffle(rng, Array.from({ length: N * N }, (_, i) => i));
  for (const idx of order) {
    if (givens.size >= givenCount) break;
    givens.set(idx, solution[idx]);
  }

  return { seed, solution, clues: computeClues(solution), givens };
}

function lineForClue(grid: Grid, clueIndex: number): number[] {
  if (clueIndex < N) return [0, 1, 2, 3].map((r) => grid[r * N + clueIndex]);
  if (clueIndex < 2 * N) return [3, 2, 1, 0].map((r) => grid[r * N + clueIndex - N]);
  if (clueIndex < 3 * N) return [0, 1, 2, 3].map((c) => grid[(clueIndex - 2 * N) * N + c]);
  return [3, 2, 1, 0].map((c) => grid[(clueIndex - 3 * N) * N + c]);
}

export function validateTowers(grid: Grid, clues: number[]): TowersValidation {
  const rowErrors = new Set<number>();
  const colErrors = new Set<number>();
  const clueErrors = new Set<number>();
  const clueSatisfied = new Set<number>();

  for (let r = 0; r < N; r += 1) {
    const seen = new Map<number, number>();
    for (let c = 0; c < N; c += 1) {
      const idx = r * N + c;
      const value = grid[idx];
      if (!value) continue;
      const previous = seen.get(value);
      if (previous !== undefined) {
        rowErrors.add(idx);
        rowErrors.add(previous);
      }
      seen.set(value, idx);
    }
  }

  for (let c = 0; c < N; c += 1) {
    const seen = new Map<number, number>();
    for (let r = 0; r < N; r += 1) {
      const idx = r * N + c;
      const value = grid[idx];
      if (!value) continue;
      const previous = seen.get(value);
      if (previous !== undefined) {
        colErrors.add(idx);
        colErrors.add(previous);
      }
      seen.set(value, idx);
    }
  }

  for (let i = 0; i < 4 * N; i += 1) {
    const line = lineForClue(grid, i);
    const clue = clues[i];
    let best = 0;
    let visible = 0;
    let full = true;
    for (const value of line) {
      if (!value) {
        full = false;
        break;
      }
      if (value > best) {
        best = value;
        visible += 1;
      }
    }
    if (visible > clue || (full && visible < clue)) clueErrors.add(i);
    if (full && visible === clue) clueSatisfied.add(i);
  }

  const complete = grid.every((value) => value >= 1 && value <= N);
  const valid = complete && rowErrors.size === 0 && colErrors.size === 0 && clueErrors.size === 0;
  return { rowErrors, colErrors, clueErrors, clueSatisfied, complete, valid };
}
