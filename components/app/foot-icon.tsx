"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type Foot = "left" | "right" | "both";

export const FOOT_LABEL: Record<Foot, string> = {
  left: "Kiri",
  right: "Kanan",
  both: "Dua kaki",
};

/** Single footprint (sole view). Drawn as a right foot; `side="left"` mirrors it. */
export function FootIcon({
  side,
  active,
  className,
}: {
  side: "left" | "right";
  active?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 40"
      aria-hidden
      className={cn(
        "h-full w-auto transition-colors",
        active ? "text-brand" : "text-axis",
        className,
      )}
    >
      <g fill="currentColor" transform={side === "left" ? "translate(24 0) scale(-1 1)" : undefined}>
        <ellipse cx="8" cy="6" rx="3.1" ry="4" />
        <circle cx="13.2" cy="4.4" r="1.9" />
        <circle cx="16.6" cy="5.7" r="1.7" />
        <circle cx="19.3" cy="8" r="1.5" />
        <circle cx="21.2" cy="11" r="1.25" />
        <path d="M5 14.5C5 11.5 9 10.5 13 11c4.5.5 8.5 1.5 8.3 5.5-.3 4-2.5 7.5-3.1 11.5-.4 3 0 6-1.2 8.5-1.2 2.5-7.4 2.8-8.6.1-1.1-2.4.2-5.6 1-8.6.8-3 .4-5.5-1.8-7.5C5.6 18.8 5 17 5 14.5Z" />
      </g>
    </svg>
  );
}

/** Pair of footprints with the preferred foot (or both) highlighted. */
export function FootPreference({
  foot,
  size = 20,
  showLabel,
  className,
}: {
  foot: Foot;
  /** Height of each footprint in px. */
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`Kaki dominan: ${FOOT_LABEL[foot]}`}
    >
      <span className="inline-flex items-end gap-[2px]" style={{ height: size }}>
        <FootIcon side="left" active={foot !== "right"} />
        <FootIcon side="right" active={foot !== "left"} />
      </span>
      {showLabel && <span>{FOOT_LABEL[foot]}</span>}
    </span>
  );
}

/** Radio-card picker for forms; submits `name=left|right|both`. */
export function FootPicker({
  name,
  defaultValue = "right",
}: {
  name: string;
  defaultValue?: Foot;
}) {
  const [value, setValue] = React.useState<Foot>(defaultValue);
  // Unnamed radios + a hidden input: React resets forms after an action, and a
  // hidden input keeps the chosen foot instead of snapping back to the default.
  const group = React.useId();
  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-2">
      <input type="hidden" name={name} value={value} />
      {(["left", "right", "both"] as const).map((f) => (
        <label
          key={f}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition-colors",
            value === f
              ? "border-brand/50 bg-brand/10 text-ink"
              : "border-line text-ink-muted hover:border-brand/30 hover:text-ink-secondary",
          )}
        >
          <input
            type="radio"
            name={group}
            value={f}
            checked={value === f}
            onChange={() => setValue(f)}
            className="sr-only"
          />
          <FootPreference foot={f} size={26} />
          <span className="font-medium">{FOOT_LABEL[f]}</span>
        </label>
      ))}
    </div>
  );
}
