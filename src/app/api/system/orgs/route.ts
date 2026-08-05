import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
  name: string;
  admin_count: number;
  user_count: number;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query<OrgRow>(
    `SELECT
       o.org_id,
       o.name,
       (SELECT COUNT(*) FROM admins a
         WHERE a.organization_id = o.org_id AND a.active_flag = 1 AND a.withdraw_flag = 0) AS admin_count,
       (SELECT COUNT(*) FROM users u JOIN districts d ON u.district_id = d.dist_id
         WHERE d.org_id = o.org_id AND u.active_flag = 1) AS user_count
     FROM organizations o
     ORDER BY o.name ASC`,
    [],
  );

  return NextResponse.json({ orgs: rows });
}
