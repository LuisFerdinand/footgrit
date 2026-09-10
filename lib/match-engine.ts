import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchEvents, matches, playerStats } from "@/lib/db/schema";
import { computeRating, computeScore } from "@/lib/scoring";
import type { FormulaWeights } from "@/lib/db/schema";

/** Live match minute given stored minute + running clock (capped at 90+ stoppage). */
export function liveMinute(
  m: {
    currentMinute: number;
    clockStartedAt: Date | string | null;
    status: string;
  },
  cap = 96,
) {
  if (m.status !== "live" || !m.clockStartedAt) return m.currentMinute;
  const elapsed = Math.floor(
    (Date.now() - new Date(m.clockStartedAt).getTime()) / 60000,
  );
  return Math.min(cap, m.currentMinute + Math.max(0, elapsed));
}

const GOAL_TYPES = ["goal", "penalty_goal"];

/** Recompute a match's scoreline from its non-voided events. */
export async function recomputeMatchScore(matchId: string) {
  const evs = await db
    .select({
      type: matchEvents.type,
      clubId: matchEvents.clubId,
    })
    .from(matchEvents)
    .where(and(eq(matchEvents.matchId, matchId), eq(matchEvents.voided, false)));

  const m = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!m) return;

  let home = 0;
  let away = 0;
  for (const e of evs) {
    if (GOAL_TYPES.includes(e.type)) {
      if (e.clubId === m.homeClubId) home++;
      else if (e.clubId === m.awayClubId) away++;
    } else if (e.type === "own_goal") {
      // own goal credits the opponent
      if (e.clubId === m.homeClubId) away++;
      else if (e.clubId === m.awayClubId) home++;
    }
  }

  await db
    .update(matches)
    .set({ homeScore: home, awayScore: away, updatedAt: new Date() })
    .where(eq(matches.id, matchId));
}

/**
 * Fold a confirmed match's events into per-tournament + career player_stats.
 * `direction` = 1 to apply, -1 to reverse (used when amending).
 */
export async function applyMatchToPlayerStats(
  matchId: string,
  weights: FormulaWeights,
  direction: 1 | -1 = 1,
) {
  const m = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!m) return;

  const evs = await db
    .select()
    .from(matchEvents)
    .where(and(eq(matchEvents.matchId, matchId), eq(matchEvents.voided, false)));

  const delta: Record<
    string,
    { goals: number; assists: number; yellowCards: number; redCards: number; saves: number; motm: number }
  > = {};
  const touch = (pid: string) => (delta[pid] ??= { goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0, motm: 0 });

  for (const e of evs) {
    if (!e.playerId) continue;
    const d = touch(e.playerId);
    if (e.type === "goal" || e.type === "penalty_goal") d.goals += direction;
    else if (e.type === "assist") d.assists += direction;
    else if (e.type === "yellow_card" || e.type === "second_yellow") d.yellowCards += direction;
    else if (e.type === "red_card") d.redCards += direction;
    else if (e.type === "save") d.saves += direction;
    else if (e.type === "var_check" && (e.detail as { award?: string })?.award) d.motm += direction;
  }

  for (const [pid, d] of Object.entries(delta)) {
    for (const scope of ["career", "tournament"] as const) {
      const cond =
        scope === "career"
          ? and(eq(playerStats.playerId, pid), eq(playerStats.season, "career"))
          : and(eq(playerStats.playerId, pid), eq(playerStats.tournamentId, m.tournamentId));

      const existing = await db.query.playerStats.findFirst({ where: cond });
      if (existing) {
        await db
          .update(playerStats)
          .set({
            goals: sql`greatest(0, ${playerStats.goals} + ${d.goals})`,
            assists: sql`greatest(0, ${playerStats.assists} + ${d.assists})`,
            yellowCards: sql`greatest(0, ${playerStats.yellowCards} + ${d.yellowCards})`,
            redCards: sql`greatest(0, ${playerStats.redCards} + ${d.redCards})`,
            saves: sql`greatest(0, ${playerStats.saves} + ${d.saves})`,
            motm: sql`greatest(0, ${playerStats.motm} + ${d.motm})`,
            updatedAt: new Date(),
          })
          .where(cond);
      } else if (scope === "tournament" && direction === 1) {
        await db.insert(playerStats).values({
          playerId: pid,
          tournamentId: m.tournamentId,
          season: "2026",
          appearances: 1,
          goals: Math.max(0, d.goals),
          assists: Math.max(0, d.assists),
          yellowCards: Math.max(0, d.yellowCards),
          redCards: Math.max(0, d.redCards),
          saves: Math.max(0, d.saves),
          motm: Math.max(0, d.motm),
        });
      }

      // refresh derived score/rating
      const row = await db.query.playerStats.findFirst({ where: cond });
      if (row) {
        const scorable = {
          goals: row.goals,
          assists: row.assists,
          saves: row.saves,
          tackles: row.tackles,
          interceptions: row.interceptions,
          keyPasses: row.keyPasses,
          duelsWon: row.duelsWon,
          cleanSheets: row.cleanSheets,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          minutesPlayed: row.minutesPlayed,
          motm: row.motm,
        };
        await db
          .update(playerStats)
          .set({
            score: computeScore(scorable, weights),
            rating: computeRating(scorable, row.appearances || 1, weights),
          })
          .where(cond);
      }
    }
  }
}
