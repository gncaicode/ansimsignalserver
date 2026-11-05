import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getOrgPlan } from "@/lib/org-plan";
import { PlanBanner } from "@/components/layout/PlanBanner";

export default async function AppGroupLayout(
  props: LayoutProps<"/[lang]">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const plan = session?.organization_id ? await getOrgPlan(session.organization_id) : null;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar
        locale={lang}
        role={session?.role}
        labels={{
          dashboard: dict.nav.dashboard,
          users: dict.nav.users,
          managers: dict.nav.managers,
          reports: dict.nav.reports,
          settings: dict.nav.settings,
          profile: dict.nav.profile,
          support: dict.nav.support,
          comingSoon: dict.nav.comingSoon,
          logout: dict.nav.logout,
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        {plan && <PlanBanner plan={plan} t={dict.planBanner} />}
        {props.children}
      </div>
    </div>
  );
}
