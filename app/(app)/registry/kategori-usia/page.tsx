import type { Metadata } from "next";
import { Clock, Users, Shirt, CircleDot, Repeat } from "lucide-react";
import { listAgeCategories } from "@/lib/queries/registry";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Aturan Kategori Usia" };
export const dynamic = "force-dynamic";

export default async function AgeCategoriesPage() {
  const cats = await listAgeCategories();

  return (
    <div>
      <PageHeader
        title="Aturan Kategori Usia"
        description="Konfigurasi durasi pertandingan, jumlah pemain, dan aturan khusus per kelompok umur (KU-8 hingga KU-16)."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cats.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge tone="grit">{c.code}</Badge>
                {c.label}
              </CardTitle>
              <span className="text-[11px] text-ink-muted">
                Usia {c.minAge}–{c.maxAge} · lahir {c.birthYearFrom}–{c.birthYearTo}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Rule icon={Clock} label="Durasi">
                  {c.rules.matchDuration}&rsquo; ({c.rules.halfDuration}&rsquo; / babak)
                </Rule>
                <Rule icon={Users} label="Format">
                  {c.rules.playersOnField} vs {c.rules.playersOnField}
                </Rule>
                <Rule icon={Shirt} label="Skuad maks">{c.rules.maxSquad} pemain</Rule>
                <Rule icon={CircleDot} label="Ukuran bola">No. {c.rules.ballSize}</Rule>
                <Rule icon={Repeat} label="Pergantian" wide>
                  {c.rules.substitutions}
                </Rule>
              </div>
              <div className="rounded-lg border border-line-soft bg-surface-2/40 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Lapangan</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{c.rules.fieldType}</p>
              </div>
              {c.rules.notes && c.rules.notes.length > 0 && (
                <ul className="space-y-1 text-[11px] text-ink-muted">
                  {c.rules.notes.map((n, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-grit">•</span> {n}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Rule({
  icon: I,
  label,
  children,
  wide,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
        <I className="size-3" /> {label}
      </div>
      <div className="mt-0.5 text-xs text-ink-secondary">{children}</div>
    </div>
  );
}
