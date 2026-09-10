"use client";

import * as React from "react";
import {
  Play,
  Pause,
  SkipForward,
  Square,
  Loader2,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import {
  startMatch,
  pauseClock,
  resumeSecondHalf,
  endMatch,
} from "./actions";

const PERIOD_LABEL: Record<string, string> = {
  not_started: "Belum Dimulai",
  first_half: "Babak Pertama",
  halftime: "Jeda",
  second_half: "Babak Kedua",
  extra_time: "Perpanjangan Waktu",
  penalties: "Adu Penalti",
  full_time: "Selesai",
};

export function ConsoleControls({
  matchId,
  status,
  period,
  currentMinute,
  clockStartedAt,
  homeShort,
  awayShort,
  homeName,
  awayName,
  homeColor,
  awayColor,
  homeScore,
  awayScore,
  canOperate,
  meta,
}: {
  matchId: string;
  status: string;
  period: string;
  currentMinute: number;
  clockStartedAt: string | null;
  homeShort: string | null;
  awayShort: string | null;
  homeName: string | null;
  awayName: string | null;
  homeColor: string | null;
  awayColor: string | null;
  homeScore: number;
  awayScore: number;
  canOperate: boolean;
  meta: React.ReactNode;
}) {
  const [pending, start] = React.useTransition();
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (status !== "live" || !clockStartedAt) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [status, clockStartedAt]);

  const minute =
    status === "live" && clockStartedAt
      ? currentMinute +
        Math.floor((Date.now() - new Date(clockStartedAt).getTime()) / 60000)
      : currentMinute;
  void tick;

  const run = (fn: (id: string) => Promise<void>, msg: string) =>
    start(async () => {
      try {
        await fn(matchId);
        toast.success(msg);
      } catch (e) {
        toast.error("Gagal", e instanceof Error ? e.message : undefined);
      }
    });

  return (
    <div className="rounded-xl border border-line bg-surface/70 p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TeamCol name={homeName} short={homeShort} color={homeColor} align="right" />
        <div className="flex flex-col items-center">
          {status === "live" && (
            <span className="mb-1 flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
              <Radio className="size-2.5 animate-live" /> LANGSUNG
            </span>
          )}
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-3xl font-bold tabular-nums text-ink sm:text-4xl">
              {homeScore}
            </span>
            <span className="text-2xl text-ink-muted">:</span>
            <span className="font-mono text-3xl font-bold tabular-nums text-ink sm:text-4xl">
              {awayScore}
            </span>
          </div>
          <span
            className={cn(
              "mt-1 text-xs font-medium",
              status === "live" ? "text-grit" : "text-ink-muted",
            )}
          >
            {status === "live"
              ? `${minute}'`
              : status === "completed"
                ? "Selesai"
                : status === "halftime"
                  ? `Jeda · ${currentMinute}'`
                  : PERIOD_LABEL[period]}
          </span>
        </div>
        <TeamCol name={awayName} short={awayShort} color={awayColor} align="left" />
      </div>

      <div className="mt-3">{meta}</div>

      {canOperate && status !== "completed" && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-line-soft pt-4">
          {status === "scheduled" && (
            <Button size="sm" disabled={pending} onClick={() => run(startMatch, "Kick-off!")}>
              {pending ? <Loader2 className="animate-spin" /> : <Play className="size-3.5" />}
              Mulai Pertandingan
            </Button>
          )}
          {status === "live" && period === "first_half" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(pauseClock, "Turun minum")}>
              <Pause className="size-3.5" /> Akhiri Babak 1
            </Button>
          )}
          {(status === "halftime" || (status === "live" && period === "halftime")) && (
            <Button size="sm" disabled={pending} onClick={() => run(resumeSecondHalf, "Babak 2 dimulai")}>
              <SkipForward className="size-3.5" /> Mulai Babak 2
            </Button>
          )}
          {status === "live" && (
            <Button size="sm" variant="danger" disabled={pending} onClick={() => run(endMatch, "Peluit panjang")}>
              <Square className="size-3.5" /> Akhiri Pertandingan
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function TeamCol({
  name,
  short,
  color,
  align,
}: {
  name: string | null;
  short: string | null;
  color: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-black"
        style={{ background: color ?? "var(--color-grit)" }}
      >
        {short}
      </span>
      <span className="min-w-0 truncate text-sm font-semibold text-ink">{name}</span>
    </div>
  );
}
