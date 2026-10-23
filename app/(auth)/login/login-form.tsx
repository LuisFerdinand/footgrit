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

const labelClass = "mb-0 text-[0.95rem] font-bold text-ink";
const inputClass = "mt-2 h-[3.3rem] rounded-2xl px-5 text-base";

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
    <div className="w-full max-w-[38.5rem]">
      <LogoChip className="mb-8 lg:hidden" logoClassName="h-12" />
      <div className="px-2.5">
        <h1 className="font-headline text-[clamp(3rem,4.3vw,5.2rem)] uppercase leading-[0.95] text-ink">
          {t("Masuk ke platform")}
        </h1>
        <p className="mt-3 max-w-[34rem] text-base font-semibold leading-snug text-ink-muted lg:text-lg">
          {t("Gunakan kredensial operasional Anda untuk mengakses ruang kerja.")}
        </p>
      </div>

      <form
        action={formAction}
        className="mt-6 space-y-4 rounded-[2.25rem] bg-surface p-[clamp(1.25rem,1.7vw,2.1rem)] shadow-[0_24px_48px_-28px_rgba(20,20,20,0.25)]"
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

        <Button type="submit" size="lg" className="h-[3.6rem] w-full text-lg font-bold" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <LogIn className="!size-5" />}
          {t("Masuk")}
        </Button>
      </form>

      <div className="mt-8 rounded-[2.25rem] bg-[#364dbc] p-[clamp(1.25rem,1.7vw,2.1rem)] text-white">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
          <ShieldCheck className="size-3.5" />
          {t("Akun demo — klik untuk mengisi")}
        </div>
        <div className="grid grid-cols-2 gap-2">
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
                  "rounded-2xl px-3.5 py-2.5 text-left transition-colors",
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
        <p className="mt-3 text-[11px] text-white/80">
          {t("Kata sandi semua akun demo:")}{" "}
          <code className="rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-white">{DEMO_PASSWORD}</code>
        </p>
      </div>
    </div>
  );
}
