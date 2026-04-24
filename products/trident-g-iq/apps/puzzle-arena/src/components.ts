import type { ScoreRow, WindowKey } from "./leaderboard";
import { formatTime } from "./scoring";
import { DISCORD_INVITE_URL, IQMINDWARE_HOME_URL } from "./siteLinks";

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function DiscordIcon(): string {
  return `
    <svg class="discord-icon" viewBox="0 0 127.14 96.36" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.7 1.76 1.38 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.15c2.64-27.35-4.51-51.08-18.9-72.14ZM42.45 65.69c-6.28 0-11.46-5.74-11.46-12.79s5.07-12.8 11.46-12.8c6.42 0 11.57 5.79 11.46 12.8 0 7.05-5.08 12.79-11.46 12.79Zm42.24 0c-6.28 0-11.46-5.74-11.46-12.79s5.07-12.8 11.46-12.8c6.42 0 11.57 5.79 11.46 12.8 0 7.05-5.04 12.79-11.46 12.79Z"/>
    </svg>
  `;
}

export function GameShell(props: {
  activeGame: string;
  title: string;
  subtitle: string;
  audioOn: boolean;
  body: string;
}): string {
  return `
    <div class="arena-shell">
      <div class="neural-backdrop" aria-hidden="true">
        <span style="--x: 8%; --y: 20%; --s: 4px;"></span>
        <span style="--x: 18%; --y: 62%; --s: 3px;"></span>
        <span style="--x: 31%; --y: 36%; --s: 5px;"></span>
        <span style="--x: 45%; --y: 72%; --s: 3px;"></span>
        <span style="--x: 61%; --y: 28%; --s: 4px;"></span>
        <span style="--x: 74%; --y: 58%; --s: 5px;"></span>
        <span style="--x: 88%; --y: 18%; --s: 3px;"></span>
        <span style="--x: 92%; --y: 78%; --s: 4px;"></span>
      </div>
      <header class="topbar">
        <div class="brand-block">
          <div class="brand-mark">
            <img class="brand-icon" src="/trident-g-icon.svg" alt="" aria-hidden="true" />
          </div>
          <div>
            <div class="eyebrow">IQMindware Puzzle Arena</div>
            <h1>${escapeHtml(props.title)}</h1>
            <p>${escapeHtml(props.subtitle)}</p>
          </div>
        </div>
        <div class="top-actions">
          <button class="icon-btn ${props.audioOn ? "is-active" : ""}" data-action="toggle-audio" type="button" title="Toggle audio">
            ${props.audioOn ? "Audio on" : "Audio off"}
          </button>
        </div>
      </header>
      ${props.body}
    </div>
  `;
}

export function GameModeSwitch(activeGame: string): string {
  return `
    <div class="game-switch" aria-label="Puzzle selection">
      <button class="mode-btn mode-towers ${activeGame === "towers" ? "is-active" : ""}" data-action="mode-towers" type="button">Towers</button>
      <button class="mode-btn mode-hidden ${activeGame === "hidden" ? "is-active" : ""}" data-action="mode-hidden" type="button">Hidden</button>
    </div>
  `;
}

