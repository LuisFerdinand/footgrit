import Link from "next/link";
import { notFound } from "next/navigation";
import { getTournamentOverview } from "@/lib/queries/competition";
import { Card, CardContent } from "@/components/ui/card";
import { ClubCrest } from "@/components/app/club-crest";
import { StatusBadge } from "@/components/app/status-badge";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getTournamentOverview(id);
  if (!d) notFound();
  const { teams } = d;

  const groups = [...new Set(teams.map((t) => t.group ?? "-"))].sort();

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g}>
          {g !== "-" && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Grup {g}
            </h3>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {teams
              .filter((t) => (t.group ?? "-") === g)
              .map((t) => (
                <Link
                  key={t.id}
                  href={`/registry/klub/${t.clubId}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 p-3 transition-colors hover:border-brand/40"
                >
                  <ClubCrest logoUrl={t.logo} short={t.short} color={t.color} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-[11px] text-ink-muted">Unggulan {t.seed ?? "—"}</p>
                  </div>
                  <StatusBadge kind="registration" value={t.regStatus} />
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
