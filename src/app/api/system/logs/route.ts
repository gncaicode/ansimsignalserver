import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface LogRow extends RowDataPacket {
  log_id: number;
  created_at: string;
  action: string;
  resource: string | null;
  ip_address: string | null;
  email: string | null;
  admin_name: string | null;
  admin_role: string | null;
  org_name: string | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const org = sp.get("org") ?? "";
  const action = sp.get("action") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const adminName = sp.get("adminName") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (org) {
    conditions.push("o.name LIKE ?");
    params.push(`%${org}%`);
  }
  if (action) {
    conditions.push("l.action = ?");
    params.push(action);
  }
  if (dateFrom) {
    conditions.push("l.created_at >= ?");
    params.push(dateFrom + " 00:00:00");
  }
  if (dateTo) {
    conditions.push("l.created_at <= ?");
    params.push(dateTo + " 23:59:59");
  }
  if (adminName) {
    conditions.push("a.name LIKE ?");
    params.push(`%${adminName}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const baseSql = `
    FROM admin_access_logs l
    LEFT JOIN admins a ON l.admin_id = a.admin_id
    LEFT JOIN organizations o ON a.organization_id = o.org_id
    ${whereClause}
  `;

  const { rows: countRows } = await query<CountRow>(
    `SELECT COUNT(*) AS total ${baseSql}`,
    params,
  );
  const total = countRows[0]?.total ?? 0;

  const { rows } = await query<LogRow>(
    `SELECT l.log_id, l.created_at, l.action, l.resource, l.ip_address, l.email,
            a.name AS admin_name, a.role AS admin_role,
            o.name AS org_name
     ${baseSql}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return NextResponse.json({ logs: rows, total, page, limit });
}
