import { getTournamentFixtures } from "@/lib/queries/competition";
import { Card, CardContent } from "@/components/ui/card";
import { MatchRow } from "@/components/app/match-row";
import { EmptyState } from "@/components/ui/misc";
import { STAGE_LABEL } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matches = await getTournamentFixtures(id);

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Jadwal belum dibuat"
        description="Operator dapat membuat jadwal pertandingan otomatis dari tab Ringkasan."
      />
    );
  }

  // group by (stage, round, groupLabel)
  const buckets = new Map<string, typeof matches>();
  for (const m of matches) {
    const key =
      m.stage === "league"
        ? `Pekan ${m.round}`
        : m.groupLabel
          ? `${STAGE_LABEL[m.stage] ?? m.stage} · Grup ${m.groupLabel} · Pekan ${m.round}`
          : `${STAGE_LABEL[m.stage] ?? m.stage}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  return (
    <div className="space-y-4">
      {[...buckets.entries()].map(([label, list]) => (
        <Card key={label}>
          <CardContent>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              {label}
            </h3>
            <div className="space-y-2">
              {list.map((m) => (
                <MatchRow key={m.id} m={m} showMeta={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
