import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ageCategories,
  clubs,
  matches,
  players,
  playerStats,
  referees,
  standings,
  tournamentTeams,
  tournaments,
  venues,
} from "@/lib/db/schema";
import { alias } from "drizzle-orm/pg-core";

export type PlayerListParams = {
  q?: string;
  club?: string;
  age?: string;
  position?: string;
  verification?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const PAGE_SIZE = 20;

export async function listPlayers(params: PlayerListParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const conds: SQL[] = [];

  if (params.q) {
    conds.push(
      or(
        ilike(players.fullName, `%${params.q}%`),
        ilike(players.registrationNo, `%${params.q}%`),
        ilike(players.nickname, `%${params.q}%`),
      )!,
    );
  }
  if (params.club) conds.push(eq(players.clubId, params.club));
  if (params.age) conds.push(eq(players.ageCategoryId, params.age));
  if (params.position)
    conds.push(eq(players.position, params.position as "GK" | "DF" | "MF" | "FW"));
  if (params.verification)
    conds.push(
      eq(
        players.verificationStatus,
        params.verification as "verified" | "flagged" | "pending" | "rejected",
      ),
    );

  const where = conds.length ? and(...conds) : undefined;

  const sortCol =
    params.sort === "name"
      ? players.fullName
      : params.sort === "club"
        ? clubs.name
        : params.sort === "age"
          ? ageCategories.sortOrder
          : params.sort === "created"
            ? players.createdAt
            : players.fullName;
  const dir = params.dir === "desc" ? desc : asc;

  const [rows, totalRes, filterData] = await Promise.all([
    db
      .select({
        id: players.id,
        fullName: players.fullName,
        nickname: players.nickname,
        registrationNo: players.registrationNo,
        photoUrl: players.photoUrl,
        position: players.position,
        jerseyNumber: players.jerseyNumber,
        verificationStatus: players.verificationStatus,
        dob: players.dob,
        clubName: clubs.name,
        clubShort: clubs.shortName,
        clubColor: clubs.primaryColor,
        ageCode: ageCategories.code,
      })
      .from(players)
      .leftJoin(clubs, eq(clubs.id, players.clubId))
      .leftJoin(ageCategories, eq(ageCategories.id, players.ageCategoryId))
      .where(where)
      .orderBy(dir(sortCol))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(players).where(where),
    getRegistryFilters(),
  ]);

  return {
    rows,
    total: totalRes[0].n,
    page,
    pageSize: PAGE_SIZE,
    filters: filterData,
  };
}

export async function getRegistryFilters() {
  const [cl, ag] = await Promise.all([
    db
      .select({ id: clubs.id, name: clubs.name })
      .from(clubs)
      .orderBy(asc(clubs.name)),
    db
      .select({ id: ageCategories.id, code: ageCategories.code })
      .from(ageCategories)
      .orderBy(asc(ageCategories.sortOrder)),
  ]);
  return { clubs: cl, ageCategories: ag };
}

export async function getPlayerProfile(id: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.id, id),
    with: {
      club: { with: { homeVenue: true } },
      ageCategory: true,
      badges: { with: { badge: true } },
      seasonHistory: true,
    },
  });
  if (!player) return null;

  const stats = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerId, id));

  const career = stats.find((s) => s.season === "career");
  const perTournament = stats.filter((s) => s.tournamentId);

  // percentile context: same position + age category
  const peers = await db
    .select({ score: playerStats.score, goals: playerStats.goals })
    .from(playerStats)
    .innerJoin(players, eq(players.id, playerStats.playerId))
    .where(
      and(
        eq(playerStats.season, "career"),
        eq(players.position, player.position),
        player.ageCategoryId
          ? eq(players.ageCategoryId, player.ageCategoryId)
          : sql`true`,
      ),
    );

  return { player, career, perTournament, stats, peers };
}

/* ─────────────────────────── Clubs ──────────────────────────────── */

export async function listClubs(params: { q?: string; type?: string; city?: string }) {
  const conds: SQL[] = [];
  if (params.q)
    conds.push(
      or(ilike(clubs.name, `%${params.q}%`), ilike(clubs.shortName, `%${params.q}%`))!,
    );
  if (params.type) conds.push(eq(clubs.type, params.type as "club" | "academy"));
  if (params.city) conds.push(eq(clubs.city, params.city));

  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      shortName: clubs.shortName,
      type: clubs.type,
      city: clubs.city,
      province: clubs.province,
      foundedYear: clubs.foundedYear,
      logoUrl: clubs.logoUrl,
      primaryColor: clubs.primaryColor,
      accreditation: clubs.accreditation,
      venue: venues.name,
      squadSize: sql<number>`(select count(*) from ${players} p where p.club_id = ${clubs.id})`,
    })
    .from(clubs)
    .leftJoin(venues, eq(venues.id, clubs.homeVenueId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(clubs.name));

  const cities = await db
    .selectDistinct({ city: clubs.city })
    .from(clubs)
    .orderBy(asc(clubs.city));

  return { rows, cities: cities.map((c) => c.city) };
}

