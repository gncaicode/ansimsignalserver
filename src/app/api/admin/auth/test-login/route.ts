import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import type { AdminSession } from "@/lib/session";
import { DEMO_ADMIN_EMAIL } from "@/lib/demo-account";
import { establishAdminSession } from "@/lib/auth-login";
import type { RowDataPacket } from "mysql2";

// 랜딩페이지 "체험 계정으로 둘러보기" 버튼 전용. 자격정보는 브라우저로 절대 내려보내지 않고
// 서버에서만 보관·검증한다.
const DEMO_PASSWORD = "paldal1234";

interface AdminRow extends RowDataPacket {
  admin_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: AdminSession["role"];
  organization_id: number | null;
  active_flag: number;
  withdraw_flag: number;
}

export async function POST(req: NextRequest) {
  const { rows } = await query<AdminRow>(
    "SELECT admin_id, name, email, password_hash, role, organization_id, active_flag, withdraw_flag FROM admins WHERE email = ? LIMIT 1",
    [DEMO_ADMIN_EMAIL],
  );

  const admin = rows[0];
  if (!admin || admin.withdraw_flag === 1 || admin.active_flag === 0) {
    return NextResponse.json({ error: "체험 계정을 사용할 수 없습니다." }, { status: 503 });
  }

  const valid = await bcrypt.compare(DEMO_PASSWORD, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "체험 계정을 사용할 수 없습니다." }, { status: 503 });
  }

  return establishAdminSession(admin, req);
}
