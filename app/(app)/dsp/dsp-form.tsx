"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { saveDsp } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/utils";
import type { DspSelection } from "@/lib/dsp";

export function DspForm({ matchId, clubName, coachName, players, initial, submission, locked, rules }: {
  matchId: string; clubName: string; coachName: string;
  players: { id: string; name: string; position: string; jersey: number | null }[];
  initial: DspSelection[]; submission: { coachName: string; submittedAt: string } | null;
  locked: boolean; rules?: { playersOnField: number; maxSquad: number } | null;
}) {
  const [selected, setSelected] = useState(initial);
  const [name, setName] = useState(submission?.coachName ?? coachName);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const starters = selected.filter((p) => p.role === "starter").length;
  return <Card><CardHeader><CardTitle>Form DSP · {clubName}</CardTitle></CardHeader><CardContent className="space-y-4">
    {submission && <p className="flex items-center gap-2 text-xs text-success"><CheckCircle2 className="size-4" />Sudah submit · {formatDateTime(submission.submittedAt)}</p>}
    <p className="text-xs text-ink-muted">{locked ? "Pertandingan sudah dimulai. DSP terkunci." : "Pilih starter dan cadangan dari klub Anda. DSP dapat direvisi sampai pertandingan dimulai."}</p>
    <fieldset disabled={pending || locked} className="space-y-4">
      <Field label="Nama pelatih"><Input aria-label="Nama pelatih" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} /></Field>
      <p className="text-xs font-semibold">{starters} starter · {selected.length - starters} cadangan{rules && ` · maksimal ${rules.playersOnField} starter / ${rules.maxSquad} pemain`}</p>
      <div className="max-h-[28rem] space-y-2 overflow-y-auto">
        {players.map((p) => {
          const entry = selected.find((s) => s.playerId === p.id);
          return <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
            <label className="flex min-w-0 flex-1 items-center gap-3 text-sm"><input type="checkbox" checked={!!entry} onChange={(e) => setSelected((old) => e.target.checked ? [...old, { playerId: p.id, role: "substitute" }] : old.filter((s) => s.playerId !== p.id))} />
              <span>#{p.jersey ?? "—"} {p.name}<span className="ml-2 text-xs text-ink-muted">{p.position}</span></span></label>
            {entry && <Select aria-label={`Peran ${p.name}`} className="w-32" value={entry.role} onChange={(e) => setSelected((old) => old.map((s) => s.playerId === p.id ? { ...s, role: e.target.value as DspSelection["role"] } : s))}><option value="starter">Starter</option><option value="substitute">Cadangan</option></Select>}
          </div>;
        })}
      </div>
    </fieldset>
    {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    <Button disabled={pending || locked || !starters || name.trim().length < 2} onClick={() => start(async () => {
      setError("");
      try { await saveDsp({ matchId, coachName: name, selections: selected }); toast.success("DSP berhasil disubmit"); }
      catch (e) { setError(e instanceof Error ? e.message : "Gagal submit DSP"); }
    })}>{locked ? <LockKeyhole className="size-4" /> : <CheckCircle2 className="size-4" />}{pending ? "Menyimpan…" : locked ? "DSP terkunci" : submission ? "Submit revisi DSP" : "Submit DSP"}</Button>
  </CardContent></Card>;
}
