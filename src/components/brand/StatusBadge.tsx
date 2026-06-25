import { Badge } from "@/components/ui/badge";
import type { SignalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<"ko" | "ja", Record<SignalStatus, string>> = {
  ko: { safe: "안전", warn: "주의", danger: "위급", pending: "대기" },
  ja: { safe: "安全", warn: "注意", danger: "緊急", pending: "待機" },
};

const META: Record<
  SignalStatus,
  { tone: "safe" | "warn" | "danger" | "pending"; dot: string }
> = {
  safe:    { tone: "safe",    dot: "bg-status-safe" },
  warn:    { tone: "warn",    dot: "bg-status-warn" },
  danger:  { tone: "danger",  dot: "bg-status-danger" },
  pending: { tone: "pending", dot: "bg-slate-400" },
};

export function StatusBadge({
  status,
  locale = "ko",
  className,
  withDot = true,
}: {
  status: SignalStatus;
  locale?: "ko" | "ja";
  className?: string;
  withDot?: boolean;
}) {
  const m = META[status];
  return (
    <Badge tone={m.tone} className={cn("min-w-[3.25rem] justify-center", className)}>
      {withDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            m.dot,
            status === "danger" && "pulse-danger",
          )}
        />
      )}
      {LABELS[locale][status]}
    </Badge>
  );
}
