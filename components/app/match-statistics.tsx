import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATCH_EVENT_STYLE } from "./match-event-style";
import { cn } from "@/lib/utils";
import type { MatchStatistic } from "@/lib/match-statistics";

export function MatchStatistics({ stats, homeShort, awayShort }: {
  stats: MatchStatistic[]; homeShort: string | null; awayShort: string | null;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Statistik Pertandingan</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-3 text-[10px] font-semibold text-ink-secondary">
          <span className="flex min-w-0 items-center gap-1.5"><span className="size-2 shrink-0 rounded-full bg-brand" /><span className="truncate">{homeShort ?? "Tuan rumah"}</span></span>
          <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">{awayShort ?? "Tamu"}</span><span className="size-2 shrink-0 rounded-full bg-block-blue" /></span>
        </div>
        <dl className="space-y-3">
          {stats.map(({ label, type, home, away }) => {
            const style = MATCH_EVENT_STYLE[type];
            const Icon = style.icon;
            const total = home + away || 1;
            return (
              <div key={label}>
                <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
                  <dt className={cn("col-start-2 row-start-1 mx-auto inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold", style.tile)}><Icon className="size-3.5 shrink-0" /><span>{label}</span></dt>
                  <dd className="col-start-1 row-start-1 font-display text-xl tabular-nums"><span className="sr-only">{homeShort ?? "Tuan rumah"}: </span>{home}</dd>
                  <dd className="col-start-3 row-start-1 text-right font-display text-xl tabular-nums"><span className="sr-only">{awayShort ?? "Tamu"}: </span>{away}</dd>
                </div>
                <div aria-hidden="true" className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-elevated">
                  <span className="bg-brand" style={{ width: `${(home / total) * 100}%` }} />
                  <span className="ml-auto bg-block-blue" style={{ width: `${(away / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