export function ScoreChip(label: string, value: string | number, accent = ""): string {
  return `<div class="score-chip ${accent}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

export function TimerChip(seconds: number, target: number): string {
  const hot = seconds > target ? "is-hot" : seconds > target * 0.75 ? "is-warm" : "";
  return `<div class="timer-chip ${hot}"><span>Time</span><strong>${formatTime(seconds)}</strong></div>`;
}

export function LeaderboardPanel(props: {
  rows: ScoreRow[];
  windowKey: WindowKey;
  activeRowId?: string | null;
  game: "towers" | "hidden";
  expanded?: boolean;
}): string {
  const tabs: WindowKey[] = ["daily", "weekly", "all-time"];
  const headers =
    props.game === "hidden"
      ? `<tr><th>#</th><th>Name</th><th>Total</th><th>Survey</th><th>Build</th><th>Probes</th><th>Faults</th></tr>`
      : `<tr><th>#</th><th>Name</th><th>Score</th><th>Time</th></tr>`;
  const visibleRows = props.rows.slice(0, props.expanded ? 20 : 5);
  const rows = visibleRows
    .map((row, index) => {
      const mine = row.id === props.activeRowId ? "is-player" : "";
      if (props.game === "hidden") {
        return `<tr class="${mine}"><td>${index + 1}</td><td>${escapeHtml(row.nickname)}</td><td>${row.totalScore}</td><td>${row.surveyScore || 0}</td><td>${row.buildScore || 0}</td><td>${row.probes || 0}</td><td>${row.correctFaults || 0}/2</td></tr>`;
      }
      return `<tr class="${mine}"><td>${index + 1}</td><td>${escapeHtml(row.nickname)}</td><td>${row.totalScore}</td><td>${formatTime(row.buildSeconds)}</td></tr>`;
    })
    .join("");

  return `
    <section class="leaderboard-panel ${props.expanded ? "is-expanded" : ""}">
      <div class="panel-head">
        <div>
          <h2>Leaderboard</h2>
          <p>Best valid attempt per nickname for this seed.</p>
        </div>
        <div class="tabs">
          ${tabs
            .map((tab) => `<button class="${tab === props.windowKey ? "is-active" : ""}" data-action="window-${tab}" type="button">${tab === "all-time" ? "All" : tab}</button>`)
            .join("")}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>${headers}</thead>
          <tbody>${rows || `<tr><td colspan="${props.game === "hidden" ? 7 : 4}">No scores yet.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function InstructionsPanel(props: { game: "towers" | "hidden"; compact?: boolean; open?: boolean }): string {
  const towersBasics = `
    <li>Fill every square with a tower height from 1 to 4.</li>
    <li>Each row and column must contain 1, 2, 3, and 4 exactly once.</li>
    <li>Edge clues show how many towers are visible from that direction. Taller towers hide shorter towers behind them.</li>
    <li>Select a square, then use the number pad or keyboard. Backspace clears a selected editable square.</li>
  `;

  const hiddenBasics = `
    <li>Survey first: fire probes from the edge to infer two hidden foundation faults.</li>
    <li><strong>H</strong> means the probe hit a fault. <strong>R</strong> means it reflected. Matching numbers show an entry/exit pair.</li>
    <li>Mark exactly two suspected fault cells. Each fired probe costs points, so efficient surveying matters.</li>
    <li>Start building to commit your markers, then solve the Towers grid. Missed faults collapse their tower cells at reveal.</li>
  `;

  const title = props.game === "hidden" ? "How Hidden Foundations Works" : "How Towers Speed Run Works";
  const body = props.game === "hidden" ? hiddenBasics : towersBasics;

  if (props.compact) {
    return `
      <section class="instructions-panel is-compact">
        <details ${props.open ? "open" : ""}>
          <summary data-action="toggle-instructions">How to play</summary>
          <ul>${body}</ul>
        </details>
        <div class="source-credit compact-credit">
          Mechanics adapted from Simon Tatham's MIT-licensed
          <a href="https://github.com/ghewgill/puzzles" target="_blank" rel="noreferrer">Portable Puzzle Collection</a>.
        </div>
      </section>
    `;
  }

  return `
    <section class="instructions-panel">
      <h2>${title}</h2>
      <ul>${body}</ul>
      <div class="source-credit">
        <strong>Source credit:</strong>
        Puzzle mechanics adapted from Simon Tatham's Portable Puzzle Collection,
        including <em>Black Box</em> and <em>Towers</em>, via the MIT-licensed
        <a href="https://github.com/ghewgill/puzzles" target="_blank" rel="noreferrer">ghewgill/puzzles</a> repository.
      </div>
    </section>
  `;
}

export function HookPanel(): string {
  return `
    <section class="hook-panel">
      <div class="hook-copy">
        <span>Want the full training loop?</span>
        <strong>Try IQMindware's cognitive training software.</strong>
      </div>
      <div class="cta-row">
        <a class="cta-link primary" href="${escapeHtml(IQMINDWARE_HOME_URL)}" target="_blank" rel="noreferrer">Visit IQMindware</a>
      </div>
    </section>
  `;
}

export function DiscordPanel(): string {
  const discord = DISCORD_INVITE_URL
    ? `<a class="cta-link discord" href="${escapeHtml(DISCORD_INVITE_URL)}" target="_blank" rel="noreferrer">${DiscordIcon()} Join Discord</a>`
    : `<span class="cta-link is-disabled">Discord coming soon</span>`;

  return `
    <section class="discord-panel">
      <div class="hook-copy">
        <span>Want to chat?</span>
        <strong>Share scores, tactics, and bug reports with other players.</strong>
      </div>
      <div class="cta-row">${discord}</div>
    </section>
  `;
}

export function CompletionCtas(): string {
  const discord = DISCORD_INVITE_URL
    ? `<a class="discord" href="${escapeHtml(DISCORD_INVITE_URL)}" target="_blank" rel="noreferrer">${DiscordIcon()} Share tactics on Discord</a>`
    : `<span>Discord link ready when invite URL is added</span>`;

  return `
    <div class="completion-ctas">
      <a href="${escapeHtml(IQMINDWARE_HOME_URL)}" target="_blank" rel="noreferrer">See IQMindware</a>
      ${discord}
    </div>
  `;
}

export function NicknameForm(error = "", defaultName = ""): string {
  return `
    <form class="submit-score" data-action="submit-score">
      <label>
        <span>Nickname</span>
        <input name="nickname" maxlength="20" value="${escapeHtml(defaultName)}" placeholder="2-20 chars" autocomplete="nickname" />
      </label>
      <button class="primary-btn" type="submit">Post score</button>
      ${error ? `<p class="form-error">${escapeHtml(error)}</p>` : ""}
    </form>
  `;
}

export function ResultReveal(props: {
  title: string;
  message: string;
  chips: string;
  form: string;
}): string {
  return `
    <section class="result-card result-sequence">
      <h2>${escapeHtml(props.title)}</h2>
      <p>${escapeHtml(props.message)}</p>
      <div class="chip-row">${props.chips}</div>
      ${props.form}
    </section>
  `;
}
