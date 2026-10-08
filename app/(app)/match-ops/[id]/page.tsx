import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Flag as FlagIcon, CalendarClock } from "lucide-react";
import { getMatchConsole } from "@/lib/queries/match";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { DEFAULT_MATCH_MINUTES, clockCap } from "@/lib/match-clock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { MatchTimeline } from "@/components/app/match-timeline";
import { ConsoleControls } from "./console-controls";
import type { RosterPlayer } from "./event-entry";
import { PlayerList, type PlayerTally } from "./player-list";
import { ResultControl } from "./result-control";
import { STAGE_LABEL } from "@/lib/status";
import { LINE_ORDER, positionLine } from "@/lib/positions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getMatchConsole(id);
  return {
    title: d ? `${d.homeShort} v ${d.awayShort}` : "Pertandingan",
  };
}

export default async function MatchConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getMatchConsole(id);
  if (!d) notFound();
  const { m } = d;
  const user = await getCurrentUser();
  const canOperate = can(user?.role, "match:operate");
  const canConfirm = can(user?.role, "match:confirm");

  const duration = m.durationMinutes ?? d.ageDuration?.matchDuration ?? DEFAULT_MATCH_MINUTES;
  const clock = {
    status: m.status,
    currentMinute: m.currentMinute,
    clockStartedAt: m.clockStartedAt ? new Date(m.clockStartedAt).toISOString() : null,
    cap: clockCap(duration),
  };
  const playerLookup = Object.fromEntries([
    ...d.squads.map((s) => [s.id, s.name]),
    ...d.lineups.map((l) => [l.playerId, l.name]),
  ]);

  // Team sheets: the confirmed line-up (starters, then bench) when there is
  // one, otherwise every registered player of the club in this age category.
  const byPitchOrder = (a: RosterPlayer, b: RosterPlayer) =>
    LINE_ORDER[positionLine(a.position)] - LINE_ORDER[positionLine(b.position)] || (a.number ?? 99) - (b.number ?? 99);
  const rosterFor = (clubId: string | null): RosterPlayer[] => {
    if (!clubId) return [];
    const lineup = d.lineups.filter((l) => l.clubId === clubId);
    if (lineup.length) {
      return lineup
        .map((l) => ({
          id: l.playerId,
          name: l.name,
          position: l.position,
          number: l.shirtNumber,
          role: l.role,
          captain: l.isCaptain,
        }))
        .sort(byPitchOrder);
    }
    return d.squads
      .filter((s) => s.clubId === clubId)
      .map((s) => ({ id: s.id, name: s.name, position: s.position, number: s.jersey, role: "squad" as const }))
      .sort(byPitchOrder);
  };

  const evs = d.events.filter((e) => !e.voided);

  // Per-player tags for the list. Assists come from the paired "assist"
  // events (as the stats engine counts them), not the goal's relatedPlayerId.
  const tallies: Record<string, PlayerTally> = {};
  const tally = (pid: string) =>
    (tallies[pid] ??= { goals: 0, ownGoals: 0, assists: 0, yellow: 0, red: 0, subOff: null, subOn: null });
  for (const e of evs) {
    if (!e.playerId) continue;
    if (e.type === "goal" || e.type === "penalty_goal") tally(e.playerId).goals++;
    else if (e.type === "own_goal") tally(e.playerId).ownGoals++;
    else if (e.type === "assist") tally(e.playerId).assists++;
    else if (e.type === "yellow_card") tally(e.playerId).yellow++;
    else if (e.type === "red_card" || e.type === "second_yellow") tally(e.playerId).red++;
    else if (e.type === "substitution") {
      tally(e.playerId).subOff = e.minute;
      if (e.relatedPlayerId) tally(e.relatedPlayerId).subOn = e.minute;
    }
  }

  const canRecord = canOperate && m.status !== "scheduled";

  // simple live stats from events
  const countFor = (clubId: string | null, types: string[]) =>
    evs.filter((e) => e.clubId === clubId && types.includes(e.type)).length;
  const stats = [
    ["Tembakan", countFor(m.homeClubId, ["goal", "penalty_goal", "shot_on", "shot_off"]), countFor(m.awayClubId, ["goal", "penalty_goal", "shot_on", "shot_off"])],
    ["Tepat sasaran", countFor(m.homeClubId, ["goal", "penalty_goal", "shot_on"]), countFor(m.awayClubId, ["goal", "penalty_goal", "shot_on"])],
    ["Sudut", countFor(m.homeClubId, ["corner"]), countFor(m.awayClubId, ["corner"])],
    ["Pelanggaran", countFor(m.homeClubId, ["foul"]), countFor(m.awayClubId, ["foul"])],
    ["Kartu kuning", countFor(m.homeClubId, ["yellow_card"]), countFor(m.awayClubId, ["yellow_card"])],
  ];

  return (
    <div>
      {m.status === "live" && <AutoRefresh seconds={12} />}
      <Link
        href="/match-ops"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Semua pertandingan
      </Link>

      {/* Scoreboard */}
      <ConsoleControls
        matchId={id}
        status={m.status}
        period={m.period}
        currentMinute={m.currentMinute}
        clockStartedAt={clock.clockStartedAt}
        duration={duration}
        homeShort={d.homeShort}
        awayShort={d.awayShort}
        homeName={d.homeName}
        awayName={d.awayName}
        homeColor={d.homeColor}
        awayColor={d.awayColor}
        homeLogo={d.homeLogo}
        awayLogo={d.awayLogo}
        homeScore={m.homeScore}
        awayScore={m.awayScore}
        canOperate={canOperate}
        meta={
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-night-muted">
            <Link href={`/kompetisi/${d.tournamentId}`} className="font-semibold text-white hover:underline">
              {d.tournamentName}
            </Link>
            <span>· {STAGE_LABEL[m.stage] ?? m.stage}{m.groupLabel ? ` Grup ${m.groupLabel}` : ""}</span>
            {d.venue && <span className="flex items-center gap-1"><MapPin className="size-3" />{d.venue}</span>}
            {d.referee && <span className="flex items-center gap-1"><FlagIcon className="size-3" />{d.referee}</span>}
            <span className="flex items-center gap-1"><CalendarClock className="size-3" />{formatDateTime(m.scheduledAt)}</span>
            <StatusBadge kind="result" value={m.resultStatus} />
          </div>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Squad list — click a player to record an event (replaces the tactical board) */}
          {m.homeClubId && m.awayClubId && (
            <PlayerList
              matchId={id}
              clock={clock}
              home={{
                club: { id: m.homeClubId, short: d.homeShort ?? "H", name: d.homeName ?? "Tuan rumah", color: d.homeColor, logo: d.homeLogo },
                formation: m.homeFormation,
                side: "home",
                players: rosterFor(m.homeClubId),
              }}
              away={{
                club: { id: m.awayClubId, short: d.awayShort ?? "A", name: d.awayName ?? "Tamu", color: d.awayColor, logo: d.awayLogo },
                formation: m.awayFormation,
                side: "away",
                players: rosterFor(m.awayClubId),
              }}
              tallies={tallies}
              canRecord={canRecord}
              hint={
                canOperate
                  ? "Pencatatan kejadian aktif setelah pertandingan dimulai."
                  : "Susunan pemain kedua tim."
              }
            />
          )}

          {/* Live stats */}
          {(m.status === "live" || m.status === "completed") && (
            <Card>
              <CardHeader>
                <CardTitle>Statistik Pertandingan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {stats.map(([label, h, a]) => {
                  const total = (h as number) + (a as number) || 1;
                  return (
                    <div key={label as string}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold tabular-nums text-ink">{h}</span>
                        <span className="text-ink-muted">{label}</span>
                        <span className="font-semibold tabular-nums text-ink">{a}</span>
                      </div>
                      <div className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-2">
                        <div style={{ width: `${((h as number) / total) * 100}%`, background: d.homeColor ?? "var(--color-brand)" }} />
                        <div style={{ width: `${((a as number) / total) * 100}%`, background: d.awayColor ?? "var(--color-info)" }} className="ml-auto" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Result validation */}
          {(m.status === "completed" || canConfirm) && m.status === "completed" && (
            <ResultControl
              matchId={id}
              resultStatus={m.resultStatus}
              homeScore={m.homeScore}
              awayScore={m.awayScore}
              canConfirm={canConfirm}
              amendmentReason={m.amendmentReason}
            />
          )}
        </div>

        <div className="space-y-4">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Lini Masa Kejadian</CardTitle>
              <span className="text-[11px] text-ink-muted">{evs.length} kejadian</span>
            </CardHeader>
            <CardContent>
              <MatchTimeline
                events={d.events}
                matchId={id}
                homeClubId={m.homeClubId}
                canEdit={canOperate}
                playerLookup={playerLookup}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

