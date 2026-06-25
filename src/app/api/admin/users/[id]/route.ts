import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import { logAccess } from "@/lib/access-log";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket { admin_id: number | null; district_id: number | null; org_id: number | null; }

async function checkUserOrg(userId: number, orgId: number | null): Promise<boolean> {
  const { rows } = await query<UserRow>(
    `SELECT d.org_id FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     WHERE u.user_id = ? AND u.active_flag = 1`,
    [userId],
  );
  if (rows.length === 0) return false;
  if (orgId === null) return true; // superadmin: 전체 접근
  return rows[0].org_id === orgId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (!(await checkUserOrg(userId, session.organization_id ?? null))) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const name            = String(body.name            ?? "").trim();
  const age             = Number(body.age             ?? 0);
  const district_id     = body.district_id  ? Number(body.district_id)  : null;
  const address         = String(body.address         ?? "").trim();
  const emergency_phone = String(body.emergency_phone ?? "").trim();
  const admin_id        = body.admin_id     ? Number(body.admin_id)      : null;

  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (!age || age < 1 || age > 150) return NextResponse.json({ error: "올바른 연령을 입력해주세요." }, { status: 400 });

  await execute(
    `UPDATE users
     SET name = ?, age = ?, district_id = ?, address = ?,
         emergency_phone = ?, admin_id = ?, updated_at = NOW()
     WHERE user_id = ? AND active_flag = 1`,
    [name, age, district_id, address, emergency_phone, admin_id, userId],
  );

  await logAccess({ adminId: session.admin_id, action: "edit_user", resource: `user_id=${userId}`, req });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (!(await checkUserOrg(userId, session.organization_id ?? null))) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await execute(
    "UPDATE users SET active_flag = 0, updated_at = NOW() WHERE user_id = ?",
    [userId],
  );

  await logAccess({ adminId: session.admin_id, action: "delete_user", resource: `user_id=${userId}`, req });

  return NextResponse.json({ ok: true });
}
