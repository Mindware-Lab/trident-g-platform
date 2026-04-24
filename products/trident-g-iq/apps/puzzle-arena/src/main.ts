import "./styles.css";
import { audio } from "./audio";
import { CompletionCtas, DiscordPanel, GameModeSwitch, GameShell, HookPanel, InstructionsPanel, LeaderboardPanel, NicknameForm, ResultReveal, ScoreChip, TimerChip, escapeHtml } from "./components";
import { leaderboard, type ScoreRow, type WindowKey } from "./leaderboard";
import { generateFaults, faultKey, traceProbe, type Fault, type ProbeResult } from "./puzzles/blackbox";
import { N, generateTowersPuzzle, validateTowers, type Grid, type TowersPuzzle } from "./puzzles/towers";
import {
  BUILD_MIN_SECONDS,
  BUILD_TARGET_SECONDS,
  TOWERS_MIN_SECONDS,
  TOWERS_TARGET_SECONDS,
  formatTime,
  isSafeNickname,
  scoreHiddenBuild,
  scoreHiddenSurvey,
  scoreTowers,
} from "./scoring";

type Mode = "towers" | "hidden";
type HiddenPhase = "survey" | "build" | "reveal";

interface ProbeEntry {
  result: ProbeResult;
  number?: number;
}

interface TowersState {
  puzzle: TowersPuzzle;
  grid: Grid;
  selected: number | null;
  startedAt: number | null;
  elapsed: number;
  completed: boolean;
  revealedSolution: boolean;
  hasInteracted: boolean;
  submittedRowId: string | null;
  submitError: string;
}

interface HiddenResult {
  correctMarkers: number;
  wrongMarkers: number;
  collapsed: Set<number>;
  surveyScore: number;
  buildScore: number;
  totalScore: number;
}

interface HiddenState {
  puzzle: TowersPuzzle;
  faults: Fault[];
  phase: HiddenPhase;
  markers: Set<string>;
  probes: Map<number, ProbeEntry>;
  probeShots: number;
  probeNumbers: number;
  buildGrid: Grid;
  selected: number | null;
  buildStartedAt: number | null;
  buildElapsed: number;
  result: HiddenResult | null;
  revealedSolution: boolean;
  hasInteracted: boolean;
  submittedRowId: string | null;
  submitError: string;
}

interface AppState {
  mode: Mode;
  windowKey: WindowKey;
  towers: TowersState;
  hidden: HiddenState;
}

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root");
const appRoot = root;

function blankGrid(puzzle: TowersPuzzle): Grid {
  const grid = Array(N * N).fill(0);
  for (const [idx, value] of puzzle.givens.entries()) grid[idx] = value;
  return grid;
}

function newTowersState(): TowersState {
  const puzzle = generateTowersPuzzle(leaderboard.seedFor("towers-speed-run"), 4);
  return {
    puzzle,
    grid: blankGrid(puzzle),
    selected: null,
    startedAt: null,
    elapsed: 0,
    completed: false,
    revealedSolution: false,
    hasInteracted: false,
    submittedRowId: null,
    submitError: "",
  };
}

function newHiddenState(): HiddenState {
  const puzzle = generateTowersPuzzle(leaderboard.seedFor("hidden-foundations"), 3);
  return {
    puzzle,
    faults: generateFaults(puzzle.seed, 2),
    phase: "survey",
    markers: new Set(),
    probes: new Map(),
    probeShots: 0,
    probeNumbers: 1,
    buildGrid: blankGrid(puzzle),
    selected: null,
    buildStartedAt: null,
    buildElapsed: 0,
    result: null,
    revealedSolution: false,
    hasInteracted: false,
    submittedRowId: null,
    submitError: "",
  };
}

let state: AppState = {
  mode: "towers",
  windowKey: "daily",
  towers: newTowersState(),
  hidden: newHiddenState(),
};

function secondsSince(startedAt: number | null, fallback: number): number {
  if (!startedAt) return fallback;
  return Math.ceil((Date.now() - startedAt) / 1000);
}

