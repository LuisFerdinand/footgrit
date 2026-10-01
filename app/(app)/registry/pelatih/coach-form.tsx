"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import { createCoach, updateCoach } from "./actions";
import type { FormState } from "@/lib/form";
import type { Coach } from "@/lib/db/schema";
import { COACH_LICENSE_LEVELS, COACH_SPECIALTIES } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";

export function CoachForm({
  clubs,
  coach,
  defaultClubId,
}: {
  clubs: { id: string; name: string }[];
  coach?: Coach;
  defaultClubId?: string;
}) {
  const action = coach ? updateCoach.bind(null, coach.id) : createCoach;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const sv = state?.values ?? {};
  const val = (key: keyof Coach & string, fallback = "") => {
    if (key in sv) return sv[key];
    const v = coach?.[key];
    return v == null ? fallback : String(v);
  };
  const revoked = state?.values ? sv.revoked === "on" : coach?.status === "revoked";

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Identitas">
        <div className="sm:col-span-2">
          <ImageUpload
            name="photoUrl"
            label="Foto pelatih"
            displayName={coach?.fullName ?? "Pelatih Baru"}
            defaultValue={coach?.photoUrl}
          />
          {fe.photoUrl && <p className="mt-1 text-[11px] text-danger">{fe.photoUrl}</p>}
        </div>
        <Field label="Nama lengkap" error={fe.fullName} className="sm:col-span-2">
          <Input name="fullName" required defaultValue={val("fullName")} placeholder="mis. Budi Santoso" />
        </Field>
        <Field label="Tanggal lahir" error={fe.dob}>
          <Input name="dob" type="date" defaultValue={val("dob")} />
        </Field>
        <Field label="Kota domisili" error={fe.city}>
          <Input name="city" defaultValue={val("city")} />
        </Field>
      </Section>

      <Section title="Penugasan">
        <Field label="Klub / Akademi" error={fe.clubId}>
          <Select name="clubId" defaultValue={val("clubId", defaultClubId ?? "")}>
            <option value="">Belum terikat klub</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Peran" error={fe.specialty}>
          <Select name="specialty" defaultValue={val("specialty", coach ? "" : COACH_SPECIALTIES[0])}>
            <option value="">—</option>
            {COACH_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pengalaman melatih (tahun)" error={fe.experienceYears}>
          <Input name="experienceYears" type="number" min={0} max={60} defaultValue={val("experienceYears")} />
        </Field>
      </Section>

      <Section title="Lisensi kepelatihan">
        <Field label="Tingkat lisensi" error={fe.licenseLevel}>
          <Select name="licenseLevel" required defaultValue={val("licenseLevel", COACH_LICENSE_LEVELS[0])}>
            {COACH_LICENSE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nomor lisensi" error={fe.licenseNumber}>
          <Input
            name="licenseNumber"
            required
            defaultValue={val("licenseNumber")}
            placeholder="mis. PLT-2026-0101"
            className="font-mono uppercase"
          />
        </Field>
        <Field label="Tanggal terbit" error={fe.licenseIssuedAt}>
          <Input name="licenseIssuedAt" type="date" defaultValue={val("licenseIssuedAt")} />
        </Field>
        <Field label="Berlaku sampai" error={fe.licenseExpiry} hint="Status Aktif / Akan Kedaluwarsa dihitung otomatis">
          <Input name="licenseExpiry" type="date" required defaultValue={val("licenseExpiry")} />
        </Field>
        <label className="flex items-start gap-2 rounded-lg border border-line-soft bg-surface-2/40 p-3 text-xs sm:col-span-2">
          <input
            type="checkbox"
            name="revoked"
            defaultChecked={revoked}
            className="mt-0.5 size-3.5 accent-[var(--color-danger)]"
          />
          <span>
            <span className="font-medium text-ink">Lisensi dicabut</span>
            <span className="block text-[11px] text-ink-muted">
              Tandai bila lisensi dicabut/dibekukan — status menjadi &ldquo;Dicabut&rdquo; terlepas dari masa berlaku.
            </span>
          </span>
        </label>
      </Section>

      <Section title="Kontak">
        <Field label="Telepon" error={fe.phone}>
          <Input name="phone" defaultValue={val("phone")} placeholder="08xx" />
        </Field>
        <Field label="Email" error={fe.email}>
          <Input name="email" type="email" defaultValue={val("email")} />
        </Field>
      </Section>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : coach ? <Save /> : <UserPlus />}
          {coach ? "Simpan perubahan" : "Daftarkan pelatih"}
        </Button>
        {coach && (
          <Button variant="ghost" href={`/registry/pelatih/${coach.id}`}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
