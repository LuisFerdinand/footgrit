import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ruler,
  Footprints,
  ShieldCheck,
  User2,
  Phone,
} from "lucide-react";
import { getPlayerProfile } from "@/lib/queries/registry";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { Icon } from "@/components/app/icon";
import { Radar } from "@/components/charts/radar";
import { RADAR_AXES, radarValues, per90Summary, percentileOf } from "@/lib/player-metrics";
import { POSITION } from "@/lib/status";
import { ageFromDob, formatDate, formatNumber } from "@/lib/utils";
import { VerificationControl } from "./verification-control";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlayerProfile(id);
  return { title: data?.player.fullName ?? "Pemain" };
}

const FOOT: Record<string, string> = { left: "Kiri", right: "Kanan", both: "Keduanya" };

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlayerProfile(id);
  if (!data) notFound();
  const { player, career, perTournament, peers } = data;
  const user = await getCurrentUser();
  const canVerify = can(user?.role, "registry:verify");

  const radar = radarValues(career);
  const p90 = per90Summary(career);
  const scorePct = percentileOf(
    career?.score ?? 0,
    peers.map((x) => x.score),
  );

  const careerTotals = [
    { label: "Penampilan", value: career?.appearances ?? 0 },
    { label: "Menit", value: formatNumber(career?.minutesPlayed ?? 0) },
    { label: "Gol", value: career?.goals ?? 0 },
    { label: "Assist", value: career?.assists ?? 0 },
    { label: "Penyelamatan", value: career?.saves ?? 0 },
    { label: "Tekel", value: career?.tackles ?? 0 },
    { label: "Nirbobol", value: career?.cleanSheets ?? 0 },
    { label: "Kartu Kuning", value: career?.yellowCards ?? 0 },
  ];

  return (
    <div>
      <Link
        href="/registry/pemain"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar pemain
      </Link>

      {/* Header */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={player.photoUrl} name={player.fullName} size={96} square className="border border-line" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                {player.fullName}
              </h1>
              {player.nickname && (
                <span className="text-sm text-ink-muted">&ldquo;{player.nickname}&rdquo;</span>
              )}
              <StatusBadge kind="verification" value={player.verificationStatus} dot />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-secondary">
              <span className="font-mono text-ink-muted">{player.registrationNo}</span>
              <StatusBadge kind="position" value={player.position} />
              {player.jerseyNumber && <span>No. punggung {player.jerseyNumber}</span>}
              {player.club && (
                <Link href={`/registry/klub/${player.club.id}`} className="flex items-center gap-1.5 hover:text-ink">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: player.club.primaryColor ?? "var(--color-grit)" }}
                  />
                  {player.club.name}
                </Link>
              )}
              {player.ageCategory && <Badge tone="info">{player.ageCategory.code}</Badge>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3 lg:grid-cols-4">
              <Detail icon={CalendarDays} label="Tanggal lahir">
                {player.dob ? `${formatDate(player.dob)} · ${ageFromDob(player.dob)} th` : "—"}
              </Detail>
              <Detail icon={MapPin} label="Tempat lahir">{player.birthPlace ?? "—"}</Detail>
              <Detail icon={Ruler} label="Tinggi / Berat">
                {player.heightCm ? `${player.heightCm} cm` : "—"} / {player.weightKg ? `${player.weightKg} kg` : "—"}
              </Detail>
              <Detail icon={Footprints} label="Kaki dominan">{FOOT[player.foot]}</Detail>
              <Detail icon={User2} label="Wali">{player.guardianName ?? "—"}</Detail>
              <Detail icon={Phone} label="Kontak wali">{player.guardianPhone ?? "—"}</Detail>
              {player.verifiedAt && (
                <Detail icon={ShieldCheck} label="Diverifikasi">{formatDate(player.verifiedAt)}</Detail>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Radar Performa</CardTitle>
            {scorePct !== null && (
              <Badge tone="grit">Persentil {scorePct} · {POSITION[player.position].label}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {career && career.appearances > 0 ? (
              <>
                <Radar
                  axes={RADAR_AXES.map((a) => ({ key: a.key, label: a.label }))}
                  series={[
                    {
                      label: player.fullName,
                      color: "var(--color-chart-1)",
                      values: radar,
                    },
                  ]}
                />
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-center">
                  {[
                    ["Gol / 90", p90.goals],
                    ["Assist / 90", p90.assists],
                    ["Umpan kunci / 90", p90.keyPasses],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-sm font-semibold tabular-nums text-ink">{v}</div>
                      <div className="text-[10px] text-ink-muted">{l}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-xs text-ink-muted">
                Belum ada data pertandingan untuk membentuk profil radar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Career stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Karier</CardTitle>
            <span className="text-[11px] text-ink-muted">Akumulasi seluruh kompetisi</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {careerTotals.map((s) => (
                <div key={s.label} className="rounded-lg border border-line-soft bg-surface-2/40 p-3">
                  <div className="text-lg font-semibold tabular-nums text-ink">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-muted">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Data</CardTitle>
          </CardHeader>
          <CardContent>
            {canVerify ? (
              <VerificationControl
                playerId={player.id}
                current={player.verificationStatus}
                notes={player.verificationNotes}
              />
            ) : (
              <div className="space-y-2">
                <StatusBadge kind="verification" value={player.verificationStatus} dot />
                {player.verificationNotes && (
                  <p className="rounded-lg border border-line-soft bg-surface-2/40 p-2.5 text-xs text-ink-secondary">
                    {player.verificationNotes}
                  </p>
                )}
                <p className="text-[11px] text-ink-muted">
                  Anda tidak memiliki izin mengubah status verifikasi.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-tournament + badges + history */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rincian per Kompetisi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {perTournament.length ? (
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5">Kompetisi</th>
                    <th className="px-3 py-2.5 text-right">Main</th>
                    <th className="px-3 py-2.5 text-right">Gol</th>
                    <th className="px-3 py-2.5 text-right">Assist</th>
                    <th className="px-3 py-2.5 text-right">Rating</th>
                    <th className="px-4 py-2.5 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {perTournament.map((st) => (
                    <tr key={st.id}>
                      <td className="px-4 py-2.5 text-ink-secondary">Kompetisi {st.season}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{st.appearances}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{st.goals}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{st.assists}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{st.rating.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink">
                        {Math.round(st.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-xs text-ink-muted">
                Pemain belum tampil di kompetisi resmi.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lencana & Penghargaan</CardTitle>
          </CardHeader>
          <CardContent>
            {player.badges.length ? (
              <ul className="space-y-2">
                {player.badges.map((pb) => (
                  <li key={pb.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-warn/25 bg-warn/10 text-warn">
                      <Icon name={pb.badge.icon} className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-ink">{pb.badge.name}</p>
                      <p className="text-[10px] text-ink-muted">{pb.context ?? pb.badge.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-xs text-ink-muted">Belum ada lencana.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {player.seasonHistory.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Perkembangan Jangka Panjang</CardTitle>
            <span className="text-[11px] text-ink-muted">Pemantauan longitudinal antar musim</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[...player.seasonHistory]
                .sort((a, b) => a.season.localeCompare(b.season))
                .map((h) => (
                  <div
                    key={h.id}
                    className="min-w-[140px] flex-1 rounded-lg border border-line-soft bg-surface-2/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Musim {h.season}</span>
                      <Badge tone="neutral">{h.ageCategoryCode}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                      <Mini label="Main" value={h.appearances} />
                      <Mini label="Gol" value={h.goals} />
                      <Mini label="Rating" value={h.avgRating.toFixed(1)} />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({
  icon: I,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
        <I className="size-3" /> {label}
      </span>
      <span className="mt-0.5 block text-ink-secondary">{children}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums text-ink">{value}</div>
      <div className="text-[9px] text-ink-muted">{label}</div>
    </div>
  );
}
