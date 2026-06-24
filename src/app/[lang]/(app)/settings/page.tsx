import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { query } from "@/lib/db";
import { getAlertCount, getAdminOptions } from "@/lib/dashboard-data";
import { SettingsForm } from "@/components/settings/SettingsForm";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket { name: string; }
interface DistrictRow extends RowDataPacket { dist_id: number; name: string; }

export default async function SettingsPage(props: PageProps<"/[lang]/settings">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.settings;
  const adminInfo = getAdminHeaderInfo(session, lang);

  if (!session) notFound();
  if (!["superadmin", "admin"].includes(session.role)) notFound();

  const isSuperadmin = session.role === "superadmin";
  const orgId = session.organization_id;

  const [orgRows, districtResult, admins, alertCount] = await Promise.all([
    orgId
      ? query<OrgRow>("SELECT name FROM organizations WHERE org_id = ? LIMIT 1", [orgId])
      : Promise.resolve({ rows: [] as OrgRow[], rowCount: 0 }),
    orgId
      ? query<DistrictRow>("SELECT dist_id, name FROM districts WHERE org_id = ? ORDER BY name", [orgId])
      : Promise.resolve({ rows: [] as DistrictRow[], rowCount: 0 }),
    getAdminOptions(orgId),
    getAlertCount(orgId),
  ]);

  const orgName = orgRows.rows[0]?.name ?? "";
  const districts = districtResult.rows;

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.desc}
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
      <SettingsForm
        orgName={orgName}
        districts={districts}
        admins={admins}
        isSuperadmin={isSuperadmin}
        t={t}
      />
    </>
  );
}
