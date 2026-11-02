import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface AlertRow extends RowDataPacket {
  log_id: number;
  changed_at: string;
  user_name: string;
  org_name: string | null;
  district_name: string | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// user_status_logs.status='danger'는 cron/alert(30분 주기)가 대상자의 실시간 상태가
// 직전 이력과 달라졌을 때만 기록하므로, 위급 전환(=알림 발송 시점)의 이력으로 사용한다.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const org = sp.get("org") ?? "";
  const userName = sp.get("userName") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["l.status = 'danger'"];
  const params: (string | number)[] = [];

  if (org) {
    conditions.push("o.name LIKE ?");
    params.push(`%${org}%`);
  }
  if (userName) {
    conditions.push("u.name LIKE ?");
    params.push(`%${userName}%`);
  }
  if (dateFrom) {
    conditions.push("l.changed_at >= ?");
    params.push(dateFrom + " 00:00:00");
  }
  if (dateTo) {
    conditions.push("l.changed_at <= ?");
    params.push(dateTo + " 23:59:59");
  }

  const baseSql = `
    FROM user_status_logs l
    JOIN users u ON l.user_id = u.user_id
    LEFT JOIN districts d ON u.district_id = d.dist_id
    LEFT JOIN organizations o ON d.org_id = o.org_id
    WHERE ${conditions.join(" AND ")}
  `;

  const { rows: countRows } = await query<CountRow>(`SELECT COUNT(*) AS total ${baseSql}`, params);
  const total = countRows[0]?.total ?? 0;

  const { rows } = await query<AlertRow>(
    `SELECT l.log_id, l.changed_at, u.name AS user_name, o.name AS org_name, d.name AS district_name
     ${baseSql}
     ORDER BY l.changed_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return NextResponse.json({ alerts: rows, total, page, limit });
}
