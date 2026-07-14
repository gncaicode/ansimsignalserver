import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import { logAccess } from "@/lib/access-log";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  admin_id: number | null;
  district_id: number | null;
  org_id: number | null;
  checkin_mode: string;
  interval_hours: number;
}

const CHECKIN_MODES = ["manual", "appOpen", "passive"];
const INTERVAL_HOURS_OPTIONS = [12, 24];

async function getUserForOrgCheck(userId: number, orgId: number | null): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(
    `SELECT d.org_id, u.checkin_mode, u.interval_hours FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     WHERE u.user_id = ? AND u.active_flag = 1`,
    [userId],
  );
  if (rows.length === 0) return null;
  if (orgId !== null && rows[0].org_id !== orgId) return null; // superadmin(orgId=null): 전체 접근
  return rows[0];
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

  const existing = await getUserForOrgCheck(userId, session.organization_id ?? null);
  if (!existing) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const name            = String(body.name            ?? "").trim();
  const age             = Number(body.age             ?? 0);
  const district_id     = body.district_id  ? Number(body.district_id)  : null;
  const address         = String(body.address         ?? "").trim();
  const emergency_phone = String(body.emergency_phone ?? "").trim();
  const admin_id        = body.admin_id     ? Number(body.admin_id)      : null;
  const checkin_mode    = body.checkin_mode !== undefined ? String(body.checkin_mode) : existing.checkin_mode;
  const interval_hours  = body.interval_hours !== undefined ? Number(body.interval_hours) : existing.interval_hours;

  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (!age || age < 1 || age > 150) return NextResponse.json({ error: "올바른 연령을 입력해주세요." }, { status: 400 });
  if (!CHECKIN_MODES.includes(checkin_mode)) {
    return NextResponse.json({ error: "올바른 체크인 방식을 선택해주세요." }, { status: 400 });
  }
  if (!INTERVAL_HOURS_OPTIONS.includes(interval_hours)) {
    return NextResponse.json({ error: "체크인 주기는 12시간 또는 24시간 중에서 선택해주세요." }, { status: 400 });
  }

  await execute(
    `UPDATE users
     SET name = ?, age = ?, district_id = ?, address = ?,
         emergency_phone = ?, admin_id = ?, checkin_mode = ?, interval_hours = ?, updated_at = NOW()
     WHERE user_id = ? AND active_flag = 1`,
    [name, age, district_id, address, emergency_phone, admin_id, checkin_mode, interval_hours, userId],
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

  if (!(await getUserForOrgCheck(userId, session.organization_id ?? null))) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await execute(
    "UPDATE users SET active_flag = 0, updated_at = NOW() WHERE user_id = ?",
    [userId],
  );

  await logAccess({ adminId: session.admin_id, action: "delete_user", resource: `user_id=${userId}`, req });

  return NextResponse.json({ ok: true });
}
