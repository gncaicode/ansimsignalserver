import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket {
  admin_id: number;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, position, department } = body;

    // 유효성 검사
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
    }

    // 기존 정보 확인
    const { rows } = await query<AdminRow>(
      "SELECT admin_id FROM admins WHERE admin_id = ?",
      [session.admin_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "관리자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 업데이트
    await execute(
      `UPDATE admins
       SET name = ?, phone = ?, position = ?, department = ?, updated_at = NOW()
       WHERE admin_id = ?`,
      [name.trim(), phone ?? "", position ?? "", department ?? "", session.admin_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/profile]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
