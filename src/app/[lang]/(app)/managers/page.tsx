import { notFound } from "next/navigation";
import { ShieldCheck, UserPlus, Mail, MoreHorizontal } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { getSession, getAdminHeaderInfo } from "@/lib/session";
import { getAdmins, getOrgName } from "@/lib/dashboard-data";
import { DistrictManager } from "@/components/dashboard/DistrictManager";
import { query } from "@/lib/db";
import type { ManagerRole, ApprovalStatus } from "@/lib/types";
import type { RowDataPacket } from "mysql2";

interface DistrictRow extends RowDataPacket { dist_id: number; name: string; }

const ROLE_TONE: Record<ManagerRole, "trust" | "neutral" | "outline" | "safe"> = {
  admin:      "trust",
  supervisor: "trust",
  worker:     "safe",
  viewer:     "outline",
};

const APPROVAL_TONE: Record<ApprovalStatus, "safe" | "warn" | "danger"> = {
  approved:  "safe",
  pending:   "warn",
  suspended: "danger",
};

export default async function ManagersPage(props: PageProps<"/[lang]/managers">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const [dict, session] = await Promise.all([getDictionary(lang), getSession()]);
  const t = dict.managers;
  const orgId = session?.organization_id ?? null;

  const adminInfo = getAdminHeaderInfo(session);
  const canEdit = session?.role === "superadmin" || session?.role === "admin";

  const [managers, orgName, districtResult] = await Promise.all([
    getAdmins(orgId),
    getOrgName(orgId),
    orgId
      ? query<DistrictRow>("SELECT dist_id, name FROM districts WHERE org_id = ? ORDER BY name", [orgId])
      : Promise.resolve({ rows: [] as DistrictRow[], rowCount: 0 }),
  ]);
  const districts = districtResult.rows;

  const approvedCount  = managers.filter((m) => m.approvalStatus === "approved").length;
  const pendingCount   = managers.filter((m) => m.approvalStatus === "pending").length;
  const suspendedCount = managers.filter((m) => m.approvalStatus === "suspended").length;

  return (
    <>
      <AppHeader
        title={t.title}
        description={t.desc}
        orgName={orgName}
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
      <main className="flex-1 px-6 py-6 space-y-5 max-w-[1400px] mx-auto w-full">
        {/* 요약 카드 + 액션 */}
        <div className="grid lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <SummaryStat label={t.summary.approved}  value={approvedCount}  unit={t.summary.unit} tone="safe" />
          <SummaryStat label={t.summary.pending}   value={pendingCount}   unit={t.summary.unit} tone="warn"
            badge={pendingCount > 0 ? t.summary.pendingBadge : undefined} />
          <SummaryStat label={t.summary.suspended} value={suspendedCount} unit={t.summary.unit} tone="danger" />
          <div className="flex gap-2">
            <Button variant="outline" size="md">
              <Mail className="h-4 w-4" />
              {t.btnInvite}
            </Button>
            <Button size="md">
              <UserPlus className="h-4 w-4" />
              {t.btnAdd}
            </Button>
          </div>
        </div>

        {/* 권한 안내 */}
        <Card className="bg-trust-50/60 border-trust-200">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-trust-700 mt-0.5 shrink-0" />
            <p className="text-sm text-trust-900 leading-relaxed">
              <strong>{t.notice.title}</strong> · {t.notice.body}
            </p>
          </CardContent>
        </Card>

        {/* 구역 관리 */}
        <DistrictManager initial={districts} canEdit={canEdit} />

        {/* 테이블 */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">{t.columns.approvalStatus}</TableHead>
                  <TableHead>{t.columns.department}</TableHead>
                  <TableHead className="w-[100px]">{t.columns.position}</TableHead>
                  <TableHead>{t.columns.name}</TableHead>
                  <TableHead>{t.columns.contact}</TableHead>
                  <TableHead className="w-[140px]">{t.columns.role}</TableHead>
                  <TableHead className="w-[110px]">{t.columns.joinedAt}</TableHead>
                  <TableHead className="w-[150px]">{t.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted">
                      등록된 운영자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.map((m) => {
                    const role = t.roles[m.role];
                    const approvalLabel = t.approvals[m.approvalStatus];
                    return (
                      <TableRow key={m.admin_id}>
                        <TableCell>
                          <Badge tone={APPROVAL_TONE[m.approvalStatus]}>{approvalLabel}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {m.department || m.org_name || "—"}
                        </TableCell>
                        <TableCell>{m.position || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-trust-700/90 text-white flex items-center justify-center text-xs font-bold">
                              {m.name.charAt(0)}
                            </div>
                            <span className="font-semibold">{m.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{m.phone || "—"}</div>
                          <div className="text-xs text-subtle">{m.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge tone={ROLE_TONE[m.role]}>{role.label}</Badge>
                          <p className="mt-1 text-[11px] text-subtle">{role.desc}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted">
                            {m.joined_at ? m.joined_at.toString().slice(0, 10) : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {m.approvalStatus === "suspended" ? (
                            <Button size="sm" variant="outline">{t.actions.unsuspend}</Button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline">{t.actions.changeRole}</Button>
                              <Button size="icon" variant="ghost" aria-label={t.actions.moreA11y}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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

function SummaryStat({
  label, value, unit, tone, badge,
}: {
  label: string; value: number; unit: string;
  tone: "safe" | "warn" | "danger"; badge?: string;
}) {
  const map = {
    safe:   "text-status-safe-fg",
    warn:   "text-status-warn-fg",
    danger: "text-status-danger",
  } as const;
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {badge && <Badge tone="warn">{badge}</Badge>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-3xl font-extrabold ${map[tone]}`}>{value}</span>
        <span className="text-sm font-semibold text-muted">{unit}</span>
      </div>
    </Card>
  );
}
