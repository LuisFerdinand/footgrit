"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import { createPlayer, updatePlayer, type PlayerFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";
import { DocumentUpload, type DocumentMeta } from "@/components/app/document-upload";
import { FootPicker, type Foot } from "@/components/app/foot-icon";
import type { Player } from "@/lib/db/schema";

type AgeOption = {
  id: string;
  code: string;
  birthYearFrom: number | null;
  birthYearTo: number | null;
};

export function PlayerForm({
  clubs,
  ageCategories,
  player,
  kiaMeta,
}: {
  clubs: { id: string; name: string }[];
  ageCategories: AgeOption[];
  /** When present the form edits this player instead of registering a new one. */
  player?: Player;
  kiaMeta?: DocumentMeta | null;
}) {
  const action = player ? updatePlayer.bind(null, player.id) : createPlayer;
  const [state, formAction, pending] = useActionState<PlayerFormState, FormData>(
    action,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const sv = state?.values ?? {};
  const val = (key: keyof Player & string) => {
    if (key in sv) return sv[key];
    const v = player?.[key];
    return v == null ? "" : String(v);
  };

  const [dob, setDob] = React.useState(val("dob"));
  const ageRef = React.useRef<HTMLSelectElement>(null);
  const birthYear = dob ? Number(dob.slice(0, 4)) : null;
  const suggested = birthYear
    ? ageCategories.find(
        (a) =>
          a.birthYearFrom != null &&
          a.birthYearTo != null &&
          birthYear >= a.birthYearFrom &&
          birthYear <= a.birthYearTo,
      )
    : undefined;

  const onDob = (value: string) => {
    setDob(value);
    // Fill the category automatically only while it is still unset.
    const y = Number(value.slice(0, 4));
    const match = ageCategories.find(
      (a) => a.birthYearFrom != null && a.birthYearTo != null && y >= a.birthYearFrom && y <= a.birthYearTo,
    );
    if (match && ageRef.current && !ageRef.current.value) ageRef.current.value = match.id;
  };

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Identitas pemain">
        <div className="sm:col-span-2">
          <ImageUpload
            name="photoUrl"
            label="Foto pemain"
            displayName={player?.fullName ?? "Pemain Baru"}
            shape="square"
            defaultValue={player?.photoUrl}
          />
          {fe.photoUrl && <p className="mt-1 text-[11px] text-danger">{fe.photoUrl}</p>}
        </div>
        <Field label="Nama lengkap" error={fe.fullName} className="sm:col-span-2">
          <Input name="fullName" required defaultValue={val("fullName")} placeholder="mis. Arya Pratama" />
        </Field>
        <Field label="Nama panggilan" error={fe.nickname}>
          <Input name="nickname" defaultValue={val("nickname")} placeholder="Opsional" />
        </Field>
        <Field label="NISN" error={fe.nisn} hint="Nomor Induk Siswa Nasional · 10 digit">
          <Input
            name="nisn"
            defaultValue={val("nisn")}
            inputMode="numeric"
            maxLength={10}
            pattern="\d{10}"
            title="10 digit angka"
            placeholder="0123456789"
            className="font-mono tracking-wider"
          />
        </Field>
        <Field label="Tanggal lahir" error={fe.dob}>
          <Input name="dob" type="date" required defaultValue={val("dob")} onChange={(e) => onDob(e.target.value)} />
        </Field>
        <Field label="Tempat lahir" error={fe.birthPlace}>
          <Input name="birthPlace" defaultValue={val("birthPlace")} placeholder="Kota kelahiran" />
        </Field>
      </Section>

      <Section title="Profil bermain">
        <Field label="Posisi" error={fe.position}>
          <Select name="position" required defaultValue={val("position") || "MF"}>
            <option value="GK">Kiper</option>
            <option value="DF">Bertahan</option>
            <option value="MF">Tengah</option>
            <option value="FW">Depan</option>
          </Select>
        </Field>
        <Field label="Nomor punggung" error={fe.jerseyNumber}>
          <Input name="jerseyNumber" type="number" min={1} max={99} defaultValue={val("jerseyNumber")} />
        </Field>
        <Field label="Kaki dominan" error={fe.foot} className="sm:col-span-2">
          <FootPicker name="foot" defaultValue={(val("foot") || "right") as Foot} />
        </Field>
        <Field label="Tinggi (cm)" error={fe.heightCm}>
          <Input name="heightCm" type="number" min={90} max={220} defaultValue={val("heightCm")} />
        </Field>
        <Field label="Berat (kg)" error={fe.weightKg}>
          <Input name="weightKg" type="number" min={20} max={150} defaultValue={val("weightKg")} />
        </Field>
      </Section>

      <Section title="Klub & kategori">
        <Field label="Klub / Akademi" error={fe.clubId}>
          <Select name="clubId" defaultValue={val("clubId")}>
            <option value="">Tanpa klub</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Kategori usia"
          error={fe.ageCategoryId}
          hint={
            suggested
              ? `Sesuai tahun lahir ${birthYear}: ${suggested.code}`
              : birthYear
                ? `Belum ada kategori untuk kelahiran ${birthYear}`
                : undefined
          }
        >
          <Select ref={ageRef} name="ageCategoryId" defaultValue={val("ageCategoryId")}>
            <option value="">Belum ditentukan</option>
            {ageCategories.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Orang tua / wali">
        <Field label="Nama wali" error={fe.guardianName}>
          <Input name="guardianName" defaultValue={val("guardianName")} placeholder="Orang tua / wali" />
        </Field>
        <Field label="Kontak wali" error={fe.guardianPhone}>
          <Input name="guardianPhone" defaultValue={val("guardianPhone")} placeholder="08xx" />
        </Field>
      </Section>

      <Section title="Dokumen identitas">
        <div className="sm:col-span-2">
          <DocumentUpload
            name="kiaUrl"
            label="KIA (Kartu Identitas Anak)"
            hint="Scan / foto KIA — JPG, PNG, atau PDF · maks 5 MB. Hanya admin & operator yang dapat membuka dokumen ini."
            defaultValue={player?.kiaUrl}
            defaultMeta={kiaMeta}
            error={fe.kiaUrl}
          />
        </div>
      </Section>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : player ? <Save /> : <UserPlus />}
          {player ? "Simpan perubahan" : "Daftarkan pemain"}
        </Button>
        {player && (
          <Button variant="ghost" href={`/registry/pemain/${player.id}`}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
