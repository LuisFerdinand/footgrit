"use client";

import * as React from "react";
import { cn, initials as toInitials } from "@/lib/utils";

const PALETTE = [
  ["#0b3b30", "#00e28a"],
  ["#0c2c44", "#38bdf8"],
  ["#3a2a0b", "#fbbf24"],
  ["#2e1a3a", "#a78bfa"],
  ["#3a1526", "#f472b6"],
  ["#0f3327", "#34d399"],
  ["#2a1414", "#f87171"],
  ["#122b3a", "#22d3ee"],
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  src,
  name,
  size = 36,
  square,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const show = src && !errored;
  const [bg, fg] = PALETTE[hash(name) % PALETTE.length];
  const ini = toInitials(name);

  return (
    <div
      style={{ width: size, height: size, background: show ? "var(--color-surface-2)" : bg }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        square ? "rounded-lg" : "rounded-full",
        className,
      )}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-semibold leading-none"
          style={{ fontSize: Math.max(9, size * 0.38), color: fg }}
        >
          {ini}
        </span>
      )}
    </div>
  );
}
