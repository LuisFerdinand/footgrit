"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TournamentTabs({ id, format }: { id: string; format: string }) {
  const pathname = usePathname();
  const base = `/kompetisi/${id}`;

  const tabs = [
    { href: base, label: "Ringkasan" },
    { href: `${base}/jadwal`, label: "Jadwal & Hasil" },
    ...(format !== "knockout"
      ? [{ href: `${base}/klasemen`, label: "Klasemen" }]
      : []),
    ...(format === "cup" || format === "knockout" || format === "hybrid"
      ? [{ href: `${base}/bagan`, label: "Bagan Gugur" }]
      : []),
    { href: `${base}/peserta`, label: "Peserta" },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-grit text-ink"
                : "border-transparent text-ink-muted hover:text-ink-secondary",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
