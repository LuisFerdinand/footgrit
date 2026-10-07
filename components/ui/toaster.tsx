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
  success: <CheckCircle2 className="size-4 text-block-mint" />,
  error: <XCircle className="size-4 text-[#ff8a8f]" />,
  warn: <AlertTriangle className="size-4 text-block-yellow" />,
  info: <Info className="size-4 text-[#9fb2ff]" />,
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
            "pointer-events-auto flex items-start gap-3 rounded-2xl bg-night p-4 text-white shadow-[0_20px_50px_-15px_rgba(20,20,20,0.6)]",
            "animate-[toast-in_.22s_ease-out]",
          )}
        >
          <div className="mt-0.5">{icons[t.tone]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-night-muted">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            aria-label="Tutup notifikasi"
            className="text-night-muted transition-colors hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
