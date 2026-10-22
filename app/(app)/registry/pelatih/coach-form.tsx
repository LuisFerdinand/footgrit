"use client";

import * as React from "react";
import { useActionState } from "react";
import { IdCard, Loader2, Save, ScrollText, UserPlus } from "lucide-react";
import { createCoach, updateCoach } from "./actions";
import type { FormState } from "@/lib/form";
import type { Coach } from "@/lib/db/schema";
import { COACH_LICENSE_LEVELS, COACH_SPECIALTIES } from "@/lib/status";
import { COACH_DOCUMENTS, type CoachDocumentKey } from "@/lib/coach-documents";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { ImageUpload } from "@/components/app/image-upload";
import { DocumentUpload, type DocumentMeta } from "@/components/app/document-upload";
import { rich } from "@/lib/i18n/rich";
import { useT } from "@/lib/i18n/client";

const DOC_ICON: Record<CoachDocumentKey, React.ComponentType<{ className?: string }>> = {
  licenseDocUrl: ScrollText,
  ktpUrl: IdCard,
};

export function CoachForm({
  clubs,
  coach,
  defaultClubId,
  docMeta,
}: {
  clubs: { id: string; name: string }[];
  coach?: Coach;
  defaultClubId?: string;
  /** File name / size of already-uploaded documents (only loaded for people who may open them). */
  docMeta?: Partial<Record<CoachDocumentKey, DocumentMeta | null>>;
}) {
  const t = useT();
  const action = coach ? updateCoach.bind(null, coach.id) : createCoach;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const sv = state?.values ?? {};
  const val = (key: keyof Coach & string, fallback = "") => {
    if (key in sv) return sv[key];
    const v = coach?.[key];
    return v == null ? fallback : String(v);
  };

  return (
    <form action={formAction} className="space-y-6">
      <Section title={t("Identitas")}>
        <div className="sm:col-span-2">
          <ImageUpload
            name="photoUrl"
            label={t("Foto pelatih")}
            displayName={coach?.fullName ?? t("Pelatih Baru")}
            defaultValue={coach?.photoUrl}
          />
          {fe.photoUrl && <p className="mt-1 text-[11px] text-danger">{fe.photoUrl}</p>}
        </div>
        <Field label={t("Nama lengkap")} error={fe.fullName} className="sm:col-span-2">
          <Input name="fullName" required defaultValue={val("fullName")} placeholder={t("mis. Budi Santoso")} />
        </Field>
        <Field label={t("Tanggal lahir")} error={fe.dob}>
          <Input name="dob" type="date" defaultValue={val("dob")} />
        </Field>
        <Field label={t("Kota domisili")} error={fe.city}>
          <Input name="city" defaultValue={val("city")} />
        </Field>
      </Section>

      <Section title={t("Penugasan")}>
        <Field label={t("SSB::tunggal")} error={fe.clubId}>
          <Select name="clubId" defaultValue={val("clubId", defaultClubId ?? "")}>
            <option value="">{t("Belum terikat SSB")}</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Peran")} error={fe.specialty}>
          <Select name="specialty" defaultValue={val("specialty", coach ? "" : COACH_SPECIALTIES[0])}>
            <option value="">—</option>
            {COACH_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {t.dyn(s)}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title={t("Lisensi kepelatihan")}>
        <Field label={t("Tingkat lisensi")} error={fe.licenseLevel}>
          <Select name="licenseLevel" required defaultValue={val("licenseLevel", COACH_LICENSE_LEVELS[0])}>
            {COACH_LICENSE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {t.dyn(l)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Nomor lisensi")} error={fe.licenseNumber}>
          <Input
            name="licenseNumber"
            required
            defaultValue={val("licenseNumber")}
            placeholder={t("mis. PLT-2026-0101")}
            className="font-mono uppercase"
          />
        </Field>
      </Section>

      <Section title={t("Dokumen pelatih")}>
        <p className="rounded-lg bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-ink-muted sm:col-span-2">
          {rich(t("Dokumen bersifat <b>privat</b> — hanya admin & operator yang dapat membukanya. Boleh diunggah bertahap; kelengkapannya tampil di profil dan daftar pelatih."), {
            b: (c) => <strong className="text-ink-secondary">{c}</strong>,
          })}
        </p>
        {COACH_DOCUMENTS.map((d) => (
          <div key={d.key} className="sm:col-span-2">
            <DocumentUpload
              name={d.key}
              label={t.dyn(d.label)}
              hint={t.dyn(d.hint)}
              icon={DOC_ICON[d.key]}
              defaultValue={sv[d.key] ?? coach?.[d.key]}
              defaultMeta={docMeta?.[d.key]}
              error={fe[d.key]}
            />
          </div>
        ))}
      </Section>

      <Section title={t("Kontak")}>
        <Field label={t("Telepon")} error={fe.phone}>
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
          {coach ? t("Simpan perubahan") : t("Daftarkan pelatih")}
        </Button>
        {coach && (
          <Button variant="ghost" href={`/registry/pelatih/${coach.id}`}>
            {t("Batal")}
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
