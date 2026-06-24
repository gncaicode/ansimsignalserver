import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/brand/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { ActionLogSection } from "@/components/dashboard/ActionLogSection";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { formatShortDateTime, formatRelativeTime } from "@/lib/i18n/format";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getUserById, getActionLogs, getOrgName, getAlertCount } from "@/lib/dashboard-data";

export default async function UserDetailPage(
  props: PageProps<"/[lang]/users/[id]">,
) {
  const { lang, id } = await props.params;
  if (!hasLocale(lang)) notFound();

  const userId = Number(id);
  if (!Number.isFinite(userId) || userId <= 0) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.userDetail;
  const orgId = session?.organization_id ?? null;
  const adminInfo = getAdminHeaderInfo(session, lang);

  const [user, actionLogs, orgName, alertCount] = await Promise.all([
    getUserById(userId, orgId),
    getActionLogs(userId),
    getOrgName(orgId),
    getAlertCount(orgId),
  ]);

  if (!user) notFound();

  const lastCheckinDisplay = user.last_checkin_at
    ? `${formatRelativeTime(user.last_checkin_at, lang)} (${formatShortDateTime(user.last_checkin_at, lang)})`
    : t.noCheckin;

  return (
    <>
      <AppHeader
        title={user.name}
        description={`#${user.user_id} · ${user.district_name ?? t.unassigned}`}
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

      <main className="flex-1 px-6 py-6 space-y-6 max-w-[900px] mx-auto w-full">
        {/* 뒤로 가기 */}
        <Link
          href={`/${lang}/users`}
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
        >
          {t.backToList}
        </Link>

        {/* 대상자 정보 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <StatusBadge status={user.status} locale={lang} />
              <CardTitle className="text-xl">{user.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoRow label={t.labelAge} value={`${user.age}${dict.users.yearsSuffix}`} />
              <InfoRow label={t.labelDistrict} value={user.district_name ?? t.unassigned} />
              <InfoRow label={t.labelAddress} value={user.address || "—"} />
              <InfoRow
                label={t.labelContact}
                value={
                  user.emergency_phone ? (
                    <a
                      href={`tel:${user.emergency_phone}`}
                      className="inline-flex items-center gap-1.5 text-trust-700 font-semibold hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {user.emergency_phone}
                    </a>
                  ) : "—"
                }
              />
              <InfoRow
                label={t.labelCaseworker}
                value={
                  user.admin_name
                    ? <Badge tone="trust">{user.admin_name}</Badge>
                    : <span className="text-muted">{t.unassigned}</span>
                }
              />
              <InfoRow label={t.labelLastCheckin} value={lastCheckinDisplay} />
              <InfoRow label={t.labelInterval} value={`${user.interval_hours}${t.intervalSuffix}`} />
            </dl>
          </CardContent>
        </Card>

        {/* 조치 기록 섹션 */}
        <Card>
          <CardContent className="pt-6">
            <ActionLogSection
              userId={String(user.user_id)}
              userName={user.name}
              initialLogs={actionLogs}
              locale={lang}
              t={{
                actionTitle:  t.actionTitle,
                actionDesc:   t.actionDesc,
                btnAddAction: t.btnAddAction,
                noActionLog:  t.noActionLog,
                actionTypes:  t.actionTypes,
                actor:        t.actor,
                actionModal:  t.actionModal,
              }}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
