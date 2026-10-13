import { z } from "zod";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const identity = {
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(200),
  email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid").max(255)),
  active: z.boolean().default(true),
};
const password = z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 byte")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Kata sandi maksimal 72 byte");
export const newOperatorSchema = z.object({ ...identity, password });
export const editOperatorSchema = z.object({ ...identity, password: z.preprocess((v) => v === "" ? undefined : v, password.optional()) });

function duplicateEmail(error: unknown) {
  const cause = error as { code?: string; cause?: { code?: string } };
  return cause.code === "ER_DUP_ENTRY" || cause.cause?.code === "ER_DUP_ENTRY";
}
export class OperatorEmailExists extends Error {
  constructor() { super("Email sudah terdaftar."); }
}

/** Call only after checking account-management permission in the server action. */
export async function createOperatorAccount(input: z.infer<typeof newOperatorSchema>) {
  const v = newOperatorSchema.parse(input);
  if (await db.query.users.findFirst({ where: eq(users.email, v.email), columns: { id: true } })) throw new OperatorEmailExists();
  const id = crypto.randomUUID();
  const passwordHash = await hash(v.password, 12);
  try { await db.insert(users).values({ id, name: v.name, email: v.email, active: v.active, role: "operator", passwordHash }); }
  catch (error) { if (duplicateEmail(error)) throw new OperatorEmailExists(); throw error; }
  return { id, name: v.name, email: v.email, active: v.active };
}

export async function updateOperatorAccount(id: string, input: z.infer<typeof editOperatorSchema>) {
  const v = editOperatorSchema.parse(input);
  const before = await db.query.users.findFirst({ where: eq(users.id, id), columns: { id: true, name: true, email: true, role: true, active: true } });
  if (!before || before.role !== "operator") throw new Error("Akun operator tidak ditemukan.");
  const existing = await db.query.users.findFirst({ where: eq(users.email, v.email), columns: { id: true } });
  if (existing && existing.id !== id) throw new OperatorEmailExists();
  const passwordHash = v.password ? await hash(v.password, 12) : undefined;
  try { await db.update(users).set({ name: v.name, email: v.email, active: v.active, ...(passwordHash ? { passwordHash } : {}) }).where(eq(users.id, id)); }
  catch (error) { if (duplicateEmail(error)) throw new OperatorEmailExists(); throw error; }
  return { before, after: { id, name: v.name, email: v.email, active: v.active, passwordChanged: !!passwordHash } };
}
