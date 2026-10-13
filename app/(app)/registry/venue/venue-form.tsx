"use client";

import { useActionState } from "react";
import { Loader2, MapPin, Plus, LayoutGrid } from "lucide-react";
import { createVenue, updateVenue } from "./actions";
import type { Venue } from "@/lib/db/schema";
import type { FormState } from "@/lib/form";
import { VENUE_SURFACE } from "@/lib/venue";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";

export function VenueForm({ venue }: { venue?: Venue }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(venue ? updateVenue.bind(null, venue.id) : createVenue, undefined);
  const errors = state?.fieldErrors ?? {};
  const value = (key: string, fallback = "") => {
    if (state?.values) return state.values[key] ?? (key === "floodlights" ? "" : fallback);
    const saved = venue?.[key as keyof Venue];
    return saved == null ? fallback : typeof saved === "boolean" ? (saved ? "on" : "") : String(saved);
  };

  return (
    <form action={formAction} className="space-y-7">
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-brand" /> Identitas & lokasi</legend>
        <Field label="Nama venue" error={errors.name} className="sm:col-span-2">
          <Input name="name" aria-label="Nama venue" required minLength={3} maxLength={200} defaultValue={value("name")} placeholder="mis. Stadion Kota Jakarta" />
        </Field>
        <Field label="Kota / kabupaten" error={errors.city}><Input name="city" aria-label="Kota / kabupaten" required minLength={2} maxLength={120} defaultValue={value("city")} placeholder="Jakarta Selatan" /></Field>
        <Field label="Provinsi" error={errors.province}><Input name="province" aria-label="Provinsi" maxLength={120} defaultValue={value("province")} placeholder="DKI Jakarta" /></Field>
        <Field label="Alamat" error={errors.address} className="sm:col-span-2"><Textarea name="address" aria-label="Alamat" rows={2} maxLength={500} defaultValue={value("address")} placeholder="Nama jalan dan detail lokasi" /></Field>
      </fieldset>
      <fieldset disabled={pending} className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <legend className="mb-4 flex items-center gap-2 text-sm font-bold"><LayoutGrid className="size-4 text-brand" /> Fasilitas pertandingan</legend>
        <Field label="Permukaan lapangan" error={errors.surface}><Select name="surface" aria-label="Permukaan lapangan" defaultValue={value("surface", "natural")}>{Object.entries(VENUE_SURFACE).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
        <Field label="Jumlah lapangan" error={errors.fieldCount}><Input name="fieldCount" aria-label="Jumlah lapangan" type="number" required min={1} max={2_147_483_647} step={1} defaultValue={value("fieldCount", "1")} /></Field>
        <Field label="Kapasitas penonton" error={errors.capacity} hint="Kosongkan jika belum diketahui."><Input name="capacity" aria-label="Kapasitas penonton" type="number" min={0} max={2_147_483_647} step={1} defaultValue={value("capacity")} placeholder="mis. 2000" /></Field>
        <label className="flex cursor-pointer items-center gap-3 self-start rounded-xl bg-surface-2 p-3 text-xs font-medium sm:mt-5"><input name="floodlights" type="checkbox" defaultChecked={value("floodlights") === "on"} className="size-4 accent-brand" /> Tersedia lampu pertandingan</label>
        <Field label="Catatan fasilitas" error={errors.notes} className="sm:col-span-2"><Textarea name="notes" aria-label="Catatan fasilitas" rows={3} maxLength={2000} defaultValue={value("notes")} placeholder="Akses masuk, ruang ganti, atau informasi tambahan" /></Field>
        <div className="sm:col-span-2"><ImageUpload name="photoUrl" label="Foto venue (opsional)" displayName="Venue" shape="square" defaultValue={value("photoUrl")} hint="Foto tampil di kartu venue · JPG, PNG, WEBP · maks 5 MB" />{errors.photoUrl && <p className="mt-1 text-xs text-danger">{errors.photoUrl}</p>}</div>
      </fieldset>
      {state?.error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-xs text-danger">{state.error}</p>}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Plus />}{venue ? "Simpan perubahan" : "Daftarkan venue"}</Button>
        <Button href="/registry/venue" variant="outline">Batal</Button>
      </div>
    </form>
  );
}
