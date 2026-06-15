import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border-strong bg-white px-3.5 text-sm text-foreground",
        "placeholder:text-subtle",
        "focus:outline-none focus:ring-2 focus:ring-trust-500 focus:border-trust-500",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
