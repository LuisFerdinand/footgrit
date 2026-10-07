import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "brand"
  | "info"
  | "warn"
  | "danger"
  | "success"
  | "violet"
  | "magenta";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-secondary border-line",
  brand: "bg-brand/12 text-brand border-brand/25",
  info: "bg-info/12 text-info border-info/25",
  warn: "bg-warn/12 text-warn border-warn/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  success: "bg-success/12 text-success border-success/25",
  violet: "bg-violet/12 text-violet border-violet/25",
  magenta: "bg-magenta/12 text-magenta border-magenta/25",
};

export function Badge({
  className,
  tone = "neutral",
  dot,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {props.children}
    </span>
  );
}
