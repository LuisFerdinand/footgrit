import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const credsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

/** Shared login path for operator accounts and the existing credential provider. */
export async function authenticateCredentials(raw: unknown) {
  const parsed = credsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.active || !await compare(password, user.passwordHash)) return null;
  return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, title: user.title, clubId: user.clubId };
}
