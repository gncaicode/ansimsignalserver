import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket {
  password_hash: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    // 유효성 검사
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ error: "현재 비밀번호를 입력해주세요." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "새 비밀번호를 입력해주세요." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "새 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 기존 비밀번호 조회
    const { rows } = await query<AdminRow>(
      "SELECT password_hash FROM admins WHERE admin_id = ?",
      [session.admin_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "관리자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 현재 비밀번호 검증
    const admin = rows[0];
    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "현재 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 새 비밀번호 해시 및 업데이트
    const newHash = await bcrypt.hash(newPassword, 10);
    await execute(
      "UPDATE admins SET password_hash = ? WHERE admin_id = ?",
      [newHash, session.admin_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/password]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
