import type { FormulaWeights } from "@/lib/db/schema";

export const DEFAULT_WEIGHTS: FormulaWeights = {
  goal: 6,
  assist: 4,
  save: 1.5,
  tackle: 1.2,
  interception: 1,
  cleanSheet: 4,
  keyPass: 0.8,
  duelWon: 0.4,
  yellowCard: -1.5,
  redCard: -5,
  minutesPer90: 1.5,
  motm: 5,
};

export const WEIGHT_LABELS: Record<keyof FormulaWeights, string> = {
  goal: "Gol",
  assist: "Assist",
  save: "Penyelamatan",
  tackle: "Tekel",
  interception: "Intersep",
  cleanSheet: "Nirbobol",
  keyPass: "Umpan kunci",
  duelWon: "Duel menang",
  yellowCard: "Kartu kuning",
  redCard: "Kartu merah",
  minutesPer90: "Menit / 90",
  motm: "Pemain Terbaik",
};

export type ScorableStats = {
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  interceptions: number;
  keyPasses: number;
  duelsWon: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  motm: number;
};

/** Weighted performance score used by leaderboards, ratings and the radar. */
export function computeScore(
  s: ScorableStats,
  w: FormulaWeights = DEFAULT_WEIGHTS,
): number {
  const per90 = s.minutesPlayed / 90;
  const raw =
    s.goals * w.goal +
    s.assists * w.assist +
    s.saves * w.save +
    s.tackles * w.tackle +
    s.interceptions * w.interception +
    s.keyPasses * w.keyPass +
    s.duelsWon * w.duelWon +
    s.cleanSheets * w.cleanSheet +
    s.yellowCards * w.yellowCard +
    s.redCards * w.redCard +
    per90 * w.minutesPer90 +
    s.motm * w.motm;
  return Math.round(raw * 10) / 10;
}

/** 0–10 match-style rating derived from the weighted score per appearance. */
export function computeRating(
  s: ScorableStats,
  appearances: number,
  w: FormulaWeights = DEFAULT_WEIGHTS,
): number {
  if (appearances <= 0) return 6.0;
  const perGame = computeScore(s, w) / appearances;
  // Map a typical per-game contribution (~0–14) onto 5.8–9.4
  const rating = 5.8 + Math.max(0, Math.min(14, perGame)) * 0.26;
  return Math.round(Math.min(9.6, rating) * 10) / 10;
}

/** Percentile rank (0–100) of `value` within `pool`. */
export function percentile(value: number, pool: number[]): number {
  if (pool.length === 0) return 50;
  const below = pool.filter((v) => v < value).length;
  const equal = pool.filter((v) => v === value).length;
  return Math.round(((below + equal / 2) / pool.length) * 100);
}
