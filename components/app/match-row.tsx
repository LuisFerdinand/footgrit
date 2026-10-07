import Link from "next/link";
import { Radio } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { STAGE_LABEL } from "@/lib/status";
import { ClubCrest } from "./club-crest";

export type MatchRowData = {
  id: string;
  stage: string;
  round: number;
  groupLabel?: string | null;
  bracketSlot?: string | null;
  scheduledAt: Date | string;
  status: string;
  currentMinute?: number | null;
  homeScore: number;
  awayScore: number;
  homeShort?: string | null;
  homeName?: string | null;
  homeColor?: string | null;
  homeLogo?: string | null;
  awayShort?: string | null;
  awayName?: string | null;
  awayColor?: string | null;
  awayLogo?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  venue?: string | null;
};

export function MatchRow({ m, showMeta = true }: { m: MatchRowData; showMeta?: boolean }) {
  const live = m.status === "live";
  const done = m.status === "completed";
  const homeWon = done && m.homeScore > m.awayScore;
  const awayWon = done && m.awayScore > m.homeScore;

  return (
    <Link
      href={`/match-ops/${m.id}`}
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-xl bg-surface-2 px-3.5 py-3 transition-colors hover:bg-elevated"
    >
      <Side
        name={m.homeName ?? m.homePlaceholder}
        short={m.homeShort}
        color={m.homeColor}
        logo={m.homeLogo}
        align="right"
        dim={awayWon}
        bold={homeWon}
      />
      <div className="flex flex-col items-center">
        {done || live ? (
          <span
            className={cn(
              "font-display text-xl leading-none tracking-wide tabular-nums",
              live ? "text-brand" : "text-ink",
            )}
          >
            {m.homeScore}<span className="mx-0.5 text-ink-muted">-</span>{m.awayScore}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-ink-secondary">
            {formatDateTime(m.scheduledAt).replace(", ", " · ")}
          </span>
        )}
        {live && (
          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-bold text-brand">
            <Radio className="size-2 animate-live" />
            {m.currentMinute}&rsquo;
          </span>
        )}
      </div>
      <Side
        name={m.awayName ?? m.awayPlaceholder}
        short={m.awayShort}
        color={m.awayColor}
        logo={m.awayLogo}
        align="left"
        dim={homeWon}
        bold={awayWon}
      />
      {showMeta && (
        <div className="col-span-3 mt-0.5 flex items-center justify-center gap-2 text-[10px] text-ink-muted">
          <span>
            {STAGE_LABEL[m.stage] ?? m.stage}
            {m.groupLabel ? ` · Grup ${m.groupLabel}` : ""}
            {m.stage === "league" ? ` · Pekan ${m.round}` : ""}
          </span>
          {m.venue && <span>· {m.venue}</span>}
        </div>
      )}
    </Link>
  );
}

function Side({
  name,
  short,
  color,
  logo,
  align,
  dim,
  bold,
}: {
  name?: string | null;
  short?: string | null;
  color?: string | null;
  logo?: string | null;
  align: "left" | "right";
  dim?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <ClubCrest logoUrl={logo} short={short} color={color} size={28} />
      <span
        className={cn(
          "min-w-0 truncate text-xs",
          dim ? "text-ink-muted" : bold ? "font-bold text-ink" : "font-medium text-ink-secondary",
        )}
      >
        {name ?? "TBD"}
      </span>
    </div>
  );
}
