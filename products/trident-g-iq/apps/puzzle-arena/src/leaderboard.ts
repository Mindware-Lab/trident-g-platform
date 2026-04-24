import type { Grid } from "./puzzles/towers";
import { todaySeed } from "./random";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

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

export interface ScoreSubmission extends Omit<ScoreRow, "id" | "createdAt"> {
  grid: Grid;
  markers?: string[];
}

const STORAGE_KEY = "iqmw.leaderboard-puzzles.scores.v1";
const remoteRows = new Map<string, ScoreRow[]>();
const fetched = new Set<string>();
const inFlight = new Map<string, Promise<boolean>>();

function cacheKey(gameSlug: GameSlug, puzzleSeed: string, windowKey: WindowKey): string {
  return `${gameSlug}|${puzzleSeed}|${windowKey}`;
}

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

function localSubmit(row: Omit<ScoreRow, "id" | "createdAt">): ScoreRow {
  const created: ScoreRow = {
    ...row,
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  };
  const rows = loadRows();
  rows.push(created);
  saveRows(rows);
  return created;
}

function localRows(gameSlug: GameSlug, puzzleSeed: string, windowKey: WindowKey): ScoreRow[] {
  const bestByName = new Map<string, ScoreRow>();
  for (const row of loadRows()) {
    if (row.gameSlug !== gameSlug || row.puzzleSeed !== puzzleSeed || !inWindow(row, windowKey)) continue;
    const key = row.nickname.trim().toLowerCase();
    const existing = bestByName.get(key);
    if (!existing || compareRows(row, existing) < 0) bestByName.set(key, row);
  }
  return Array.from(bestByName.values()).sort(compareRows).slice(0, 20);
}

function fromRemote(row: Record<string, unknown>): ScoreRow {
  return {
    id: String(row.id),
    gameSlug: row.game_slug as GameSlug,
    puzzleSeed: String(row.puzzle_seed),
    nickname: String(row.nickname),
    totalScore: Number(row.total_score),
    surveyScore: row.survey_score === null || row.survey_score === undefined ? undefined : Number(row.survey_score),
    buildScore: row.build_score === null || row.build_score === undefined ? undefined : Number(row.build_score),
    buildSeconds: Number(row.build_seconds),
    probes: row.probe_count === null || row.probe_count === undefined ? undefined : Number(row.probe_count),
    correctFaults: row.faults_correct === null || row.faults_correct === undefined ? undefined : Number(row.faults_correct),
    createdAt: String(row.created_at),
  };
}

export const leaderboard = {
  async submit(row: ScoreSubmission): Promise<ScoreRow> {
    if (!isSupabaseConfigured || !supabase) {
      const { grid: _grid, markers: _markers, ...scoreRow } = row;
      return localSubmit(scoreRow);
    }
    const { data, error } = await supabase.functions.invoke("submit-score", {
      body: row,
    });
    if (error) throw new Error(error.message);
    if (!data?.row) throw new Error("Score submission did not return a row.");
    return fromRemote(data.row);
  },

  rows(gameSlug: GameSlug, puzzleSeed: string, windowKey: WindowKey): ScoreRow[] {
    const key = cacheKey(gameSlug, puzzleSeed, windowKey);
    return remoteRows.get(key) || localRows(gameSlug, puzzleSeed, windowKey);
  },

  async refreshRows(gameSlug: GameSlug, puzzleSeed: string, windowKey: WindowKey, force = false): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    const key = cacheKey(gameSlug, puzzleSeed, windowKey);
    if (!force && fetched.has(key)) return false;
    const current = inFlight.get(key);
    if (current) return current;

    const request = (async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_game_slug: gameSlug,
        p_puzzle_seed: puzzleSeed,
        p_window: windowKey,
        p_limit: 20,
      });
      inFlight.delete(key);
      if (error) throw new Error(error.message);
      const nextRows = ((data || []) as Record<string, unknown>[]).map((row) => fromRemote(row));
      const before = JSON.stringify(remoteRows.get(key) || []);
      const after = JSON.stringify(nextRows);
      remoteRows.set(key, nextRows);
      fetched.add(key);
      return before !== after;
    })().catch((error: unknown) => {
      inFlight.delete(key);
      console.warn("Leaderboard refresh failed", error);
      return false;
    });

    inFlight.set(key, request);
    return request;
  },

  seedFor(gameSlug: GameSlug): string {
    return todaySeed(gameSlug);
  },
};
