"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { positionText } from "@/lib/positions";
import { useT } from "@/lib/i18n/client";

type P = {
  id: string;
  name: string;
  club: string | null;
  position: string;
  ageCode: string | null;
  photoUrl: string | null;
  goals: number;
  assists: number;
  score: number;
};

export function PlayerPicker({
  players,
  selectedId,
  paramName = "player",
}: {
  players: P[];
  selectedId?: string;
  paramName?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pick = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(paramName, id);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div>
      <ul className="max-h-[260px] overflow-y-auto p-1.5 lg:max-h-[480px]">
        {players.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => pick(p.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                p.id === selectedId ? "bg-brand/10" : "hover:bg-surface-2",
              )}
            >
              <Avatar src={p.photoUrl} name={p.name} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink">{p.name}</span>
                <span className="block truncate text-[10px] text-ink-muted">
                  {p.club} · {positionText(p.position, t)} · {p.ageCode}
                </span>
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
                {Math.round(p.score)}
              </span>
            </button>
          </li>
        ))}
        {players.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-ink-muted">
            {t("Tidak ada pemain yang cocok.")}
          </li>
        )}
      </ul>
    </div>
  );
}
