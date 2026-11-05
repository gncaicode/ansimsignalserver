import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import { TRIAL_EXTEND_DAYS } from "@/lib/org-plan";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
  name: string;
  default_checkin_mode: string | null;
  default_interval_hours: number | null;
}

interface DistrictRow extends RowDataPacket {
  dist_id: number;
  name: string;
  user_count: number;
}

interface AdminRow extends RowDataPacket {
  admin_id: number;
  name: string;
  email: string;
  role: string;
  position: string | null;
  department: string | null;
  active_flag: number;
}

interface ActivityRow extends RowDataPacket {
  log_id: number;
  created_at: string;
  action: string;
  resource: string | null;
  admin_name: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orgId = Number(id);
  if (!orgId) return NextResponse.json({ error: "잘못된 기관 ID입니다." }, { status: 400 });

  const [{ rows: orgRows }, { rows: districtRows }, { rows: adminRows }, { rows: activityRows }] = await Promise.all([
    query<OrgRow>(
      "SELECT org_id, name, default_checkin_mode, default_interval_hours FROM organizations WHERE org_id = ?",
      [orgId],
    ),
    query<DistrictRow>(
      `SELECT d.dist_id, d.name,
              COUNT(CASE WHEN u.active_flag = 1 THEN u.user_id END) AS user_count
       FROM districts d
       LEFT JOIN users u ON u.district_id = d.dist_id
       WHERE d.org_id = ?
       GROUP BY d.dist_id, d.name
       ORDER BY d.name ASC`,
      [orgId],
    ),
    query<AdminRow>(
      `SELECT admin_id, name, email, role, position, department, active_flag
       FROM admins
       WHERE organization_id = ? AND withdraw_flag = 0
       ORDER BY FIELD(role, 'superadmin', 'admin', 'social_worker', 'viewer'), name ASC`,
      [orgId],
    ),
    query<ActivityRow>(
      `SELECT l.log_id, l.created_at, l.action, l.resource, a.name AS admin_name
       FROM admin_access_logs l
       JOIN admins a ON l.admin_id = a.admin_id
       WHERE a.organization_id = ?
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [orgId],
    ),
  ]);

  if (orgRows.length === 0) {
    return NextResponse.json({ error: "기관을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    org: orgRows[0],
    districts: districtRows,
    admins: adminRows,
    recentActivity: activityRows,
  });
}

interface PlanOrgRow extends RowDataPacket {
  plan_status: string;
  trial_ends_at: string | null;
  verified_at: string | null;
}

// 운영사가 기관 이용 상태를 바꾼다.
// verify: 기관 확인 / extend: 체험 30일 연장 / activate: 정식(무상) 전환 / suspend: 정지 / resume: 정지 해제
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  const { rows } = await query<PlanOrgRow>(
    "SELECT plan_status, trial_ends_at, verified_at FROM organizations WHERE org_id = ?",
    [orgId],
  );
  const org = rows[0];
  if (!org) return NextResponse.json({ error: "기관을 찾을 수 없습니다." }, { status: 404 });

  switch (action) {
    case "verify":
      await execute("UPDATE organizations SET verified_at = COALESCE(verified_at, NOW()) WHERE org_id = ?", [orgId]);
      break;

    case "extend":
      if (org.plan_status !== "trial") {
        return NextResponse.json({ error: "체험 중인 기관만 연장할 수 있습니다." }, { status: 400 });
      }
      // 이미 끝났으면 오늘부터, 남아 있으면 종료일부터 연장
      await execute(
        `UPDATE organizations
         SET trial_ends_at = DATE_ADD(GREATEST(COALESCE(trial_ends_at, NOW()), NOW()), INTERVAL ? DAY)
         WHERE org_id = ?`,
        [TRIAL_EXTEND_DAYS, orgId],
      );
      break;

    case "activate": {
      if (!org.verified_at) {
        return NextResponse.json({ error: "기관 확인을 먼저 해 주세요." }, { status: 400 });
      }
      const raw = body.user_limit;
      const userLimit = raw === null || raw === "" || raw === undefined ? null : Number(raw);
      if (userLimit !== null && (!Number.isInteger(userLimit) || userLimit < 1)) {
        return NextResponse.json({ error: "대상자 상한은 1 이상의 정수이거나 비워 두어야 합니다." }, { status: 400 });
      }
      // 정식 기관은 체험 종료일을 갖지 않는다 (정지 해제 시 체험/정식 구분에도 쓰인다)
      await execute(
        "UPDATE organizations SET plan_status = 'active', user_limit = ?, trial_ends_at = NULL WHERE org_id = ?",
        [userLimit, orgId],
      );
      break;
    }

    case "suspend":
      await execute("UPDATE organizations SET plan_status = 'suspended' WHERE org_id = ?", [orgId]);
      break;

    case "resume": {
      if (org.plan_status !== "suspended") {
        return NextResponse.json({ error: "정지된 기관이 아닙니다." }, { status: 400 });
      }
      const next = org.trial_ends_at !== null || org.verified_at === null ? "trial" : "active";
      await execute("UPDATE organizations SET plan_status = ? WHERE org_id = ?", [next, orgId]);
      break;
    }

    default:
      return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
