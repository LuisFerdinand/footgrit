import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./index";
import { can, type Capability, type Role } from "./rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCapability(cap: Capability) {
  const user = await requireUser();
  if (!can(user.role as Role, cap)) {
    redirect("/command-center?denied=" + encodeURIComponent(cap));
  }
  return user;
}

/**
 * For server actions — resolves the session against the live DB row so that
 * actions keep working after a re-seed (session id may be stale; email is stable).
 * Throws instead of redirecting.
 */
export async function actionUser(cap?: Capability) {
  const session = await getCurrentUser();
  if (!session?.email) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, session.email),
    columns: { id: true, name: true, email: true, role: true },
  });
  if (!dbUser) throw new Error("Akun tidak ditemukan. Silakan masuk kembali.");

  if (cap && !can(dbUser.role as Role, cap)) {
    throw new Error("Akses ditolak untuk tindakan ini.");
  }
  return dbUser;
}