function clueCell(value: number, clueIndex: number, validation: ReturnType<typeof validateTowers>): string {
  const ok = validation.clueSatisfied.has(clueIndex);
  const bad = validation.clueErrors.has(clueIndex);
  const dirs = ["↓", "↑", "→", "←"];
  const dir = dirs[Math.floor(clueIndex / N)];
  return `<div class="clue ${ok ? "is-ok" : ""} ${bad ? "is-bad" : ""}"><small>${dir}</small><strong>${value}</strong></div>`;
}

function TowerCell(args: {
  idx: number;
  value: number;
  selected: boolean;
  given: boolean;
  error: boolean;
  collapsed?: boolean;
  reinforced?: boolean;
  trueFault?: boolean;
  mode: "towers" | "hidden";
}): string {
  const value = args.value;
  return `
    <button class="tower-cell h${value || 0} ${args.selected ? "is-selected" : ""} ${args.given ? "is-given" : ""} ${args.error ? "is-error" : ""} ${args.collapsed ? "is-collapsed" : ""} ${args.reinforced ? "is-reinforced" : ""} ${args.trueFault ? "is-true-fault" : ""}"
      data-action="${args.mode}-select-cell" data-cell="${args.idx}" type="button">
      ${value ? `<span class="height-fill"></span><strong>${value}</strong>` : `<span class="empty-dot"></span>`}
    </button>
  `;
}

function towerBoard(props: {
  puzzle: TowersPuzzle;
  grid: Grid;
  selected: number | null;
  mode: "towers" | "hidden";
  collapsed?: Set<number>;
  reinforced?: Set<string>;
  trueFaults?: Set<string>;
}): string {
  const validation = validateTowers(props.grid, props.puzzle.clues);
  const rows: string[] = [];
  for (let row = 0; row < N + 2; row += 1) {
    const cells: string[] = [];
    for (let col = 0; col < N + 2; col += 1) {
      const corner = (row === 0 || row === N + 1) && (col === 0 || col === N + 1);
      if (corner) {
        cells.push(`<div class="corner"></div>`);
      } else if (row === 0) {
        cells.push(clueCell(props.puzzle.clues[col - 1], col - 1, validation));
      } else if (row === N + 1) {
        cells.push(clueCell(props.puzzle.clues[N + col - 1], N + col - 1, validation));
      } else if (col === 0) {
        cells.push(clueCell(props.puzzle.clues[2 * N + row - 1], 2 * N + row - 1, validation));
      } else if (col === N + 1) {
        cells.push(clueCell(props.puzzle.clues[3 * N + row - 1], 3 * N + row - 1, validation));
      } else {
        const idx = (row - 1) * N + (col - 1);
        const key = `${col},${row}`;
        cells.push(
          TowerCell({
            idx,
            value: props.grid[idx],
            selected: props.selected === idx,
            given: props.puzzle.givens.has(idx),
            error: validation.rowErrors.has(idx) || validation.colErrors.has(idx),
            collapsed: props.collapsed?.has(idx),
            reinforced: props.reinforced?.has(key),
            trueFault: props.trueFaults?.has(key),
            mode: props.mode,
          }),
        );
      }
    }
    rows.push(`<div class="board-row">${cells.join("")}</div>`);
  }
  return `<div class="tower-board">${rows.join("")}</div>`;
}

function numberPad(mode: "towers" | "hidden", disabled = false): string {
  return `
    <div class="number-pad">
      ${[1, 2, 3, 4].map((n) => `<button class="num-btn h${n}" data-action="${mode}-enter" data-number="${n}" ${disabled ? "disabled" : ""} type="button">${n}</button>`).join("")}
      <button class="num-btn clear" data-action="${mode}-clear" ${disabled ? "disabled" : ""} type="button">⌫</button>
    </div>
  `;
}

