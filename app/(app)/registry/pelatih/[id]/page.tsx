import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, ScrollText, Pencil, Cake } from "lucide-react";
import { getCoachProfile } from "@/lib/queries/registry";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { ClubCrest } from "@/components/app/club-crest";
import { ageFromDob, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getCoachProfile(id);
  return { title: d?.coach.fullName ?? "Pelatih" };
}

export default async function CoachProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getCoachProfile(id);
  if (!d) notFound();
  const { coach: c, club, recentMatches, squadSize } = d;
  const user = await getCurrentUser();
  const canWrite = can(user?.role, "registry:write");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/registry/pelatih"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Kembali
      </Link>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={c.photoUrl} name={c.fullName} size={72} className="border border-line" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-ink">{c.fullName}</h1>
              <Badge tone="violet">{c.licenseLevel}</Badge>
              <StatusBadge kind="coach" value={c.status} dot />
              {canWrite && (
                <Button variant="outline" size="sm" href={`/registry/pelatih/${c.id}/edit`} className="ml-auto">
                  <Pencil className="size-3.5" /> Ubah data
                </Button>
              )}
            </div>
            {c.specialty && <p className="mt-0.5 text-xs text-ink-muted">{c.specialty}</p>}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
              <span className="flex items-center gap-1"><ScrollText className="size-3" /> {c.licenseNumber}</span>
              {c.dob && (
                <span className="flex items-center gap-1"><Cake className="size-3" /> {ageFromDob(c.dob)} th</span>
              )}
              {c.city && <span className="flex items-center gap-1"><MapPin className="size-3" /> {c.city}</span>}
              {c.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {c.email}</span>}
              {c.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {c.phone}</span>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Info label="Diterbitkan">{c.licenseIssuedAt ? formatDate(c.licenseIssuedAt) : "—"}</Info>
              <Info label="Berlaku s.d.">{formatDate(c.licenseExpiry)}</Info>
              <Info label="Pengalaman">{c.experienceYears} tahun</Info>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Klub Asuhan</CardTitle>
        </CardHeader>
        <CardContent>
          {club ? (
            <Link
              href={`/registry/klub/${club.id}`}
              className="flex items-center gap-3 rounded-lg border border-line-soft bg-surface-2/40 p-3 transition-colors hover:border-grit/30"
            >
              <ClubCrest logoUrl={club.logoUrl} short={club.shortName} color={club.primaryColor} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{club.name}</span>
                <span className="text-[11px] text-ink-muted">
                  {club.city} · {squadSize} pemain terdaftar
                </span>
              </span>
            </Link>
          ) : (
            <p className="py-4 text-center text-xs text-ink-muted">Belum terikat dengan klub.</p>
          )}
        </CardContent>
      </Card>

      {club && (
        <Card>
          <CardHeader>
            <CardTitle>Pertandingan Klub</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length ? (
              <ul className="divide-y divide-line-soft">
                {recentMatches.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/match-ops/${m.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-ink">{m.homeShort} v {m.awayShort}</span>
                        <span className="text-[11px] text-ink-muted">{m.tournament}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-right">
                        {m.status === "completed" ? (
                          <span className="font-mono font-semibold text-ink">
                            {m.homeScore}–{m.awayScore}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-muted">{formatDate(m.scheduledAt)}</span>
                        )}
                        <StatusBadge kind="match" value={m.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-xs text-ink-muted">Belum ada pertandingan.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line-soft bg-surface-2/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-0.5 text-ink-secondary">{children}</div>
    </div>
  );
}
