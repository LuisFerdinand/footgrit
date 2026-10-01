"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { players, playerStats } from "@/lib/db/schema";
import { actionUser } from "@/lib/auth/session";
import { changedSuffix, recordAudit } from "@/lib/audit";
import { documentUrlField, imageUrlField } from "@/lib/media";
import { releaseReplaced } from "@/lib/media-store";
import { optionalInt, formError, type FormState } from "@/lib/form";

const VERIF = ["verified", "flagged", "pending", "rejected"] as const;

export async function setVerification(formData: FormData) {
  const user = await actionUser("registry:verify");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as (typeof VERIF)[number];
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!VERIF.includes(status)) throw new Error("Status tidak valid");

  const before = await db.query.players.findFirst({ where: eq(players.id, id) });

  await db
    .update(players)
    .set({
      verificationStatus: status,
      verificationNotes: notes,
      verifiedBy: status === "verified" ? user.id : null,
      verifiedAt: status === "verified" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(players.id, id));

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: status === "verified" ? "player.verify" : status === "flagged" ? "player.flag" : "player.status",
    entityType: "player",
    entityId: id,
    summary: `Status verifikasi pemain ${before?.fullName ?? ""} diubah menjadi "${status}"`,
    before: { verificationStatus: before?.verificationStatus },
    after: { verificationStatus: status },
  });

  revalidatePath(`/registry/pemain/${id}`);
  revalidatePath("/registry/pemain");
  revalidatePath("/command-center");
}

const playerSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter"),
  nickname: z.string().trim().optional(),
  nisn: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{10}$/.test(v), "NISN harus 10 digit angka")
    .optional(),
  dob: z.string().min(1, "Tanggal lahir wajib diisi"),
  birthPlace: z.string().trim().optional(),
  position: z.enum(["GK", "DF", "MF", "FW"], "Pilih posisi"),
  foot: z.enum(["left", "right", "both"], "Pilih kaki dominan").default("right"),
  jerseyNumber: optionalInt(1, 99, "Nomor punggung 1–99"),
  heightCm: optionalInt(90, 220, "Tinggi 90–220 cm"),
  weightKg: optionalInt(20, 150, "Berat 20–150 kg"),
  clubId: z.string().optional(),
  ageCategoryId: z.string().optional(),
  photoUrl: imageUrlField,
  kiaUrl: documentUrlField,
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
});

type PlayerInput = z.infer<typeof playerSchema>;

function toRow(v: PlayerInput) {
  return {
    fullName: v.fullName,
    nickname: v.nickname || null,
    nisn: v.nisn || null,
    dob: v.dob,
    birthPlace: v.birthPlace || null,
    position: v.position,
    foot: v.foot,
    jerseyNumber: v.jerseyNumber ?? null,
    heightCm: v.heightCm ?? null,
    weightKg: v.weightKg ?? null,
    clubId: v.clubId || null,
    ageCategoryId: v.ageCategoryId || null,
    photoUrl: v.photoUrl || null,
    kiaUrl: v.kiaUrl || null,
    guardianName: v.guardianName || null,
    guardianPhone: v.guardianPhone || null,
  };
}

/** NISN is unique per player — report a friendly field error instead of a DB constraint error. */
async function nisnTaken(nisn: string | null, exceptId?: string) {
  if (!nisn) return null;
  const hit = await db.query.players.findFirst({
    where: exceptId
      ? and(eq(players.nisn, nisn), ne(players.id, exceptId))
      : eq(players.nisn, nisn),
    columns: { fullName: true, registrationNo: true },
  });
  return hit ? `NISN sudah terdaftar atas nama ${hit.fullName} (${hit.registrationNo})` : null;
}

export type PlayerFormState = FormState;

export async function createPlayer(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const user = await actionUser("registry:write");
  const parsed = playerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formError(parsed.error, formData);

  const row = toRow(parsed.data);
  const taken = await nisnTaken(row.nisn);
  if (taken) return formError({ nisn: taken }, formData);

  const count = await db.$count(players);
  const regNo = `FG-2026-${String(count + 1).padStart(5, "0")}`;

  const [created] = await db
    .insert(players)
    .values({ ...row, registrationNo: regNo, verificationStatus: "pending" })
    .returning();

  await db.insert(playerStats).values({
    playerId: created.id,
    tournamentId: null,
    season: "career",
    appearances: 0,
  });

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "player.create",
    entityType: "player",
    entityId: created.id,
    summary: `Registrasi pemain baru: ${created.fullName} (${regNo})`,
  });

  revalidatePath("/registry/pemain");
  redirect(`/registry/pemain/${created.id}`);
}

export async function updatePlayer(
  id: string,
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const user = await actionUser("registry:write");
  const before = await db.query.players.findFirst({ where: eq(players.id, id) });
  if (!before) return { error: "Pemain tidak ditemukan." };

  const parsed = playerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formError(parsed.error, formData);

  const row = toRow(parsed.data);
  const taken = await nisnTaken(row.nisn, id);
  if (taken) return formError({ nisn: taken }, formData);

  await db
    .update(players)
    .set({ ...row, updatedAt: new Date() })
    .where(eq(players.id, id));

  await Promise.all([
    releaseReplaced(before.photoUrl, row.photoUrl),
    releaseReplaced(before.kiaUrl, row.kiaUrl),
  ]);

  const changed = (Object.keys(row) as (keyof typeof row)[]).filter(
    (k) => (before[k] ?? null) !== (row[k] ?? null),
  );

  await recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "player.update",
    entityType: "player",
    entityId: id,
    summary: `Data pemain ${row.fullName} diperbarui${changedSuffix(changed)}`,
    before: Object.fromEntries(changed.map((k) => [k, before[k]])),
    after: Object.fromEntries(changed.map((k) => [k, row[k]])),
  });

  revalidatePath(`/registry/pemain/${id}`);
  revalidatePath("/registry/pemain");
  redirect(`/registry/pemain/${id}`);
}
