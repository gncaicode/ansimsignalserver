import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { query } from "@/lib/db";
import { getDistrictOptions, getAdminOptions, getOrgName, getAlertCount } from "@/lib/dashboard-data";
import { UserAddForm } from "@/components/dashboard/UserAddForm";
import type { RowDataPacket } from "mysql2";

interface OrgDefaultsRow extends RowDataPacket {
  default_checkin_mode: "manual" | "appOpen" | "passive";
  default_interval_hours: number;
}

export default async function UserNewPage(props: PageProps<"/[lang]/users/new">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  if (!session) notFound();

  const t = dict.users;
  const adminInfo = getAdminHeaderInfo(session, lang);
  const orgId = session.organization_id ?? null;

  const [districtOptions, adminOptions, orgName, alertCount, orgDefaultsResult] = await Promise.all([
    getDistrictOptions(orgId),
    getAdminOptions(orgId),
    getOrgName(orgId),
    getAlertCount(orgId),
    orgId
      ? query<OrgDefaultsRow>(
          "SELECT default_checkin_mode, default_interval_hours FROM organizations WHERE org_id = ? LIMIT 1",
          [orgId],
        )
      : Promise.resolve({ rows: [] as OrgDefaultsRow[], rowCount: 0 }),
  ]);
  const defaultCheckinMode = orgDefaultsResult.rows[0]?.default_checkin_mode ?? "manual";
  const defaultIntervalHours = orgDefaultsResult.rows[0]?.default_interval_hours ?? 24;

  return (
    <>
      <AppHeader
        title={t.addModal.title}
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
      <UserAddForm
        districts={districtOptions}
        admins={adminOptions}
        defaultCheckinMode={defaultCheckinMode}
        defaultIntervalHours={defaultIntervalHours}
        t={t.addModal}
        lang={lang}
      />
    </>
  );
}
