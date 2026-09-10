import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-grit text-black font-semibold hover:bg-grit-dark shadow-[0_0_0_1px_rgba(0,226,138,0.25),0_8px_24px_-8px_rgba(0,226,138,0.4)]",
  secondary: "bg-elevated text-ink hover:bg-[#20303f] border border-line",
  outline:
    "border border-line text-ink-secondary hover:text-ink hover:border-[#33445a] hover:bg-surface-2",
  ghost: "text-ink-secondary hover:text-ink hover:bg-surface-2",
  subtle: "bg-surface-2 text-ink-secondary hover:text-ink hover:bg-elevated",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-grit/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render an anchor / next-link with button styling. */
  asChild?: boolean;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, href, children, ...props }, ref) => {
    const cls = buttonClass({ variant, size, className });

    if (href) {
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    }

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(cls, child.props.className),
      });
    }

    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
