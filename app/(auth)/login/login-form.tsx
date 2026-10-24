"use client";

import * as React from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LogoChip } from "@/components/brand/logo";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { ROLE_LABEL } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Sizes follow the viewport height so the whole form always fits one screen. */
const labelClass = "mb-0 text-sm font-bold text-ink";
const inputClass = "mt-1.5 h-[clamp(2.6rem,6vh,3.2rem)] rounded-2xl px-5 text-base";

export function LoginForm() {
  const t = useT();
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );
  const [email, setEmail] = React.useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = React.useState(DEMO_PASSWORD);

  return (
    <div className="relative z-[1] m-auto w-full max-w-[34rem]">
      <LogoChip className="mb-6 lg:hidden" logoClassName="h-12" />
      <div className="px-2">
        <h1 className="font-headline text-[clamp(2.4rem,min(4vw,6.8vh),4.4rem)] uppercase leading-[0.95] text-ink">
          {t("Masuk ke platform")}
        </h1>
        <p className="mt-2 max-w-[30rem] text-sm font-semibold leading-snug text-ink-muted lg:text-base">
          {t("Gunakan kredensial operasional Anda untuk mengakses ruang kerja.")}
        </p>
      </div>

      <form
        action={formAction}
        className="mt-[clamp(0.75rem,2.4vh,1.5rem)] space-y-[clamp(0.6rem,1.8vh,1rem)] rounded-[2rem] bg-surface p-[clamp(1rem,2.6vh,1.75rem)] shadow-[0_24px_48px_-28px_rgba(20,20,20,0.3)] ring-1 ring-black/5"
      >
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email" className={labelClass}>Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password" className={labelClass}>{t("Kata sandi")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {state?.error && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-[clamp(2.75rem,6.4vh,3.4rem)] w-full text-base font-bold" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <LogIn className="!size-5" />}
          {t("Masuk")}
        </Button>
      </form>

      <div className="mt-[clamp(0.75rem,2.2vh,1.25rem)] rounded-[2rem] bg-gradient-to-br from-[#4361ee] to-[#2c3fb8] p-[clamp(0.9rem,2.2vh,1.5rem)] text-white shadow-[0_20px_40px_-24px_rgba(67,97,238,0.8)]">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
          <ShieldCheck className="size-3.5" />
          {t("Akun demo — klik untuk mengisi")}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((a) => {
            const on = a.email === email;
            return (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className={cn(
                  "rounded-xl px-3 py-[clamp(0.3rem,1vh,0.55rem)] text-left transition-colors",
                  on ? "bg-white text-ink" : "bg-white/15 text-white hover:bg-white/25",
                )}
              >
                <span className="block text-xs font-semibold">{t(ROLE_LABEL[a.role])}</span>
                <span className={cn("block truncate text-[10px]", on ? "text-ink-muted" : "text-white/70")}>
                  {a.email}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-white/85">
          {t("Kata sandi semua akun demo:")}{" "}
          <code className="rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-white">{DEMO_PASSWORD}</code>
        </p>
      </div>
    </div>
  );
}
