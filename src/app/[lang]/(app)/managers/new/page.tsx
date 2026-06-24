import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getOrgName, getAlertCount } from "@/lib/dashboard-data";
import { ManagerAddForm } from "@/components/dashboard/ManagerAddForm";

export default async function ManagerNewPage(props: PageProps<"/[lang]/managers/new">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  if (!session) notFound();
  if (!["superadmin", "admin"].includes(session.role)) notFound();

  const t = dict.managers;
  const adminInfo = getAdminHeaderInfo(session, lang);
  const orgId = session.organization_id ?? null;

  const [orgName, alertCount] = await Promise.all([
    getOrgName(orgId),
    getAlertCount(orgId),
  ]);

  const roleOptions = [
    { value: "admin",         label: t.roles.supervisor.label },
    { value: "social_worker", label: t.roles.worker.label },
    { value: "viewer",        label: t.roles.viewer.label },
  ];

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
      <ManagerAddForm
        roles={roleOptions}
        t={t.addModal}
        lang={lang}
      />
    </>
  );
}
