import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const N = 4;
const TOWERS_MIN_SECONDS = 5;
const TOWERS_MAX_SECONDS = 600;
const TOWERS_BASE = 1000;
const TOWERS_TARGET_SECONDS = 60;
const TOWERS_TIME_PENALTY = 5;
const TOWERS_OVERTIME_PENALTY = 10;
const BUILD_MIN_SECONDS = 8;
const BUILD_MAX_SECONDS = 900;
const SURVEY_BASE = 500;
const PROBE_PENALTY = 20;
const CORRECT_FAULT_BONUS = 150;
const WRONG_MARKER_PENALTY = 75;
const BUILD_BASE = 1000;
const BUILD_TARGET_SECONDS = 90;
const BUILD_TIME_PENALTY = 4;
const BUILD_OVERTIME_PENALTY = 8;
const COLLAPSE_PENALTY = 150;

type GameSlug = "towers-speed-run" | "hidden-foundations";
type Grid = number[];

interface Fault {
  x: number;
  y: number;
}

interface Payload {
  gameSlug: GameSlug;
  puzzleSeed: string;
  nickname: string;
  buildSeconds: number;
  probes?: number;
  grid: Grid;
  markers?: string[];
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function reject(reason: string, status = 400): Response {
  return json(status, { error: reason });
}

function makeSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(rng: () => number, input: T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function countVisible(line: number[]): number {
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

function computeClues(grid: Grid): number[] {
  const clues: number[] = [];
  for (let c = 0; c < N; c += 1) clues.push(countVisible([0, 1, 2, 3].map((r) => grid[r * N + c])));
  for (let c = 0; c < N; c += 1) clues.push(countVisible([3, 2, 1, 0].map((r) => grid[r * N + c])));
  for (let r = 0; r < N; r += 1) clues.push(countVisible([0, 1, 2, 3].map((c) => grid[r * N + c])));
  for (let r = 0; r < N; r += 1) clues.push(countVisible([3, 2, 1, 0].map((c) => grid[r * N + c])));
  return clues;
}

function generateTowersPuzzle(seed: string, givenCount: number): { solution: Grid; clues: number[]; givens: Map<number, number> } {
  const rng = mulberry32(makeSeed(seed));
  const rows = shuffle(rng, [0, 1, 2, 3]);
  const cols = shuffle(rng, [0, 1, 2, 3]);
  const labels = shuffle(rng, [1, 2, 3, 4]);
  const solution: Grid = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) solution.push(labels[(rows[r] + cols[c]) % N]);
  }
  const givens = new Map<number, number>();
  for (const idx of shuffle(rng, Array.from({ length: N * N }, (_, i) => i))) {
    if (givens.size >= givenCount) break;
    givens.set(idx, solution[idx]);
  }
  return { solution, clues: computeClues(solution), givens };
}

function validateTowers(grid: Grid, clues: number[]): boolean {
  if (!Array.isArray(grid) || grid.length !== N * N || !grid.every((value) => Number.isInteger(value) && value >= 1 && value <= N)) return false;
  for (let r = 0; r < N; r += 1) {
    if (new Set(grid.slice(r * N, r * N + N)).size !== N) return false;
  }
  for (let c = 0; c < N; c += 1) {
    if (new Set([0, 1, 2, 3].map((r) => grid[r * N + c])).size !== N) return false;
  }
  return computeClues(grid).every((clue, idx) => clue === clues[idx]);
}

function generateFaults(seed: string, count = 2): Fault[] {
  const rng = mulberry32(makeSeed(`${seed}:faults`));
  return shuffle(
    rng,
    Array.from({ length: 16 }, (_, idx) => ({ x: (idx % 4) + 1, y: Math.floor(idx / 4) + 1 })),
  ).slice(0, count);
}

function faultKey(fault: Fault): string {
  return `${fault.x},${fault.y}`;
}

function scoreTowers(seconds: number): number {
  const safeSeconds = Math.max(TOWERS_MIN_SECONDS, Math.ceil(seconds));
  return Math.max(
    0,
    TOWERS_BASE -
      Math.min(safeSeconds, TOWERS_TARGET_SECONDS) * TOWERS_TIME_PENALTY -
      Math.max(0, safeSeconds - TOWERS_TARGET_SECONDS) * TOWERS_OVERTIME_PENALTY,
  );
}

function scoreHiddenSurvey(probes: number, correctMarkers: number, wrongMarkers: number): number {
  return Math.max(0, SURVEY_BASE - probes * PROBE_PENALTY + correctMarkers * CORRECT_FAULT_BONUS - wrongMarkers * WRONG_MARKER_PENALTY);
}

function scoreHiddenBuild(seconds: number, collapsedTowers: number): number {
  const safeSeconds = Math.max(BUILD_MIN_SECONDS, Math.ceil(seconds));
  return Math.max(
    0,
    BUILD_BASE -
      Math.min(safeSeconds, BUILD_TARGET_SECONDS) * BUILD_TIME_PENALTY -
      Math.max(0, safeSeconds - BUILD_TARGET_SECONDS) * BUILD_OVERTIME_PENALTY -
      collapsedTowers * COLLAPSE_PENALTY,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return reject("Method not allowed.", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return reject("Server is not configured.", 500);

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return reject("Malformed JSON payload.");
  }

  if (!["towers-speed-run", "hidden-foundations"].includes(payload.gameSlug)) return reject("Unknown game slug.");
  if (typeof payload.puzzleSeed !== "string" || !payload.puzzleSeed.startsWith(`${payload.gameSlug}:`)) return reject("Invalid puzzle seed.");
  if (typeof payload.nickname !== "string" || !/^[A-Za-z0-9 _-]{2,20}$/.test(payload.nickname.trim())) return reject("Invalid nickname.");
  if (!Number.isInteger(payload.buildSeconds)) return reject("Build time must be whole seconds.");

  let insertRow: Record<string, unknown>;

  if (payload.gameSlug === "towers-speed-run") {
    if (payload.buildSeconds < TOWERS_MIN_SECONDS || payload.buildSeconds > TOWERS_MAX_SECONDS) return reject("Implausible build time.");
    const puzzle = generateTowersPuzzle(payload.puzzleSeed, 4);
    if (!validateTowers(payload.grid, puzzle.clues)) return reject("Submitted grid does not solve this Towers puzzle.");
    for (const [idx, value] of puzzle.givens.entries()) {
      if (payload.grid[idx] !== value) return reject("Submitted grid changes a given tower.");
    }
    insertRow = {
      game_slug: payload.gameSlug,
      puzzle_seed: payload.puzzleSeed,
      nickname: payload.nickname.trim(),
      total_score: scoreTowers(payload.buildSeconds),
      build_seconds: payload.buildSeconds,
      raw_payload: payload,
      validation_version: "edge-v1",
    };
  } else {
    if (payload.buildSeconds < BUILD_MIN_SECONDS || payload.buildSeconds > BUILD_MAX_SECONDS) return reject("Implausible build time.");
    const probes = payload.probes;
    if (!Number.isInteger(probes) || probes < 0 || probes > 64) return reject("Invalid probe count.");
    const markers = Array.isArray(payload.markers) ? payload.markers : [];
    if (markers.length !== 2 || !markers.every((marker) => /^[1-4],[1-4]$/.test(marker))) return reject("Exactly two valid fault markers are required.");
    const markerSet = new Set(markers);
    if (markerSet.size !== 2) return reject("Fault markers must be unique.");

    const puzzle = generateTowersPuzzle(payload.puzzleSeed, 3);
    if (!validateTowers(payload.grid, puzzle.clues)) return reject("Submitted grid does not solve this Towers puzzle.");

    const faults = generateFaults(payload.puzzleSeed, 2);
    const faultSet = new Set(faults.map(faultKey));
    let correctMarkers = 0;
    for (const marker of markerSet) if (faultSet.has(marker)) correctMarkers += 1;
    if (correctMarkers === 2 && probes < 3) return reject("Probe count is too low for 2/2 fault accuracy.");
    const wrongMarkers = markerSet.size - correctMarkers;
    const collapsed = faults.filter((fault) => !markerSet.has(faultKey(fault))).length;
    const surveyScore = scoreHiddenSurvey(probes, correctMarkers, wrongMarkers);
    const buildScore = scoreHiddenBuild(payload.buildSeconds, collapsed);

    insertRow = {
      game_slug: payload.gameSlug,
      puzzle_seed: payload.puzzleSeed,
      nickname: payload.nickname.trim(),
      total_score: surveyScore + buildScore,
      survey_score: surveyScore,
      build_score: buildScore,
      build_seconds: payload.buildSeconds,
      probe_count: probes,
      faults_correct: correctMarkers,
      faults_total: 2,
      raw_payload: payload,
      validation_version: "edge-v1",
    };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.from("score_attempts").insert(insertRow).select("*").single();
  if (error) return reject(error.message, 500);
  return json(200, { row: data });
});
