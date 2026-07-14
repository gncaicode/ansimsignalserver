import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import { logAccess } from "@/lib/access-log";
import { logStatusChange } from "@/lib/status-log";
import type { RowDataPacket } from "mysql2";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface DistrictRow extends RowDataPacket { org_id: number; }
interface OrgDefaultsRow extends RowDataPacket { default_checkin_mode: string; default_interval_hours: number; }

const CHECKIN_MODES = ["manual", "appOpen", "passive"];
const INTERVAL_HOURS_OPTIONS = [12, 24];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const name           = String(body.name           ?? "").trim();
  const age            = Number(body.age            ?? 0);
  const district_id    = body.district_id ? Number(body.district_id) : null;
  const address        = String(body.address        ?? "").trim();
  const emergency_phone = String(body.emergency_phone ?? "").trim();
  const admin_id       = body.admin_id ? Number(body.admin_id) : null;
  const joined_at      = new Date().toISOString().slice(0, 10); // 오늘 날짜 자동 설정

  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (!age || age < 1 || age > 150) return NextResponse.json({ error: "올바른 연령을 입력해주세요." }, { status: 400 });

  // 구역이 본인 기관 소속인지 확인
  if (district_id && session.organization_id) {
    const { rows } = await query<DistrictRow>(
      "SELECT org_id FROM districts WHERE dist_id = ?", [district_id]
    );
    if (rows.length === 0 || rows[0].org_id !== session.organization_id) {
      return NextResponse.json({ error: "잘못된 구역입니다." }, { status: 400 });
    }
  }

  // 체크인 방식/주기 — 지정하지 않으면 기관 기본 설정을 따른다.
  let checkinMode = body.checkin_mode as string | undefined;
  let intervalHours = body.interval_hours !== undefined ? Number(body.interval_hours) : undefined;
  if (checkinMode === undefined || intervalHours === undefined) {
    const { rows: orgRows } = await query<OrgDefaultsRow>(
      "SELECT default_checkin_mode, default_interval_hours FROM organizations WHERE org_id = ?",
      [session.organization_id],
    );
    checkinMode ??= orgRows[0]?.default_checkin_mode ?? "manual";
    intervalHours ??= orgRows[0]?.default_interval_hours ?? 24;
  }
  if (!CHECKIN_MODES.includes(checkinMode)) {
    return NextResponse.json({ error: "올바른 체크인 방식을 선택해주세요." }, { status: 400 });
  }
  if (!INTERVAL_HOURS_OPTIONS.includes(intervalHours)) {
    return NextResponse.json({ error: "체크인 주기는 12시간 또는 24시간 중에서 선택해주세요." }, { status: 400 });
  }

  const { insertId } = await execute(
    `INSERT INTO users
       (name, age, district_id, address, emergency_phone, admin_id, checkin_mode, interval_hours, joined_at, active_flag)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [name, age, district_id, address, emergency_phone, admin_id, checkinMode, intervalHours, joined_at],
  );
  await logStatusChange(insertId, "pending");

  // 초대코드 자동 생성 (중복 시 재시도)
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    try {
      await execute(
        "INSERT INTO invite_codes (code, admin_id, user_id) VALUES (?, ?, ?)",
        [candidate, session.admin_id, insertId],
      );
      code = candidate;
      break;
    } catch {
      // UNIQUE 충돌 시 재시도
    }
  }

  await logAccess({ adminId: session.admin_id, action: "create_user", resource: `user_id=${insertId}`, req });

  return NextResponse.json({ user_id: insertId, invite_code: code }, { status: 201 });
}
