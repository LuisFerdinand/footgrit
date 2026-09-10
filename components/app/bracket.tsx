import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MatchRowData } from "./match-row";
import { STAGE_LABEL } from "@/lib/status";

/**
 * Knockout bracket — columns per round, connectors drawn with borders.
 * Reads left-to-right: quarters → semis → final (+ third place shown separately).
 */
export function Bracket({ matches }: { matches: MatchRowData[] }) {
  const thirdPlace = matches.filter((m) => m.stage === "third_place");
  const main = matches.filter((m) => m.stage !== "third_place");

  const rounds = [...new Set(main.map((m) => m.round))].sort((a, b) => a - b);
  if (rounds.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-xs text-ink-muted">
        Bagan babak gugur akan tersedia setelah fase grup selesai.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {rounds.map((round) => {
          const roundMatches = main.filter((m) => m.round === round);
          const stage = roundMatches[0]?.stage ?? "";
          return (
            <div key={round} className="flex min-w-[220px] flex-1 flex-col justify-around gap-4">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                {STAGE_LABEL[stage] ?? `Babak ${round}`}
              </p>
              {roundMatches.map((m) => (
                <BracketMatch key={m.id} m={m} />
              ))}
            </div>
          );
        })}
      </div>

      {thirdPlace.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Perebutan Tempat Ketiga
          </p>
          <div className="max-w-[240px]">
            <BracketMatch m={thirdPlace[0]} />
          </div>
        </div>
      )}
    </div>
  );
}

function BracketMatch({ m }: { m: MatchRowData }) {
  const done = m.status === "completed";
  const homeWon = done && m.homeScore > m.awayScore;
  const awayWon = done && m.awayScore > m.homeScore;

  return (
    <Link
      href={`/match-ops/${m.id}`}
      className="block overflow-hidden rounded-lg border border-line bg-surface-2/40 transition-colors hover:border-grit/40"
    >
      <BracketSide
        name={m.homeName ?? m.homePlaceholder ?? "TBD"}
        short={m.homeShort}
        color={m.homeColor}
        score={done ? m.homeScore : null}
        won={homeWon}
        lost={awayWon}
      />
      <div className="h-px bg-line" />
      <BracketSide
        name={m.awayName ?? m.awayPlaceholder ?? "TBD"}
        short={m.awayShort}
        color={m.awayColor}
        score={done ? m.awayScore : null}
        won={awayWon}
        lost={homeWon}
      />
      <div className="border-t border-line-soft bg-surface/60 px-2.5 py-1 text-[9px] text-ink-muted">
        {m.status === "live"
          ? `Berlangsung · ${m.currentMinute}'`
          : done
            ? "Selesai"
            : "Terjadwal"}
      </div>
    </Link>
  );
}

function BracketSide({
  name,
  short,
  color,
  score,
  won,
  lost,
}: {
  name: string;
  short?: string | null;
  color?: string | null;
  score: number | null;
  won?: boolean;
  lost?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-2",
        won && "bg-grit/5",
      )}
    >
      <span
        className="grid size-5 shrink-0 place-items-center rounded text-[9px] font-bold text-black"
        style={{ background: color ?? "var(--color-surface-2)" }}
      >
        {short ?? "?"}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs",
          lost ? "text-ink-muted" : won ? "font-semibold text-ink" : "text-ink-secondary",
        )}
      >
        {name}
      </span>
      {score !== null && (
        <span
          className={cn(
            "font-mono text-xs font-bold tabular-nums",
            won ? "text-grit" : "text-ink-muted",
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
