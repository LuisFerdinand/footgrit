import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  ageCategories,
  clubs,
  matches,
  players,
  playerStats,
  scoringFormulas,
  standings,
  tournamentTeams,
  tournaments,
  venues,
} from "@/lib/db/schema";

export async function listTournaments() {
  const rows = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      slug: tournaments.slug,
      season: tournaments.season,
      format: tournaments.format,
      status: tournaments.status,
      host: tournaments.host,
      city: tournaments.city,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      logoUrl: tournaments.logoUrl,
      ageCode: ageCategories.code,
      teams: sql<number>`(select count(*) from ${tournamentTeams} tt where tt.tournament_id = ${tournaments.id})`,
      totalMatches: sql<number>`(select count(*) from ${matches} m where m.tournament_id = ${tournaments.id})`,
      playedMatches: sql<number>`(select count(*) from ${matches} m where m.tournament_id = ${tournaments.id} and m.status = 'completed')`,
      liveMatches: sql<number>`(select count(*) from ${matches} m where m.tournament_id = ${tournaments.id} and m.status = 'live')`,
    })
    .from(tournaments)
    .leftJoin(ageCategories, eq(ageCategories.id, tournaments.ageCategoryId))
    .orderBy(desc(tournaments.startDate));
  return rows;
}

export async function getTournamentBase(id: string) {
  return db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
    with: { ageCategory: true, scoringFormula: true },
  });
}

export async function getTournamentOverview(id: string) {
  const t = await getTournamentBase(id);
  if (!t) return null;

  const [teamRows, matchAgg, topScorers, recentResults, upcoming] = await Promise.all([
    db
      .select({
        id: tournamentTeams.id,
        clubId: clubs.id,
        name: clubs.name,
        short: clubs.shortName,
        color: clubs.primaryColor,
        group: tournamentTeams.groupLabel,
        seed: tournamentTeams.seed,
        regStatus: tournamentTeams.registrationStatus,
      })
      .from(tournamentTeams)
      .innerJoin(clubs, eq(clubs.id, tournamentTeams.clubId))
      .where(eq(tournamentTeams.tournamentId, id))
      .orderBy(asc(tournamentTeams.groupLabel), asc(tournamentTeams.seed)),
    db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${matches.status} = 'completed')`,
        live: sql<number>`count(*) filter (where ${matches.status} = 'live')`,
        goals: sql<number>`coalesce(sum(${matches.homeScore} + ${matches.awayScore}) filter (where ${matches.status}='completed'),0)`,
      })
      .from(matches)
      .where(eq(matches.tournamentId, id)),
    db
      .select({
        id: players.id,
        name: players.fullName,
        club: clubs.shortName,
        goals: playerStats.goals,
        assists: playerStats.assists,
      })
      .from(playerStats)
      .innerJoin(players, eq(players.id, playerStats.playerId))
      .leftJoin(clubs, eq(clubs.id, players.clubId))
      .where(and(eq(playerStats.tournamentId, id), sql`${playerStats.goals} > 0`))
      .orderBy(desc(playerStats.goals), desc(playerStats.assists))
      .limit(6),
    tournamentMatches(id, "completed", 6),
    tournamentMatches(id, "scheduled", 6),
  ]);

  return { tournament: t, teams: teamRows, matchAgg: matchAgg[0], topScorers, recentResults, upcoming };
}

async function tournamentMatches(
  id: string,
  status: "completed" | "scheduled" | "live" | "all",
  limit?: number,
) {
  const hc = alias(clubs, "hc");
  const ac = alias(clubs, "ac");
  const q = db
    .select({
      id: matches.id,
      stage: matches.stage,
      round: matches.round,
      groupLabel: matches.groupLabel,
      bracketSlot: matches.bracketSlot,
      scheduledAt: matches.scheduledAt,
      status: matches.status,
      period: matches.period,
      currentMinute: matches.currentMinute,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      homeClubId: matches.homeClubId,
      awayClubId: matches.awayClubId,
      homeName: hc.name,
      homeShort: hc.shortName,
      homeColor: hc.primaryColor,
      awayName: ac.name,
      awayShort: ac.shortName,
      awayColor: ac.primaryColor,
      homePlaceholder: matches.homePlaceholder,
      awayPlaceholder: matches.awayPlaceholder,
      venue: venues.name,
      resultStatus: matches.resultStatus,
    })
    .from(matches)
    .leftJoin(hc, eq(hc.id, matches.homeClubId))
    .leftJoin(ac, eq(ac.id, matches.awayClubId))
    .leftJoin(venues, eq(venues.id, matches.venueId))
    .where(
      status === "all"
        ? eq(matches.tournamentId, id)
        : and(eq(matches.tournamentId, id), eq(matches.status, status)),
    )
    .orderBy(
      status === "completed" ? desc(matches.scheduledAt) : asc(matches.scheduledAt),
    );
  const rows = limit ? await q.limit(limit) : await q;
  return rows;
}

export async function getTournamentFixtures(id: string) {
  return tournamentMatches(id, "all");
}

export async function getTournamentStandings(id: string) {
  const rows = await db
    .select({
      clubId: standings.clubId,
      name: clubs.name,
      short: clubs.shortName,
      color: clubs.primaryColor,
      group: standings.groupLabel,
      played: standings.played,
      won: standings.won,
      drawn: standings.drawn,
      lost: standings.lost,
      goalsFor: standings.goalsFor,
      goalsAgainst: standings.goalsAgainst,
      points: standings.points,
      form: standings.form,
      rank: standings.rank,
    })
    .from(standings)
    .innerJoin(clubs, eq(clubs.id, standings.clubId))
    .where(eq(standings.tournamentId, id))
    .orderBy(asc(standings.groupLabel), asc(standings.rank));
  return rows;
}

export async function getKnockoutMatches(id: string) {
  const all = await tournamentMatches(id, "all");
  return all
    .filter((m) =>
      ["round_of_16", "quarter", "semi", "final", "third_place"].includes(m.stage),
    )
    .sort((a, b) => a.round - b.round || (a.bracketSlot ?? "").localeCompare(b.bracketSlot ?? ""));
}

export async function getClubOptionsForTournament() {
  return db
    .select({ id: clubs.id, name: clubs.name, short: clubs.shortName })
    .from(clubs)
    .where(eq(clubs.active, true))
    .orderBy(asc(clubs.name));
}

export async function getFormOptions() {
  const [ages, formulas, allClubs] = await Promise.all([
    db.select().from(ageCategories).orderBy(asc(ageCategories.sortOrder)),
    db.select().from(scoringFormulas).orderBy(desc(scoringFormulas.isActive)),
    getClubOptionsForTournament(),
  ]);
  return { ages, formulas, clubs: allClubs };
}

void inArray;
