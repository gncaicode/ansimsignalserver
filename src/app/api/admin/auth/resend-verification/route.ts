import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { issueEmailVerification } from "@/lib/email-verification";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket { admin_id: number; name: string; email: string; }

export async function POST(req: NextRequest) {
  const { email, lang } = await req.json().catch(() => ({}));
  if (!email) {
    return NextResponse.json({ error: "이메일을 입력해 주세요." }, { status: 400 });
  }

  const { rows } = await query<AdminRow>(
    `SELECT admin_id, name, email FROM admins
     WHERE email = ? AND email_verified_at IS NULL AND active_flag = 1 AND withdraw_flag = 0
     LIMIT 1`,
    [String(email).trim().toLowerCase()],
  );

  // 대상이 없어도 같은 응답 (이메일 열거 방지)
  if (rows.length > 0) {
    await issueEmailVerification(rows[0], req.headers, lang);
  }
  return NextResponse.json({ ok: true });
}
