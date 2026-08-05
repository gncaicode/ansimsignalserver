import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSession, COOKIE_NAME, type AdminSession } from "@/lib/session";
import { logAccess } from "@/lib/access-log";
import type { RowDataPacket } from "mysql2";

interface DistrictRow extends RowDataPacket { district_id: number; }

export interface LoginAdmin {
  admin_id: number;
  name: string;
  email: string;
  role: AdminSession["role"];
  organization_id: number | null;
}

// 로그인 성공이 확정된 admin에 대해 세션을 발급하고 로그인 성공 로그를 남긴 뒤,
// 세션 쿠키가 설정된 응답을 반환한다. 일반 로그인과 체험(데모) 로그인이 공유한다.
export async function establishAdminSession(admin: LoginAdmin, req: NextRequest): Promise<NextResponse> {
  const { rows: districtRows } = await query<DistrictRow>(
    "SELECT district_id FROM admin_districts WHERE admin_id = ?",
    [admin.admin_id],
  );
  const district_ids = districtRows.map((r) => r.district_id);

  const token = await createSession({
    admin_id: admin.admin_id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    organization_id: admin.organization_id,
    district_ids,
  });

  await logAccess({ adminId: admin.admin_id, action: "login_success", email: admin.email, req });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
  });

  return res;
}
