import { notFound } from "next/navigation";
import { Download, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getUsers, getOrgName, getDistrictOptions, getAdminOptions, getAlertCount } from "@/lib/dashboard-data";
import { UsersTable } from "@/components/dashboard/UsersTable";
import { BulkImportModal } from "@/components/dashboard/BulkImportModal";

const PAGE_SIZE = 20;

export default async function UsersPage(props: PageProps<"/[lang]/users">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  // searchParams는 Next.js 15+에서 Promise
  const searchParams = await (props as any).searchParams;
  const statusFilter = searchParams?.status ?? "all";
  const page = Math.max(1, Number(searchParams?.page ?? 1));

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.users;
  const orgId = session?.organization_id ?? null;

  const adminInfo = getAdminHeaderInfo(session, lang);

  const [{ users, total }, orgName, districtOptions, adminOptions, alertCount] = await Promise.all([
    getUsers(orgId, statusFilter, page, PAGE_SIZE),
    getOrgName(orgId),
    getDistrictOptions(orgId),
    getAdminOptions(orgId),
    getAlertCount(orgId),
  ]);

  const dangerCount = users.filter((u) => u.status === "danger").length;
  const warnCount   = users.filter((u) => u.status === "warn").length;
  const safeCount   = users.filter((u) => u.status === "safe").length;
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.desc(users.length, total)}
        orgName={orgName}
        locale={lang}
        alertCount={alertCount}
        labels={{
          breadcrumb: dict.nav.breadcrumb,
          searchPlaceholder: dict.appHeader.searchPlaceholder,
          role: adminInfo.role,
          notify: dict.appHeader.notify,
          user: adminInfo.user,
          userInitial: adminInfo.userInitial,
        }}
      />
      <main className="flex-1 px-6 py-6 space-y-5 max-w-[1400px] mx-auto w-full">
        {/* 액션바 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              placeholder={t.searchPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill href={`/${lang}/users?status=all`}   label={t.filterAll}    count={total}       active={statusFilter === "all"} />
            <FilterPill href={`/${lang}/users?status=danger`} label={t.filterDanger} count={dangerCount} active={statusFilter === "danger"} tone="danger" />
            <FilterPill href={`/${lang}/users?status=warn`}   label={t.filterWarn}   count={warnCount}   active={statusFilter === "warn"}   tone="warn" />
            <FilterPill href={`/${lang}/users?status=safe`}   label={t.filterSafe}   count={safeCount}   active={statusFilter === "safe"}   tone="safe" />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <a href="/api/admin/users/export" download>
              <Button variant="outline" size="md">
                <Download className="h-4 w-4" />
                {t.btnExport}
              </Button>
            </a>
            <BulkImportModal btnLabel={t.btnImport} t={t.importModal} />
            <Link href={`/${lang}/users/new`}>
              <Button size="md">
                <UserPlus className="h-4 w-4" />
                {t.btnAdd}
              </Button>
            </Link>
          </div>
        </div>

        {/* 테이블 */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <UsersTable
              users={users}
              locale={lang}
              districts={districtOptions}
              admins={adminOptions}
              t={{
                columns: t.columns,
                yearsSuffix: t.yearsSuffix,
                a11y: t.a11y,
                addModal: t.addModal,
              }}
              common={dict.common}
            />
          </CardContent>

          <Pagination
            page={page}
            totalPages={totalPages}
            visible={users.length}
            total={total}
            lang={lang}
            statusFilter={statusFilter}
            t={t}
          />
        </Card>
      </main>
    </>
  );
}

function Pagination({
  page, totalPages, visible, total, lang, statusFilter, t,
}: {
  page: number;
  totalPages: number;
  visible: number;
  total: number;
  lang: string;
  statusFilter: string;
  t: Awaited<ReturnType<typeof getDictionary>>["users"];
}) {
  const summary = t.pagination.summary(visible, total);
  const base = `/${lang}/users?status=${statusFilter}&page=`;

  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-muted/40 text-sm">
      <span className="text-muted">
        <strong className="text-foreground">{summary.visible}</strong>
        {summary.suffix}{" "}
        <strong className="text-foreground">{summary.total}</strong>
        {summary.total2}
      </span>
      <div className="flex items-center gap-1">
        <a href={page > 1 ? `${base}${page - 1}` : undefined as any}>
          <Button variant="outline" size="sm" disabled={page <= 1}>{t.pagination.prev}</Button>
        </a>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={i} className="px-2 text-muted">…</span>
          ) : (
            <a key={p} href={`${base}${p}`}>
              <Button variant={p === page ? "primary" : "ghost"} size="sm" className="min-w-9">{p}</Button>
            </a>
          )
        )}
        <a href={page < totalPages ? `${base}${page + 1}` : undefined as any}>
          <Button variant="outline" size="sm" disabled={page >= totalPages}>{t.pagination.next}</Button>
        </a>
      </div>
    </div>
  );
}

function FilterPill({
  href, label, count, active, tone,
}: {
  href: string;
  label: string;
  count: number;
  active?: boolean;
  tone?: "danger" | "warn" | "safe";
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors";
  if (active) {
    return (
      <a href={href}>
        <button className={`${base} border-trust-700 bg-trust-700 text-white`}>
          {label}
          <span className="rounded-full bg-white/15 px-1.5 text-xs">{count}</span>
        </button>
      </a>
    );
  }
  const toneText =
    tone === "danger" ? "text-status-danger" :
    tone === "warn"   ? "text-status-warn-fg" :
    tone === "safe"   ? "text-status-safe-fg" : "text-foreground";
  return (
    <a href={href}>
      <button className={`${base} border-border bg-white hover:bg-surface-muted ${toneText}`}>
        {label}
        <span className="rounded-full bg-surface-muted px-1.5 text-xs text-muted">{count}</span>
      </button>
    </a>
  );
}
