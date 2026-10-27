import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import type { TFunction } from "@/lib/i18n/translate";
import { users } from "@/lib/db/schema";
import { getSafeT } from "@/lib/i18n/server";

const identity = (t: TFunction) => ({
  name: z.string().trim().min(2, t("Nama minimal 2 karakter")).max(200),
  email: z.string().trim().toLowerCase().pipe(z.email(t("Email tidak valid")).max(255)),
  active: z.boolean().default(true),
});
const passwordField = (t: TFunction) => z.string().min(8, t("Kata sandi minimal 8 karakter")).max(72, t("Kata sandi maksimal 72 byte"))
  .refine((v) => new TextEncoder().encode(v).length <= 72, t("Kata sandi maksimal 72 byte"));
export const makeNewOperatorSchema = (t: TFunction) => z.object({ ...identity(t), password: passwordField(t) });
export const makeEditOperatorSchema = (t: TFunction) =>
  z.object({ ...identity(t), password: z.preprocess((v) => v === "" ? undefined : v, passwordField(t).optional()) });
export type NewOperatorInput = z.infer<ReturnType<typeof makeNewOperatorSchema>>;
export type EditOperatorInput = z.infer<ReturnType<typeof makeEditOperatorSchema>>;

function duplicateEmail(error: unknown) {
  const cause = error as { code?: string; cause?: { code?: string } };
  return cause.code === "ER_DUP_ENTRY" || cause.cause?.code === "ER_DUP_ENTRY";
}
export class OperatorEmailExists extends Error {
  constructor() { super("Email sudah terdaftar."); }
}

/** Call only after checking account-management permission in the server action. */
export async function createOperatorAccount(input: NewOperatorInput) {
  const t = await getSafeT();
  const v = makeNewOperatorSchema(t).parse(input);
  if (await db.query.users.findFirst({ where: eq(users.email, v.email), columns: { id: true } })) throw new OperatorEmailExists();
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(v.password);
  try { await db.insert(users).values({ id, name: v.name, email: v.email, active: v.active, role: "operator", passwordHash }); }
  catch (error) { if (duplicateEmail(error)) throw new OperatorEmailExists(); throw error; }
  return { id, name: v.name, email: v.email, active: v.active };
}

export async function updateOperatorAccount(id: string, input: EditOperatorInput) {
  const t = await getSafeT();
  const v = makeEditOperatorSchema(t).parse(input);
  const before = await db.query.users.findFirst({ where: eq(users.id, id), columns: { id: true, name: true, email: true, role: true, active: true } });
  if (!before || before.role !== "operator") throw new Error(t("Akun operator tidak ditemukan."));
  const existing = await db.query.users.findFirst({ where: eq(users.email, v.email), columns: { id: true } });
  if (existing && existing.id !== id) throw new OperatorEmailExists();
  const passwordHash = v.password ? await hashPassword(v.password) : undefined;
  try { await db.update(users).set({ name: v.name, email: v.email, active: v.active, ...(passwordHash ? { passwordHash } : {}) }).where(eq(users.id, id)); }
  catch (error) { if (duplicateEmail(error)) throw new OperatorEmailExists(); throw error; }
  return { before, after: { id, name: v.name, email: v.email, active: v.active, passwordChanged: !!passwordHash } };
}
