import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportPrintButton } from "@/components/dashboard/ReportPrintButton";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { logAccess } from "@/lib/access-log";
import { headers } from "next/headers";
import { getMonthlyReport } from "@/lib/reports-data";
import { getAlertCount } from "@/lib/dashboard-data";

interface ReportsPageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReportsPage(props: ReportsPageProps) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const searchParams = props.searchParams ? await props.searchParams : {};

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.reports;
  const orgId = session?.organization_id ?? null;
  const districtIds =
    session?.role === "social_worker" ? (session?.district_ids ?? []) : null;

  if (session) {
    logAccess({ adminId: session.admin_id, action: "view_reports", headers: await headers() });
  }

  // Determine year/month from searchParams or default to current KST month
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const defaultYear  = nowKst.getUTCFullYear();
  const defaultMonth = nowKst.getUTCMonth() + 1;

  const year  = searchParams?.year  ? Number(searchParams.year)  : defaultYear;
  const month = searchParams?.month ? Number(searchParams.month) : defaultMonth;

  const validYear  = Number.isFinite(year)  && year  >= 2020 && year  <= 2099 ? year  : defaultYear;
  const validMonth = Number.isFinite(month) && month >= 1    && month <= 12   ? month : defaultMonth;

  const [report, alertCount] = await Promise.all([
    getMonthlyReport(orgId, validYear, validMonth, districtIds),
    getAlertCount(orgId, districtIds),
  ]);

  const adminInfo = getAdminHeaderInfo(session, lang);

  // Prev / next month navigation
  const prevMonth = validMonth === 1  ? 12 : validMonth - 1;
  const prevYear  = validMonth === 1  ? validYear - 1 : validYear;
  const nextMonth = validMonth === 12 ? 1  : validMonth + 1;
  const nextYear  = validMonth === 12 ? validYear + 1 : validYear;

  const periodLabel =
    lang === "ja"
      ? `${validYear}年${validMonth}月`
      : `${validYear}년 ${validMonth}월`;

  return (
    <>
      {/* Print CSS — hides chrome, keeps report clean */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          header, nav, aside { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <AppHeader
        title={t.title}
        description={t.desc(validYear, validMonth)}
        orgName={report.overview.orgName}
        locale={lang}
        alertCount={alertCount}
        labels={{
          breadcrumb:        dict.nav.breadcrumb,
          searchPlaceholder: dict.appHeader.searchPlaceholder,
          role:              adminInfo.role,
          notify:            dict.appHeader.notify,
          user:              adminInfo.user,
          userInitial:       adminInfo.userInitial,
        }}
      />

      <main className="flex-1 px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        {/* ── Month navigation + Print button ── */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`?year=${prevYear}&month=${prevMonth}`}
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted transition-colors"
            >
              {t.btnPrev}
            </a>
            <span className="text-sm font-semibold text-foreground px-2">
              {periodLabel}
            </span>
            <a
              href={`?year=${nextYear}&month=${nextMonth}`}
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted transition-colors"
            >
              {t.btnNext}
            </a>
          </div>
          <ReportPrintButton label={t.btnPrint} />
        </div>

        {/* ── Section 1: 개요 ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t.sections.overview}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  {lang === "ja" ? "機関名" : "기관명"}
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {report.overview.orgName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  {t.period}
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {periodLabel}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  {t.generatedAt}
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {report.overview.generatedAt}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* ── Section 2: 대상자 현황 ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t.sections.subjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatBlock
                label={t.subjects.total}
                value={report.subjects.total}
                unit={t.subjects.unit}
                tone="neutral"
              />
              <StatBlock
                label={t.subjects.danger}
                value={report.subjects.danger}
                unit={t.subjects.unit}
                tone="danger"
              />
              <StatBlock
                label={t.subjects.warn}
                value={report.subjects.warn}
                unit={t.subjects.unit}
                tone="warn"
              />
              <StatBlock
                label={t.subjects.safe}
                value={report.subjects.safe}
                unit={t.subjects.unit}
                tone="safe"
              />
              <StatBlock
                label={t.subjects.newJoined}
                value={report.subjects.newJoined}
                unit={t.subjects.unit}
                tone="neutral"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: 안부 확인율 + Section 4: 위기 대응 건수 ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.sections.checkin}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-status-safe-fg">
                  {report.checkin.rate}
                  <span className="text-lg font-semibold">%</span>
                </span>
                <span className="text-sm text-muted mb-1">
                  ({report.checkin.checkedInMonth}{t.checkin.unit} / {report.checkin.total}{t.checkin.unit})
                </span>
              </div>
              {/* progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-status-safe transition-all"
                  style={{ width: `${report.checkin.rate}%` }}
                />
              </div>
              <p className="text-xs text-muted">{t.checkin.label}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.sections.alerts}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-status-danger">
                  {report.alerts.sent}
                  <span className="text-lg font-semibold ml-1">{t.alerts.unit}</span>
                </span>
              </div>
              <p className="text-xs text-muted">{t.alerts.desc}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Section 5: 구역별 현황 ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t.sections.districts}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.districts.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">{t.noData}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted font-medium">
                      <th className="py-2 pr-4">{t.districts.name}</th>
                      <th className="py-2 pr-4 text-right">{t.districts.total}</th>
                      <th className="py-2 pr-4 text-right">{t.districts.danger}</th>
                      <th className="py-2 pr-4 text-right">{t.districts.warn}</th>
                      <th className="py-2 pr-4 text-right">{t.districts.workers}</th>
                      <th className="py-2 text-right">{t.districts.checkinRate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.districts.map((d) => (
                      <tr
                        key={d.name}
                        className="border-b border-border/50 hover:bg-surface-muted/40 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-medium">{d.name}</td>
                        <td className="py-2.5 pr-4 text-right">{d.total}</td>
                        <td className="py-2.5 pr-4 text-right">
                          {d.danger > 0 ? (
                            <span className="font-semibold text-status-danger">{d.danger}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {d.warn > 0 ? (
                            <span className="font-semibold text-status-warn-fg">{d.warn}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right">{d.workerCount}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={
                              d.checkinRate >= 90
                                ? "font-semibold text-status-safe-fg"
                                : d.checkinRate >= 70
                                ? "font-semibold text-status-warn-fg"
                                : "font-semibold text-status-danger"
                            }
                          >
                            {d.checkinRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Section 6: 조치 이력 ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t.sections.actions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted font-medium">
                    <th className="py-2 pr-4">{lang === "ja" ? "種別" : "종류"}</th>
                    <th className="py-2 text-right">{lang === "ja" ? "件数" : "건수"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["visit",    t.actions.visit,    report.actions.visit],
                      ["call",     t.actions.call,     report.actions.call],
                      ["sms",      t.actions.sms,      report.actions.sms],
                      ["hospital", t.actions.hospital, report.actions.hospital],
                      ["other",    t.actions.other,    report.actions.other],
                    ] as [string, string, number][]
                  ).map(([key, label, cnt]) => (
                    <tr
                      key={key}
                      className="border-b border-border/50 hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="py-2.5 pr-4">{label}</td>
                      <td className="py-2.5 text-right font-medium">{cnt}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-surface-muted/30">
                    <td className="py-2.5 pr-4 font-bold">{t.actions.total}</td>
                    <td className="py-2.5 text-right font-bold text-foreground">
                      {report.actions.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {report.actions.total === 0 && (
              <p className="text-sm text-muted text-center py-4">{t.noData}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

/* ── helper sub-component ── */
function StatBlock({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: "neutral" | "danger" | "warn" | "safe";
}) {
  const colorMap = {
    neutral: "text-foreground",
    danger:  "text-status-danger",
    warn:    "text-status-warn-fg",
    safe:    "text-status-safe-fg",
  } as const;

  return (
    <div className="rounded-lg border border-border bg-surface-subtle p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold ${colorMap[tone]}`}>{value}</span>
        <span className="text-sm text-muted mb-0.5">{unit}</span>
      </div>
    </div>
  );
}
