import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
  name: string;
  created_at: string;
  plan_status: "trial" | "active" | "suspended";
  trial_ends_at: string | null;
  user_limit: number | null;
  verified_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_email_verified: number | null;
  admin_count: number;
  user_count: number;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 대상자 수는 org-plan.countOrgUsers와 같은 기준 (구역 기준, 구역 없으면 담당·초대 운영자 기관)
  const { rows } = await query<OrgRow>(
    `SELECT
       o.org_id,
       o.name,
       o.created_at,
       o.plan_status,
       o.trial_ends_at,
       o.user_limit,
       o.verified_at,
       owner.name  AS owner_name,
       owner.email AS owner_email,
       owner.email_verified_at IS NOT NULL AS owner_email_verified,
       (SELECT COUNT(*) FROM admins a
         WHERE a.organization_id = o.org_id AND a.active_flag = 1 AND a.withdraw_flag = 0) AS admin_count,
       (SELECT COUNT(*) FROM users u
          LEFT JOIN districts d ON u.district_id = d.dist_id
          LEFT JOIN admins ua ON u.admin_id = ua.admin_id
         WHERE u.active_flag = 1
           AND (d.org_id = o.org_id OR (u.district_id IS NULL AND (
                  ua.organization_id = o.org_id
                  OR EXISTS (SELECT 1 FROM invite_codes ic JOIN admins ia ON ia.admin_id = ic.admin_id
                             WHERE ic.user_id = u.user_id AND ia.organization_id = o.org_id))))) AS user_count
     FROM organizations o
     LEFT JOIN admins owner
       ON owner.admin_id = (SELECT MIN(a2.admin_id) FROM admins a2
                            WHERE a2.organization_id = o.org_id AND a2.role = 'superadmin' AND a2.withdraw_flag = 0)
     ORDER BY o.created_at DESC`,
    [],
  );

  return NextResponse.json({ orgs: rows });
}
