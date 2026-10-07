"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ageCategories,
  matchEvents,
  matches,
  scoringFormulas,
  standings,
  tournamentTeams,
  tournaments,
} from "@/lib/db/schema";
import { actionUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  applyMatchToPlayerStats,
  liveMinute,
  recomputeMatchScore,
} from "@/lib/match-engine";
import {
  DEFAULT_TIEBREAKERS,
  computeStandings,
  type MatchResultInput,
} from "@/lib/standings";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import {
  DEFAULT_MATCH_MINUTES,
  MAX_MATCH_MINUTES,
  MIN_MATCH_MINUTES,
  clockCap,
  halfOf,
} from "@/lib/match-clock";

async function loadMatch(id: string) {
  const m = await db.query.matches.findFirst({ where: eq(matches.id, id) });
  if (!m) throw new Error("Pertandingan tidak ditemukan");
  return m;
}

/** Match length: set at kick-off, else the age category rule, else 90. */
async function durationOf(m: { durationMinutes: number | null; tournamentId: string }) {
  if (m.durationMinutes) return m.durationMinutes;
  const row = await db
    .select({ rules: ageCategories.rules })
    .from(tournaments)
    .leftJoin(ageCategories, eq(ageCategories.id, tournaments.ageCategoryId))
    .where(eq(tournaments.id, m.tournamentId));
  return row[0]?.rules?.matchDuration ?? DEFAULT_MATCH_MINUTES;
}

function rev(id: string, tournamentId?: string) {
  revalidatePath(`/match-ops/${id}`);
  revalidatePath("/match-ops");
  revalidatePath("/command-center");
  if (tournamentId) revalidatePath(`/kompetisi/${tournamentId}`, "layout");
}

export async function startMatch(id: string, durationMinutes: number) {
  const user = await actionUser("match:operate");
  const m = await loadMatch(id);
  if (m.status === "completed") throw new Error("Pertandingan sudah selesai");
  const duration = Math.round(Number(durationMinutes));
  if (!Number.isFinite(duration) || duration < MIN_MATCH_MINUTES || duration > MAX_MATCH_MINUTES) {
    throw new Error(`Durasi harus antara ${MIN_MATCH_MINUTES} dan ${MAX_MATCH_MINUTES} menit`);
  }

  await db
    .update(matches)
    .set({
      status: "live",
      period: "first_half",
      clockStartedAt: new Date(),
      currentMinute: 0,
      durationMinutes: duration,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, id));

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "match.start",
    entityType: "match",
    entityId: id,
    summary: `Pertandingan dimulai (kick-off), durasi ${duration} menit`,
  });
  rev(id, m.tournamentId);
}

export async function pauseClock(id: string) {
  const user = await actionUser("match:operate");
  const m = await loadMatch(id);
  const duration = await durationOf(m);
  const minute = liveMinute(m, clockCap(duration));
  await db
    .update(matches)
    .set({ clockStartedAt: null, currentMinute: minute, status: "halftime", period: "halftime" })
    .where(eq(matches.id, id));
  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.pause", entityType: "match", entityId: id,
    summary: `Waktu dihentikan pada menit ${minute}`,
  });
  rev(id, m.tournamentId);
}

export async function resumeSecondHalf(id: string) {
  const user = await actionUser("match:operate");
  const m = await loadMatch(id);
  const half = (m.homeScoreHt == null);
  const duration = await durationOf(m);
  await db
    .update(matches)
    .set({
      status: "live",
      period: "second_half",
      clockStartedAt: new Date(),
      currentMinute: Math.max(m.currentMinute, halfOf(duration)),
      homeScoreHt: half ? m.homeScore : m.homeScoreHt,
      awayScoreHt: half ? m.awayScore : m.awayScoreHt,
    })
    .where(eq(matches.id, id));
  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.resume", entityType: "match", entityId: id,
    summary: "Babak kedua dimulai",
  });
  rev(id, m.tournamentId);
}

