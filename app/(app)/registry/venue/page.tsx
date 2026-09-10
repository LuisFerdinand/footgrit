import type { Metadata } from "next";
import { MapPin, Users, LayoutGrid, Lightbulb } from "lucide-react";
import { listVenues } from "@/lib/queries/registry";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBox, FilterSelect } from "@/components/app/list-controls";
import { EmptyState } from "@/components/ui/misc";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrasi Venue" };
export const dynamic = "force-dynamic";

const SURFACE: Record<string, string> = {
  natural: "Rumput alami",
  artificial: "Rumput sintetis",
  hybrid: "Hybrid",
  futsal: "Futsal",
};

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; surface?: string }>;
}) {
  const params = await searchParams;
  const rows = await listVenues(params);

  return (
    <div>
      <PageHeader
        title="Registrasi Venue"
        description="Data lokasi, jumlah lapangan, dan kapasitas fasilitas pertandingan."
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <SearchBox placeholder="Cari venue atau kota…" />
          <FilterSelect
            param="surface"
            placeholder="Semua permukaan"
            options={Object.entries(SURFACE).map(([v, l]) => ({ value: v, label: l }))}
          />
        </div>
      </Card>
      {rows.length === 0 ? (
        <EmptyState title="Tidak ada venue yang cocok" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => (
            <div key={v.id} className="rounded-xl border border-line bg-surface/70 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{v.name}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="size-3" /> {v.city}, {v.province}
                  </p>
                </div>
                <Badge tone="info">{SURFACE[v.surface]}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Stat icon={Users} label="Kapasitas" value={v.capacity ? formatNumber(v.capacity) : "—"} />
                <Stat icon={LayoutGrid} label="Lapangan" value={v.fieldCount} />
                <Stat icon={Lightbulb} label="Lampu" value={v.floodlights ? "Ada" : "Tidak"} />
                <Stat label="Pertandingan" value={v.matches} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: I,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line-soft bg-surface-2/40 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
        {I && <I className="size-3" />} {label}
      </div>
      <div className="mt-0.5 font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
