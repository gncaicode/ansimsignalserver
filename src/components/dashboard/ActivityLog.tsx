import {
  BellRing,
  Phone,
  Footprints,
  HeartPulse,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityLogEntry, LogType } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/i18n/format";

const ICON_BY_TYPE: Record<LogType, React.ComponentType<{ className?: string }>> = {
  alert: BellRing,
  call: Phone,
  visit: Footprints,
  checkin: HeartPulse,
  register: UserPlus,
};

export type ActivityLabels = {
  title: string;
  desc: string;
  viewAll: string;
  labels: Record<LogType, string>;
  actorPrefix: string;
};

export function ActivityLog({
  entries,
  locale,
  labels,
  lang,
}: {
  entries: ActivityLogEntry[];
  locale: Locale;
  labels: ActivityLabels;
  lang: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{labels.title}</CardTitle>
          <p className="mt-1 text-xs text-muted">{labels.desc}</p>
        </div>
        <Link href={`/${lang}/users`} className="text-xs font-semibold text-trust-700 hover:underline">
          {labels.viewAll}
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ul className="divide-y divide-border">
          {entries.map((e) => {
            const Icon = ICON_BY_TYPE[e.type];
            const tone =
              e.severity === "danger"
                ? "danger"
                : e.severity === "warn"
                ? "warn"
                : "safe";
            const ringTone =
              tone === "danger"
                ? "ring-status-danger/30 bg-status-danger-bg text-status-danger"
                : tone === "warn"
                ? "ring-status-warn/30 bg-status-warn-bg text-status-warn-fg"
                : "ring-status-safe/30 bg-status-safe-bg text-status-safe-fg";

            return (
              <li key={e.id} className="px-5 py-3.5 flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    ringTone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={tone}>{labels.labels[e.type]}</Badge>
                    <span className="text-sm font-semibold">{e.subjectName}</span>
                    <span className="text-xs text-subtle">{e.district}</span>
                    {e.actor && (
                      <span className="text-xs text-muted">
                        {labels.actorPrefix}
                        {e.actor}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/90 leading-snug">
                    {e.message}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-subtle whitespace-nowrap">
                  {formatRelativeTime(e.occurredAt, locale)}
                </time>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
