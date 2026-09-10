"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DonutSlice = { label: string; value: number; color: string };

/**
 * Composition of a whole across a few named states (e.g. verification status
 * mix). ≤5 slices; legend always present; hover reveals share.
 */
export function Donut({
  slices,
  size = 148,
  centerLabel,
  centerValue,
  className,
}: {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {slices.map((s, i) => {
            const frac = s.value / total;
            const len = frac * c;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? stroke + 3 : stroke}
                strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                strokeDashoffset={-offset}
                className="transition-all duration-200"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums text-ink">
            {hover !== null
              ? `${((slices[hover].value / total) * 100).toFixed(0)}%`
              : (centerValue ?? total)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">
            {hover !== null ? slices[hover].label : centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 text-xs"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: s.color }}
              />
              <span className="truncate text-ink-secondary">{s.label}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-ink">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
