import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getDistrictOptions, getAdminOptions, getOrgName, getAlertCount } from "@/lib/dashboard-data";
import { UserAddForm } from "@/components/dashboard/UserAddForm";

export default async function UserNewPage(props: PageProps<"/[lang]/users/new">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  if (!session) notFound();

  const t = dict.users;
  const adminInfo = getAdminHeaderInfo(session, lang);
  const orgId = session.organization_id ?? null;

  const [districtOptions, adminOptions, orgName, alertCount] = await Promise.all([
    getDistrictOptions(orgId),
    getAdminOptions(orgId),
    getOrgName(orgId),
    getAlertCount(orgId),
  ]);

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
        t={t.addModal}
        lang={lang}
      />
    </>
  );
}
