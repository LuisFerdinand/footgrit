"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Trophy, Check } from "lucide-react";
import { createTournament, type TournamentFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FORMATS = [
  { value: "league", label: "Liga", desc: "Round-robin kandang-tandang, klasemen tunggal." },
  { value: "cup", label: "Piala", desc: "Fase grup lalu babak gugur." },
  { value: "knockout", label: "Sistem Gugur", desc: "Langsung eliminasi satu kali kalah." },
  { value: "hybrid", label: "Hybrid", desc: "Kombinasi sesuai kebutuhan." },
];

export function TournamentForm({
  ages,
  formulas,
  clubs,
}: {
  ages: { id: string; code: string; label: string }[];
  formulas: { id: string; name: string; isActive: boolean }[];
  clubs: { id: string; name: string; short: string }[];
}) {
  const [state, action, pending] = useActionState<TournamentFormState, FormData>(
    createTournament,
    undefined,
  );
  const [format, setFormat] = React.useState("league");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const fe = state?.fieldErrors ?? {};

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <form action={action} className="space-y-5">
      <Field label="Nama turnamen" error={fe.name}>
        <Input name="name" required placeholder="mis. Liga Pelajar U-14 Jabodetabek 2026" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Musim">
          <Input name="season" defaultValue="2026" required />
        </Field>
        <Field label="Kategori usia">
          <Select name="ageCategoryId" defaultValue="">
            <option value="">—</option>
            {ages.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Formula penilaian">
          <Select name="scoringFormulaId" defaultValue={formulas.find((f) => f.isActive)?.id ?? ""}>
            <option value="">—</option>
            {formulas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.isActive ? " (aktif)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-secondary">Format kompetisi</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <label
              key={f.value}
              className={cn(
                "cursor-pointer rounded-lg border p-3 transition-colors",
                format === f.value
                  ? "border-brand/50 bg-brand/5"
                  : "border-line hover:border-ink/25",
              )}
            >
              <input
                type="radio"
                name="format"
                value={f.value}
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Trophy className="size-3.5 text-brand" />
                {f.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">{f.desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penyelenggara">
          <Input name="host" placeholder="mis. Asprov PSSI DKI Jakarta" />
        </Field>
        <Field label="Kota">
          <Input name="city" placeholder="mis. Jakarta Selatan" />
        </Field>
        <Field label="Tanggal mulai">
          <Input name="startDate" type="date" />
        </Field>
        <Field label="Tanggal selesai">
          <Input name="endDate" type="date" />
        </Field>
        {format === "cup" && (
          <Field label="Jumlah grup" error={fe.groupCount}>
            <Input name="groupCount" type="number" min={2} max={8} defaultValue={2} />
          </Field>
        )}
        {format === "league" && (
          <label className="flex items-center gap-2 self-end pb-2 text-xs text-ink-secondary">
            <input type="checkbox" name="doubleRound" className="accent-brand" />
            Round-robin ganda (kandang & tandang)
          </label>
        )}
      </div>

      <Field label="Deskripsi">
        <Textarea name="description" placeholder="Ringkasan kompetisi (opsional)" />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-secondary">
            Peserta ({selected.size} dipilih)
          </span>
          <button
            type="button"
            onClick={() =>
              setSelected((s) => (s.size === clubs.length ? new Set() : new Set(clubs.map((c) => c.id))))
            }
            className="text-[11px] text-ink-muted hover:text-ink"
          >
            {selected.size === clubs.length ? "Hapus semua" : "Pilih semua"}
          </button>
        </div>
        <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-2">
          {clubs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                selected.has(c.id)
                  ? "bg-brand/10 text-ink"
                  : "text-ink-secondary hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "grid size-4 place-items-center rounded border",
                  selected.has(c.id) ? "border-brand bg-brand text-white" : "border-line",
                )}
              >
                {selected.has(c.id) && <Check className="size-3" />}
              </span>
              {c.name}
            </button>
          ))}
        </div>
        {[...selected].map((id) => (
          <input key={id} type="hidden" name="clubIds" value={id} />
        ))}
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Trophy />}
        Buat turnamen
      </Button>
    </form>
  );
}
