import type { PlayerStat } from "@/lib/db/schema";

export const RADAR_AXES = [
  { key: "goals", label: "Goal" },
  { key: "assists", label: "Assist" },
  { key: "shotsOnTarget", label: "Shot on goal" },
  { key: "saves", label: "Saves" },
  { key: "interceptions", label: "Intercept" },
  { key: "shotsOffTarget", label: "Shot off target" },
  { key: "redCards", label: "Red card" },
  { key: "yellowCards", label: "Yellow card" },
] as const;

/** Actual counters from recorded match statistics. */
export function radarValues(s: Partial<PlayerStat> | null | undefined) {
  return Object.fromEntries(RADAR_AXES.map(({ key }) => [key, s?.[key] ?? 0]));
}

/** Compact per-90 summary numbers for the profile stat strip. */
export function per90Summary(s: Partial<PlayerStat> | null | undefined) {
  const mins = s?.minutesPlayed ?? 0;
  const per90 = (n: number) =>
    mins > 0 ? Math.round(((n / mins) * 90) * 100) / 100 : 0;
  return {
    goals: per90(s?.goals ?? 0),
    assists: per90(s?.assists ?? 0),
    keyPasses: per90(s?.keyPasses ?? 0),
    tackles: per90(s?.tackles ?? 0),
    saves: per90(s?.saves ?? 0),
  };
}

export function percentileOf(value: number, pool: number[]) {
  if (pool.length < 3) return null;
  const below = pool.filter((v) => v < value).length;
  return Math.round((below / pool.length) * 100);
}
