import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
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