export async function endMatch(id: string) {
  const user = await actionUser("match:operate");
  const m = await loadMatch(id);
  const duration = await durationOf(m);
  const minute = liveMinute(m, clockCap(duration));
  await db
    .update(matches)
    .set({
      status: "completed",
      period: "full_time",
      clockStartedAt: null,
      currentMinute: minute,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, id));
  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.end", entityType: "match", entityId: id,
    summary: `Pertandingan berakhir ${m.homeScore}-${m.awayScore} pada menit ${minute}`,
  });
  rev(id, m.tournamentId);
}

const eventSchema = z.object({
  matchId: z.string(),
  type: z.enum([
    "goal", "penalty_goal", "own_goal", "assist", "save", "yellow_card",
    "red_card", "second_yellow", "foul", "corner", "offside", "substitution",
    "shot_on", "shot_off", "injury",
  ]),
  clubId: z.string(),
  playerId: z.string().optional(),
  relatedPlayerId: z.string().optional(),
  minute: z.coerce.number().int().min(0).max(130),
  note: z.string().optional(),
});

export async function addEvent(formData: FormData) {
  const user = await actionUser("match:operate");
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Data kejadian tidak valid");
  const v = parsed.data;
  const m = await loadMatch(v.matchId);
  const half = halfOf(await durationOf(m));
  const period = v.minute > half ? "second_half" : "first_half";

  await db.insert(matchEvents).values({
    matchId: v.matchId,
    type: v.type,
    minute: v.minute,
    period,
    clubId: v.clubId,
    playerId: v.playerId || null,
    relatedPlayerId: v.relatedPlayerId || null,
    detail: v.note ? { note: v.note } : undefined,
    createdBy: user.id,
  });

  // A goal's assister is stored on the goal (relatedPlayerId) *and* as its own
  // "assist" event — the latter is what player statistics count.
  if (v.type === "goal" && v.playerId && v.relatedPlayerId) {
    await db.insert(matchEvents).values({
      matchId: v.matchId,
      type: "assist",
      minute: v.minute,
      period,
      clubId: v.clubId,
      playerId: v.relatedPlayerId,
      relatedPlayerId: v.playerId,
      createdBy: user.id,
    });
  }

  if (["goal", "penalty_goal", "own_goal"].includes(v.type)) {
    await recomputeMatchScore(v.matchId);
  }

  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.event.create", entityType: "match", entityId: v.matchId,
    summary: `Kejadian dicatat: ${v.type} menit ${v.minute}`,
  });
  rev(v.matchId, m.tournamentId);
}

export async function voidEvent(formData: FormData) {
  const user = await actionUser("match:operate");
  const eventId = String(formData.get("eventId"));
  const matchId = String(formData.get("matchId"));
  const reason = String(formData.get("reason") ?? "Koreksi operator");

  const [ev] = await db
    .update(matchEvents)
    .set({ voided: true, voidReason: reason })
    .where(eq(matchEvents.id, eventId))
    .returning();

  // voiding a goal also voids the assist recorded with it
  if (ev && (ev.type === "goal" || ev.type === "penalty_goal") && ev.playerId && ev.relatedPlayerId) {
    await db
      .update(matchEvents)
      .set({ voided: true, voidReason: reason })
      .where(
        and(
          eq(matchEvents.matchId, matchId),
          eq(matchEvents.type, "assist"),
          eq(matchEvents.playerId, ev.relatedPlayerId),
          eq(matchEvents.relatedPlayerId, ev.playerId),
          eq(matchEvents.minute, ev.minute),
          eq(matchEvents.voided, false),
        ),
      );
  }

  await recomputeMatchScore(matchId);
  const m = await loadMatch(matchId);
  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.event.void", entityType: "match", entityId: matchId,
    summary: `Kejadian dibatalkan — ${reason}`,
  });
  rev(matchId, m.tournamentId);
}

async function activeWeights() {
  const f = await db.query.scoringFormulas.findFirst({
    where: eq(scoringFormulas.isActive, true),
  });
  return f?.weights ?? DEFAULT_WEIGHTS;
}

