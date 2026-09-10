"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { players, playerStats } from "@/lib/db/schema";
import { actionUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

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
  fullName: z.string().min(3, "Nama minimal 3 karakter"),
  nickname: z.string().optional(),
  dob: z.string().min(1, "Tanggal lahir wajib diisi"),
  birthPlace: z.string().optional(),
  position: z.enum(["GK", "DF", "MF", "FW"]),
  foot: z.enum(["left", "right", "both"]).default("right"),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional(),
  heightCm: z.coerce.number().int().min(90).max(220).optional(),
  weightKg: z.coerce.number().int().min(20).max(150).optional(),
  clubId: z.string().optional(),
  ageCategoryId: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  bio: z.string().optional(),
});

export type PlayerFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function createPlayer(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const user = await actionUser("registry:write");
  const parsed = playerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian formulir.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0], i.message]),
      ),
    };
  }
  const v = parsed.data;
  const count = await db.$count(players);
  const regNo = `FG-2026-${String(count + 1).padStart(5, "0")}`;

  const [row] = await db
    .insert(players)
    .values({
      fullName: v.fullName,
      nickname: v.nickname || null,
      registrationNo: regNo,
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
      guardianName: v.guardianName || null,
      guardianPhone: v.guardianPhone || null,
      bio: v.bio || null,
      verificationStatus: "pending",
    })
    .returning();

  await db.insert(playerStats).values({
    playerId: row.id,
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
    entityId: row.id,
    summary: `Registrasi pemain baru: ${row.fullName} (${regNo})`,
  });

  revalidatePath("/registry/pemain");
  redirect(`/registry/pemain/${row.id}`);
}

void slugify;
