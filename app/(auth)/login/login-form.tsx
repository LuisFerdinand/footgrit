"use client";

import * as React from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { ROLE_LABEL } from "@/lib/auth/rbac";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/command-center";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );
  const [email, setEmail] = React.useState("admin@footgrit.id");
  const [password, setPassword] = React.useState(DEMO_PASSWORD);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-grit text-black">
            <span className="text-sm font-black">F</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">FOOTGRIT-OS</p>
            <p className="text-[11px] text-ink-muted">
              Unified Football Intelligence Platform
            </p>
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Masuk ke platform</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gunakan kredensial operasional Anda untuk mengakses ruang kerja.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <Input
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Kata sandi">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {state?.error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Masuk
        </Button>
      </form>

      <div className="mt-7 rounded-xl border border-line bg-surface/60 p-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          <ShieldCheck className="size-3.5" />
          Akun demo — klik untuk mengisi
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="rounded-lg border border-line px-2.5 py-1.5 text-left transition-colors hover:border-grit/40 hover:bg-surface-2"
            >
              <span className="block text-xs font-medium text-ink">
                {ROLE_LABEL[a.role]}
              </span>
              <span className="block truncate text-[10px] text-ink-muted">
                {a.email}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[10px] text-ink-muted">
          Kata sandi semua akun demo: <code className="text-ink-secondary">{DEMO_PASSWORD}</code>
        </p>
      </div>
    </div>
  );
}
