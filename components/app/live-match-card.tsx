import Link from "next/link";
import { Radio, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClubCrest } from "./club-crest";

export type LiveMatch = {
  id: string;
  minute: number | null;
  homeScore: number;
  awayScore: number;
  period: string;
  home: string | null;
  homeShort: string | null;
  homeColor?: string | null;
  homeLogo?: string | null;
  away: string | null;
  awayShort: string | null;
  awayColor?: string | null;
  awayLogo?: string | null;
  tournament: string;
  venue?: string | null;
};

const PERIOD_LABEL: Record<string, string> = {
  first_half: "Babak 1",
  halftime: "Jeda",
  second_half: "Babak 2",
  extra_time: "Perpanjangan Waktu",
  penalties: "Adu Penalti",
};

export function LiveMatchCard({ m, compact }: { m: LiveMatch; compact?: boolean }) {
  return (
    <Link
      href={`/match-ops/${m.id}`}
      className="group block rounded-xl border border-line bg-surface/70 p-4 transition-colors hover:border-danger/40"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
          <Radio className="size-3 animate-live" />
          LANGSUNG · {m.minute}&rsquo;
        </span>
        <span className="truncate text-[11px] text-ink-muted">{m.tournament}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamSide name={m.home} short={m.homeShort} color={m.homeColor} logo={m.homeLogo} align="left" />
        <div className="flex shrink-0 flex-col items-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-ink">
            {m.homeScore}<span className="mx-1 text-ink-muted">–</span>{m.awayScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">
            {PERIOD_LABEL[m.period] ?? "Berlangsung"}
          </span>
        </div>
        <TeamSide name={m.away} short={m.awayShort} color={m.awayColor} logo={m.awayLogo} align="right" />
      </div>

      {!compact && m.venue && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-2.5 text-[11px] text-ink-muted">
          <MapPin className="size-3" />
          {m.venue}
        </div>
      )}
    </Link>
  );
}

function TeamSide({
  name,
  short,
  color,
  logo,
  align,
}: {
  name: string | null;
  short: string | null;
  color?: string | null;
  logo?: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <ClubCrest logoUrl={logo} short={short} color={color ?? "var(--color-grit)"} size={36} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink">{name}</span>
      </span>
    </div>
  );
}
