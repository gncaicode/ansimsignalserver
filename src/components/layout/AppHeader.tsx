import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

type AppHeaderProps = {
  title: string;
  description?: string;
  orgName: string;
  locale: "ko" | "ja";
  labels: {
    breadcrumb: string;
    searchPlaceholder: string;
    role: string;
    notify: string;
    user: string;
    userInitial: string;
  };
};

export function AppHeader({
  title,
  description,
  orgName,
  locale,
  labels,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-4 px-6 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-subtle">
            <span>{orgName}</span>
            <span className="text-border-strong">/</span>
            <span>{labels.breadcrumb}</span>
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted">{description}</p>
          )}
        </div>

        <div className="ml-auto hidden md:flex items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              placeholder={labels.searchPlaceholder}
              className="h-9 w-72 rounded-lg border border-border bg-surface-muted pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-trust-500"
            />
          </div>
          <LocaleSwitcher current={locale} />
          <Button
            variant="outline"
            size="icon"
            aria-label={labels.notify}
            className="relative"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-status-danger px-1 text-[10px] font-bold leading-4 text-white text-center">
              2
            </span>
          </Button>
          <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-border">
            <div className="h-9 w-9 rounded-full bg-trust-700 text-white flex items-center justify-center text-sm font-bold">
              {labels.userInitial}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{labels.user}</div>
              <Badge tone="trust" className="mt-0.5">{labels.role}</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
