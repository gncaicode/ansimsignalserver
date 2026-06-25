import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface UserRow extends RowDataPacket { user_id: number; org_id: number | null; }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);
    if (!userId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

    // 대상자 존재 및 기관 소속 확인
    const { rows } = await query<UserRow>(
      `SELECT u.user_id, d.org_id FROM users u
       LEFT JOIN districts d ON u.district_id = d.dist_id
       WHERE u.user_id = ? AND u.active_flag = 1`,
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });
    }
    const orgId = session.organization_id ?? null;
    if (orgId !== null && rows[0].org_id !== orgId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 기존 초대코드 삭제
    await execute("DELETE FROM invite_codes WHERE user_id = ?", [userId]);

    // users 초기화 (앱 가입 정보 리셋)
    await execute(
      "UPDATE users SET token = NULL, register_flag = 0, updated_at = NOW() WHERE user_id = ?",
      [userId]
    );

    // 새 초대코드 생성 (중복 방지 재시도)
    let newCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const { rows: dup } = await query<UserRow>(
        "SELECT user_id FROM invite_codes WHERE code = ?",
        [candidate]
      );
      if (dup.length === 0) { newCode = candidate; break; }
    }
    if (!newCode) {
      return NextResponse.json({ error: "초대코드 생성에 실패했습니다." }, { status: 500 });
    }

    await execute(
      "INSERT INTO invite_codes (code, admin_id, user_id) VALUES (?, ?, ?)",
      [newCode, session.admin_id, userId]
    );

    return NextResponse.json({ code: newCode }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/users/[id]/reinvite]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
