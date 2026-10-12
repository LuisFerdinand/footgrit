"use client";

import { useActionState, useEffect, useRef } from "react";
import { createOperator, updateOperator } from "./actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export type OperatorData = { id: string; name: string; email: string; active: boolean };
export function OperatorForm({ operator, onDone }: { operator?: OperatorData; onDone?: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(operator ? updateOperator.bind(null, operator.id) : createOperator, undefined);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state) {
      form.current?.reset();
      toast.success(operator ? "Akun operator diperbarui" : "Akun operator dibuat");
      onDone?.();
    }
    wasPending.current = pending;
  }, [pending, state, operator, onDone]);
  return <form ref={form} action={action} className="space-y-4">
    <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nama operator" error={state?.fieldErrors?.name}><Input name="name" aria-label="Nama operator" defaultValue={state?.values?.name ?? operator?.name} required minLength={2} maxLength={200} /></Field>
      <Field label="Email" error={state?.fieldErrors?.email}><Input name="email" aria-label="Email operator" defaultValue={state?.values?.email ?? operator?.email} type="email" autoComplete="off" required maxLength={255} /></Field>
      <Field label={operator ? "Kata sandi baru" : "Kata sandi"} error={state?.fieldErrors?.password} hint={operator ? "Kosongkan untuk mempertahankan kata sandi. Minimal 8 karakter jika diubah." : "Minimal 8 karakter. Operator masuk memakai email dan kata sandi ini."} className="sm:col-span-2"><Input name="password" aria-label={operator ? "Kata sandi baru" : "Kata sandi"} type="password" autoComplete="new-password" required={!operator} minLength={8} maxLength={72} /></Field>
      <label className="flex items-center gap-2 text-xs font-medium"><input name="active" type="checkbox" defaultChecked={state?.values ? state.values.active === "on" : operator?.active ?? true} />Akun aktif</label>
    </fieldset>
    {state?.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : operator ? "Simpan perubahan" : "Buat akun operator"}</Button>
  </form>;
}
