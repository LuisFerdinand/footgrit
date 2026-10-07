import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "dark"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white font-semibold hover:bg-brand-dark shadow-[0_8px_20px_-10px_rgba(228,34,45,0.7)]",
  dark: "bg-night text-white font-semibold hover:bg-night-2",
  secondary: "bg-surface text-ink font-medium hover:bg-elevated border border-line",
  outline:
    "border border-line bg-surface text-ink-secondary font-medium hover:text-ink hover:border-ink/30",
  ghost: "text-ink-secondary hover:text-ink hover:bg-elevated",
  subtle: "bg-surface-2 text-ink-secondary hover:text-ink hover:bg-elevated",
  danger: "bg-danger/10 text-danger font-medium border border-danger/25 hover:bg-danger/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-7 text-sm gap-2 rounded-full",
  icon: "h-10 w-10 rounded-full",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
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
