import Link from "next/link";
import { X } from "lucide-react";
import { getPlayerRadarData, searchPlayersForRadar } from "@/lib/queries/intelligence";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar } from "@/components/charts/radar";
import { RADAR_AXES, radarValues } from "@/lib/player-metrics";
import { POSITION } from "@/lib/status";
import { PlayerPicker } from "../player-picker";

export const dynamic = "force-dynamic";

const SERIES_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ players?: string; q?: string; position?: string }>;
}) {
  const sp = await searchParams;
  const selected = (sp.players ?? "").split(",").filter(Boolean).slice(0, 3);
  const [list, rows] = await Promise.all([
    searchPlayersForRadar(sp.q, sp.position),
    selected.length ? getPlayerRadarData(selected) : Promise.resolve([]),
  ]);
  const ordered = selected.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as typeof rows;

  const addHref = (id: string) =>
    `?players=${[...selected, id].slice(0, 3).join(",")}`;
  const removeHref = (id: string) =>
    `?players=${selected.filter((s) => s !== id).join(",")}`;

  const metricRows = [
    ["Penampilan", (s: (typeof rows)[number]["stat"]) => s.appearances],
    ["Gol", (s: (typeof rows)[number]["stat"]) => s.goals],
    ["Assist", (s: (typeof rows)[number]["stat"]) => s.assists],
    ["Umpan kunci", (s: (typeof rows)[number]["stat"]) => s.keyPasses],
    ["Tekel", (s: (typeof rows)[number]["stat"]) => s.tackles],
    ["Intersep", (s: (typeof rows)[number]["stat"]) => s.interceptions],
    ["Penyelamatan", (s: (typeof rows)[number]["stat"]) => s.saves],
    ["Nirbobol", (s: (typeof rows)[number]["stat"]) => s.cleanSheets],
    ["Kartu kuning", (s: (typeof rows)[number]["stat"]) => s.yellowCards],
    ["Rating rata-rata", (s: (typeof rows)[number]["stat"]) => s.rating.toFixed(1)],
    ["Skor performa", (s: (typeof rows)[number]["stat"]) => Math.round(s.score)],
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Tambah Pemain ({selected.length}/3)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-1.5">
            <ul>
              {list.slice(0, 30).map((p) => {
                const isSelected = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <Link
                      href={isSelected ? removeHref(p.id) : addHref(p.id)}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        isSelected ? "bg-grit/10" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-[10px] text-ink-muted">
                          {p.club} · {POSITION[p.position].label}
                        </span>
                      </span>
                      {isSelected ? (
                        <X className="size-3.5 text-danger" />
                      ) : selected.length < 3 ? (
                        <span className="text-[10px] text-grit">+ Tambah</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      {ordered.length >= 1 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Radar Perbandingan</CardTitle>
            </CardHeader>
            <CardContent>
              <Radar
                axes={RADAR_AXES.map((a) => ({ key: a.key, label: a.label }))}
                series={ordered.map((r, i) => ({
                  label: r.name,
                  color: SERIES_COLORS[i],
                  values: radarValues(r.stat),
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Head-to-Head</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5">Metrik</th>
                    {ordered.map((r, i) => (
                      <th key={r.id} className="px-3 py-2.5 text-right">
                        <span className="flex items-center justify-end gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: SERIES_COLORS[i] }}
                          />
                          {r.name.split(" ").slice(-1)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {metricRows.map(([label, fn]) => {
                    const vals = ordered.map((r) => Number(fn(r.stat)));
                    const max = Math.max(...vals);
                    return (
                      <tr key={label}>
                        <td className="px-4 py-2.5 text-ink-secondary">{label}</td>
                        {ordered.map((r, i) => (
                          <td
                            key={r.id}
                            className={`px-3 py-2.5 text-right tabular-nums ${
                              vals[i] === max && max > 0 ? "font-semibold text-grit" : "text-ink"
                            }`}
                          >
                            {String(fn(r.stat))}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-sm text-ink-muted">
            Pilih 2–3 pemain dari panel kiri untuk membandingkan profil performa.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
