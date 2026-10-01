"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Club logo when one has been uploaded, otherwise the short name on the club
 * colour (the previous look). Falls back automatically if the image fails.
 */
export function ClubCrest({
  logoUrl,
  short,
  color,
  size = 24,
  className,
}: {
  logoUrl?: string | null;
  short?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const radius = size >= 32 ? "rounded-lg" : "rounded-md";

  if (logoUrl && !errored) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border border-line bg-surface-2",
          radius,
          className,
        )}
        style={{ width: size, height: size, padding: Math.max(1, size * 0.08) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={short ?? "Logo klub"}
          className="max-h-full max-w-full object-contain"
          onError={() => setErrored(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn("grid shrink-0 place-items-center font-bold text-black", radius, className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.36)),
        background: color ?? "var(--color-surface-2)",
      }}
    >
      {short ?? "?"}
    </span>
  );
}
