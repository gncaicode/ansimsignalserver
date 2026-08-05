import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getOrgName, getAlertCount, getAdminById, getDistrictOptions } from "@/lib/dashboard-data";
import { ManagerEditForm } from "@/components/dashboard/ManagerEditForm";

export default async function ManagerEditPage(props: PageProps<"/[lang]/managers/[id]">) {
  const { lang, id } = await props.params;
  if (!hasLocale(lang)) notFound();

  const adminId = Number(id);
  if (!Number.isInteger(adminId) || adminId <= 0) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  if (!session) notFound();
  if (!["superadmin", "admin"].includes(session.role)) notFound();

  const t = dict.managers;
  const adminInfo = getAdminHeaderInfo(session, lang);
  const orgId = session.organization_id ?? null;

  const target = await getAdminById(adminId, orgId);
  if (!target || target.dbRole === "superadmin") notFound();

  const [orgName, alertCount, districtOptions] = await Promise.all([
    getOrgName(orgId),
    getAlertCount(orgId),
    getDistrictOptions(orgId),
  ]);

  const roleOptions = [
    { value: "admin",         label: t.roles.supervisor.label },
    { value: "social_worker", label: t.roles.worker.label },
    { value: "viewer",        label: t.roles.viewer.label },
  ];

  return (
    <>
      <AppHeader
        title={t.editPage.title}
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
      <ManagerEditForm
        adminId={target.admin_id}
        email={target.email}
        initial={{
          name: target.name,
          phone: target.phone ?? "",
          position: target.position ?? "",
          department: target.department ?? "",
          role: target.dbRole,
          district_ids: target.district_ids,
        }}
        roles={roleOptions}
        districtOptions={districtOptions}
        t={t.editPage}
        lang={lang}
      />
    </>
  );
}
