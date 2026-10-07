/**
 * Match clock helpers — pure, so both server actions and client components can
 * use them (lib/match-engine.ts pulls in the database and cannot be imported
 * from the browser).
 */

export const DEFAULT_MATCH_MINUTES = 90;
export const MIN_MATCH_MINUTES = 10;
export const MAX_MATCH_MINUTES = 120;
/** Quick-pick durations offered when starting a match. */
export const DURATION_PRESETS = [40, 60, 70, 80, 90];

/** Stoppage allowance shown past the nominal full time. */
const STOPPAGE = 10;

export type ClockState = {
  status: string;
  currentMinute: number;
  clockStartedAt: Date | string | null;
};

/** Highest minute the clock will show: full time plus stoppage. */
export function clockCap(duration: number) {
  return duration + STOPPAGE;
}

/** Half-time minute for a match of this length. */
export function halfOf(duration: number) {
  return Math.ceil(duration / 2);
}

/** Minute the match is at right now: stored minute + the time the clock has run. */
export function elapsedMinute(c: ClockState, cap: number, now = Date.now()) {
  if (c.status !== "live" || !c.clockStartedAt) return c.currentMinute;
  const run = Math.floor((now - new Date(c.clockStartedAt).getTime()) / 60000);
  return Math.min(cap, c.currentMinute + Math.max(0, run));
}
