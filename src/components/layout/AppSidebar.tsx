"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bell,
  FileBarChart2,
  Settings,
  LifeBuoy,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type NavLabels = {
  dashboard: string;
  users: string;
  managers: string;
  alerts: string;
  reports: string;
  settings: string;
  support: string;
  comingSoon: string;
};

export function AppSidebar({
  locale,
  labels,
}: {
  locale: "ko" | "ja";
  labels: NavLabels;
}) {
  const pathname = usePathname();
  const base = `/${locale}`;

  const NAV = [
    { href: `${base}/dashboard`, label: labels.dashboard, icon: LayoutDashboard },
    { href: `${base}/users`, label: labels.users, icon: Users },
    { href: `${base}/managers`, label: labels.managers, icon: ShieldCheck },
    { href: `${base}/dashboard`, label: labels.alerts, icon: Bell, disabled: true },
    {
      href: `${base}/dashboard`,
      label: labels.reports,
      icon: FileBarChart2,
      disabled: true,
    },
  ];

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-border bg-white">
      <div className="px-5 py-5 border-b border-border">
        <Link href={`${base}/dashboard`}>
          <Logo locale={locale} />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          {locale === "ja" ? "業務メニュー" : "업무 메뉴"}
        </p>
        {NAV.map((item) => {
          const active = pathname === item.href && !item.disabled;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              aria-disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-trust-50 text-trust-700"
                  : "text-foreground hover:bg-surface-muted",
                item.disabled && "opacity-40 pointer-events-none",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
              {item.disabled && (
                <span className="ml-auto text-[10px] text-subtle">
                  {labels.comingSoon}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted"
        >
          <Settings className="h-[18px] w-[18px]" />
          {labels.settings}
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted"
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
          {labels.support}
        </Link>
      </div>
    </aside>
  );
}
