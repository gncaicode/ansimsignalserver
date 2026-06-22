import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // admin 이상의 권한 확인
    if (!["superadmin", "admin"].includes(session.role)) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name } = body;

    // 유효성 검사
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "기관명은 필수입니다." }, { status: 400 });
    }

    if (!session.organization_id) {
      return NextResponse.json(
        { error: "기관 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기관 존재 확인
    const { rows } = await query<OrgRow>(
      "SELECT org_id FROM organizations WHERE org_id = ?",
      [session.organization_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "기관을 찾을 수 없습니다." }, { status: 404 });
    }

    // 업데이트
    await execute(
      "UPDATE organizations SET name = ?, updated_at = NOW() WHERE org_id = ?",
      [name.trim(), session.organization_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/org]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