function renderTowers(): string {
  const game = state.towers;
  const seconds = secondsSince(game.startedAt, game.elapsed);
  const validation = validateTowers(game.grid, game.puzzle.clues);
  const score = validation.valid ? scoreTowers(seconds) : scoreTowers(seconds);
  const rows = leaderboard.rows("towers-speed-run", game.puzzle.seed, state.windowKey);
  const sidebarExpanded = game.hasInteracted || game.completed || Boolean(game.submittedRowId);
  const finishMessage = validation.valid
    ? game.revealedSolution
      ? "Solution shown for practice. Start a new run for leaderboard scoring."
      : "Ready to finish."
    : validation.complete
      ? "Complete grid, but red clues or duplicate cells still need fixing."
      : "Fill every non-given square, then finish.";
  const finishLabel = validation.valid ? "Finish" : validation.complete ? "Fix red clues" : "Finish";
  const result = game.completed
    ? ResultReveal({
        title: "Speed run complete",
        message: "Valid solution logged locally. Post a nickname to highlight your leaderboard row.",
        chips:
          ScoreChip("Score", score, "accent-cyan") +
          ScoreChip("Time", formatTime(Math.max(TOWERS_MIN_SECONDS, seconds)), seconds > TOWERS_TARGET_SECONDS ? "accent-red" : "accent-green") +
          ScoreChip("Seed", game.puzzle.seed.split(":").pop() || "daily"),
        form: NicknameForm(game.submitError) + CompletionCtas(),
      })
    : "";

  return GameShell({
    activeGame: "towers",
    title: "Towers 4x4 Speed Run",
    subtitle: "Daily easy grid. Fill every row and column with 1-4 exactly once.",
    audioOn: audio.isEnabled(),
    body: `
      <main class="game-grid">
        <section class="play-column">
          ${GameModeSwitch("towers")}
          <div class="play-panel">
            <div class="status-row">
              ${TimerChip(seconds, TOWERS_TARGET_SECONDS)}
              ${ScoreChip("Live score", score, "accent-cyan")}
              ${ScoreChip("Clues", `${validation.clueSatisfied.size}/16`, validation.clueErrors.size ? "accent-red" : "accent-green")}
            </div>
            ${towerBoard({ puzzle: game.puzzle, grid: game.grid, selected: game.selected, mode: "towers" })}
            ${numberPad("towers", game.completed)}
            <div class="action-row">
              <button class="ghost-btn" data-action="reset-towers" type="button">New run</button>
              <button class="ghost-btn" data-action="solve-towers" type="button">Show solution</button>
              <button class="primary-btn" data-action="finish-towers" ${validation.valid && !game.revealedSolution ? "" : "disabled"} type="button">${finishLabel}</button>
            </div>
            <p class="validation-note ${validation.valid && !game.revealedSolution ? "is-ok" : validation.complete ? "is-bad" : ""}">${finishMessage}</p>
            ${result}
          </div>
        </section>
        <aside class="side-panel">
          ${LeaderboardPanel({ rows, windowKey: state.windowKey, activeRowId: game.submittedRowId, game: "towers", expanded: sidebarExpanded })}
          ${HookPanel()}
          ${DiscordPanel()}
          ${InstructionsPanel({ game: "towers", compact: sidebarExpanded })}
        </aside>
      </main>
    `,
  });
}

function ProbeCell(args: { rangeNo: number; entry?: ProbeEntry; firedPair?: boolean }): string {
  const entry = args.entry;
  let label = "";
  let cls = "";
  if (entry) {
    if (entry.result === "H") {
      label = "H";
      cls = "is-hit";
    } else if (entry.result === "R") {
      label = "R";
      cls = "is-reflect";
    } else {
      label = String(entry.number || "");
      cls = "is-pair";
    }
  } else {
    label = "•";
  }
  return `<button class="probe-cell ${cls} ${entry ? "was-fired" : ""} ${args.firedPair ? "is-pair-hover" : ""}" data-action="fire-probe" data-probe="${args.rangeNo}" type="button">${label}</button>`;
}

