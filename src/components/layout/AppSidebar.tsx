"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileBarChart2,
  Settings,
  UserCircle,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type NavLabels = {
  dashboard: string;
  users: string;
  managers: string;
  reports: string;
  settings: string;
  profile: string;
  support: string;
  comingSoon: string;
  logout: string;
};

export function AppSidebar({
  locale,
  labels,
  role,
}: {
  locale: "ko" | "ja";
  labels: NavLabels;
  role?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${locale}`;

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  }

  const canManage = role === "superadmin" || role === "admin";

  const NAV = [
    { href: `${base}/dashboard`, label: labels.dashboard, icon: LayoutDashboard },
    { href: `${base}/users`, label: labels.users, icon: Users },
    ...(canManage ? [{ href: `${base}/managers`, label: labels.managers, icon: ShieldCheck }] : []),
    { href: `${base}/reports`, label: labels.reports, icon: FileBarChart2 },
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
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-trust-50 text-trust-700"
                  : "text-foreground hover:bg-surface-muted",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        {canManage && <Link
          href={`${base}/settings`}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === `${base}/settings` ? "bg-trust-50 text-trust-700" : "text-foreground hover:bg-surface-muted",
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          {labels.settings}
        </Link>}
        <Link
          href={`${base}/profile`}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === `${base}/profile` ? "bg-trust-50 text-trust-700" : "text-foreground hover:bg-surface-muted",
          )}
        >
          <UserCircle className="h-[18px] w-[18px]" />
          {labels.profile}
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {labels.logout}
        </button>
      </div>
    </aside>
  );
}
