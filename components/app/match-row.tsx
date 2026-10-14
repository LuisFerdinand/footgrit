import Link from "next/link";
import { Radio, CheckCircle2, Circle } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { MATCH_STATUS, STAGE_LABEL } from "@/lib/status";
import { matchWinnerSide } from "@/lib/fixtures";
import { ClubCrest } from "./club-crest";
import { LiveCountdown } from "./match-countdown";
import styles from "./match-row.module.css";
import { GoalScorers } from "./goal-scorers";
import type { MatchGoal } from "@/lib/queries/match-goals";

export type MatchRowData = {
  id: string;
  homeClubId?: string | null;
  awayClubId?: string | null;
  goals?: MatchGoal[];
  homeDspSubmitted?: boolean;
  awayDspSubmitted?: boolean;
  stage: string;
  round: number;
  groupLabel?: string | null;
  bracketSlot?: string | null;
  scheduledAt: Date | string;
  status: string;
  currentMinute?: number | null;
  clockStartedAt?: Date | string | null;
  duration?: number;
  homeScore: number;
  awayScore: number;
  /** Shoot-out score of a level Cup match. */
  homePenalties?: number | null;
  awayPenalties?: number | null;
  homeShort?: string | null;
  homeName?: string | null;
  homeLogo?: string | null;
  awayShort?: string | null;
  awayName?: string | null;
  awayLogo?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  venue?: string | null;
  /** Age group of the KU, when the list spans several. */
  ageCode?: string | null;
  tournamentName?: string | null;
};

/** Overlapping folder cards, including rows wrapped with management controls. */
export function MatchStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

export function MatchRow({ m, showMeta = true }: { m: MatchRowData; showMeta?: boolean }) {
  const live = m.status === "live";
  const done = m.status === "completed";
  const winner = done ? matchWinnerSide(m) : null;
  const homeGoals = (m.goals ?? []).filter((g) => g.clubId === m.homeClubId);
  const awayGoals = (m.goals ?? []).filter((g) => g.clubId === m.awayClubId);
  const hasGoals = homeGoals.length > 0 || awayGoals.length > 0;
  const longGoalList = homeGoals.length > 5 || awayGoals.length > 5;
  const shootout = done && m.homeScore === m.awayScore && m.homePenalties != null && m.awayPenalties != null
    ? `${m.homePenalties}–${m.awayPenalties} pen` : null;

  return (
    <Link href={`/match-ops/${m.id}`} className={cn(styles.ticket, "group block min-w-0 transition-colors hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand focus-visible:outline-none")}>
      <div className="flex items-center justify-between gap-16 border-b border-current/15 px-4 pb-2.5 pt-3.5 text-[10px] font-bold">
        <span className="min-w-0 truncate">{STAGE_LABEL[m.stage] ?? m.stage}{m.groupLabel ? ` · Grup ${m.groupLabel}` : ""}{m.stage === "league" ? ` · Pekan ${m.round}` : ""}</span>
        <span className="shrink-0">{formatDate(m.scheduledAt, { day: "numeric", month: "short" })}</span>
      </div>
      {showMeta && (m.tournamentName || m.ageCode) && <div className="px-4 pt-2 text-[10px] font-semibold">{[m.tournamentName, m.ageCode].filter(Boolean).join(" · ")}</div>}
      <div className={styles.body}>
        <div className={cn(styles.matchInfo, "grid grid-cols-2 items-center gap-3 px-4 py-4 sm:grid-cols-[80px_minmax(0,1fr)_80px]")}>
          <div className={cn(styles.time, "order-1")}>
            <span className="font-display text-2xl italic tabular-nums">{formatTime(m.scheduledAt)}</span>
            <span className="ml-1 text-[9px] font-semibold sm:ml-0 sm:mt-1 sm:block">WIB</span>
          </div>
          <div className={cn(styles.teams, "order-3 col-span-2 mx-auto grid w-full max-w-sm min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:order-2 sm:col-span-1")}>
            <Side name={m.homeName ?? m.homePlaceholder} short={m.homeShort} logo={m.homeLogo} dim={winner === "away"} bold={winner === "home"} dsp={m.homeClubId ? !!m.homeDspSubmitted : undefined} />
            <div className="flex flex-col items-center">
              {done || live ? <span className="whitespace-nowrap font-display text-3xl leading-none tabular-nums">{m.homeScore}<span className="mx-1">–</span>{m.awayScore}</span> : <span className="font-display text-lg italic">VS</span>}
              {shootout && <span className="mt-1 text-[9px] font-semibold">{shootout}</span>}
              {live && <span className="mt-1 flex items-center gap-1 text-[9px] font-bold"><Radio className="size-2 animate-live" />{m.duration ? <LiveCountdown status={m.status} currentMinute={m.currentMinute ?? 0} clockStartedAt={m.clockStartedAt ?? null} duration={m.duration} className="text-current" /> : <>{m.currentMinute ?? 0}&rsquo;</>}</span>}
            </div>
            <Side name={m.awayName ?? m.awayPlaceholder} short={m.awayShort} logo={m.awayLogo} dim={winner === "home"} bold={winner === "away"} dsp={m.awayClubId ? !!m.awayDspSubmitted : undefined} />
          </div>
          {showMeta && m.venue && <div className={cn(styles.venue, "order-2 min-w-0 text-right sm:order-3")}><span className="mb-1 block text-[9px]">Stadion</span><span className="line-clamp-2 text-xs font-bold italic">{m.venue}</span></div>}
        </div>
        {hasGoals && <div className={cn(styles.scorers, "mx-4 grid gap-4 border-t border-current/15 py-3 sm:grid-cols-2 sm:gap-6", longGoalList ? "grid-cols-1" : "grid-cols-2")}>
          <div className={cn(styles.homeGoals, "min-w-0")}>
            <span className={cn(styles.scorerLabel, "block text-[9px] font-bold uppercase tracking-wide")}>{m.homeName ?? m.homePlaceholder ?? "Tuan rumah"}</span>
            <GoalScorers goals={homeGoals} />
          </div>
          <div className={cn(styles.awayGoals, "min-w-0")}>
            <span className={cn(styles.scorerLabel, "block text-[9px] font-bold uppercase tracking-wide")}>{m.awayName ?? m.awayPlaceholder ?? "Tamu"}</span>
            <GoalScorers goals={awayGoals} />
          </div>
        </div>}
      </div>
      <div className="flex justify-end px-4 pb-3">
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold", live ? "bg-brand text-white" : "bg-night text-white")}>{MATCH_STATUS[m.status]?.label ?? m.status}</span>
      </div>
    </Link>
  );
}

function Side({ name, short, logo, dim, bold, dsp }: { name?: string | null; short?: string | null; logo?: string | null; dim?: boolean; bold?: boolean; dsp?: boolean }) {
  return <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
    {dsp !== undefined && <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold", dsp ? "bg-white text-success" : "bg-black/10")} title={dsp ? "DSP sudah submit" : "DSP belum submit"}>{dsp ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}DSP {dsp ? "Sudah submit" : "Belum submit"}</span>}
    <span className="rounded-full border border-current/20 p-1"><ClubCrest logoUrl={logo} short={short} size={40} /></span>
    <span className={cn("line-clamp-2 min-w-0 text-xs leading-snug", dim ? "font-normal" : bold ? "font-bold" : "font-semibold")}>{name ?? "TBD"}</span>
  </div>;
}
