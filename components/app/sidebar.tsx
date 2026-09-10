"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { NAV, SETTINGS_NAV } from "@/lib/nav";
import { can, type Role } from "@/lib/auth/rbac";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const items = [...NAV, SETTINGS_NAV].filter(
    (n) => !n.capability || can(role, n.capability),
  );

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-line bg-surface/80 backdrop-blur transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
        <Link href="/command-center" className="flex items-center gap-2.5 overflow-hidden">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-grit text-black">
            <span className="text-sm font-black">F</span>
          </span>
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-bold tracking-tight">
              FOOTGRIT<span className="text-grit">-OS</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith("/" + item.key) ||
            item.children?.some((c) => pathname.startsWith(c.href));
          return (
            <div key={item.key}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-grit/10 text-grit"
                    : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon name={item.icon} className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
              {!collapsed && active && item.children && (
                <div className="my-1 ml-4 space-y-0.5 border-l border-line pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block rounded-md px-2 py-1 text-xs transition-colors",
                        pathname === child.href
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink-secondary",
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        {collapsed ? (
          <PanelLeft className="size-4" />
        ) : (
          <>
            <PanelLeftClose className="size-4" />
            Ciutkan panel
          </>
        )}
      </button>
    </aside>
  );
}
