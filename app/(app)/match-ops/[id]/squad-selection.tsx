"use client";

import { useState, useTransition } from "react";
import { saveMatchSquad } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/input";

type Player = { id: string; name: string; clubId: string; jersey: number | null };
export function SquadSelection({ matchId, teams, players, initialIds, initialStarters }: {
  matchId: string; teams: { id: string; name: string }[]; players: Player[]; initialIds: string[]; initialStarters: string[];
}) {
  const [selected, setSelected] = useState(initialIds);
  const [starters, setStarters] = useState(initialStarters);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <Card><CardHeader><CardTitle>Pilih pemain pertandingan</CardTitle></CardHeader><CardContent>
    <p className="mb-3 text-xs text-ink-muted">Pilih starter dan cadangan setiap tim sebelum kick-off. Perubahan operator membatalkan status submit DSP tim yang diubah agar pelatih dapat meninjaunya kembali.</p>
    <div className="grid gap-4 sm:grid-cols-2">{teams.map((team) => <fieldset key={team.id} disabled={pending} className="rounded-xl border border-line p-3">
      <legend className="px-1 text-xs font-bold">{team.name}</legend>
      <div className="max-h-56 space-y-2 overflow-y-auto">{players.filter((p) => p.clubId === team.id).map((p) => <label key={p.id} className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id))} />
        <span className="flex-1">#{p.jersey ?? "—"} {p.name}</span>
        {selected.includes(p.id) && <Select aria-label={`Peran ${p.name}`} className="w-28" value={starters.includes(p.id) ? "starter" : "substitute"} onChange={(e) => setStarters((old) => e.target.value === "starter" ? [...old.filter((id) => id !== p.id), p.id] : old.filter((id) => id !== p.id))}><option value="starter">Starter</option><option value="substitute">Cadangan</option></Select>}
      </label>)}</div>
    </fieldset>)}</div>
    {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
    <Button className="mt-4" disabled={pending || teams.some((team) => !players.some((p) => p.clubId === team.id && selected.includes(p.id)))} onClick={() => start(async () => {
      setError(null);
      try { await saveMatchSquad(matchId, selected, starters.filter((id) => selected.includes(id))); toast.success("Pemain pertandingan disimpan"); }
      catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan pemain"); }
    })}>{pending ? "Menyimpan…" : "Simpan pemain"}</Button>
  </CardContent></Card>;
}
