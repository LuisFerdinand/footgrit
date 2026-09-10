import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Mail, Phone, User } from "lucide-react";
import { getClubProfile } from "@/lib/queries/registry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/ui/misc";
import { STAGE_LABEL, POSITION } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getClubProfile(id);
  return { title: d?.club.name ?? "Klub" };
}

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getClubProfile(id);
  if (!d) notFound();
  const { club, squad, comps, recentMatches } = d;

  const byCategory = squad.reduce<Record<string, typeof squad>>((acc, p) => {
    const k = p.ageCode ?? "Lainnya";
    (acc[k] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <Link
        href="/registry/klub"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar klub
      </Link>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={club.logoUrl} name={club.shortName} size={80} square className="border border-line" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink">{club.name}</h1>
              <Badge tone={club.type === "academy" ? "violet" : "info"}>
                {club.type === "academy" ? "Akademi" : "Klub"}
              </Badge>
              <span
                className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted"
              >
                <span className="size-2 rounded-full" style={{ background: club.primaryColor ?? "#00e28a" }} />
                Warna klub
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3" /> {club.city}, {club.province}
              </span>
              {club.homeVenue && (
                <Link href={`/registry/venue/${club.homeVenue.id}`} className="hover:text-ink">
                  Kandang: {club.homeVenue.name}
                </Link>
              )}
              <span>Berdiri {club.foundedYear ?? "—"}</span>
              {club.accreditation && <span className="text-grit">{club.accreditation}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-muted">
              {club.contactName && (
                <span className="flex items-center gap-1"><User className="size-3" /> {club.contactName}</span>
              )}
              {club.contactEmail && (
                <span className="flex items-center gap-1"><Mail className="size-3" /> {club.contactEmail}</span>
              )}
              {club.contactPhone && (
                <span className="flex items-center gap-1"><Phone className="size-3" /> {club.contactPhone}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-1 sm:gap-1.5">
            <div>
              <div className="text-lg font-semibold tabular-nums text-ink">{squad.length}</div>
              <div className="text-[10px] text-ink-muted">Pemain</div>
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums text-ink">{comps.length}</div>
              <div className="text-[10px] text-ink-muted">Kompetisi</div>
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums text-ink">
                {Object.keys(byCategory).length}
              </div>
              <div className="text-[10px] text-ink-muted">Kelompok umur</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Skuad</CardTitle>
              <span className="text-[11px] text-ink-muted">{squad.length} pemain terdaftar</span>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(byCategory)
                .sort()
                .map(([cat, list]) => (
                  <div key={cat}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge tone="info">{cat}</Badge>
                      <span className="text-[11px] text-ink-muted">{list.length} pemain</span>
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {list.map((p) => (
                        <Link
                          key={p.id}
                          href={`/registry/pemain/${p.id}`}
                          className="flex items-center gap-2.5 rounded-lg border border-line-soft bg-surface-2/40 p-2 transition-colors hover:border-grit/30"
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 text-[10px] font-semibold text-ink-muted">
                            {p.jerseyNumber ?? "–"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-ink">
                              {p.fullName}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              {POSITION[p.position].label} · {p.apps} main · {p.goals} gol
                            </span>
                          </span>
                          <StatusBadge kind="verification" value={p.verificationStatus} />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kompetisi</CardTitle>
            </CardHeader>
            <CardContent>
              {comps.length ? (
                <ul className="space-y-2.5">
                  {comps.map((c) => (
                    <li key={c.tournamentId}>
                      <Link
                        href={`/kompetisi/${c.tournamentId}`}
                        className="block rounded-lg border border-line-soft bg-surface-2/40 p-2.5 transition-colors hover:border-grit/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-ink">{c.name}</span>
                          <StatusBadge kind="tournament" value={c.status} />
                        </div>
                        {c.played != null && c.played > 0 && (
                          <p className="mt-1 text-[10px] text-ink-muted">
                            Peringkat {c.rank} · {c.played} main · {c.won}M {c.drawn}S {c.lost}K · {c.points} poin
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Belum ikut kompetisi" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pertandingan Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMatches.length ? (
                <ul className="space-y-1.5">
                  {recentMatches.map((m) => {
                    const isHome = m.homeClubId === id;
                    return (
                      <li key={m.id}>
                        <Link
                          href={`/match-ops/${m.id}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2"
                        >
                          <span className="min-w-0 truncate text-ink-secondary">
                            {m.homeShort} v {m.awayShort}
                          </span>
                          {m.status === "completed" ? (
                            <span className="shrink-0 font-mono font-semibold text-ink">
                              {m.homeScore}–{m.awayScore}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] text-ink-muted">
                              {formatDate(m.scheduledAt)}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-4 text-center text-xs text-ink-muted">Belum ada pertandingan.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

void STAGE_LABEL;
