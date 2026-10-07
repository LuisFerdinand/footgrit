"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Flag, Plus, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClubCrest } from "@/components/app/club-crest";
import { cn } from "@/lib/utils";
import { POSITION } from "@/lib/status";
import { EventForm, type ClubMini, type MatchClock, type RosterPlayer } from "./event-entry";

/** What a player has done in this match — drives the inline tags. */
export type PlayerTally = {
  goals: number;
  ownGoals: number;
  assists: number;
  yellow: number;
  red: number;
  subOff: number | null;
  subOn: number | null;
};

export type TeamSheet = {
  club: ClubMini;
  formation: string | null;
  side: "home" | "away";
  players: RosterPlayer[];
};

const GROUP_LABEL: Record<RosterPlayer["role"], string> = {
  starter: "Starter",
  substitute: "Cadangan",
  squad: "Skuad terdaftar",
};

export function PlayerList({
  matchId,
  clock,
  home,
  away,
  tallies,
  canRecord,
  hint,
}: {
  matchId: string;
  clock: MatchClock;
  home: TeamSheet;
  away: TeamSheet;
  tallies: Record<string, PlayerTally>;
  /** Operator may record events (role allows it and the match has kicked off). */
  canRecord: boolean;
  /** Shown instead of the click hint when recording is unavailable. */
  hint?: string;
}) {
  // undefined = closed · null = team-level event · object = a specific player
  const [target, setTarget] = React.useState<{ id: string; clubId: string } | null | undefined>(
    undefined,
  );
  const rosters = React.useMemo(
    () => ({ [home.club.id]: home.players, [away.club.id]: away.players }),
    [home, away],
  );

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" /> Daftar Pemain
          </CardTitle>
          <CardDescription className="mt-1">
            {canRecord ? "Klik pemain untuk mencatat kejadian." : hint}
          </CardDescription>
        </div>
        {canRecord && (
          <Button size="sm" variant="outline" onClick={() => setTarget(null)}>
            <Flag className="size-3.5" /> Kejadian Tim
          </Button>
        )}
      </CardHeader>
      <CardContent className="@container">
        <div className="grid gap-4 @xl:grid-cols-2">
          {[home, away].map((t) => (
            <TeamColumn
              key={t.club.id}
              team={t}
              tallies={tallies}
              canRecord={canRecord}
              onPick={(p) => setTarget({ id: p.id, clubId: t.club.id })}
            />
          ))}
        </div>
      </CardContent>

      <Dialog
        open={target !== undefined}
        onOpenChange={(v) => {
          if (!v) setTarget(undefined);
        }}
      >
        <DialogContent
          title="Catat Kejadian"
          description={
            target === null
              ? "Kejadian tim seperti tendangan sudut atau offside — atau pilih pemain secara manual."
              : undefined
          }
          className="max-w-md"
        >
          {target !== undefined && (
            <EventForm
              matchId={matchId}
              clock={clock}
              homeClub={home.club}
              awayClub={away.club}
              rosters={rosters}
              player={target}
              onDone={() => setTarget(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TeamColumn({
  team,
  tallies,
  canRecord,
  onPick,
}: {
  team: TeamSheet;
  tallies: Record<string, PlayerTally>;
  canRecord: boolean;
  onPick: (p: RosterPlayer) => void;
}) {
  const groups = (["starter", "substitute", "squad"] as const)
    .map((role) => ({ role, players: team.players.filter((p) => p.role === role) }))
    .filter((g) => g.players.length);

  return (
    <section className="min-w-0 rounded-2xl bg-surface-2 p-2">
      <header className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
        <ClubCrest logoUrl={team.club.logo} short={team.club.short} color={team.club.color} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{team.club.name}</p>
          <p className="text-[11px] text-ink-muted">
            {team.side === "home" ? "Tuan rumah" : "Tamu"}
            {team.formation ? ` · ${team.formation}` : ""}
          </p>
        </div>
        <span className="font-display text-2xl leading-none text-ink-muted">{team.players.length}</span>
      </header>

      {groups.length === 0 && (
        <p className="px-3 py-8 text-center text-xs text-ink-muted">Belum ada pemain terdaftar.</p>
      )}

      {groups.map((g) => (
        <div key={g.role} className="mt-2">
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {GROUP_LABEL[g.role]}
          </p>
          <ul className="space-y-1">
            {g.players.map((p) => (
              <li key={p.id}>
                <PlayerRow p={p} tally={tallies[p.id]} canRecord={canRecord} onPick={() => onPick(p)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function PlayerRow({
  p,
  tally,
  canRecord,
  onPick,
}: {
  p: RosterPlayer;
  tally?: PlayerTally;
  canRecord: boolean;
  onPick: () => void;
}) {
  const body = (
    <>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-surface font-display text-base leading-none text-ink ring-1 ring-line">
        {p.number ?? "–"}
        {p.captain && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-night text-[8px] font-bold text-white">
            C
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{p.name}</span>
        <span className="block text-[11px] text-ink-muted">{POSITION[p.position]?.label ?? p.position}</span>
      </span>
      {tally && <Tags t={tally} />}
      {canRecord && (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Plus className="size-3.5" />
        </span>
      )}
    </>
  );

  if (!canRecord) {
    return <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`Catat kejadian untuk ${p.name}`}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {body}
    </button>
  );
}

function Tags({ t }: { t: PlayerTally }) {
  const items: React.ReactNode[] = [];
  if (t.goals)
    items.push(
      <Tag key="g" className="bg-brand text-white" title={`${t.goals} gol`}>
        {t.goals > 1 ? `${t.goals} ` : ""}Gol
      </Tag>,
    );
  if (t.ownGoals)
    items.push(
      <Tag key="og" className="bg-night text-white" title={`${t.ownGoals} gol bunuh diri`}>
        OG
      </Tag>,
    );
  if (t.assists)
    items.push(
      <Tag key="a" className="bg-block-blue text-white" title={`${t.assists} assist`}>
        {t.assists > 1 ? `${t.assists} ` : ""}A
      </Tag>,
    );
  for (let i = 0; i < t.yellow; i++)
    items.push(
      <span key={`y${i}`} title="Kartu kuning" className="h-3.5 w-2.5 rounded-[2px] bg-block-yellow ring-1 ring-black/10" />,
    );
  for (let i = 0; i < t.red; i++)
    items.push(
      <span key={`r${i}`} title="Kartu merah" className="h-3.5 w-2.5 rounded-[2px] bg-brand ring-1 ring-black/10" />,
    );
  if (t.subOn != null)
    items.push(
      <Tag key="in" className="bg-success/12 text-success" title={`Masuk menit ${t.subOn}`}>
        <ArrowDownLeft className="size-3" />
        {t.subOn}&rsquo;
      </Tag>,
    );
  if (t.subOff != null)
    items.push(
      <Tag key="out" className="bg-danger/10 text-danger" title={`Keluar menit ${t.subOff}`}>
        <ArrowUpRight className="size-3" />
        {t.subOff}&rsquo;
      </Tag>,
    );
  if (!items.length) return null;
  return <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">{items}</span>;
}

function Tag({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
