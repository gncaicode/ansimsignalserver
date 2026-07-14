import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
}

const CHECKIN_MODES = ["manual", "appOpen", "passive"];
const INTERVAL_HOURS_OPTIONS = [12, 24];

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

    // 체크인 기본 설정 변경 — 최고관리자만 가능
    if (body.default_checkin_mode !== undefined || body.default_interval_hours !== undefined) {
      if (session.role !== "superadmin") {
        return NextResponse.json({ error: "최고관리자만 변경할 수 있습니다." }, { status: 403 });
      }

      const defaultCheckinMode = body.default_checkin_mode;
      const defaultIntervalHours = Number(body.default_interval_hours);

      if (!CHECKIN_MODES.includes(defaultCheckinMode)) {
        return NextResponse.json({ error: "올바른 체크인 방식을 선택해주세요." }, { status: 400 });
      }
      if (!INTERVAL_HOURS_OPTIONS.includes(defaultIntervalHours)) {
        return NextResponse.json({ error: "체크인 주기는 12시간 또는 24시간 중에서 선택해주세요." }, { status: 400 });
      }

      await execute(
        "UPDATE organizations SET default_checkin_mode = ?, default_interval_hours = ?, updated_at = NOW() WHERE org_id = ?",
        [defaultCheckinMode, defaultIntervalHours, session.organization_id]
      );

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 기관명 변경
    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "기관명은 필수입니다." }, { status: 400 });
    }

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
