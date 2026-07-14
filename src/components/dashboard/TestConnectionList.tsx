import { PlugZap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TestConnectionEntry } from "@/lib/dashboard-data";
import type { Locale } from "@/lib/i18n";
import { formatRelativeTime, formatShortDateTime } from "@/lib/i18n/format";

export type TestConnectionLabels = {
  title: string;
  desc: string;
  empty: string;
};

export function TestConnectionList({
  entries,
  locale,
  labels,
}: {
  entries: TestConnectionEntry[];
  locale: Locale;
  labels: TestConnectionLabels;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-trust-700" />
          {labels.title}
        </CardTitle>
        <p className="mt-1 text-xs text-muted">{labels.desc}</p>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {entries.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted text-center py-4">{labels.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <li key={e.userId} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-semibold">{e.name}</span>
                  {e.district && <span className="ml-2 text-xs text-subtle">{e.district}</span>}
                </div>
                <time className="shrink-0 text-right text-xs text-subtle">
                  <div className="font-medium text-foreground">{formatRelativeTime(e.receivedAt, locale)}</div>
                  <div>{formatShortDateTime(e.receivedAt, locale)}</div>
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
