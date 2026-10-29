"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { crestTint } from "@/lib/crest";

/**
 * SSB logo when one has been uploaded, otherwise the short name on a tint
 * picked from it (see lib/crest.ts). Falls back automatically if the image fails.
 *
 * `size` is pixels, or any CSS length — `"var(--crest)"` lets a parent make the crest bigger on
 * wider screens. The logo fills 88% of the circle; the initials scale with it.
 */
export function ClubCrest({
  logoUrl,
  short,
  size = 24,
  className,
}: {
  logoUrl?: string | null;
  short?: string | null;
  size?: number | string;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const side = typeof size === "number" ? `${size}px` : size;

  if (logoUrl && !errored) {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden rounded-full border border-line bg-surface", className)}
        style={{ width: side, height: side }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={short ?? "Logo SSB"}
          className="absolute inset-[6%] h-[88%] w-[88%] object-contain"
          onError={() => setErrored(true)}
        />
      </span>
    );
  }

  const tint = crestTint(short);
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-bold", className)}
      style={{
        width: side,
        height: side,
        fontSize: `max(8px, calc(${side} * 0.36))`,
        background: tint.bg,
        color: tint.fg,
      }}
    >
      {short ?? "?"}
    </span>
  );
}
