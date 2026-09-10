"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Radial gauge for a single 0–100 headline (e.g. verification compliance).
 * One value → no legend; the number is the hero, the arc is context.
 */
export function Gauge({
  value,
  size = 132,
  label,
  sublabel,
  tone,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
  tone?: "grit" | "warn" | "danger";
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const dash = c * arc;
  const filled = (v / 100) * dash;

  const color =
    tone === "danger"
      ? "var(--color-danger)"
      : tone === "warn"
        ? "var(--color-warn)"
        : v >= 85
          ? "var(--color-success)"
          : v >= 60
            ? "var(--color-warn)"
            : "var(--color-danger)";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[135deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${c}`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-ink">
            {v.toFixed(0)}
            <span className="text-sm text-ink-muted">%</span>
          </span>
          {label && (
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <p className="mt-1 text-center text-[11px] text-ink-muted">{sublabel}</p>
      )}
    </div>
  );
}