export async function getClubProfile(id: string) {
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, id),
    with: { homeVenue: true },
  });
  if (!club) return null;

  const squad = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      photoUrl: players.photoUrl,
      verificationStatus: players.verificationStatus,
      ageCode: ageCategories.code,
      goals: sql<number>`coalesce((select sum(goals) from ${playerStats} ps where ps.player_id = ${players.id} and ps.season <> 'career'),0)`,
      apps: sql<number>`coalesce((select sum(appearances) from ${playerStats} ps where ps.player_id = ${players.id} and ps.season <> 'career'),0)`,
    })
    .from(players)
    .leftJoin(ageCategories, eq(ageCategories.id, players.ageCategoryId))
    .where(eq(players.clubId, id))
    .orderBy(asc(ageCategories.sortOrder), asc(players.jerseyNumber));

  const comps = await db
    .select({
      tournamentId: tournaments.id,
      name: tournaments.name,
      status: tournaments.status,
      format: tournaments.format,
      season: tournaments.season,
      regStatus: tournamentTeams.registrationStatus,
      group: tournamentTeams.groupLabel,
      played: standings.played,
      won: standings.won,
      drawn: standings.drawn,
      lost: standings.lost,
      points: standings.points,
      rank: standings.rank,
    })
    .from(tournamentTeams)
    .innerJoin(tournaments, eq(tournaments.id, tournamentTeams.tournamentId))
    .leftJoin(
      standings,
      and(
        eq(standings.tournamentId, tournaments.id),
        eq(standings.clubId, id),
      ),
    )
    .where(eq(tournamentTeams.clubId, id))
    .orderBy(desc(tournaments.startDate));

  const hc = alias(clubs, "hc");
  const ac = alias(clubs, "ac");
  const recentMatches = await db
    .select({
      id: matches.id,
      scheduledAt: matches.scheduledAt,
      status: matches.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      homeClubId: matches.homeClubId,
      homeShort: hc.shortName,
      awayShort: ac.shortName,
      tournament: tournaments.name,
    })
    .from(matches)
    .innerJoin(tournaments, eq(tournaments.id, matches.tournamentId))
    .leftJoin(hc, eq(hc.id, matches.homeClubId))
    .leftJoin(ac, eq(ac.id, matches.awayClubId))
    .where(or(eq(matches.homeClubId, id), eq(matches.awayClubId, id)))
    .orderBy(desc(matches.scheduledAt))
    .limit(8);

  return { club, squad, comps, recentMatches };
}

/* ─────────────────────────── Referees ───────────────────────────── */

export async function listReferees(params: { q?: string; status?: string; level?: string }) {
  const conds: SQL[] = [];
  if (params.q) conds.push(ilike(referees.fullName, `%${params.q}%`));
  if (params.status)
    conds.push(
      eq(referees.status, params.status as "active" | "expiring" | "expired" | "revoked"),
    );
  if (params.level) conds.push(eq(referees.licenseLevel, params.level));

  return db
    .select()
    .from(referees)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(referees.fullName));
}

export async function getRefereeProfile(id: string) {
  const referee = await db.query.referees.findFirst({ where: eq(referees.id, id) });
  if (!referee) return null;
  const hc = alias(clubs, "hc");
  const ac = alias(clubs, "ac");
  const assignments = await db
    .select({
      id: matches.id,
      scheduledAt: matches.scheduledAt,
      status: matches.status,
      homeShort: hc.shortName,
      awayShort: ac.shortName,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      tournament: tournaments.name,
    })
    .from(matches)
    .innerJoin(tournaments, eq(tournaments.id, matches.tournamentId))
    .leftJoin(hc, eq(hc.id, matches.homeClubId))
    .leftJoin(ac, eq(ac.id, matches.awayClubId))
    .where(eq(matches.refereeId, id))
    .orderBy(desc(matches.scheduledAt))
    .limit(12);
  return { referee, assignments };
}

/* ─────────────────────────── Venues ─────────────────────────────── */

export async function listVenues(params: { q?: string; surface?: string }) {
  const conds: SQL[] = [];
  if (params.q)
    conds.push(or(ilike(venues.name, `%${params.q}%`), ilike(venues.city, `%${params.q}%`))!);
  if (params.surface)
    conds.push(
      eq(venues.surface, params.surface as "natural" | "artificial" | "hybrid" | "futsal"),
    );

  return db
    .select({
      id: venues.id,
      name: venues.name,
      city: venues.city,
      province: venues.province,
      capacity: venues.capacity,
      fieldCount: venues.fieldCount,
      surface: venues.surface,
      floodlights: venues.floodlights,
      photoUrl: venues.photoUrl,
      clubs: sql<number>`(select count(*) from ${clubs} c where c.home_venue_id = ${venues.id})`,
      matches: sql<number>`(select count(*) from ${matches} m where m.venue_id = ${venues.id})`,
    })
    .from(venues)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(venues.name));
}

export async function listAgeCategories() {
  return db.select().from(ageCategories).orderBy(asc(ageCategories.sortOrder));
}
