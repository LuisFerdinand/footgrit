"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const account = await db.query.users.findFirst({ where: eq(users.email, email), columns: { role: true } });
  const fallback = account?.role === "coach" ? "/dsp" : "/command-center";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next.startsWith("/") && !next.startsWith("//") ? next : fallback,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email atau kata sandi tidak sesuai." };
    }
    throw err;
  }
  return undefined;
}
