import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import type { AdminSession } from "@/lib/session";
import { logAccess } from "@/lib/access-log";
import { establishAdminSession } from "@/lib/auth-login";
import type { RowDataPacket } from "mysql2";

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
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const { rows } = await query<AdminRow>(
    "SELECT admin_id, name, email, password_hash, role, organization_id, active_flag, withdraw_flag FROM admins WHERE email = ? LIMIT 1",
    [email],
  );

  const admin = rows[0];

  if (!admin) {
    await logAccess({ action: "login_fail", email, req });
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  if (admin.withdraw_flag === 1) {
    return NextResponse.json({ error: "탈퇴한 계정입니다." }, { status: 403 });
  }

  if (admin.active_flag === 0) {
    return NextResponse.json({ error: "비활성화된 계정입니다. 관리자에게 문의해주세요." }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    await logAccess({ adminId: admin.admin_id, action: "login_fail", email, req });
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  return establishAdminSession(admin, req);
}
