import { makeSeed, mulberry32, shuffle } from "../random";

export interface Fault {
  x: number;
  y: number;
}

export type ProbeResult = "H" | "R" | number;

const OFFSETS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function generateFaults(seed: string, count = 2): Fault[] {
  const rng = mulberry32(makeSeed(`${seed}:faults`));
  return shuffle(
    rng,
    Array.from({ length: 16 }, (_, idx) => ({ x: (idx % 4) + 1, y: Math.floor(idx / 4) + 1 })),
  ).slice(0, count);
}

export function faultKey(fault: Fault): string {
  return `${fault.x},${fault.y}`;
}

export function rangeToGrid(rangeNo: number): { x: number; y: number; direction: number } | null {
  if (rangeNo < 0 || rangeNo >= 16) return null;
  if (rangeNo < 4) return { x: rangeNo + 1, y: 0, direction: 2 };
  const right = rangeNo - 4;
  if (right < 4) return { x: 5, y: right + 1, direction: 3 };
  const bottom = rangeNo - 8;
  if (bottom < 4) return { x: 4 - bottom, y: 5, direction: 0 };
  const left = rangeNo - 12;
  return { x: 0, y: 4 - left, direction: 1 };
}

export function gridToRange(x: number, y: number): number | null {
  if (x > 0 && x < 5 && y > 0 && y < 5) return null;
  if (x < 0 || x > 5 || y < 0 || y > 5) return null;
  if ((x === 0 || x === 5) && (y === 0 || y === 5)) return null;
  if (y === 0) return x - 1;
  if (x === 5) return y - 1 + 4;
  if (y === 5) return 4 - x + 8;
  return 4 - y + 12;
}

function hasFault(faults: Set<string>, gx: number, gy: number, direction: number, look: "left" | "forward" | "right"): boolean {
  let x = gx + OFFSETS[direction].x;
  let y = gy + OFFSETS[direction].y;
  if (look === "left") {
    x += OFFSETS[(direction + 3) % 4].x;
    y += OFFSETS[(direction + 3) % 4].y;
  } else if (look === "right") {
    x += OFFSETS[(direction + 1) % 4].x;
    y += OFFSETS[(direction + 1) % 4].y;
  }
  if (x < 1 || y < 1 || x > 4 || y > 4) return false;
  return faults.has(`${x},${y}`);
}

export function traceProbe(faultList: Fault[], entryNo: number): ProbeResult {
  const start = rangeToGrid(entryNo);
  if (!start) throw new Error(`Probe entry out of range: ${entryNo}`);
  const faults = new Set(faultList.map(faultKey));
  let { x, y, direction } = start;

  if (hasFault(faults, x, y, direction, "forward")) return "H";
  if (hasFault(faults, x, y, direction, "left") || hasFault(faults, x, y, direction, "right")) return "R";

  x += OFFSETS[direction].x;
  y += OFFSETS[direction].y;

  for (let guard = 0; guard < 300; guard += 1) {
    const exit = gridToRange(x, y);
    if (exit !== null) return exit === entryNo ? "R" : exit;
    if (hasFault(faults, x, y, direction, "forward")) return "H";
    if (hasFault(faults, x, y, direction, "left")) {
      direction = (direction + 1) % 4;
      continue;
    }
    if (hasFault(faults, x, y, direction, "right")) {
      direction = (direction + 3) % 4;
      continue;
    }
    x += OFFSETS[direction].x;
    y += OFFSETS[direction].y;
  }

  return "H";
}
