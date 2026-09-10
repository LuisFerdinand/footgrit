import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Radio, CalendarDays, Users2, Trophy } from "lucide-react";
import { listTournaments } from "@/lib/queries/competition";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { StatusBadge } from "@/components/app/status-badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kompetisi" };
export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  cup: "Piala (Grup + Gugur)",
  league: "Liga (Round-robin)",
  hybrid: "Hybrid",
  knockout: "Sistem Gugur",
};

export default async function CompetitionsPage() {
  const rows = await listTournaments();
  const user = await getCurrentUser();
  const canWrite = can(user?.role, "competition:write");

  return (
    <div>
      <PageHeader
        title="Competition & Rules"
        description="Pengelolaan turnamen dengan format Cup, League, Hybrid, dan Knockout — dari draf hingga arsip."
        actions={
          canWrite && (
            <Button size="sm" href="/kompetisi/baru">
              <Plus className="size-3.5" /> Turnamen Baru
            </Button>
          )
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((t) => {
          const progress =
            t.totalMatches > 0 ? (t.playedMatches / t.totalMatches) * 100 : 0;
          return (
            <Link
              key={t.id}
              href={`/kompetisi/${t.id}`}
              className="group rounded-xl border border-line bg-surface/70 p-4 transition-colors hover:border-grit/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink group-hover:text-grit">
                      {t.name}
                    </h3>
                    {t.liveMatches > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-danger">
                        <Radio className="size-3 animate-live" /> {t.liveMatches} LANGSUNG
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{t.host}</p>
                </div>
                <StatusBadge kind="tournament" value={t.status} dot />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <Trophy className="size-3" /> {FORMAT_LABEL[t.format]}
                </span>
                {t.ageCode && (
                  <Badge tone="info" className="!py-0">
                    {t.ageCode}
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Users2 className="size-3" /> {t.teams} tim
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {t.startDate ? formatDate(t.startDate) : "—"}
                </span>
              </div>

              {t.totalMatches > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] text-ink-muted">
                    <span>Progres pertandingan</span>
                    <span className="tabular-nums">
                      {t.playedMatches} / {t.totalMatches}
                    </span>
                  </div>
                  <Progress value={progress} tone={progress === 100 ? "success" : "grit"} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