function probeBoard(): string {
  const game = state.hidden;
  const rows: string[] = [];
  const entries = game.probes;
  for (let row = 0; row < 6; row += 1) {
    const cells: string[] = [];
    for (let col = 0; col < 6; col += 1) {
      const corner = (row === 0 || row === 5) && (col === 0 || col === 5);
      const arena = row >= 1 && row <= 4 && col >= 1 && col <= 4;
      let rangeNo: number | null = null;
      if (!corner && row === 0) rangeNo = col - 1;
      if (!corner && col === 5) rangeNo = 4 + row - 1;
      if (!corner && row === 5) rangeNo = 8 + (4 - col);
      if (!corner && col === 0) rangeNo = 12 + (4 - row);

      if (corner) cells.push(`<div class="corner"></div>`);
      else if (arena) {
        const key = `${col},${row}`;
        const marked = game.markers.has(key);
        const trueFault = game.phase === "reveal" && game.faults.some((f) => faultKey(f) === key);
        const saved = game.phase === "reveal" && marked && trueFault;
        const missed = game.phase === "reveal" && !marked && trueFault;
        cells.push(`
          <button class="foundation-cell ${marked ? "is-marked" : ""} ${trueFault ? "is-fault" : ""} ${saved ? "is-saved" : ""} ${missed ? "is-missed" : ""}" data-action="toggle-marker" data-cell-key="${key}" ${game.phase !== "survey" ? "disabled" : ""} type="button">
            ${marked ? "◆" : ""}
          </button>
        `);
      } else if (rangeNo !== null) {
        cells.push(ProbeCell({ rangeNo, entry: entries.get(rangeNo) }));
      }
    }
    rows.push(`<div class="board-row">${cells.join("")}</div>`);
  }
  return `<div class="probe-board">${rows.join("")}</div>`;
}

function finaliseHidden(): void {
  const game = state.hidden;
  const faultSet = new Set(game.faults.map(faultKey));
  let correctMarkers = 0;
  let wrongMarkers = 0;
  for (const marker of game.markers) {
    if (faultSet.has(marker)) correctMarkers += 1;
    else wrongMarkers += 1;
  }
  const collapsed = new Set<number>();
  for (const fault of game.faults) {
    const key = faultKey(fault);
    if (!game.markers.has(key)) collapsed.add((fault.y - 1) * N + (fault.x - 1));
  }
  const buildSeconds = Math.max(BUILD_MIN_SECONDS, secondsSince(game.buildStartedAt, game.buildElapsed));
  const surveyScore = scoreHiddenSurvey(game.probeShots, correctMarkers, wrongMarkers);
  const buildScore = scoreHiddenBuild(buildSeconds, collapsed.size);
  game.result = {
    correctMarkers,
    wrongMarkers,
    collapsed,
    surveyScore,
    buildScore,
    totalScore: surveyScore + buildScore,
  };
  game.phase = "reveal";
  audio.cue(collapsed.size ? "collapse" : "ok");
}

