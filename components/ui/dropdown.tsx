"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const DropdownCtx = React.createContext<Ctx | null>(null);

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <DropdownCtx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </DropdownCtx.Provider>
  );
}

export function DropdownTrigger({
  children,
}: {
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const ctx = React.useContext(DropdownCtx)!;
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      (children.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
      ctx.setOpen(!ctx.open);
    },
  });
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const ctx = React.useContext(DropdownCtx)!;
  if (!ctx.open) return null;
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-[0_20px_50px_-15px_rgba(20,20,20,0.3)] animate-fade-in",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  className,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  tone?: "danger";
  disabled?: boolean;
}) {
  const ctx = React.useContext(DropdownCtx)!;
  return (
    <button
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors disabled:opacity-40 [&_svg]:size-3.5",
        tone === "danger"
          ? "text-danger hover:bg-danger/10"
          : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
      {children}
    </div>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-line-soft" />;
}
