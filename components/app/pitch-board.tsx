"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export type PitchPlayer = {
  playerId: string;
  name: string;
  slot?: string | null;
  x?: number | null;
  y?: number | null;
  shirtNumber?: number | null;
  isCaptain?: boolean;
  position?: string;
};

const FORMATIONS: Record<string, { slot: string; x: number; y: number }[]> = {
  "4-3-3": [
    { slot: "GK", x: 50, y: 92 },
    { slot: "RB", x: 84, y: 72 }, { slot: "RCB", x: 63, y: 78 }, { slot: "LCB", x: 37, y: 78 }, { slot: "LB", x: 16, y: 72 },
    { slot: "RCM", x: 68, y: 52 }, { slot: "CM", x: 50, y: 57 }, { slot: "LCM", x: 32, y: 52 },
    { slot: "RW", x: 78, y: 26 }, { slot: "ST", x: 50, y: 18 }, { slot: "LW", x: 22, y: 26 },
  ],
  "4-4-2": [
    { slot: "GK", x: 50, y: 92 },
    { slot: "RB", x: 84, y: 72 }, { slot: "RCB", x: 63, y: 78 }, { slot: "LCB", x: 37, y: 78 }, { slot: "LB", x: 16, y: 72 },
    { slot: "RM", x: 82, y: 48 }, { slot: "RCM", x: 58, y: 52 }, { slot: "LCM", x: 42, y: 52 }, { slot: "LM", x: 18, y: 48 },
    { slot: "RST", x: 58, y: 20 }, { slot: "LST", x: 42, y: 20 },
  ],
  "3-4-3": [
    { slot: "GK", x: 50, y: 92 },
    { slot: "RCB", x: 68, y: 78 }, { slot: "CB", x: 50, y: 80 }, { slot: "LCB", x: 32, y: 78 },
    { slot: "RM", x: 86, y: 50 }, { slot: "RCM", x: 60, y: 54 }, { slot: "LCM", x: 40, y: 54 }, { slot: "LM", x: 14, y: 50 },
    { slot: "RW", x: 76, y: 24 }, { slot: "ST", x: 50, y: 18 }, { slot: "LW", x: 24, y: 24 },
  ],
  "4-2-3-1": [
    { slot: "GK", x: 50, y: 92 },
    { slot: "RB", x: 84, y: 72 }, { slot: "RCB", x: 63, y: 78 }, { slot: "LCB", x: 37, y: 78 }, { slot: "LB", x: 16, y: 72 },
    { slot: "RDM", x: 60, y: 60 }, { slot: "LDM", x: 40, y: 60 },
    { slot: "RAM", x: 76, y: 36 }, { slot: "CAM", x: 50, y: 34 }, { slot: "LAM", x: 24, y: 36 },
    { slot: "ST", x: 50, y: 16 },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

export function PitchBoard({
  home,
  away,
  homeFormation = "4-3-3",
  awayFormation = "4-3-3",
  homeColor = "#00e28a",
  awayColor = "#38bdf8",
  homeShort,
  awayShort,
  editable,
  onFormationChange,
}: {
  home: PitchPlayer[];
  away: PitchPlayer[];
  homeFormation?: string;
  awayFormation?: string;
  homeColor?: string | null;
  awayColor?: string | null;
  homeShort?: string | null;
  awayShort?: string | null;
  editable?: boolean;
  onFormationChange?: (side: "home" | "away", formation: string) => void;
}) {
  const layout = (players: PitchPlayer[], formation: string, flip: boolean) => {
    const shape = FORMATIONS[formation] ?? FORMATIONS["4-3-3"];
    const starters = players.filter((p) => p.x == null).slice(0, 11);
    const placed = players.filter((p) => p.x != null);
    // if lineup has explicit coords use them; else assign to formation shape
    const list =
      placed.length >= 7
        ? placed.map((p) => ({
            ...p,
            px: flip ? 100 - (p.x ?? 50) : p.x ?? 50,
            py: flip ? 100 - (p.y ?? 50) : p.y ?? 50,
          }))
        : starters.map((p, i) => {
            const s = shape[i] ?? { x: 50, y: 50 };
            return {
              ...p,
              px: flip ? 100 - s.x : s.x,
              py: flip ? 100 - s.y : s.y,
            };
          });
    return list;
  };

  const homeNodes = layout(home, homeFormation, false);
  const awayNodes = layout(away, awayFormation, true);

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line bg-[#0c1a12]">
        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <rect x="2" y="2" width="96" height="129" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          <circle cx="50" cy="66.5" r="12" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,0.2)" />
          <rect x="28" y="2" width="44" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <rect x="28" y="111" width="44" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <rect x="40" y="2" width="20" height="7" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <rect x="40" y="124" width="20" height="7" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          {[...Array(8)].map((_, i) => (
            <rect key={i} x="2" y={2 + i * 16.1} width="96" height="8" fill={i % 2 ? "rgba(255,255,255,0.015)" : "transparent"} />
          ))}
        </svg>

        {[...homeNodes.map((n) => ({ ...n, color: homeColor })), ...awayNodes.map((n) => ({ ...n, color: awayColor }))].map(
          (n) => (
            <div
              key={n.playerId}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${n.px}%`, top: `${(n.py / 100) * 100}%` }}
            >
              <span
                className="grid size-7 place-items-center rounded-full border-2 text-[9px] font-bold text-black shadow-lg sm:size-8"
                style={{ background: n.color ?? "#00e28a", borderColor: "rgba(255,255,255,0.5)" }}
              >
                {n.shirtNumber ?? initials(n.name)}
              </span>
              <span className="mt-0.5 max-w-[54px] truncate rounded bg-black/50 px-1 text-[8px] text-white/90">
                {n.name.split(" ").slice(-1)[0]}
                {n.isCaptain ? " (C)" : ""}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
        <FormationPicker
          label={homeShort ?? "Tuan rumah"}
          value={homeFormation}
          color={homeColor}
          editable={editable}
          onChange={(v) => onFormationChange?.("home", v)}
        />
        <FormationPicker
          label={awayShort ?? "Tamu"}
          value={awayFormation}
          color={awayColor}
          editable={editable}
          onChange={(v) => onFormationChange?.("away", v)}
        />
      </div>
    </div>
  );
}

function FormationPicker({
  label,
  value,
  color,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  color?: string | null;
  editable?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color ?? "#00e28a" }} />
      <span className="text-ink-muted">{label}</span>
      {editable ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-ink outline-none"
        >
          {FORMATION_NAMES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      ) : (
        <span className={cn("font-semibold text-ink")}>{value}</span>
      )}
    </div>
  );
}