function renderHidden(): string {
  const game = state.hidden;
  const buildSeconds = secondsSince(game.buildStartedAt, game.buildElapsed);
  const validation = validateTowers(game.buildGrid, game.puzzle.clues);
  const faultSet = new Set(game.faults.map(faultKey));
  const result = game.result;
  const rows = leaderboard.rows("hidden-foundations", game.puzzle.seed, state.windowKey);
  const sidebarExpanded = game.hasInteracted || game.phase !== "survey" || Boolean(game.submittedRowId);
  const buildMessage = validation.valid
    ? game.revealedSolution
      ? "Solution shown for practice. Start a new site for leaderboard scoring."
      : "Ready to reveal foundations."
    : validation.complete
      ? "Complete grid, but red clues or duplicate cells still need fixing."
      : "Complete the Towers grid before revealing foundations.";
  const revealLabel = validation.valid ? "Reveal foundations" : validation.complete ? "Fix red clues" : "Reveal foundations";
  const reveal = result
    ? ResultReveal({
        title: result.collapsed.size ? "Foundations revealed" : "Clean build",
        message: result.collapsed.size ? "Missed faults collapsed their tower cells. The Towers solve still earns build credit." : "Both foundations were reinforced before construction.",
        chips:
          ScoreChip("Total", result.totalScore, "accent-cyan") +
          ScoreChip("Survey", result.surveyScore, "accent-blue") +
          ScoreChip("Build", result.buildScore, "accent-green") +
          ScoreChip("Faults", `${result.correctMarkers}/2`, result.correctMarkers === 2 ? "accent-green" : "accent-red"),
        form: NicknameForm(game.submitError) + CompletionCtas(),
      })
    : "";

  const body =
    game.phase === "survey"
      ? `
        <section class="play-column">
          ${GameModeSwitch("hidden")}
          <div class="play-panel">
            <div class="status-row">
              ${ScoreChip("Probes", game.probeShots, "accent-blue")}
              ${ScoreChip("Cost", `-${game.probeShots * 20}`, "accent-red")}
              ${ScoreChip("Marked", `${game.markers.size}/2`, game.markers.size === 2 ? "accent-green" : "")}
            </div>
            ${probeBoard()}
            <div class="action-row">
              <button class="ghost-btn" data-action="reset-hidden" type="button">New site</button>
              <button class="ghost-btn" data-action="solve-hidden" type="button">Show solution</button>
              <button class="primary-btn" data-action="start-building" ${game.markers.size === 2 ? "" : "disabled"} type="button">Start building</button>
            </div>
            <p class="hint">Fire perimeter probes, mark two suspected hidden foundation faults, then commit and build.</p>
          </div>
        </section>
      `
      : `
        <section class="play-column">
          ${GameModeSwitch("hidden")}
          <div class="play-panel">
            <div class="status-row">
              ${TimerChip(buildSeconds, BUILD_TARGET_SECONDS)}
              ${ScoreChip("Probes", game.probeShots, "accent-blue")}
              ${ScoreChip("Clues", `${validation.clueSatisfied.size}/16`, validation.clueErrors.size ? "accent-red" : "accent-green")}
            </div>
            ${towerBoard({
              puzzle: game.puzzle,
              grid: game.buildGrid,
              selected: game.selected,
              mode: "hidden",
              collapsed: result?.collapsed,
              reinforced: game.markers,
              trueFaults: game.phase === "reveal" ? faultSet : undefined,
            })}
            ${numberPad("hidden", game.phase === "reveal")}
            <div class="action-row">
              <button class="ghost-btn" data-action="reset-hidden" type="button">New site</button>
              <button class="ghost-btn" data-action="solve-hidden" type="button">Show solution</button>
              <button class="primary-btn" data-action="finish-hidden" ${validation.valid && game.phase === "build" && !game.revealedSolution ? "" : "disabled"} type="button">${revealLabel}</button>
            </div>
            <p class="validation-note ${validation.valid && !game.revealedSolution ? "is-ok" : validation.complete ? "is-bad" : ""}">${buildMessage}</p>
            ${reveal}
          </div>
        </section>
      `;

  return GameShell({
    activeGame: "hidden",
    title: "Hidden Foundations 4x4",
    subtitle: "Survey hidden faults, reinforce two cells, then build the Towers grid.",
    audioOn: audio.isEnabled(),
    body: `
      <main class="game-grid">
        ${body}
        <aside class="side-panel">
          ${LeaderboardPanel({ rows, windowKey: state.windowKey, activeRowId: game.submittedRowId, game: "hidden", expanded: sidebarExpanded })}
          ${HookPanel()}
          ${DiscordPanel()}
          ${InstructionsPanel({ game: "hidden", compact: sidebarExpanded })}
        </aside>
      </main>
    `,
  });
}

function render(): void {
  appRoot.innerHTML = state.mode === "towers" ? renderTowers() : renderHidden();
}

