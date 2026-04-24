export const TOWERS_BASE = 1000;
export const TOWERS_TARGET_SECONDS = 60;
export const TOWERS_TIME_PENALTY = 5;
export const TOWERS_OVERTIME_PENALTY = 10;
export const TOWERS_MIN_SECONDS = 5;
export const TOWERS_MAX_SECONDS = 600;
export const TOWERS_MAX_ACCEPTED_SCORE = 975;

export const SURVEY_BASE = 500;
export const PROBE_PENALTY = 20;
export const CORRECT_FAULT_BONUS = 150;
export const WRONG_MARKER_PENALTY = 75;
export const BUILD_BASE = 1000;
export const BUILD_TARGET_SECONDS = 90;
export const BUILD_TIME_PENALTY = 4;
export const BUILD_OVERTIME_PENALTY = 8;
export const BUILD_MIN_SECONDS = 8;
export const BUILD_MAX_SECONDS = 900;
export const COLLAPSE_PENALTY = 150;
export const HIDDEN_FOUNDATIONS_MAX_ACCEPTED_SCORE = 1708;

export function scoreTowers(seconds: number): number {
  const safeSeconds = Math.max(TOWERS_MIN_SECONDS, Math.ceil(seconds));
  return Math.max(
    0,
    TOWERS_BASE -
      Math.min(safeSeconds, TOWERS_TARGET_SECONDS) * TOWERS_TIME_PENALTY -
      Math.max(0, safeSeconds - TOWERS_TARGET_SECONDS) * TOWERS_OVERTIME_PENALTY,
  );
}

export function scoreHiddenSurvey(probes: number, correctMarkers: number, wrongMarkers: number): number {
  return Math.max(
    0,
    SURVEY_BASE - probes * PROBE_PENALTY + correctMarkers * CORRECT_FAULT_BONUS - wrongMarkers * WRONG_MARKER_PENALTY,
  );
}

export function scoreHiddenBuild(seconds: number, collapsedTowers: number): number {
  const safeSeconds = Math.max(BUILD_MIN_SECONDS, Math.ceil(seconds));
  return Math.max(
    0,
    BUILD_BASE -
      Math.min(safeSeconds, BUILD_TARGET_SECONDS) * BUILD_TIME_PENALTY -
      Math.max(0, safeSeconds - BUILD_TARGET_SECONDS) * BUILD_OVERTIME_PENALTY -
      collapsedTowers * COLLAPSE_PENALTY,
  );
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return mins ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}

export function isSafeNickname(value: string): boolean {
  return /^[A-Za-z0-9 _-]{2,20}$/.test(value.trim());
}
