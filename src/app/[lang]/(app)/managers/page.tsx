import { notFound } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { logAccess } from "@/lib/access-log";
import { headers } from "next/headers";
import { getAdmins, getOrgName, getAlertCount } from "@/lib/dashboard-data";
import type { ManagerRole } from "@/lib/types";

const ROLE_TONE: Record<ManagerRole, "trust" | "neutral" | "outline" | "safe"> = {
  admin:      "trust",
  supervisor: "trust",
  worker:     "safe",
  viewer:     "outline",
};

export default async function ManagersPage(props: PageProps<"/[lang]/managers">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.managers;
  const orgId = session?.organization_id ?? null;

  if (session) {
    logAccess({ adminId: session.admin_id, action: "view_managers", headers: await headers() });
  }

  const adminInfo = getAdminHeaderInfo(session, lang);
  const canEdit = session?.role === "superadmin" || session?.role === "admin";

  const [managers, orgName, alertCount] = await Promise.all([
    getAdmins(orgId),
    getOrgName(orgId),
    getAlertCount(orgId),
  ]);

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
      <main className="flex-1 px-6 py-6 space-y-5 max-w-[1400px] mx-auto w-full">
        {/* 액션 */}
        {canEdit && (
          <div className="flex justify-end">
            <Link href={`/${lang}/managers/new`}>
              <Button size="md">
                <UserPlus className="h-4 w-4" />
                {t.btnAdd}
              </Button>
            </Link>
          </div>
        )}

        {/* 권한 안내 */}
        <Card className="bg-trust-50/60 border-trust-200">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-trust-700 mt-0.5 shrink-0" />
            <p className="text-sm text-trust-900 leading-relaxed">
              <strong>{t.notice.title}</strong> · {t.notice.body}
            </p>
          </CardContent>
        </Card>

        {/* 테이블 */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">{t.columns.name}</TableHead>
                  <TableHead className="w-[160px] px-5">{t.columns.department}</TableHead>
                  <TableHead className="w-[110px] px-5">{t.columns.position}</TableHead>
                  <TableHead className="px-5">{t.columns.contact}</TableHead>
                  <TableHead className="w-[160px] px-5">{t.columns.role}</TableHead>
                  <TableHead className="w-[160px] px-5">담당구역</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted">
                      {t.empty}
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.map((m) => {
                    const role = t.roles[m.role];
                    return (
                      <TableRow key={m.admin_id}>
                        <TableCell className="px-5">
                          {canEdit ? (
                            <Link
                              href={`/${lang}/managers/${m.admin_id}`}
                              className="flex items-center gap-2.5 group w-fit"
                            >
                              <div className="h-8 w-8 rounded-full bg-trust-700/90 text-white flex items-center justify-center text-xs font-bold">
                                {m.name.charAt(0)}
                              </div>
                              <span className="font-semibold group-hover:text-trust-700 group-hover:underline">{m.name}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-trust-700/90 text-white flex items-center justify-center text-xs font-bold">
                                {m.name.charAt(0)}
                              </div>
                              <span className="font-semibold">{m.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-5 font-medium">
                          {m.department || m.org_name || "—"}
                        </TableCell>
                        <TableCell className="px-5">{m.position || "—"}</TableCell>
                        <TableCell className="px-5">
                          <div className="text-sm">{m.phone || "—"}</div>
                          <div className="text-xs text-subtle">{m.email}</div>
                        </TableCell>
                        <TableCell className="px-5">
                          <Badge tone={ROLE_TONE[m.role]}>{role.label}</Badge>
                          <p className="mt-1 text-[11px] text-subtle">{role.desc}</p>
                        </TableCell>
                        <TableCell className="px-5">
                          <span className="text-sm text-muted">
                            {m.dbRole === "social_worker"
                              ? (m.district_names ?? "—")
                              : <span className="text-subtle text-xs">전체</span>}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
