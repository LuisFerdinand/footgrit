"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";

const JUMPS: [string, string, string][] = [
  ["g c", "Command Center", "/command-center"],
  ["g r", "Registry — Pemain", "/registry/pemain"],
  ["g k", "Kompetisi", "/kompetisi"],
  ["g m", "Match Operations", "/match-ops"],
  ["g p", "Player Intelligence", "/player-intelligence"],
  ["g a", "AI Scout", "/ai-scout"],
  ["g i", "Data Ingestion", "/ingestion"],
];

export function ShortcutsButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const seq = React.useRef<string>("");
  const seqTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.key === "?") {
        setOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      seq.current += e.key.toLowerCase();
      if (seqTimer.current) clearTimeout(seqTimer.current);
      seqTimer.current = setTimeout(() => (seq.current = ""), 800);
      const match = JUMPS.find(([k]) => k.replace(" ", "") === seq.current);
      if (match) {
        seq.current = "";
        router.push(match[2]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Pintasan keyboard (?)"
        className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <HelpCircle className="size-4" />
      </button>
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-2xl animate-fade-in">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
              <h2 className="text-sm font-semibold text-ink">Pintasan keyboard</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Navigasi cepat untuk pengguna operasional.
              </p>
              <div className="mt-4 space-y-1.5">
                <Row keys={["⌘", "K"]} label="Palet perintah / pencarian global" />
                {JUMPS.map(([k, label]) => (
                  <Row key={k} keys={k.split(" ")} label={label} />
                ))}
                <Row keys={["?"]} label="Buka panel pintasan ini" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2">
      <span className="text-ink-secondary">{label}</span>
      <span className="flex gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[20px] rounded border border-line bg-surface-2 px-1.5 py-0.5 text-center text-[10px] font-medium text-ink"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
