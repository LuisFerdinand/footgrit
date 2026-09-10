"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "warn" | "info";
type Toast = { id: number; title: string; description?: string; tone: ToastTone };

let externalPush: ((t: Omit<Toast, "id">) => void) | null = null;

export function toast(
  title: string,
  opts: { description?: string; tone?: ToastTone } = {},
) {
  externalPush?.({ title, description: opts.description, tone: opts.tone ?? "info" });
}
toast.success = (t: string, d?: string) => toast(t, { description: d, tone: "success" });
toast.error = (t: string, d?: string) => toast(t, { description: d, tone: "error" });
toast.warn = (t: string, d?: string) => toast(t, { description: d, tone: "warn" });

const icons = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <XCircle className="size-4 text-danger" />,
  warn: <AlertTriangle className="size-4 text-warn" />,
  info: <Info className="size-4 text-info" />,
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    externalPush = (t) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 4500);
    };
    return () => {
      externalPush = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-elevated/95 p-3.5 shadow-2xl backdrop-blur",
            "animate-[toast-in_.22s_ease-out]",
          )}
        >
          <div className="mt-0.5">{icons[t.tone]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-ink-muted">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
