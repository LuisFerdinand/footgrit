"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { createClub, updateClub } from "./actions";
import type { FormState } from "@/lib/form";
import type { Club } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";

export function ClubForm({
  venues,
  club,
}: {
  venues: { id: string; name: string; city: string }[];
  club?: Club;
}) {
  const action = club ? updateClub.bind(null, club.id) : createClub;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const sv = state?.values ?? {};
  const val = (key: keyof Club & string, fallback = "") => {
    if (key in sv) return sv[key];
    const v = club?.[key];
    return v == null ? fallback : String(v);
  };

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Identitas">
        <div className="sm:col-span-2">
          <ImageUpload
            name="logoUrl"
            label="Logo tim"
            displayName={club?.shortName ?? "Klub"}
            shape="square"
            fit="contain"
            defaultValue={club?.logoUrl}
            hint="PNG transparan paling rapi · JPG/WEBP juga bisa · maks 5 MB"
          />
          {fe.logoUrl && <p className="mt-1 text-[11px] text-danger">{fe.logoUrl}</p>}
        </div>
        <Field label="Nama klub / akademi" error={fe.name} className="sm:col-span-2">
          <Input name="name" required defaultValue={val("name")} placeholder="mis. Garuda Muda Football Academy" />
        </Field>
        <Field label="Singkatan" error={fe.shortName} hint="2–8 karakter, tampil di papan skor">
          <Input
            name="shortName"
            required
            maxLength={8}
            defaultValue={val("shortName")}
            placeholder="GMF"
            className="font-mono uppercase"
          />
        </Field>
        <Field label="Jenis" error={fe.type}>
          <Select name="type" defaultValue={val("type", "club")}>
            <option value="club">Klub</option>
            <option value="academy">Akademi / SSB</option>
          </Select>
        </Field>
        <Field label="Tahun berdiri" error={fe.foundedYear}>
          <Input name="foundedYear" type="number" min={1900} max={new Date().getFullYear()} defaultValue={val("foundedYear")} />
        </Field>
        <Field label="Akreditasi" error={fe.accreditation}>
          <Input name="accreditation" defaultValue={val("accreditation")} placeholder="mis. Terakreditasi A" />
        </Field>
      </Section>

      <Section title="Warna tim">
        <ColorField label="Warna utama" name="primaryColor" defaultValue={val("primaryColor", "#00e28a")} error={fe.primaryColor} />
        <ColorField label="Warna kedua" name="secondaryColor" defaultValue={val("secondaryColor", "#0f1620")} error={fe.secondaryColor} />
      </Section>

      <Section title="Lokasi">
        <Field label="Kota" error={fe.city}>
          <Input name="city" required defaultValue={val("city")} placeholder="mis. Depok" />
        </Field>
        <Field label="Provinsi" error={fe.province}>
          <Input name="province" defaultValue={val("province")} placeholder="mis. Jawa Barat" />
        </Field>
        <Field label="Venue kandang" error={fe.homeVenueId} className="sm:col-span-2">
          <Select name="homeVenueId" defaultValue={val("homeVenueId")}>
            <option value="">Belum ditentukan</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Kontak sekretariat">
        <Field label="Nama kontak" error={fe.contactName}>
          <Input name="contactName" defaultValue={val("contactName")} />
        </Field>
        <Field label="Telepon" error={fe.contactPhone}>
          <Input name="contactPhone" defaultValue={val("contactPhone")} placeholder="08xx" />
        </Field>
        <Field label="Email" error={fe.contactEmail} className="sm:col-span-2">
          <Input name="contactEmail" type="email" defaultValue={val("contactEmail")} placeholder="sekretariat@klub.or.id" />
        </Field>
      </Section>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : club ? <Save /> : <Plus />}
          {club ? "Simpan perubahan" : "Daftarkan klub"}
        </Button>
        {club && (
          <Button variant="ghost" href={`/registry/klub/${club.id}`}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  const [color, setColor] = React.useState(defaultValue);
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-line bg-base/60 p-1"
          aria-label={label}
        />
        <Input
          name={name}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          maxLength={7}
          className="font-mono uppercase"
        />
      </div>
    </Field>
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