async function recomputeTournamentStandings(tournamentId: string) {
  const t = await db.query.tournaments.findFirst({
    where: (tt, { eq: e }) => e(tt.id, tournamentId),
  });
  if (!t || t.format === "knockout") return;

  const teams = await db
    .select({ clubId: tournamentTeams.clubId, group: tournamentTeams.groupLabel })
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, tournamentId));
  const groupsByClub = Object.fromEntries(teams.map((x) => [x.clubId, x.group ?? "-"]));

  const done = await db
    .select()
    .from(matches)
    .where(and(eq(matches.tournamentId, tournamentId), eq(matches.status, "completed")));
  const ids = done.map((m) => m.id);
  const evs = ids.length
    ? await db.select().from(matchEvents).where(inArray(matchEvents.matchId, ids))
    : [];

  const results: MatchResultInput[] = done
    .filter((m) => m.homeClubId && m.awayClubId)
    .map((m) => ({
      homeClubId: m.homeClubId!,
      awayClubId: m.awayClubId!,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      groupLabel: m.groupLabel,
      homeYellow: evs.filter((e) => e.matchId === m.id && e.type === "yellow_card" && e.clubId === m.homeClubId && !e.voided).length,
      awayYellow: evs.filter((e) => e.matchId === m.id && e.type === "yellow_card" && e.clubId === m.awayClubId && !e.voided).length,
      homeRed: evs.filter((e) => e.matchId === m.id && e.type === "red_card" && e.clubId === m.homeClubId && !e.voided).length,
      awayRed: evs.filter((e) => e.matchId === m.id && e.type === "red_card" && e.clubId === m.awayClubId && !e.voided).length,
    }));

  const rows = computeStandings(
    teams.map((x) => x.clubId),
    results,
    { pointsWin: t.pointsWin, pointsDraw: t.pointsDraw, pointsLoss: t.pointsLoss, tiebreakers: t.tiebreakers ?? DEFAULT_TIEBREAKERS },
    groupsByClub,
  );

  await db.delete(standings).where(eq(standings.tournamentId, tournamentId));
  if (rows.length) {
    await db.insert(standings).values(
      rows.map((r) => ({
        tournamentId,
        clubId: r.clubId,
        groupLabel: r.groupLabel,
        played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
        goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
        points: r.points, fairPlayPoints: r.fairPlayPoints, form: r.form, rank: r.rank,
      })),
    );
  }
}

export async function confirmResult(formData: FormData) {
  const user = await actionUser("match:confirm");
  const id = String(formData.get("id"));
  const m = await loadMatch(id);
  if (m.status !== "completed") throw new Error("Selesaikan pertandingan terlebih dahulu");

  const weights = await activeWeights();
  await applyMatchToPlayerStats(id, weights, 1);

  await db
    .update(matches)
    .set({
      resultStatus: "confirmed",
      confirmedBy: user.id,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, id));

  await recomputeTournamentStandings(m.tournamentId);

  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.confirm", entityType: "match", entityId: id,
    summary: `Hasil ${m.homeScore}-${m.awayScore} dikonfirmasi; klasemen & statistik diperbarui`,
  });
  rev(id, m.tournamentId);
}

export async function amendResult(formData: FormData) {
  const user = await actionUser("match:confirm");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Alasan koreksi wajib diisi");
  const m = await loadMatch(id);

  const weights = await activeWeights();
  // reverse previous contribution, then re-apply from current events
  if (m.resultStatus === "confirmed") {
    await applyMatchToPlayerStats(id, weights, -1);
  }
  await recomputeMatchScore(id);
  await applyMatchToPlayerStats(id, weights, 1);

  await db
    .update(matches)
    .set({
      resultStatus: "amended",
      amendmentReason: reason,
      confirmedBy: user.id,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, id));

  await recomputeTournamentStandings(m.tournamentId);

  await recordAudit({
    actorId: user.id, actorName: user.name, actorRole: user.role,
    action: "match.amend", entityType: "match", entityId: id,
    summary: `Hasil dikoreksi menjadi ${m.homeScore}-${m.awayScore} — ${reason}`,
  });
  rev(id, m.tournamentId);
}
