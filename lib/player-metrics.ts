import type { PlayerStat } from "@/lib/db/schema";

export const RADAR_AXES = [
  { key: "attack", label: "Gol" },
  { key: "creation", label: "Assist" },
  { key: "passing", label: "Umpan Kunci" },
  { key: "defending", label: "Tekel & Intersep" },
  { key: "keeping", label: "Penyelamatan" },
  { key: "discipline", label: "Disiplin" },
] as const;

const clamp100 = (v: number) => Math.max(4, Math.min(100, Math.round(v)));

/** Normalise a stat line into 0–100 radar values (per-90 rates against fixed caps). */
export function radarValues(s: Partial<PlayerStat> | null | undefined) {
  const mins = s?.minutesPlayed ?? 0;
  const per90 = (n: number) => (mins > 0 ? (n / mins) * 90 : 0);
  const goals = per90(s?.goals ?? 0);
  const assists = per90(s?.assists ?? 0);
  const keyPasses = per90(s?.keyPasses ?? 0);
  const def = per90((s?.tackles ?? 0) + (s?.interceptions ?? 0));
  const saves = per90(s?.saves ?? 0);
  const cards = (s?.yellowCards ?? 0) + (s?.redCards ?? 0) * 2;
  const apps = s?.appearances ?? 1;

  return {
    attack: clamp100((goals / 1.1) * 100),
    creation: clamp100((assists / 0.8) * 100),
    passing: clamp100((keyPasses / 2.5) * 100),
    defending: clamp100((def / 7) * 100),
    keeping: clamp100((saves / 5) * 100),
    discipline: clamp100(100 - (cards / Math.max(1, apps)) * 60),
  };
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
