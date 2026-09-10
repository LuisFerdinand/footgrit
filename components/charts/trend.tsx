"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TrendSeries = {
  label: string;
  color: string;
  points: number[];
};

/**
 * Multi-series line for change-over-time. One y-axis only. Crosshair + tooltip
 * on hover; legend present for ≥2 series; series are also direct-labelled at
 * the right edge.
 */
export function Trend({
  series,
  categories,
  height = 200,
  className,
  yFormat = (v) => String(Math.round(v)),
  area,
}: {
  series: TrendSeries[];
  categories: string[];
  height?: number;
  className?: string;
  yFormat?: (v: number) => string;
  area?: boolean;
}) {
  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const ref = React.useRef<SVGSVGElement>(null);
  const W = 640;
  const H = height;
  const padL = 34;
  const padR = 48;
  const padT = 12;
  const padB = 24;
  const n = categories.length;

  const allVals = series.flatMap((s) => s.points);
  const maxY = Math.max(1, ...allVals) * 1.15;
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxY) * (H - padT - padB);

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(
      ((px - padL) / (W - padL - padR)) * (n - 1),
    );
    setHoverX(Math.max(0, Math.min(n - 1, idx)));
  };

  const yTicks = 4;

  return (
    <div className={cn("w-full", className)}>
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverX(null)}
      >
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = (maxY / yTicks) * i;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-grid)"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y(v) + 3}
                textAnchor="end"
                className="fill-[var(--color-ink-muted)] text-[9px] tabular-nums"
              >
                {yFormat(v)}
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const d = s.points
            .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
            .join(" ");
          return (
            <g key={s.label}>
              {area && (
                <path
                  d={`${d} L ${x(n - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`}
                  fill={s.color}
                  opacity={0.12}
                />
              )}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <text
                x={x(n - 1) + 6}
                y={y(s.points[n - 1]) + 3}
                className="fill-[var(--color-ink-secondary)] text-[9px] font-medium"
              >
                {s.label.length > 10 ? s.label.slice(0, 9) + "…" : s.label}
              </text>
            </g>
          );
        })}

        {hoverX !== null && (
          <g>
            <line
              x1={x(hoverX)}
              x2={x(hoverX)}
              y1={padT}
              y2={H - padB}
              stroke="var(--color-axis)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {series.map((s) => (
              <circle
                key={s.label}
                cx={x(hoverX)}
                cy={y(s.points[hoverX])}
                r={3.5}
                fill="var(--color-surface)"
                stroke={s.color}
                strokeWidth={2}
              />
            ))}
          </g>
        )}

        {categories.map((cat, i) =>
          i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              className="fill-[var(--color-ink-muted)] text-[9px]"
            >
              {cat}
            </text>
          ) : null,
        )}
      </svg>

      {hoverX !== null && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
          <span className="font-medium text-ink">{categories[hoverX]}</span>
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1 text-ink-secondary">
              <span className="size-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}: <span className="font-medium tabular-nums text-ink">{yFormat(s.points[hoverX])}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
