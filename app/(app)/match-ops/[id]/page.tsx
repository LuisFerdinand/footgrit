import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Flag as FlagIcon, CalendarClock } from "lucide-react";
import { getMatchConsole } from "@/lib/queries/match";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { liveMinute } from "@/lib/match-engine";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PitchBoard, type PitchPlayer } from "@/components/app/pitch-board";
import { MatchTimeline } from "@/components/app/match-timeline";
import { ConsoleControls } from "./console-controls";
import { EventEntry } from "./event-entry";
import { ResultControl } from "./result-control";
import { STAGE_LABEL, EVENT_LABEL } from "@/lib/status";
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

  const minute = liveMinute(m);
  const playerLookup = Object.fromEntries(d.squads.map((s) => [s.id, s.name]));

  const toPitch = (clubId: string | null): PitchPlayer[] =>
    d.lineups
      .filter((l) => l.clubId === clubId && l.role === "starter")
      .map((l) => ({
        playerId: l.playerId,
        name: l.name,
        slot: l.slot,
        x: l.x,
        y: l.y,
        shirtNumber: l.shirtNumber,
        isCaptain: l.isCaptain,
        position: l.position,
      }));

  const homePitch = toPitch(m.homeClubId);
  const awayPitch = toPitch(m.awayClubId);
  const hasLineups = homePitch.length >= 7 && awayPitch.length >= 7;

  // simple live stats from events
  const evs = d.events.filter((e) => !e.voided);
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
        clockStartedAt={m.clockStartedAt ? new Date(m.clockStartedAt).toISOString() : null}
        homeShort={d.homeShort}
        awayShort={d.awayShort}
        homeName={d.homeName}
        awayName={d.awayName}
        homeColor={d.homeColor}
        awayColor={d.awayColor}
        homeScore={m.homeScore}
        awayScore={m.awayScore}
        canOperate={canOperate}
        meta={
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
            <Link href={`/kompetisi/${d.tournamentId}`} className="hover:text-ink">
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
          {/* Tactical board */}
          <Card>
            <CardHeader>
              <CardTitle>Papan Taktik Visual</CardTitle>
              <span className="text-[11px] text-ink-muted">
                {m.homeFormation} vs {m.awayFormation}
              </span>
            </CardHeader>
            <CardContent>
              {hasLineups ? (
                <PitchBoard
                  home={homePitch}
                  away={awayPitch}
                  homeFormation={m.homeFormation ?? "4-3-3"}
                  awayFormation={m.awayFormation ?? "4-3-3"}
                  homeColor={d.homeColor}
                  awayColor={d.awayColor}
                  homeShort={d.homeShort}
                  awayShort={d.awayShort}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-line px-4 py-12 text-center">
                  <p className="text-sm text-ink">Susunan pemain belum ditetapkan</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Papan taktik akan menampilkan formasi {m.homeFormation} vs {m.awayFormation}
                    {" "}setelah line-up dikonfirmasi oleh masing-masing tim.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div style={{ width: `${((h as number) / total) * 100}%`, background: d.homeColor ?? "var(--color-grit)" }} />
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
          {/* Event entry */}
          {canOperate && m.status !== "scheduled" && (
            <EventEntry
              matchId={id}
              minute={minute}
              homeClub={{ id: m.homeClubId!, short: d.homeShort ?? "H", color: d.homeColor }}
              awayClub={{ id: m.awayClubId!, short: d.awayShort ?? "A", color: d.awayColor }}
              squads={d.squads}
            />
          )}

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

void EVENT_LABEL;
