import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface TokenRow extends RowDataPacket {
  id: number;
  admin_id: number;
  expires_at: string;
  used_flag: number;
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const { rows } = await query<TokenRow>(
    `SELECT id, admin_id, expires_at, used_flag
     FROM password_reset_tokens
     WHERE token = ? LIMIT 1`,
    [token],
  );

  const row = rows[0];

  if (!row || row.used_flag === 1 || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "링크가 만료되었거나 유효하지 않습니다." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  await execute(
    "UPDATE admins SET password_hash = ?, updated_at = NOW() WHERE admin_id = ?",
    [hash, row.admin_id],
  );

  await execute(
    "UPDATE password_reset_tokens SET used_flag = 1 WHERE id = ?",
    [row.id],
  );

  return NextResponse.json({ ok: true });
}
