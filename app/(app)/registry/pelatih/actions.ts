"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { coaches, users } from "@/lib/db/schema";
import { saveCoachAccount, type CoachAccountInput } from "@/lib/coach-accounts";
import { actionUser } from "@/lib/auth/session";
import { auditText, changedSuffix, recordAudit } from "@/lib/audit";
import { documentUrlField, imageUrlField } from "@/lib/media";
import { releaseReplaced } from "@/lib/media-store";
import { COACH_DOCUMENT_KEYS } from "@/lib/coach-documents";
import { formError, type FormState } from "@/lib/form";
import { COACH_LICENSE_LEVELS, COACH_SPECIALTIES } from "@/lib/status";
import { insertReturning } from "@/lib/db/returning";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n/translate";

const optionalDate = (t: TFunction) =>
  z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), t("Tanggal tidak valid"))
    .optional();

const makeCoachSchema = (t: TFunction) => z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter"),
  dob: optionalDate(t),
  city: z.string().trim().optional(),
  clubId: z.string().optional(),
  specialty: z
    .string()
    .refine((v) => v === "" || COACH_SPECIALTIES.includes(v), t("Peran tidak dikenali"))
    .optional(),
  licenseLevel: z
    .string()
    .refine((v) => COACH_LICENSE_LEVELS.includes(v), t("Pilih tingkat lisensi")),
  licenseNumber: z.string().trim().toUpperCase().min(3, t("Nomor lisensi wajib diisi")).max(40),
  licenseDocUrl: documentUrlField(t),
  ktpUrl: documentUrlField(t),
  photoUrl: imageUrlField(t),
  phone: z.string().trim().optional(),
  email: z.union([z.literal(""), z.email("Email tidak valid")]).optional(),
});

type CoachInput = z.infer<ReturnType<typeof makeCoachSchema>>;

function toRow(v: CoachInput) {
  return {
    fullName: v.fullName,
    dob: v.dob || null,
    city: v.city || null,
    clubId: v.clubId || null,
    specialty: v.specialty || null,
    licenseLevel: v.licenseLevel,
    licenseNumber: v.licenseNumber,
    licenseDocUrl: v.licenseDocUrl || null,
    ktpUrl: v.ktpUrl || null,
    photoUrl: v.photoUrl || null,
    phone: v.phone || null,
    email: v.email || null,
  };
}

async function licenseTaken(t: TFunction, licenseNumber: string, exceptId?: string) {
  const hit = await db.query.coaches.findFirst({
    where: exceptId
      ? and(eq(coaches.licenseNumber, licenseNumber), ne(coaches.id, exceptId))
      : eq(coaches.licenseNumber, licenseNumber),
    columns: { fullName: true },
  });
  return hit ? t("Nomor lisensi sudah terdaftar atas nama {name}", { name: hit.fullName }) : null;
}

function revalidateCoach(id: string, clubIds: (string | null)[]) {
  revalidatePath("/registry/pelatih");
  revalidatePath(`/registry/pelatih/${id}`);
  for (const c of new Set(clubIds)) if (c) revalidatePath(`/registry/klub/${c}`);
}

export async function createCoach(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await actionUser("registry.coach:create");
  const parsed = makeCoachSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formError(t, parsed.error, formData);

  const row = toRow(parsed.data);
  const taken = await licenseTaken(t, row.licenseNumber);
  if (taken) return formError(t, { licenseNumber: taken }, formData);

  const [created] = await insertReturning(db, coaches, row);

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "coach.create",
    entityType: "coach",
    entityId: created.id,
    summary: auditText("Registrasi pelatih baru: {name} ({level} · {number})", { name: row.fullName, level: row.licenseLevel, number: row.licenseNumber }),
  });

  revalidateCoach(created.id, [row.clubId]);
  redirect(`/registry/pelatih/${created.id}`);
}

export async function updateCoach(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getT();
  const user = await actionUser("registry.coach:edit");
  const before = await db.query.coaches.findFirst({ where: eq(coaches.id, id) });
  if (!before) return { error: t("Pelatih tidak ditemukan.") };

  const parsed = makeCoachSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formError(t, parsed.error, formData);

  const row = toRow(parsed.data);
  const taken = await licenseTaken(t, row.licenseNumber, id);
  if (taken) return formError(t, { licenseNumber: taken }, formData);

  await db.transaction(async (tx) => {
    await tx.update(coaches).set(row).where(eq(coaches.id, id));
    if (before.userId) await tx.update(users).set({ name: row.fullName, clubId: row.clubId }).where(and(eq(users.id, before.userId), eq(users.role, "coach")));
  });
  // a replaced or removed scan / photo no longer needs its stored file
  await Promise.all([
    releaseReplaced(before.photoUrl, row.photoUrl),
    ...COACH_DOCUMENT_KEYS.map((k) => releaseReplaced(before[k], row[k])),
  ]);

  const changed = (Object.keys(row) as (keyof typeof row)[]).filter(
    (k) => (before[k] ?? null) !== (row[k] ?? null),
  );
  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "coach.update",
    entityType: "coach",
    entityId: id,
    summary: auditText("Data pelatih {name} diperbarui{changed}", { name: row.fullName, changed: changedSuffix(changed) }),
    // documents are private: record that they changed, never the file ids
    before: Object.fromEntries(changed.filter((k) => !COACH_DOCUMENT_KEYS.includes(k as never)).map((k) => [k, before[k]])),
    after: Object.fromEntries(changed.filter((k) => !COACH_DOCUMENT_KEYS.includes(k as never)).map((k) => [k, row[k]])),
  });

  revalidateCoach(id, [before.clubId, row.clubId]);
  redirect(`/registry/pelatih/${id}`);
}

export async function saveCoachLogin(coachId: string, input: CoachAccountInput) {
  const actor = await actionUser("registry.coach:account");
  const account = await saveCoachAccount(coachId, input);
  await recordAudit({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "coach.account", entityType: "user", entityId: account.id,
    summary: auditText("Akun login pelatih disimpan: {name}", { name: account.name }), after: account });
  revalidatePath(`/registry/pelatih/${coachId}`);
  revalidatePath("/dsp");
}
