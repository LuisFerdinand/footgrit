import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-7", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-wide text-ink text-balance sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2.5 max-w-2xl text-sm text-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/*
  Colour-block stat tiles. Text colours are chosen per block so every label
  clears 4.5:1 against its fill (white on red/blue/ink, ink on yellow).
*/
const BLOCKS = {
  white: {
    card: "border border-line/80 bg-surface",
    label: "text-ink-muted",
    value: "text-ink",
    hint: "text-ink-muted",
    chip: "bg-surface-2 text-ink-secondary",
  },
  red: {
    card: "bg-brand",
    label: "text-white",
    value: "text-white",
    hint: "text-white",
    chip: "bg-white/20 text-white",
  },
  blue: {
    card: "bg-block-blue",
    label: "text-white",
    value: "text-white",
    hint: "text-white",
    chip: "bg-white/20 text-white",
  },
  yellow: {
    card: "bg-block-yellow",
    label: "text-ink/75",
    value: "text-ink",
    hint: "text-ink/75",
    chip: "bg-ink/10 text-ink",
  },
  night: {
    card: "bg-night",
    label: "text-night-muted",
    value: "text-white",
    hint: "text-night-muted",
    chip: "bg-white/10 text-white",
  },
} as const;

export type StatBlock = keyof typeof BLOCKS;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  block = "white",
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "brand" | "warn" | "danger";
  block?: StatBlock;
  children?: React.ReactNode;
}) {
  const b = BLOCKS[block];
  const plain = block === "white";
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-5", b.card)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-xs font-semibold", b.label)}>{label}</span>
        {icon && (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full",
              b.chip,
              plain && tone === "brand" && "bg-brand-soft text-brand",
              plain && tone === "warn" && "bg-warn/10 text-warn",
              plain && tone === "danger" && "bg-danger/10 text-danger",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-3 font-display text-[44px] leading-none tracking-wide tabular-nums",
          b.value,
          tone === "danger" && (plain ? "text-danger" : block === "night" && "text-[#ff6b70]"),
        )}
      >
        {value}
      </div>
      {hint && <div className={cn("mt-2 text-xs", b.hint)}>{hint}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
