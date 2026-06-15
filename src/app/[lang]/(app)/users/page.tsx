import { notFound } from "next/navigation";
import {
  Upload,
  UserPlus,
  Filter,
  Search,
  Download,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/brand/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { formatRelativeTime, formatShortDateTime } from "@/lib/i18n/format";
import { getMockData } from "@/lib/mock-data";

export default async function UsersPage(props: PageProps<"/[lang]/users">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const data = getMockData(lang);
  const t = dict.users;

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.desc(data.SUBJECTS.length, data.DASHBOARD_STATS.total)}
        orgName={data.ORG_NAME}
        locale={lang}
        labels={{
          breadcrumb: dict.nav.breadcrumb,
          searchPlaceholder: dict.appHeader.searchPlaceholder,
          role: dict.appHeader.role,
          notify: dict.appHeader.notify,
          user: dict.appHeader.user,
          userInitial: dict.appHeader.userInitial,
        }}
      />
      <main className="flex-1 px-6 py-6 space-y-5 max-w-[1400px] mx-auto w-full">
        {/* 액션바 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              placeholder={t.searchPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label={t.filterAll} count={data.SUBJECTS.length} active />
            <FilterPill
              label={t.filterDanger}
              count={data.SUBJECTS.filter((s) => s.status === "danger").length}
              tone="danger"
            />
            <FilterPill
              label={t.filterWarn}
              count={data.SUBJECTS.filter((s) => s.status === "warn").length}
              tone="warn"
            />
            <FilterPill
              label={t.filterSafe}
              count={data.SUBJECTS.filter((s) => s.status === "safe").length}
              tone="safe"
            />
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
              {t.filterDetailed}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              {t.btnExport}
            </Button>
            <Button variant="outline" size="md">
              <Upload className="h-4 w-4" />
              {t.btnImport}
            </Button>
            <Button size="md">
              <UserPlus className="h-4 w-4" />
              {t.btnAdd}
            </Button>
          </div>
        </div>

        {/* 테이블 */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t.columns.status}</TableHead>
                  <TableHead>{t.columns.nameId}</TableHead>
                  <TableHead className="w-[60px] text-center">
                    {t.columns.age}
                  </TableHead>
                  <TableHead>{t.columns.district}</TableHead>
                  <TableHead>{t.columns.contact}</TableHead>
                  <TableHead className="w-[100px]">
                    {t.columns.caseworker}
                  </TableHead>
                  <TableHead className="w-[170px]">
                    {t.columns.lastCheck}
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.SUBJECTS.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <StatusBadge status={s.status} locale={lang} />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-subtle">{s.id}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{s.age}</span>
                      <span className="ml-0.5 text-xs text-subtle">
                        {s.gender === "F" ? t.genderF : t.genderM}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.district}</div>
                      <div className="text-xs text-muted truncate max-w-[260px]">
                        {s.addressDetail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {s.emergencyContactName}
                      </div>
                      <div className="text-xs text-muted">
                        {s.emergencyContactPhone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone="trust">{s.caseworker}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatRelativeTime(s.lastCheckIn, lang)}
                      </div>
                      <div className="text-xs text-subtle">
                        {formatShortDateTime(s.lastCheckIn, lang)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t.a11y.call}
                        >
                          <Phone className="h-4 w-4 text-trust-700" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t.a11y.more}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {/* 페이지네이션 */}
          <Pagination
            visible={data.SUBJECTS.length}
            total={data.DASHBOARD_STATS.total}
            locale={lang}
            t={t}
          />
        </Card>
      </main>
    </>
  );
}

function Pagination({
  visible,
  total,
  t,
}: {
  visible: number;
  total: number;
  locale: Locale;
  t: Awaited<ReturnType<typeof getDictionary>>["users"];
}) {
  const summary = t.pagination.summary(visible, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-muted/40 text-sm">
      <span className="text-muted">
        <strong className="text-foreground">{summary.visible}</strong>
        {summary.suffix}{" "}
        <strong className="text-foreground">{summary.total}</strong>
        {summary.total2}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled>
          {t.pagination.prev}
        </Button>
        {[1, 2, 3, "…", 11].map((p, i) => (
          <Button
            key={i}
            variant={p === 1 ? "primary" : "ghost"}
            size="sm"
            className="min-w-9"
          >
            {p}
          </Button>
        ))}
        <Button variant="outline" size="sm">
          {t.pagination.next}
        </Button>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  tone,
}: {
  label: string;
  count: number;
  active?: boolean;
  tone?: "danger" | "warn" | "safe";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors";
  if (active) {
    return (
      <button className={`${base} border-trust-700 bg-trust-700 text-white`}>
        {label}
        <span className="rounded-full bg-white/15 px-1.5 text-xs">{count}</span>
      </button>
    );
  }
  const toneText =
    tone === "danger"
      ? "text-status-danger"
      : tone === "warn"
      ? "text-status-warn-fg"
      : tone === "safe"
      ? "text-status-safe-fg"
      : "text-foreground";
  return (
    <button
      className={`${base} border-border bg-white hover:bg-surface-muted ${toneText}`}
    >
      {label}
      <span className="rounded-full bg-surface-muted px-1.5 text-xs text-muted">
        {count}
      </span>
    </button>
  );
}
