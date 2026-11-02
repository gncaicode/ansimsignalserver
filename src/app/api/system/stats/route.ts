import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface OrgCountRow extends RowDataPacket {
  org_count: number;
}

interface AdminCountRow extends RowDataPacket {
  admin_count: number;
}

interface UserStatsRow extends RowDataPacket {
  total: number;
  pending: number;
  danger: number;
  warn: number;
  safe: number;
}

interface AlertTodayRow extends RowDataPacket {
  alerts_today: number;
}

// org-level getDashboardStats(dashboard-data.ts)와 동일한 실시간 판정 로직(전체 기관 합산)
const NOW_KST = "NOW()";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ rows: orgRows }, { rows: adminRows }, { rows: userRows }, { rows: alertRows }] = await Promise.all([
    query<OrgCountRow>("SELECT COUNT(*) AS org_count FROM organizations", []),
    query<AdminCountRow>(
      "SELECT COUNT(*) AS admin_count FROM admins WHERE active_flag = 1 AND withdraw_flag = 0",
      [],
    ),
    query<UserStatsRow>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN u.register_flag = 0 THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN u.register_flag = 1 AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
         SUM(CASE WHEN u.register_flag = 1 AND u.last_checkin_at IS NOT NULL
                       AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                       AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
                  THEN 1 ELSE 0 END) AS warn,
         SUM(CASE WHEN u.register_flag = 1 AND (u.last_checkin_at IS NULL
                       OR (${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                           AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 >= u.interval_hours / 12.0))
                  THEN 1 ELSE 0 END) AS safe
       FROM users u
       WHERE u.active_flag = 1`,
      [],
    ),
    query<AlertTodayRow>(
      "SELECT COUNT(*) AS alerts_today FROM users WHERE alert_sent_at IS NOT NULL AND DATE(alert_sent_at) = CURDATE()",
      [],
    ),
  ]);

  const u = userRows[0];

  return NextResponse.json({
    orgCount: Number(orgRows[0]?.org_count ?? 0),
    adminCount: Number(adminRows[0]?.admin_count ?? 0),
    users: {
      total: Number(u?.total ?? 0),
      pending: Number(u?.pending ?? 0),
      danger: Number(u?.danger ?? 0),
      warn: Number(u?.warn ?? 0),
      safe: Number(u?.safe ?? 0),
    },
    alertsToday: Number(alertRows[0]?.alerts_today ?? 0),
  });
}
