"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BarItem = {
  label: string;
  value: number;
  sublabel?: string;
  href?: string;
  meta?: React.ReactNode;
};

/**
 * Ranked horizontal bars — the form for "magnitude across a short list of
 * named things" (leaderboards). Single series → no legend; bars carry a 4px
 * rounded data-end and a per-row hover state; values are direct-labelled.
 */
export function BarList({
  items,
  valueFormat = (v) => String(v),
  className,
  accent = "var(--color-grit)",
  max,
}: {
  items: BarItem[];
  valueFormat?: (v: number) => string;
  className?: string;
  accent?: string;
  max?: number;
}) {
  const peak = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className={cn("space-y-1.5", className)}>
      {items.map((item, i) => {
        const w = Math.max(2, (item.value / peak) * 100);
        const Row = item.href ? "a" : "div";
        return (
          <li key={item.label + i}>
            <Row
              {...(item.href ? { href: item.href } : {})}
              className="group grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2"
            >
              <span className="text-center text-[11px] font-medium tabular-nums text-ink-muted">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-ink group-hover:text-ink">
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span className="shrink-0 text-[10px] text-ink-muted">
                      {item.sublabel}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${w}%`, background: accent }}
                  />
                </div>
              </div>
              <span className="pl-1 text-right text-xs font-semibold tabular-nums text-ink">
                {valueFormat(item.value)}
              </span>
            </Row>
          </li>
        );
      })}
    </ol>
  );
}
