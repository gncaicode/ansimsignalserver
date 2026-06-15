import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-trust-700 text-white hover:bg-trust-800 active:bg-trust-900 focus-visible:ring-trust-500",
  secondary:
    "bg-trust-50 text-trust-700 hover:bg-trust-100 focus-visible:ring-trust-500",
  outline:
    "border border-border-strong bg-white text-foreground hover:bg-surface-muted focus-visible:ring-trust-500",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-muted focus-visible:ring-trust-500",
  danger:
    "bg-status-danger text-white hover:bg-red-700 focus-visible:ring-red-500",
  success:
    "bg-status-safe text-white hover:bg-green-700 focus-visible:ring-green-500",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
