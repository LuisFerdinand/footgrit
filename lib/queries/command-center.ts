import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  auditLogs,
  clubs,
  matches,
  players,
  playerStats,
  referees,
  tournaments,
  venues,
} from "@/lib/db/schema";

export async function getCommandCenterData() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const hc = alias(clubs, "hc");
  const ac = alias(clubs, "ac");

  const [
    playerAgg,
    clubCount,
    refCount,
    venueCount,
    matchAgg,
    liveMatches,
    verificationMix,
    tournamentMix,
    activity,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        verified: sql<number>`count(*) filter (where ${players.verificationStatus} = 'verified')`,
        pending: sql<number>`count(*) filter (where ${players.verificationStatus} = 'pending')`,
        flagged: sql<number>`count(*) filter (where ${players.verificationStatus} = 'flagged')`,
        rejected: sql<number>`count(*) filter (where ${players.verificationStatus} = 'rejected')`,
      })
      .from(players),
    db.select({ n: count() }).from(clubs).where(eq(clubs.active, true)),
    db
      .select({
        active: sql<number>`count(*) filter (where ${referees.status} in ('active','expiring'))`,
        total: count(),
      })
      .from(referees),
    db.select({ n: count() }).from(venues),
    db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${matches.status} = 'completed')`,
        live: sql<number>`count(*) filter (where ${matches.status} = 'live')`,
        upcoming: sql<number>`count(*) filter (where ${matches.status} = 'scheduled' and ${matches.scheduledAt} >= now())`,
        thisWeek: sql<number>`count(*) filter (where ${matches.scheduledAt} >= ${weekAgo.toISOString()})`,
      })
      .from(matches),
    db
      .select({
        id: matches.id,
        minute: matches.currentMinute,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        period: matches.period,
        home: hc.name,
        homeShort: hc.shortName,
        homeColor: hc.primaryColor,
        away: ac.name,
        awayShort: ac.shortName,
        awayColor: ac.primaryColor,
        tournament: tournaments.name,
        venue: venues.name,
      })
      .from(matches)
      .innerJoin(tournaments, eq(tournaments.id, matches.tournamentId))
      .leftJoin(hc, eq(hc.id, matches.homeClubId))
      .leftJoin(ac, eq(ac.id, matches.awayClubId))
      .leftJoin(venues, eq(venues.id, matches.venueId))
      .where(eq(matches.status, "live")),
    db
      .select({
        status: players.verificationStatus,
        n: count(),
      })
      .from(players)
      .groupBy(players.verificationStatus),
    db
      .select({ status: tournaments.status, n: count() })
      .from(tournaments)
      .groupBy(tournaments.status),
    db
      .select({
        id: auditLogs.id,
        actorName: auditLogs.actorName,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(9),
  ]);

  const leaderboard = async (
    col:
      | typeof playerStats.goals
      | typeof playerStats.assists
      | typeof playerStats.saves,
    min = 1,
  ) =>
    db
      .select({
        id: players.id,
        name: players.fullName,
        club: clubs.shortName,
        value: col,
        position: players.position,
      })
      .from(playerStats)
      .innerJoin(players, eq(players.id, playerStats.playerId))
      .leftJoin(clubs, eq(clubs.id, players.clubId))
      .where(and(eq(playerStats.season, "career"), gte(col, min)))
      .orderBy(desc(col))
      .limit(7);

  const [topScorers, topAssists, topSaves, topRated] = await Promise.all([
    leaderboard(playerStats.goals),
    leaderboard(playerStats.assists),
    leaderboard(playerStats.saves),
    db
      .select({
        id: players.id,
        name: players.fullName,
        club: clubs.shortName,
        value: playerStats.score,
        position: players.position,
      })
      .from(playerStats)
      .innerJoin(players, eq(players.id, playerStats.playerId))
      .leftJoin(clubs, eq(clubs.id, players.clubId))
      .where(and(eq(playerStats.season, "career"), gte(playerStats.appearances, 3)))
      .orderBy(desc(playerStats.score))
      .limit(7),
  ]);

  const p = playerAgg[0];
  const compliance = p.total ? (Number(p.verified) / p.total) * 100 : 0;

  return {
    kpis: {
      players: p.total,
      playersVerified: Number(p.verified),
      clubs: clubCount[0].n,
      refereesActive: Number(refCount[0].active),
      refereesTotal: refCount[0].total,
      venues: venueCount[0].n,
      matchesTotal: matchAgg[0].total,
      matchesCompleted: Number(matchAgg[0].completed),
      matchesLive: Number(matchAgg[0].live),
      matchesUpcoming: Number(matchAgg[0].upcoming),
      compliance,
    },
    verificationMix: verificationMix.map((r) => ({
      status: r.status,
      n: r.n,
    })),
    tournamentMix,
    liveMatches,
    activity,
    leaderboards: { topScorers, topAssists, topSaves, topRated },
  };
}
