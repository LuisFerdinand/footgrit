"use client";

import * as React from "react";
import {
  Goal,
  Square,
  Hand,
  ShieldAlert,
  Flag,
  ArrowLeftRight,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { addEvent } from "./actions";

type Squad = { id: string; name: string; clubId: string | null; position: string; jersey: number | null };
type ClubMini = { id: string; short: string; color: string | null };

type EventType = {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  needsPlayer?: boolean;
  needsAssist?: boolean;
};

const EVENT_TYPES: EventType[] = [
  { type: "goal", label: "Gol", icon: Goal, needsPlayer: true, needsAssist: true },
  { type: "penalty_goal", label: "Gol Penalti", icon: Goal, needsPlayer: true },
  { type: "yellow_card", label: "Kartu Kuning", icon: Square, needsPlayer: true },
  { type: "red_card", label: "Kartu Merah", icon: Square, needsPlayer: true },
  { type: "substitution", label: "Pergantian", icon: ArrowLeftRight, needsPlayer: true, needsAssist: true },
  { type: "save", label: "Penyelamatan", icon: Hand, needsPlayer: true },
  { type: "foul", label: "Pelanggaran", icon: ShieldAlert, needsPlayer: true },
  { type: "corner", label: "Tendangan Sudut", icon: Flag },
  { type: "offside", label: "Offside", icon: Flag },
];

export function EventEntry({
  matchId,
  minute,
  homeClub,
  awayClub,
  squads,
}: {
  matchId: string;
  minute: number;
  homeClub: ClubMini;
  awayClub: ClubMini;
  squads: Squad[];
}) {
  const [pending, start] = React.useTransition();
  const [type, setType] = React.useState<string>("goal");
  const [clubId, setClubId] = React.useState(homeClub.id);
  const [playerId, setPlayerId] = React.useState("");
  const [relatedId, setRelatedId] = React.useState("");
  const [min, setMin] = React.useState(minute);

  React.useEffect(() => setMin(minute), [minute]);

  const meta = EVENT_TYPES.find((e) => e.type === type)!;
  const clubPlayers = squads
    .filter((s) => s.clubId === clubId)
    .sort((a, b) => (a.jersey ?? 99) - (b.jersey ?? 99));

  const submit = () => {
    if (meta.needsPlayer && !playerId) {
      toast.error("Pilih pemain terlebih dahulu");
      return;
    }
    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("type", type);
    fd.set("clubId", clubId);
    fd.set("minute", String(min));
    if (playerId) fd.set("playerId", playerId);
    if (relatedId) fd.set("relatedPlayerId", relatedId);
    start(async () => {
      try {
        await addEvent(fd);
        toast.success(`${meta.label} dicatat (menit ${min})`);
        setPlayerId("");
        setRelatedId("");
      } catch (e) {
        toast.error("Gagal", e instanceof Error ? e.message : undefined);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-4" /> Catat Kejadian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {EVENT_TYPES.map((e) => (
            <button
              key={e.type}
              onClick={() => setType(e.type)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition-colors",
                type === e.type
                  ? "border-grit/50 bg-grit/10 text-ink"
                  : "border-line text-ink-muted hover:text-ink-secondary",
              )}
            >
              <e.icon className="size-3.5" />
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {[homeClub, awayClub].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setClubId(c.id);
                setPlayerId("");
                setRelatedId("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                clubId === c.id ? "border-grit/50 bg-grit/5 text-ink" : "border-line text-ink-muted",
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: c.color ?? "var(--color-grit)" }}
              />
              {c.short}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_72px] gap-2">
          {meta.needsPlayer && (
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="text-xs">
              <option value="">Pilih pemain…</option>
              {clubPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.jersey ? `#${p.jersey} ` : ""}
                  {p.name} ({p.position})
                </option>
              ))}
            </Select>
          )}
          <div className={cn(meta.needsPlayer ? "" : "col-span-2 flex gap-2")}>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              min={0}
              max={130}
              className="h-9 w-full rounded-lg border border-line bg-base/60 px-2 text-center text-xs tabular-nums text-ink outline-none focus:border-grit/50"
            />
          </div>
        </div>

        {meta.needsAssist && (
          <Select value={relatedId} onChange={(e) => setRelatedId(e.target.value)} className="text-xs">
            <option value="">
              {type === "substitution" ? "Pemain masuk…" : "Assist oleh… (opsional)"}
            </option>
            {clubPlayers
              .filter((p) => p.id !== playerId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.jersey ? `#${p.jersey} ` : ""}
                  {p.name}
                </option>
              ))}
          </Select>
        )}

        <Button className="w-full" size="sm" disabled={pending} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus className="size-3.5" />}
          Tambahkan ke Lini Masa
        </Button>
      </CardContent>
    </Card>
  );
}
