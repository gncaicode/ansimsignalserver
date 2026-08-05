import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { execute, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface DupRow extends RowDataPacket { admin_id: number; }
interface DistrictRow extends RowDataPacket { dist_id: number; }

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    if (!["superadmin", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, phone, position, department, role } = body;

    if (!name?.trim()) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    if (!["admin", "social_worker", "viewer"].includes(role)) {
      return NextResponse.json({ error: "올바른 권한을 선택해주세요." }, { status: 400 });
    }

    const districtIds: number[] = Array.isArray(body.district_ids)
      ? body.district_ids.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];
    if (districtIds.length > 0 && role !== "social_worker") {
      return NextResponse.json({ error: "복지사에게만 구역을 배정할 수 있습니다." }, { status: 400 });
    }
    if (districtIds.length > 0) {
      const { rows: validDistricts } = await query<DistrictRow>(
        `SELECT dist_id FROM districts WHERE dist_id IN (${districtIds.map(() => "?").join(",")}) AND org_id = ?`,
        [...districtIds, session.organization_id]
      );
      if (validDistricts.length !== districtIds.length) {
        return NextResponse.json({ error: "잘못된 구역입니다." }, { status: 400 });
      }
    }

    // 이메일 중복 확인
    const { rows } = await query<DupRow>(
      "SELECT admin_id FROM admins WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    if (rows.length > 0) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailNorm = email.trim().toLowerCase();

    const { insertId } = await execute(
      `INSERT INTO admins (password_hash, name, organization_id, phone, position, department, email, role, active_flag, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURDATE())`,
      [passwordHash, name.trim(), session.organization_id, phone ?? "", position ?? "", department ?? "", emailNorm, role]
    );

    for (const did of districtIds) {
      await execute("INSERT INTO admin_districts (admin_id, district_id) VALUES (?, ?)", [insertId, did]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/managers]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
