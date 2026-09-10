"use client";

import * as React from "react";
import { CheckCircle2, PenLine, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { toast } from "@/components/ui/toaster";
import { confirmResult, amendResult } from "./actions";

export function ResultControl({
  matchId,
  resultStatus,
  homeScore,
  awayScore,
  canConfirm,
  amendmentReason,
}: {
  matchId: string;
  resultStatus: string;
  homeScore: number;
  awayScore: number;
  canConfirm: boolean;
  amendmentReason: string | null;
}) {
  const [pending, start] = React.useTransition();
  const [amending, setAmending] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const doConfirm = () => {
    const fd = new FormData();
    fd.set("id", matchId);
    start(async () => {
      try {
        await confirmResult(fd);
        toast.success("Hasil dikonfirmasi", "Klasemen & statistik pemain diperbarui");
      } catch (e) {
        toast.error("Gagal", e instanceof Error ? e.message : undefined);
      }
    });
  };

  const doAmend = () => {
    if (!reason.trim()) {
      toast.error("Alasan koreksi wajib diisi");
      return;
    }
    const fd = new FormData();
    fd.set("id", matchId);
    fd.set("reason", reason);
    start(async () => {
      try {
        await amendResult(fd);
        toast.success("Hasil dikoreksi");
        setAmending(false);
        setReason("");
      } catch (e) {
        toast.error("Gagal", e instanceof Error ? e.message : undefined);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" /> Validasi Hasil
        </CardTitle>
        <StatusBadge kind="result" value={resultStatus} dot />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-ink-secondary">
          Skor akhir: <span className="font-mono font-semibold text-ink">{homeScore} – {awayScore}</span>
        </p>
        {amendmentReason && (
          <p className="rounded-lg border border-violet/25 bg-violet/10 p-2.5 text-[11px] text-violet">
            Koreksi terakhir: {amendmentReason}
          </p>
        )}

        {!canConfirm && (
          <p className="text-[11px] text-ink-muted">
            Konfirmasi hasil memerlukan peran Wasit atau Operator Kompetisi.
          </p>
        )}

        {canConfirm && (
          <div className="space-y-2">
            {resultStatus === "unconfirmed" && (
              <Button className="w-full" size="sm" disabled={pending} onClick={doConfirm}>
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                Konfirmasi Hasil
              </Button>
            )}
            {(resultStatus === "confirmed" || resultStatus === "amended") && !amending && (
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                onClick={() => setAmending(true)}
              >
                <PenLine className="size-3.5" /> Koreksi Hasil
              </Button>
            )}
            {amending && (
              <div className="space-y-2">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Alasan koreksi (mis. gol salah dicatat, protes klub disetujui)…"
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={pending} onClick={doAmend}>
                    {pending ? <Loader2 className="animate-spin" /> : <PenLine className="size-3.5" />}
                    Simpan Koreksi
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAmending(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] text-ink-muted">
          Setiap konfirmasi & koreksi tercatat pada jejak audit menyeluruh.
        </p>
      </CardContent>
    </Card>
  );
}
