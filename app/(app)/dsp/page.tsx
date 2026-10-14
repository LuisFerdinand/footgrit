import type { Metadata } from "next";
import { and, asc, eq, isNotNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { requireCapability } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ageCategories, clubs, competitions, matchDspSubmissions, matchLineups, matches, tournaments } from "@/lib/db/schema";
import { getEligibleMatchPlayers } from "@/lib/queries/match-roster";
import { PageHeader } from "@/components/app/page-header";
import { FilterSelect } from "@/components/app/list-controls";
import { EmptyState } from "@/components/ui/misc";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { formatDateTime } from "@/lib/utils";
import { DspForm } from "./dsp-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Susunan Pemain" };

export default async function DspPage({ searchParams }: { searchParams: Promise<{ ku?: string; match?: string }> }) {
  const actor = await requireCapability("dsp:write");
  const sp = await searchParams;
  if (!actor.clubId || actor.role !== "coach") return <EmptyState title="Klub pelatih belum diatur" description="Admin perlu menghubungkan akun pelatih dengan SSB pada profil pelatih." />;
  const H = alias(clubs, "dsp_home"), A = alias(clubs, "dsp_away");
  const rows = await db.select({ match: matches, competition: competitions.name, age: ageCategories.code, home: H.name, away: A.name })
    .from(matches).innerJoin(tournaments, eq(tournaments.id, matches.tournamentId)).innerJoin(competitions, eq(competitions.id, tournaments.competitionId))
    .leftJoin(ageCategories, eq(ageCategories.id, tournaments.ageCategoryId)).leftJoin(H, eq(H.id, matches.homeClubId)).leftJoin(A, eq(A.id, matches.awayClubId))
    .leftJoin(matchDspSubmissions, and(eq(matchDspSubmissions.matchId, matches.id), eq(matchDspSubmissions.clubId, actor.clubId)))
    .where(and(or(eq(matches.homeClubId, actor.clubId), eq(matches.awayClubId, actor.clubId)), or(eq(matches.status, "scheduled"), isNotNull(matchDspSubmissions.id)))).orderBy(asc(matches.scheduledAt));
  const kus = [...new Map(rows.map((r) => [r.match.tournamentId, { value: r.match.tournamentId, label: `${r.competition} · ${r.age ?? "KU"}` }])).values()];
  const fixtures = rows.filter((r) => r.match.tournamentId === sp.ku);
  const chosen = fixtures.find((r) => r.match.id === sp.match);
  const [club] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, actor.clubId));
  const detail = chosen ? await Promise.all([
    getEligibleMatchPlayers(chosen.match.tournamentId, [actor.clubId]),
    db.select().from(matchLineups).where(and(eq(matchLineups.matchId, chosen.match.id), eq(matchLineups.clubId, actor.clubId))),
    db.select().from(matchDspSubmissions).where(and(eq(matchDspSubmissions.matchId, chosen.match.id), eq(matchDspSubmissions.clubId, actor.clubId))),
    db.select({ rules: ageCategories.rules }).from(tournaments).leftJoin(ageCategories, eq(ageCategories.id, tournaments.ageCategoryId)).where(eq(tournaments.id, chosen.match.tournamentId)),
  ]) : null;
  return <div className="space-y-4"><AutoRefresh seconds={10} /><PageHeader title="Daftar Susunan Pemain (DSP)" description={`Pilih KU, pertandingan, lalu susunan pemain ${club?.name ?? "klub Anda"}.`} />
    <div className="flex flex-wrap gap-3"><FilterSelect param="ku" placeholder="1. Pilih KU" options={kus} resets={["match"]} />
      {sp.ku && <FilterSelect param="match" placeholder="2. Pilih pertandingan" options={fixtures.map((r) => ({ value: r.match.id, label: `${r.home ?? "TBD"} vs ${r.away ?? "TBD"} · ${formatDateTime(r.match.scheduledAt)}${r.match.status !== "scheduled" ? " · Terkunci" : ""}` }))} />}</div>
    {chosen && detail ? <DspForm key={chosen.match.id} matchId={chosen.match.id} clubName={club?.name ?? "Klub"} coachName={actor.name ?? ""}
      players={detail[0]} initial={detail[1].map((p) => ({ playerId: p.playerId, role: p.role }))}
      submission={detail[2][0] ? { coachName: detail[2][0].coachName, submittedAt: detail[2][0].submittedAt.toISOString() } : null}
      locked={chosen.match.status !== "scheduled" || chosen.match.period !== "not_started"} rules={detail[3][0]?.rules} />
      : <EmptyState title={kus.length ? "Pilih pertandingan untuk mengisi DSP" : "Belum ada jadwal untuk klub Anda"} description="DSP berisi pemain klub sesuai KU pertandingan." />}
  </div>;
}
