import { Goal, Plus, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  Illustrative phone showing the live match console — the squad list that
  opens "Catat Kejadian". Static markup with sample data from the demo seed.
*/

const PLAYERS = [
  { no: 1, name: "Yoga Rahardjo", pos: "Kiper" },
  { no: 8, name: "Made Aditya", pos: "Tengah", tags: ["Gol"] },
  { no: 10, name: "Reza Kurniawan", pos: "Tengah", card: true },
  { no: 16, name: "Hilmi Hakim", pos: "Depan", tags: ["Gol", "A"], active: true },
  { no: 14, name: "Hendra Kurniawan", pos: "Depan" },
];

export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-[290px] sm:w-[310px]", className)} aria-hidden>
      <div className="rounded-[3rem] bg-night p-2.5 shadow-[0_50px_100px_-30px_rgba(20,20,20,0.65)] ring-1 ring-black/10">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-base">
          {/* status bar + island */}
          <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold text-ink">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-night" />
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-[2px] bg-ink" />
              <span className="h-2 w-4 rounded-[2px] border border-ink" />
            </span>
          </div>

          {/* scoreboard */}
          <div className="mx-3 mt-2 rounded-[1.6rem] bg-night px-4 pb-4 pt-3 text-white">
            <div className="flex justify-center">
              <span className="flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[8px] font-bold">
                <Radio className="size-2.5" /> LANGSUNG · 63&rsquo;
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="grid size-9 place-items-center rounded-full bg-[#fbbf24] text-[9px] font-bold text-ink">CPF</span>
                <span className="text-[9px] font-semibold">Cibinong Putra</span>
              </div>
              <span className="font-display text-4xl leading-none tracking-wide">
                2<span className="mx-1 text-night-muted">:</span>2
              </span>
              <div className="flex flex-col items-center gap-1">
                <span className="grid size-9 place-items-center rounded-full bg-[#22d3ee] text-[9px] font-bold text-ink">BSA</span>
                <span className="text-[9px] font-semibold">Bintang Selatan</span>
              </div>
            </div>
          </div>

          {/* squad list */}
          <div className="mx-3 mt-3 rounded-[1.4rem] bg-surface p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-ink">Daftar Pemain</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[8px] font-semibold text-ink-muted">Starter</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {PLAYERS.map((p) => (
                <li
                  key={p.no}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-1.5 py-1",
                    p.active ? "bg-brand-soft ring-1 ring-brand/30" : "",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-[11px] text-ink ring-1 ring-line">
                    {p.no}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[9.5px] font-semibold text-ink">{p.name}</span>
                    <span className="block text-[8px] text-ink-muted">{p.pos}</span>
                  </span>
                  {p.card && <span className="h-2.5 w-[7px] rounded-[1.5px] bg-block-yellow ring-1 ring-black/10" />}
                  {p.tags?.map((t) => (
                    <span
                      key={t}
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white",
                        t === "A" ? "bg-block-blue" : "bg-brand",
                      )}
                    >
                      {t}
                    </span>
                  ))}
                  {p.active && (
                    <span className="grid size-5 place-items-center rounded-full bg-brand text-white">
                      <Plus className="size-3" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* bottom nav */}
          <div className="mx-6 mb-4 mt-4 flex items-center justify-between rounded-full bg-night p-1">
            <span className="flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-brand text-[8px] font-bold text-white">
              <Goal className="size-3" /> Laga
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className="grid h-7 flex-1 place-items-center">
                <span className="size-2 rounded-full bg-night-muted/60" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
