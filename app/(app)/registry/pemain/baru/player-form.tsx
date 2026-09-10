"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { createPlayer, type PlayerFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";

export function PlayerForm({
  clubs,
  ageCategories,
}: {
  clubs: { id: string; name: string }[];
  ageCategories: { id: string; code: string }[];
}) {
  const [state, action, pending] = useActionState<PlayerFormState, FormData>(
    createPlayer,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <ImageUpload name="photoUrl" label="Foto pemain" displayName="Pemain Baru" shape="square" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" error={fe.fullName} className="sm:col-span-2">
          <Input name="fullName" required placeholder="mis. Arya Pratama" />
        </Field>
        <Field label="Nama panggilan" error={fe.nickname}>
          <Input name="nickname" placeholder="Opsional" />
        </Field>
        <Field label="Tanggal lahir" error={fe.dob}>
          <Input name="dob" type="date" required />
        </Field>
        <Field label="Tempat lahir" error={fe.birthPlace}>
          <Input name="birthPlace" placeholder="Kota kelahiran" />
        </Field>
        <Field label="Nomor punggung" error={fe.jerseyNumber}>
          <Input name="jerseyNumber" type="number" min={1} max={99} />
        </Field>
        <Field label="Posisi" error={fe.position}>
          <Select name="position" required defaultValue="MF">
            <option value="GK">Kiper</option>
            <option value="DF">Bertahan</option>
            <option value="MF">Tengah</option>
            <option value="FW">Depan</option>
          </Select>
        </Field>
        <Field label="Kaki dominan" error={fe.foot}>
          <Select name="foot" defaultValue="right">
            <option value="right">Kanan</option>
            <option value="left">Kiri</option>
            <option value="both">Keduanya</option>
          </Select>
        </Field>
        <Field label="Tinggi (cm)" error={fe.heightCm}>
          <Input name="heightCm" type="number" min={90} max={220} />
        </Field>
        <Field label="Berat (kg)" error={fe.weightKg}>
          <Input name="weightKg" type="number" min={20} max={150} />
        </Field>
        <Field label="Klub / Akademi" error={fe.clubId}>
          <Select name="clubId" defaultValue="">
            <option value="">Tanpa klub</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kategori usia" error={fe.ageCategoryId}>
          <Select name="ageCategoryId" defaultValue="">
            <option value="">Belum ditentukan</option>
            {ageCategories.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nama wali" error={fe.guardianName}>
          <Input name="guardianName" placeholder="Orang tua / wali" />
        </Field>
        <Field label="Kontak wali" error={fe.guardianPhone}>
          <Input name="guardianPhone" placeholder="08xx" />
        </Field>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Daftarkan pemain
        </Button>
      </div>
    </form>
  );
}
