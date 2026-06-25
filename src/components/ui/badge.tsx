import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "trust"
  | "safe"
  | "warn"
  | "danger"
  | "pending"
  | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  trust: "bg-trust-50 text-trust-700",
  safe: "bg-status-safe-bg text-status-safe-fg",
  warn: "bg-status-warn-bg text-status-warn-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
  pending: "bg-slate-100 text-slate-500",
  outline: "border border-border-strong text-foreground",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