function enterTowerValue(mode: Mode, value: number): void {
  const game = mode === "towers" ? state.towers : state.hidden;
  const puzzle = game.puzzle;
  const selected = game.selected;
  if (selected === null || puzzle.givens.has(selected)) return;
  if (mode === "hidden" && state.hidden.phase !== "build") return;
  if (mode === "towers" && state.towers.completed) return;

  if (mode === "towers" && !state.towers.startedAt) state.towers.startedAt = Date.now();
  if (mode === "hidden" && !state.hidden.buildStartedAt) state.hidden.buildStartedAt = Date.now();
  if (mode === "towers") state.towers.hasInteracted = true;
  else state.hidden.hasInteracted = true;

  if (mode === "towers") state.towers.grid[selected] = value;
  else state.hidden.buildGrid[selected] = value;
  audio.cue(value ? "place" : "clear");
  const currentGrid = mode === "towers" ? state.towers.grid : state.hidden.buildGrid;
  const validation = validateTowers(currentGrid, puzzle.clues);
  if (validation.clueErrors.size || validation.rowErrors.size || validation.colErrors.size) audio.cue("bad");
  else if (validation.clueSatisfied.size) audio.cue("ok");
  render();
}

appRoot.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const actionEl = target.closest<HTMLElement>("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action || "";

  if (action === "toggle-audio") {
    audio.setEnabled(!audio.isEnabled());
    render();
    return;
  }
  if (action === "mode-towers") {
    state.mode = "towers";
    render();
    return;
  }
  if (action === "mode-hidden") {
    state.mode = "hidden";
    render();
    return;
  }
  if (action.startsWith("window-")) {
    state.windowKey = action.replace("window-", "") as WindowKey;
    render();
    return;
  }
  if (action === "reset-towers") {
    state.towers = newTowersState();
    render();
    return;
  }
  if (action === "solve-towers") {
    state.towers.grid = state.towers.puzzle.solution.slice();
    state.towers.revealedSolution = true;
    state.towers.completed = false;
    state.towers.hasInteracted = true;
    audio.cue("submit");
    render();
    return;
  }
  if (action === "reset-hidden") {
    state.hidden = newHiddenState();
    render();
    return;
  }
  if (action === "solve-hidden") {
    state.hidden.buildGrid = state.hidden.puzzle.solution.slice();
    state.hidden.revealedSolution = true;
    state.hidden.phase = "reveal";
    state.hidden.result = null;
    state.hidden.hasInteracted = true;
    audio.cue("submit");
    render();
    return;
  }
  if (action === "towers-select-cell") {
    state.towers.selected = Number(actionEl.dataset.cell);
    render();
    return;
  }
  if (action === "hidden-select-cell") {
    state.hidden.selected = Number(actionEl.dataset.cell);
    render();
    return;
  }
  if (action === "towers-enter") {
    enterTowerValue("towers", Number(actionEl.dataset.number));
    return;
  }
  if (action === "hidden-enter") {
    enterTowerValue("hidden", Number(actionEl.dataset.number));
    return;
  }
  if (action === "towers-clear") {
    enterTowerValue("towers", 0);
    return;
  }
  if (action === "hidden-clear") {
    enterTowerValue("hidden", 0);
    return;
  }
  if (action === "finish-towers") {
    const seconds = Math.max(TOWERS_MIN_SECONDS, secondsSince(state.towers.startedAt, state.towers.elapsed));
    state.towers.elapsed = seconds;
    state.towers.completed = true;
    audio.cue("submit");
    render();
    return;
  }
  if (action === "fire-probe") {
    const rn = Number(actionEl.dataset.probe);
    if (state.hidden.phase !== "survey" || state.hidden.probes.has(rn) || rn < 0 || rn >= 16) return;
    const result = traceProbe(state.hidden.faults, rn);
    state.hidden.hasInteracted = true;
    const number = typeof result === "number" ? state.hidden.probeNumbers : undefined;
    state.hidden.probes.set(rn, { result, number });
    if (typeof result === "number") {
      state.hidden.probes.set(result, { result: rn, number });
      state.hidden.probeNumbers += 1;
      audio.cue("paired");
    } else {
      audio.cue(result === "H" ? "hit" : "reflect");
    }
    state.hidden.probeShots += 1;
    render();
    return;
  }
  if (action === "toggle-marker") {
    if (state.hidden.phase !== "survey") return;
    const key = actionEl.dataset.cellKey || "";
    if (state.hidden.markers.has(key)) {
      state.hidden.markers.delete(key);
      audio.cue("clear");
    } else if (state.hidden.markers.size < 2) {
      state.hidden.markers.add(key);
      audio.cue("place");
    }
    state.hidden.hasInteracted = true;
    render();
    return;
  }
  if (action === "start-building") {
    if (state.hidden.markers.size !== 2) return;
    state.hidden.phase = "build";
    state.hidden.hasInteracted = true;
    state.hidden.buildStartedAt = Date.now();
    audio.cue("submit");
    render();
    return;
  }
  if (action === "finish-hidden") {
    if (state.hidden.phase !== "build" || !validateTowers(state.hidden.buildGrid, state.hidden.puzzle.clues).valid) return;
    state.hidden.buildElapsed = Math.max(BUILD_MIN_SECONDS, secondsSince(state.hidden.buildStartedAt, state.hidden.buildElapsed));
    finaliseHidden();
    render();
  }
});

