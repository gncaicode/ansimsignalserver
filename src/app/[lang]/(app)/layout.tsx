import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function AppGroupLayout(
  props: LayoutProps<"/[lang]">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar
        locale={lang}
        labels={{
          dashboard: dict.nav.dashboard,
          users: dict.nav.users,
          managers: dict.nav.managers,
          alerts: dict.nav.alerts,
          reports: dict.nav.reports,
          settings: dict.nav.settings,
          support: dict.nav.support,
          comingSoon: dict.nav.comingSoon,
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col">{props.children}</div>
    </div>
  );
}
