"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gauge, HelpCircle } from "lucide-react";
import { CommandPalette } from "./command-palette";
import { UserMenu } from "./user-menu";
import { ShortcutsButton } from "./shortcuts";
import { findNavByPath } from "@/lib/nav";
import type { Role } from "@/lib/auth/rbac";

export function Topbar({
  user,
  activeFormula,
}: {
  user: { name: string; email: string; image?: string | null; role: Role; title?: string | null };
  activeFormula: string | null;
}) {
  const pathname = usePathname();
  const nav = findNavByPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-base/80 px-4 backdrop-blur">
      <div className="hidden min-w-0 md:block">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span>FOOTGRIT-OS</span>
          {nav && (
            <>
              <span>/</span>
              <span className="font-medium text-ink-secondary">{nav.label}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:justify-between">
        <div className="hidden sm:block">
          <CommandPalette role={user.role} />
        </div>
        <div className="flex sm:hidden">
          <CommandPalette role={user.role} />
        </div>

        <div className="flex items-center gap-1.5">
          {activeFormula && (
            <Link
              href="/player-intelligence/formula"
              className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary transition-colors hover:border-grit/30 hover:text-ink lg:flex"
              title="Formula penilaian aktif"
            >
              <Gauge className="size-3.5 text-grit" />
              <span className="max-w-[160px] truncate">{activeFormula}</span>
            </Link>
          )}
          <span className="hidden shrink-0 items-center whitespace-nowrap rounded-lg border border-warn/25 bg-warn/10 px-2 py-1 text-[10px] font-medium text-warn xl:flex">
            DEMO
          </span>
          <ShortcutsButton />
          <div className="mx-1 h-5 w-px bg-line" />
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
