import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Radio, CalendarDays, Users2, Layers, Trophy } from "lucide-react";
import { listCompetitions } from "@/lib/queries/competition";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Progress } from "@/components/ui/misc";
import { StatusBadge } from "@/components/app/status-badge";
import { Card } from "@/components/ui/card";
import { SearchBox, FilterSelect } from "@/components/app/list-controls";
import { TOURNAMENT_STATUS } from "@/lib/status";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Kompetisi") };
}
export const dynamic = "force-dynamic";

/** Statuses offered by the filter; the page opens on "ongoing" when none is chosen. */
const STATUS_FILTER = ["ongoing", "ready", "verification", "registration", "draft", "completed", "archived"];

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { t, fmt } = await getI18n();
  const user = await requireCapability("competition:view");
  const params = await searchParams;
  const all = await listCompetitions();
  const canWrite = can(user, "competition:create");

  const status = params.status ?? "ongoing";
  const q = params.q?.trim().toLowerCase() ?? "";
  const rows = all.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      (!q || [c.name, c.season, c.organizer].some((v) => v?.toLowerCase().includes(q))),
  );

  return (
    <div>
      <PageHeader
        title="Competition & Rules"
        description={t("Satu turnamen memiliki banyak KU — masing-masing dengan format Liga atau Cup, jadwal, klasemen, dan peserta sendiri.")}
        actions={
          canWrite && (
            <Button size="sm" href="/kompetisi/baru">
              <Plus className="size-3.5" /> {t("Turnamen Baru")}
            </Button>
          )
        }
      />

      {all.length > 0 && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <SearchBox placeholder={t("Cari turnamen…")} />
            <FilterSelect
              param="status"
              defaultValue="ongoing"
              placeholder={t("Semua status")}
              options={STATUS_FILTER.map((s) => ({ value: s, label: t.dyn(TOURNAMENT_STATUS[s].label) }))}
            />
          </div>
        </Card>
      )}

      {all.length > 0 && rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t("Tidak ada turnamen yang cocok")}
          description={t("Ubah pencarian atau status untuk melihat turnamen lain.")}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t("Belum ada turnamen")}
          description={
            canWrite
              ? t("Buat turnamen pertama, lalu tambahkan KU yang dipertandingkan di dalamnya.")
              : t("Turnamen akan tampil di sini setelah dibuat oleh operator.")
          }
          action={
            canWrite ? (
              <Button size="sm" href="/kompetisi/baru">
                <Plus className="size-3.5" /> {t("Buat turnamen")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((c) => {
            const progress = c.totalMatches > 0 ? (c.playedMatches / c.totalMatches) * 100 : 0;
            return (
              <Link
                key={c.id}
                href={`/kompetisi/${c.id}`}
                className="group rounded-xl border border-line bg-surface/70 p-4 transition-colors hover:border-brand/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink group-hover:text-brand">{c.name}</h3>
                      {c.liveMatches > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-danger">
                          <Radio className="size-3 animate-live" /> {t("{n} LANGSUNG", { n: c.liveMatches })}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {t("Musim {season}", { season: c.season })}
                      {c.organizer ? ` · ${c.organizer}` : ""}
                    </p>
                  </div>
                  <StatusBadge kind="tournament" value={c.status} dot />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {c.kus.length ? (
                    c.kus.map((k) => (
                      <Badge key={k.id} tone="info" className="!py-0">
                        {k.ageCode ?? "—"}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-ink-muted">{t("Belum ada KU")}</span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Layers className="size-3" /> {t("{n} KU", { n: c.kus.length })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users2 className="size-3" /> {t("{n} SSB", { n: c.teams })}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {c.startDate ? fmt.date(c.startDate) : "—"}
                  </span>
                </div>

                {c.totalMatches > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] text-ink-muted">
                      <span>{t("Progres pertandingan")}</span>
                      <span className="tabular-nums">
                        {c.playedMatches} / {c.totalMatches}
                      </span>
                    </div>
                    <Progress value={progress} tone={progress === 100 ? "success" : "brand"} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
