import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { query } from "@/lib/db";
import { getOrgName, getAlertCount } from "@/lib/dashboard-data";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { RowDataPacket } from "mysql2";

interface ProfileRow extends RowDataPacket {
  name: string;
  phone: string;
  position: string;
  department: string;
}

export default async function ProfilePage(props: PageProps<"/[lang]/profile">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  if (!session) notFound();

  const t = dict.myProfile;
  const adminInfo = getAdminHeaderInfo(session, lang);
  const orgId = session.organization_id ?? null;

  const [profileRows, orgName, alertCount] = await Promise.all([
    query<ProfileRow>(
      "SELECT name, phone, position, department FROM admins WHERE admin_id = ? LIMIT 1",
      [session.admin_id]
    ),
    getOrgName(orgId),
    getAlertCount(orgId),
  ]);

  const profile = profileRows.rows[0] ?? { name: "", phone: "", position: "", department: "" };

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
      <ProfileForm profile={profile} t={t} />
    </>
  );
}
