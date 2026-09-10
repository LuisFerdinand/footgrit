import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Progress ──────────────────────────────────────────────────────── */
export function Progress({
  value,
  className,
  tone = "grit",
}: {
  value: number;
  className?: string;
  tone?: "grit" | "info" | "warn" | "danger" | "success";
}) {
  const tones = {
    grit: "bg-grit",
    info: "bg-info",
    warn: "bg-warn",
    danger: "bg-danger",
    success: "bg-success",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

/* ── Separator ─────────────────────────────────────────────────────── */
export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        "bg-line-soft",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}

/* ── Empty state ───────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
          <Icon className="size-5" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Stat delta pill ───────────────────────────────────────────────── */
export function Delta({ value, suffix }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value)}
      {suffix}
    </span>
  );
}
