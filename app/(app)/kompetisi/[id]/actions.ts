"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchEvents,
  matches,
  standings,
  tournamentTeams,
  tournaments,
} from "@/lib/db/schema";
import { actionUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { groupStage, roundRobin } from "@/lib/fixtures";
import {
  DEFAULT_TIEBREAKERS,
  computeStandings,
  type MatchResultInput,
} from "@/lib/standings";

const LIFECYCLE = [
  "draft",
  "registration",
  "verification",
  "ready",
  "ongoing",
  "completed",
  "archived",
] as const;
type Status = (typeof LIFECYCLE)[number];

const LABEL: Record<Status, string> = {
  draft: "Draf",
  registration: "Registrasi",
  verification: "Verifikasi",
  ready: "Siap",
  ongoing: "Berlangsung",
  completed: "Selesai",
  archived: "Arsip",
};

export async function setTournamentStatus(formData: FormData) {
  const user = await actionUser("competition:write");
  const id = String(formData.get("id"));
  const target = String(formData.get("status")) as Status;
  if (!LIFECYCLE.includes(target)) throw new Error("Status tidak valid");

  const before = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });

  await db
    .update(tournaments)
    .set({ status: target, updatedAt: new Date() })
    .where(eq(tournaments.id, id));

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "tournament.status",
    entityType: "tournament",
    entityId: id,
    summary: `Status "${before?.name}" diubah ke ${LABEL[target]}`,
    before: { status: before?.status },
    after: { status: target },
  });

  revalidatePath(`/kompetisi/${id}`, "layout");
  revalidatePath("/kompetisi");
  revalidatePath("/command-center");
}

export async function generateFixtures(formData: FormData) {
  const user = await actionUser("competition:write");
  const id = String(formData.get("id"));

  const t = await db.query.tournaments.findFirst({ where: eq(tournaments.id, id) });
  if (!t) throw new Error("Turnamen tidak ditemukan");

  const existing = await db.$count(matches, eq(matches.tournamentId, id));
  if (existing > 0) throw new Error("Jadwal sudah dibuat. Hapus dahulu untuk membuat ulang.");

  const teams = await db
    .select({ clubId: tournamentTeams.clubId, group: tournamentTeams.groupLabel })
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, id));
  if (teams.length < 2) throw new Error("Minimal 2 tim peserta diperlukan.");

  const ids = teams.map((x) => x.clubId);
  let fixtures;
  if (t.format === "league") {
    fixtures = roundRobin(ids, { stage: "league", doubleRound: t.doubleRound });
  } else if (t.format === "cup") {
    fixtures = groupStage(ids, Math.max(2, t.groupCount || 2), t.doubleRound);
  } else {
    // knockout / hybrid — simple seeded pairing
    fixtures = ids.slice(0, Math.floor(ids.length / 2) * 2).reduce<
      { round: number; stage: "knockout"; home: string; away: string; bracketSlot: string }[]
    >((acc, _, i, arr) => {
      if (i % 2 === 0)
        acc.push({
          round: 1,
          stage: "knockout",
          home: arr[i],
          away: arr[i + 1],
          bracketSlot: `QF${i / 2 + 1}`,
        });
      return acc;
    }, []);
  }

  const base = t.startDate ? new Date(t.startDate) : new Date();
  const rows = fixtures.map((fx, i) => {
    const d = new Date(base.getTime() + Math.floor(i / 2) * 3 * 86400000);
    d.setHours(15, 30, 0, 0);
    return {
      tournamentId: id,
      stage:
        "stage" in fx && fx.stage === "group"
          ? ("group" as const)
          : "stage" in fx && fx.stage === "knockout"
            ? ("quarter" as const)
            : ("league" as const),
      round: fx.round,
      groupLabel: "groupLabel" in fx ? (fx.groupLabel ?? null) : null,
      bracketSlot: "bracketSlot" in fx ? (fx.bracketSlot ?? null) : null,
      homeClubId: fx.home,
      awayClubId: fx.away,
      scheduledAt: d,
      status: "scheduled" as const,
      homeFormation: "4-3-3",
      awayFormation: "4-3-3",
    };
  });

  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(matches).values(rows.slice(i, i + 200));
  }

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "fixture.generate",
    entityType: "tournament",
    entityId: id,
    summary: `${rows.length} pertandingan dijadwalkan otomatis untuk "${t.name}"`,
  });

  revalidatePath(`/kompetisi/${id}`, "layout");
}

export async function recomputeStandings(formData: FormData) {
  const user = await actionUser("competition:write");
  const id = String(formData.get("id"));
  const t = await db.query.tournaments.findFirst({ where: eq(tournaments.id, id) });
  if (!t) throw new Error("Turnamen tidak ditemukan");

  const teams = await db
    .select({ clubId: tournamentTeams.clubId, group: tournamentTeams.groupLabel })
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, id));
  const groupsByClub = Object.fromEntries(
    teams.map((x) => [x.clubId, x.group ?? "-"]),
  );

  const done = await db
    .select()
    .from(matches)
    .where(and(eq(matches.tournamentId, id), eq(matches.status, "completed")));

  const matchIds = done.map((m) => m.id);
  const events = matchIds.length
    ? await db
        .select()
        .from(matchEvents)
        .where(inArray(matchEvents.matchId, matchIds))
    : [];

  const results: MatchResultInput[] = done
    .filter((m) => m.homeClubId && m.awayClubId)
    .map((m) => ({
      homeClubId: m.homeClubId!,
      awayClubId: m.awayClubId!,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      groupLabel: m.groupLabel,
      homeYellow: events.filter(
        (e) => e.matchId === m.id && e.type === "yellow_card" && e.clubId === m.homeClubId,
      ).length,
      awayYellow: events.filter(
        (e) => e.matchId === m.id && e.type === "yellow_card" && e.clubId === m.awayClubId,
      ).length,
      homeRed: events.filter(
        (e) => e.matchId === m.id && e.type === "red_card" && e.clubId === m.homeClubId,
      ).length,
      awayRed: events.filter(
        (e) => e.matchId === m.id && e.type === "red_card" && e.clubId === m.awayClubId,
      ).length,
    }));

  const rows = computeStandings(
    teams.map((x) => x.clubId),
    results,
    { pointsWin: t.pointsWin, pointsDraw: t.pointsDraw, pointsLoss: t.pointsLoss, tiebreakers: t.tiebreakers ?? DEFAULT_TIEBREAKERS },
    groupsByClub,
  );

  await db.delete(standings).where(eq(standings.tournamentId, id));
  if (rows.length) {
    await db.insert(standings).values(
      rows.map((r) => ({
        tournamentId: id,
        clubId: r.clubId,
        groupLabel: r.groupLabel,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        points: r.points,
        fairPlayPoints: r.fairPlayPoints,
        form: r.form,
        rank: r.rank,
      })),
    );
  }

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "standings.recompute",
    entityType: "tournament",
    entityId: id,
    summary: `Klasemen "${t.name}" dihitung ulang dari ${results.length} hasil pertandingan`,
  });

  revalidatePath(`/kompetisi/${id}`, "layout");
}
