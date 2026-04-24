import { todaySeed } from "./random";

export type GameSlug = "towers-speed-run" | "hidden-foundations";
export type WindowKey = "daily" | "weekly" | "all-time";

export interface ScoreRow {
  id: string;
  gameSlug: GameSlug;
  puzzleSeed: string;
  nickname: string;
  totalScore: number;
  buildSeconds: number;
  surveyScore?: number;
  buildScore?: number;
  probes?: number;
  correctFaults?: number;
  createdAt: string;
}

const STORAGE_KEY = "iqmw.leaderboard-puzzles.scores.v1";

function loadRows(): ScoreRow[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRows(rows: ScoreRow[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-300)));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay() || 7;
  const start = startOfUtcDay(date);
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start;
}

function inWindow(row: ScoreRow, windowKey: WindowKey, now = new Date()): boolean {
  if (windowKey === "all-time") return true;
  const created = new Date(row.createdAt);
  if (windowKey === "daily") return created >= startOfUtcDay(now);
  return created >= startOfUtcWeek(now);
}

function compareRows(a: ScoreRow, b: ScoreRow): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (a.gameSlug === "hidden-foundations" || b.gameSlug === "hidden-foundations") {
    const faultDelta = (b.correctFaults || 0) - (a.correctFaults || 0);
    if (faultDelta) return faultDelta;
    const probeDelta = (a.probes || 0) - (b.probes || 0);
    if (probeDelta) return probeDelta;
  }
  if (a.buildSeconds !== b.buildSeconds) return a.buildSeconds - b.buildSeconds;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export const leaderboard = {
  submit(row: Omit<ScoreRow, "id" | "createdAt">): ScoreRow {
    const created: ScoreRow = {
      ...row,
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    const rows = loadRows();
    rows.push(created);
    saveRows(rows);
    return created;
  },

  rows(gameSlug: GameSlug, puzzleSeed: string, windowKey: WindowKey): ScoreRow[] {
    const bestByName = new Map<string, ScoreRow>();
    for (const row of loadRows()) {
      if (row.gameSlug !== gameSlug || row.puzzleSeed !== puzzleSeed || !inWindow(row, windowKey)) continue;
      const key = row.nickname.trim().toLowerCase();
      const existing = bestByName.get(key);
      if (!existing || compareRows(row, existing) < 0) bestByName.set(key, row);
    }
    return Array.from(bestByName.values()).sort(compareRows).slice(0, 20);
  },

  seedFor(gameSlug: GameSlug): string {
    return todaySeed(gameSlug);
  },
};
