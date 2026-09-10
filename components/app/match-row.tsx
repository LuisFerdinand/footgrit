import Link from "next/link";
import { Radio } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { STAGE_LABEL } from "@/lib/status";

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
  awayShort?: string | null;
  awayName?: string | null;
  awayColor?: string | null;
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
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-line-soft bg-surface-2/30 px-3 py-2.5 transition-colors hover:border-grit/30"
    >
      <Side
        name={m.homeName ?? m.homePlaceholder}
        short={m.homeShort}
        color={m.homeColor}
        align="right"
        dim={awayWon}
        bold={homeWon}
      />
      <div className="flex flex-col items-center">
        {done || live ? (
          <span
            className={cn(
              "font-mono text-sm font-bold tabular-nums",
              live ? "text-danger" : "text-ink",
            )}
          >
            {m.homeScore}<span className="mx-0.5 text-ink-muted">-</span>{m.awayScore}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-ink-muted">
            {formatDateTime(m.scheduledAt).replace(", ", " · ")}
          </span>
        )}
        {live && (
          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-danger">
            <Radio className="size-2 animate-live" />
            {m.currentMinute}&rsquo;
          </span>
        )}
      </div>
      <Side
        name={m.awayName ?? m.awayPlaceholder}
        short={m.awayShort}
        color={m.awayColor}
        align="left"
        dim={homeWon}
        bold={awayWon}
      />
      {showMeta && (
        <div className="col-span-3 mt-1 flex items-center justify-center gap-2 text-[9px] text-ink-muted">
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
  align,
  dim,
  bold,
}: {
  name?: string | null;
  short?: string | null;
  color?: string | null;
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
      <span
        className="grid size-6 shrink-0 place-items-center rounded-md text-[9px] font-bold text-black"
        style={{ background: color ?? "var(--color-surface-2)" }}
      >
        {short ?? "?"}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-xs",
          dim ? "text-ink-muted" : bold ? "font-semibold text-ink" : "text-ink-secondary",
        )}
      >
        {name ?? "TBD"}
      </span>
    </div>
  );
}
