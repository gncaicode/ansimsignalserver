import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { query } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
}

interface OrgRow extends RowDataPacket {
  org_id: number;
  name: string;
}

export default async function SettingsPage(props: PageProps<"/[lang]/settings">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.settings;
  const adminInfo = getAdminHeaderInfo(session, lang);

  if (!session) {
    notFound();
  }

  // 현재 admin 정보 조회
  const { rows: adminRows } = await query<AdminRow>(
    `SELECT name, email, phone, position, department
     FROM admins
     WHERE admin_id = ?`,
    [session.admin_id]
  );

  if (adminRows.length === 0) {
    notFound();
  }

  const admin = adminRows[0];

  // 기관 정보 조회
  let org: OrgRow | null = null;
  if (session.organization_id) {
    const { rows: orgRows } = await query<OrgRow>(
      "SELECT org_id, name FROM organizations WHERE org_id = ?",
      [session.organization_id]
    );
    if (orgRows.length > 0) {
      org = orgRows[0];
    }
  }

  const canEditOrg = ["superadmin", "admin"].includes(session.role);

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.desc}
        orgName={org?.name ?? ""}
        locale={lang}
        labels={{
          breadcrumb: dict.nav.breadcrumb,
          searchPlaceholder: dict.appHeader.searchPlaceholder,
          role: adminInfo.role,
          notify: dict.appHeader.notify,
          user: adminInfo.user,
          userInitial: adminInfo.userInitial,
        }}
      />
      <SettingsForm admin={admin} org={org} t={t} canEditOrg={canEditOrg} />
    </>
  );
}
