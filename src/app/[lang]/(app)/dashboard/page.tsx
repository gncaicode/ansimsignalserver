import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CriticalAlertList } from "@/components/dashboard/CriticalAlertList";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { formatLongDateTime } from "@/lib/i18n/format";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import {
  getDashboardStats,
  getCriticalUsers,
  getDistrictBreakdown,
  getActivityLog,
  getOrgName,
  getAlertCount,
} from "@/lib/dashboard-data";

export default async function DashboardPage(
  props: PageProps<"/[lang]/dashboard">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.dashboard;
  const orgId = session?.organization_id ?? null;

  const [stats, criticalUsers, districtBreakdown, activityLog, orgName, alertCount] =
    await Promise.all([
      getDashboardStats(orgId),
      getCriticalUsers(orgId),
      getDistrictBreakdown(orgId),
      getActivityLog(orgId),
      getOrgName(orgId),
      getAlertCount(orgId),
    ]);

  const today = formatLongDateTime(new Date(), lang);
  const adminInfo = getAdminHeaderInfo(session, lang);

  const primaryDistrictTotal = districtBreakdown[0]?.total ?? 0;
  const secondaryDistrictTotal = districtBreakdown[1]?.total ?? 0;

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.updated(today)}
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
      <main className="flex-1 px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
        <SummaryCards
          total={stats.total}
          danger={stats.danger}
          warn={stats.warn}
          safe={stats.safe}
          primaryDistrictTotal={primaryDistrictTotal}
          secondaryDistrictTotal={secondaryDistrictTotal}
          labels={t.summary}
        />

        {criticalUsers.length > 0 && (
          <CriticalAlertList
            subjects={criticalUsers}
            locale={lang}
            labels={t.critical}
          />
        )}

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <ActivityLog
            entries={activityLog}
            locale={lang}
            labels={t.activity}
          />
          <DistrictBreakdown labels={t.district} data={districtBreakdown} />
        </div>
      </main>
    </>
  );
}

function DistrictBreakdown({
  labels,
  data,
}: {
  labels: Awaited<ReturnType<typeof getDictionary>>["dashboard"]["district"];
  data: { name: string; total: number; danger: number; warn: number; response: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <p className="mt-1 text-xs text-muted">{labels.desc}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 && (
          <p className="text-sm text-muted text-center py-4">데이터 없음</p>
        )}
        {data.map((d) => {
          const hasIssue = d.danger > 0 || d.warn > 0;
          return (
            <div key={d.name}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{d.name}</span>
                  <span className="text-xs text-subtle">
                    {d.total}
                    {labels.countSuffix}
                  </span>
                  {d.danger > 0 && (
                    <Badge tone="danger">{labels.dangerBadge(d.danger)}</Badge>
                  )}
                  {d.warn > 0 && (
                    <Badge tone="warn">{labels.warnBadge(d.warn)}</Badge>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${
                    d.response < 95
                      ? "text-status-danger"
                      : d.response < 100
                      ? "text-status-warn-fg"
                      : "text-status-safe-fg"
                  }`}
                >
                  {d.response}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full ${
                    hasIssue ? "bg-status-danger" : "bg-status-safe"
                  }`}
                  style={{ width: `${d.response}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
