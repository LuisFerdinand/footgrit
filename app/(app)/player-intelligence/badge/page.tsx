import Link from "next/link";
import { getBadgeGallery } from "@/lib/queries/intelligence";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/app/icon";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIER_TONE: Record<string, "warn" | "neutral" | "info" | "violet"> = {
  bronze: "warn",
  silver: "neutral",
  gold: "info",
  platinum: "violet",
};

export default async function BadgeGalleryPage() {
  const gallery = await getBadgeGallery();
  const totalAwards = gallery.reduce((a, b) => a + b.awards.length, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-ink-muted">
        {gallery.length} jenis lencana · {totalAwards} penghargaan diberikan sepanjang kompetisi.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {gallery.map((b) => (
          <Card key={b.id}>
            <CardContent>
              <div className="flex items-start gap-3">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-warn/25 bg-warn/10 text-warn"
                >
                  <Icon name={b.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{b.name}</h3>
                    <Badge tone={TIER_TONE[b.tier]}>{b.tier}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{b.description}</p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-semibold tabular-nums text-ink">
                    {b.awards.length}
                  </span>
                  <span className="text-[10px] text-ink-muted">penerima</span>
                </span>
              </div>
              {b.awards.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-line-soft pt-3">
                  {b.awards.slice(0, 4).map((a, i) => (
                    <li key={i}>
                      <Link
                        href={`/registry/pemain/${a.playerId}`}
                        className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-surface-2"
                      >
                        <span className="min-w-0 truncate text-ink-secondary">
                          {a.playerName}
                          <span className="text-ink-muted"> · {a.club}</span>
                        </span>
                        <span className="shrink-0 text-[10px] text-ink-muted">
                          {relativeTime(a.awardedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {b.awards.length > 4 && (
                    <li className="px-1.5 text-[10px] text-ink-muted">
                      +{b.awards.length - 4} penerima lainnya
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
