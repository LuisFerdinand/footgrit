"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/command-center") || "/command-center";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next.startsWith("/") ? next : "/command-center",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email atau kata sandi tidak sesuai." };
    }
    throw err;
  }
  return undefined;
}