appRoot.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const data = new FormData(form);
  const nickname = String(data.get("nickname") || "").trim();
  if (!isSafeNickname(nickname)) {
    if (state.mode === "towers") state.towers.submitError = "Use 2-20 letters, numbers, spaces, hyphen, or underscore.";
    else state.hidden.submitError = "Use 2-20 letters, numbers, spaces, hyphen, or underscore.";
    render();
    return;
  }

  let row: ScoreRow;
  if (state.mode === "towers") {
    const seconds = Math.max(TOWERS_MIN_SECONDS, state.towers.elapsed || secondsSince(state.towers.startedAt, 0));
    row = leaderboard.submit({
      gameSlug: "towers-speed-run",
      puzzleSeed: state.towers.puzzle.seed,
      nickname,
      totalScore: scoreTowers(seconds),
      buildSeconds: seconds,
    });
    state.towers.submittedRowId = row.id;
    state.towers.submitError = "";
  } else {
    const result = state.hidden.result;
    if (!result) return;
    row = leaderboard.submit({
      gameSlug: "hidden-foundations",
      puzzleSeed: state.hidden.puzzle.seed,
      nickname,
      totalScore: result.totalScore,
      surveyScore: result.surveyScore,
      buildScore: result.buildScore,
      probes: state.hidden.probeShots,
      correctFaults: result.correctMarkers,
      buildSeconds: Math.max(BUILD_MIN_SECONDS, state.hidden.buildElapsed),
    });
    state.hidden.submittedRowId = row.id;
    state.hidden.submitError = "";
  }
  localStorage.setItem("iqmw.puzzle.nickname", escapeHtml(nickname));
  audio.cue("submit");
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key >= "1" && event.key <= "4") {
    enterTowerValue(state.mode, Number(event.key));
  } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    enterTowerValue(state.mode, 0);
  }
});

setInterval(() => {
  const towersRunning = state.mode === "towers" && state.towers.startedAt && !state.towers.completed;
  const hiddenRunning = state.mode === "hidden" && state.hidden.phase === "build" && state.hidden.buildStartedAt;
  if (!towersRunning && !hiddenRunning) return;
  if (towersRunning) state.towers.elapsed = secondsSince(state.towers.startedAt, state.towers.elapsed);
  if (hiddenRunning) state.hidden.buildElapsed = secondsSince(state.hidden.buildStartedAt, state.hidden.buildElapsed);
  render();
}, 500);

render();
