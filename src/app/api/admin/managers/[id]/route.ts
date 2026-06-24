import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface TargetRow extends RowDataPacket { role: string; organization_id: number; }

const ALLOWED_ROLES = ["admin", "social_worker", "viewer"];

async function getTarget(adminId: number) {
  const { rows } = await query<TargetRow>(
    "SELECT role, organization_id FROM admins WHERE admin_id = ? AND withdraw_flag = 0 LIMIT 1",
    [adminId]
  );
  return rows[0] ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    if (!["superadmin", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const adminId = parseInt(id);
    if (isNaN(adminId)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

    const target = await getTarget(adminId);
    if (!target) return NextResponse.json({ error: "운영자를 찾을 수 없습니다." }, { status: 404 });
    if (target.role === "superadmin") {
      return NextResponse.json({ error: "최고관리자는 변경할 수 없습니다." }, { status: 403 });
    }
    if (session.role === "admin" && target.organization_id !== session.organization_id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { type } = body;

    if (type === "role") {
      const { role } = body;
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "올바른 권한을 선택해주세요." }, { status: 400 });
      }
      await execute("UPDATE admins SET role = ? WHERE admin_id = ?", [role, adminId]);
      return NextResponse.json({ success: true });
    }

    if (type === "info") {
      const { name, phone, position, department } = body;
      if (!name?.trim()) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
      await execute(
        "UPDATE admins SET name = ?, phone = ?, position = ?, department = ? WHERE admin_id = ?",
        [name.trim(), phone ?? "", position ?? "", department ?? "", adminId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/managers/[id]]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    if (!["superadmin", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const adminId = parseInt(id);
    if (isNaN(adminId)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

    if (adminId === session.admin_id) {
      return NextResponse.json({ error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
    }

    const target = await getTarget(adminId);
    if (!target) return NextResponse.json({ error: "운영자를 찾을 수 없습니다." }, { status: 404 });
    if (target.role === "superadmin") {
      return NextResponse.json({ error: "최고관리자는 삭제할 수 없습니다." }, { status: 403 });
    }
    if (session.role === "admin" && target.organization_id !== session.organization_id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await execute(
      "UPDATE admins SET withdraw_flag = 1, active_flag = 0 WHERE admin_id = ?",
      [adminId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/managers/[id]]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
