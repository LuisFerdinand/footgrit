import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users2, CalendarClock } from "lucide-react";
import { listClubs } from "@/lib/queries/registry";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SearchBox, FilterSelect } from "@/components/app/list-controls";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Klub & Akademi" };
export const dynamic = "force-dynamic";

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; city?: string }>;
}) {
  const params = await searchParams;
  const { rows, cities } = await listClubs(params);

  return (
    <div>
      <PageHeader
        title="Registrasi Klub & Akademi"
        description="Profil klub, manajemen skuad, dan riwayat performa antar kompetisi."
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <SearchBox placeholder="Cari klub…" />
          <FilterSelect
            param="type"
            placeholder="Semua jenis"
            options={[
              { value: "club", label: "Klub" },
              { value: "academy", label: "Akademi" },
            ]}
          />
          <FilterSelect
            param="city"
            placeholder="Semua kota"
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Tidak ada klub yang cocok" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/registry/klub/${c.id}`}
              className="group rounded-xl border border-line bg-surface/70 p-4 transition-colors hover:border-grit/40"
            >
              <div className="flex items-start gap-3">
                <Avatar src={c.logoUrl} name={c.shortName} size={44} square className="border border-line" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink group-hover:text-grit">
                    {c.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {c.shortName} · Est. {c.foundedYear ?? "—"}
                  </p>
                </div>
                <Badge tone={c.type === "academy" ? "violet" : "info"}>
                  {c.type === "academy" ? "Akademi" : "Klub"}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {c.city}
                </span>
                <span className="flex items-center gap-1">
                  <Users2 className="size-3" /> {c.squadSize} pemain
                </span>
                {c.venue && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3" /> {c.venue}
                  </span>
                )}
              </div>
              {c.accreditation && (
                <p className="mt-2 text-[10px] text-grit">{c.accreditation}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
