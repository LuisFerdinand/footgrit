import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Radio, CalendarDays, Users2, Layers, Trophy, MapPin } from "lucide-react";
import { getCompetitionOverview } from "@/lib/queries/competition";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/misc";
import { MatchRow, MatchStack } from "@/components/app/match-row";
import { StatusBadge } from "@/components/app/status-badge";
import { formatLabel, categoryLabel } from "@/lib/ku";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function CompetitionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, fmt } = await getI18n();
  const user = await requireCapability("competition:view");
  const { id } = await params;
  const d = await getCompetitionOverview(id);
  if (!d) notFound();
  const { kus, totals, recentResults, upcoming } = d;
  const canManage = can(user, "ku:create");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("KU")} value={totals.kus} block="red" />
        <StatCard label={t("SSB Peserta")} value={totals.clubs} block="blue" hint={t("di semua KU")} />
        <StatCard
          label={t("Pertandingan")}
          block="yellow"
          value={totals.matches}
          hint={t("{done} selesai · {goals} gol", { done: totals.completed, goals: totals.goals })}
        />
        <StatCard
          label={t("Sedang Berlangsung")}
          block="night"
          value={totals.live}
          tone={totals.live > 0 ? "danger" : "default"}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{t("KU dalam turnamen ini")}</h2>
        {canManage && kus.length > 0 && (
          <Button size="sm" variant="outline" href={`/kompetisi/${id}/ku/baru`}>
            <Plus className="size-3.5" /> Tambah KU
          </Button>
        )}
      </div>

      {kus.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("Belum ada KU")}
          description={t("Tambahkan KU pertama — pilih kategori usia, format Liga atau Cup, tanggal mulai, dan SSB pesertanya.")}
          action={
            canManage ? (
              <Button size="sm" href={`/kompetisi/${id}/ku/baru`}>
                <Plus className="size-3.5" /> Tambah KU
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kus.map((k) => {
            const progress = k.totalMatches > 0 ? (k.playedMatches / k.totalMatches) * 100 : 0;
            return (
              <Link
                key={k.id}
                href={`/kompetisi/ku/${k.id}`}
                className="group rounded-xl border border-line bg-surface/70 p-4 transition-colors hover:border-brand/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-3xl leading-none tracking-wide text-ink group-hover:text-brand">
                        {k.ageCode ?? "—"}
                      </span>
                      {k.liveMatches > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-danger">
                          <Radio className="size-3 animate-live" /> {t("{n} LANGSUNG", { n: k.liveMatches })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{k.ageLabel ? categoryLabel(t, k.ageLabel) : t("Tanpa kategori usia")}</p>
                  </div>
                  <StatusBadge kind="tournament" value={k.status} dot />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                  <Badge tone={k.format === "cup" ? "violet" : "info"} className="!py-0">
                    {t.dyn(formatLabel(k.format))}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Users2 className="size-3" /> {t("{n} SSB", { n: k.teams })}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {k.startDate ? fmt.date(k.startDate) : t("Belum dijadwalkan")}
                  </span>
                  {k.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {k.city}
                    </span>
                  )}
                </div>

                {k.totalMatches > 0 ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] text-ink-muted">
                      <span>{t("Progres pertandingan")}</span>
                      <span className="tabular-nums">
                        {k.playedMatches} / {k.totalMatches}
                      </span>
                    </div>
                    <Progress value={progress} tone={progress === 100 ? "success" : "brand"} />
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-ink-muted">{t("Jadwal belum dibuat")}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {(recentResults.length > 0 || upcoming.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4" /> {t("Hasil Terakhir")}
              </CardTitle>
              <Link href={`/kompetisi/${id}/jadwal`} className="text-[11px] text-ink-muted hover:text-ink">
                {t("Semua jadwal")}
              </Link>
            </CardHeader>
            <CardContent>
              {recentResults.length ? (
                <MatchStack>
                  {recentResults.map((m) => (
                    <MatchRow key={m.id} m={m} />
                  ))}
                </MatchStack>
              ) : (
                <p className="py-6 text-center text-xs text-ink-muted">{t("Belum ada hasil dikonfirmasi.")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Jadwal Mendatang")}</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length ? (
                <MatchStack>
                  {upcoming.map((m) => (
                    <MatchRow key={m.id} m={m} />
                  ))}
                </MatchStack>
              ) : (
                <p className="py-6 text-center text-xs text-ink-muted">{t("Tidak ada pertandingan terjadwal.")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
