"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, CornerDownLeft, ArrowRight } from "lucide-react";
import { NAV, SETTINGS_NAV } from "@/lib/nav";
import { can, type Role } from "@/lib/auth/rbac";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

type Result = { type: string; label: string; sub?: string; href: string; icon?: string };

const QUICK_ACTIONS: { label: string; href: string; icon: string; cap?: string }[] = [
  { label: "Registrasi pemain baru", href: "/registry/pemain/baru", icon: "Users", cap: "registry:write" },
  { label: "Buat turnamen baru", href: "/kompetisi/baru", icon: "Trophy", cap: "competition:write" },
  { label: "Impor data massal (CSV)", href: "/ingestion", icon: "FileInput", cap: "ingestion:write" },
  { label: "Buka AI Scout", href: "/ai-scout", icon: "Sparkles", cap: "scout:use" },
];

export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [remote, setRemote] = React.useState<Result[]>([]);
  const [active, setActive] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setRemote([]);
      setActive(0);
    }
  }, [open]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setRemote(data.results ?? []);
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const navItems: Result[] = [...NAV, SETTINGS_NAV]
    .filter((n) => !n.capability || can(role, n.capability))
    .flatMap((n) => [
      { type: "Modul", label: n.label, sub: n.hint, href: n.href, icon: n.icon },
      ...(n.children ?? []).map((c) => ({
        type: n.label,
        label: c.label,
        href: c.href,
        icon: n.icon,
      })),
    ]);

  const actions: Result[] = QUICK_ACTIONS.filter(
    (a) => !a.cap || can(role, a.cap as Parameters<typeof can>[1]),
  ).map((a) => ({ type: "Tindakan", label: a.label, href: a.href, icon: a.icon }));

  const q = query.trim().toLowerCase();
  const filteredNav = q
    ? [...actions, ...navItems].filter((i) => i.label.toLowerCase().includes(q))
    : [...actions, ...navItems].slice(0, 8);

  const all = [...filteredNav, ...remote];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-base/50 px-3 text-sm text-ink-muted transition-colors hover:border-[#33445a] hover:text-ink-secondary sm:w-64"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Cari atau lompat ke…</span>
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-line px-4">
                <Search className="size-4 shrink-0 text-ink-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(all.length - 1, a + 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(0, a - 1));
                    } else if (e.key === "Enter" && all[active]) {
                      go(all[active].href);
                    }
                  }}
                  placeholder="Cari pemain, klub, turnamen, atau modul…"
                  className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                />
              </div>
              <div className="max-h-[52vh] overflow-y-auto p-2">
                {all.length === 0 && (
                  <p className="px-3 py-8 text-center text-xs text-ink-muted">
                    {query.length >= 2
                      ? "Tidak ada hasil."
                      : "Ketik untuk mencari…"}
                  </p>
                )}
                {all.map((r, i) => (
                  <button
                    key={r.href + i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      i === active ? "bg-surface-2" : "",
                    )}
                  >
                    {r.icon ? (
                      <Icon name={r.icon} className="size-4 shrink-0 text-ink-muted" />
                    ) : (
                      <ArrowRight className="size-4 shrink-0 text-ink-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{r.label}</span>
                      {r.sub && (
                        <span className="block truncate text-[11px] text-ink-muted">
                          {r.sub}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-muted">
                      {r.type}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[10px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line px-1">↑↓</kbd> navigasi
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="size-3" /> buka
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line px-1">esc</kbd> tutup
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
