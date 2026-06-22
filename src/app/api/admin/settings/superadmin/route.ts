import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket { admin_id: number; }

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (session.role !== "superadmin") {
      return NextResponse.json({ error: "최고관리자만 변경할 수 있습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const newSuperadminId = Number(body.admin_id);

    if (!newSuperadminId) {
      return NextResponse.json({ error: "운영자를 선택해주세요." }, { status: 400 });
    }
    if (newSuperadminId === session.admin_id) {
      return NextResponse.json({ error: "현재 계정은 선택할 수 없습니다." }, { status: 400 });
    }

    // 대상 운영자가 같은 기관인지 확인
    const { rows } = await query<AdminRow>(
      "SELECT admin_id FROM admins WHERE admin_id = ? AND organization_id = ? AND active_flag = 1 AND withdraw_flag = 0",
      [newSuperadminId, session.organization_id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "운영자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 새 superadmin으로 승격, 기존 superadmin은 admin으로 강등
    await execute(
      "UPDATE admins SET role = 'superadmin', updated_at = NOW() WHERE admin_id = ?",
      [newSuperadminId]
    );
    await execute(
      "UPDATE admins SET role = 'admin', updated_at = NOW() WHERE admin_id = ?",
      [session.admin_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/superadmin]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
