import { AlertTriangle, AlertCircle, CheckCircle2, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "danger" | "warn" | "safe";

const toneStyles: Record<
  Tone,
  { ring: string; bg: string; fg: string; sub: string }
> = {
  neutral: {
    ring: "ring-trust-200",
    bg: "bg-trust-50",
    fg: "text-trust-700",
    sub: "text-trust-700/70",
  },
  danger: {
    ring: "ring-status-danger/30",
    bg: "bg-status-danger-bg",
    fg: "text-status-danger-fg",
    sub: "text-status-danger",
  },
  warn: {
    ring: "ring-status-warn/30",
    bg: "bg-status-warn-bg",
    fg: "text-status-warn-fg",
    sub: "text-status-warn-fg",
  },
  safe: {
    ring: "ring-status-safe/30",
    bg: "bg-status-safe-bg",
    fg: "text-status-safe-fg",
    sub: "text-status-safe-fg",
  },
};

export type SummaryLabels = {
  totalLabel: string;
  totalUnit: string;
  totalSub: (h: number, a: number) => string;
  dangerLabel: string;
  dangerUnit: string;
  dangerSub: string;
  warnLabel: string;
  warnUnit: string;
  warnSub: string;
  safeLabel: string;
  safeUnit: string;
  safeSub: (rate: number) => string;
};

export function SummaryCards({
  total,
  danger,
  warn,
  safe,
  primaryDistrictTotal,
  secondaryDistrictTotal,
  labels,
}: {
  total: number;
  danger: number;
  warn: number;
  safe: number;
  primaryDistrictTotal: number;
  secondaryDistrictTotal: number;
  labels: SummaryLabels;
}) {
  const items = [
    {
      label: labels.totalLabel,
      value: total,
      unit: labels.totalUnit,
      tone: "neutral" as Tone,
      icon: UsersRound,
      sub: labels.totalSub(primaryDistrictTotal, secondaryDistrictTotal),
    },
    {
      label: labels.dangerLabel,
      value: danger,
      unit: labels.dangerUnit,
      tone: "danger" as Tone,
      icon: AlertTriangle,
      sub: labels.dangerSub,
    },
    {
      label: labels.warnLabel,
      value: warn,
      unit: labels.warnUnit,
      tone: "warn" as Tone,
      icon: AlertCircle,
      sub: labels.warnSub,
    },
    {
      label: labels.safeLabel,
      value: safe,
      unit: labels.safeUnit,
      tone: "safe" as Tone,
      icon: CheckCircle2,
      sub: labels.safeSub(Math.round((safe / total) * 100)),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const t = toneStyles[item.tone];
        const Icon = item.icon;
        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-muted">{item.label}</p>
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1",
                  t.bg,
                  t.ring,
                )}
              >
                <Icon className={cn("h-5 w-5", t.fg)} />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={cn("text-4xl font-extrabold tracking-tight", t.fg)}>
                {item.value}
              </span>
              <span className="text-sm font-semibold text-muted">{item.unit}</span>
            </div>
            <p className={cn("mt-1.5 text-xs font-medium", t.sub)}>{item.sub}</p>
          </Card>
        );
      })}
    </div>
  );
}
