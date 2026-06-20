import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface DistrictRow extends RowDataPacket {
  dist_id: number;
  name: string;
  org_id: number;
}

// 구역 목록 조회
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const orgId = session.organization_id;
  if (!orgId) return NextResponse.json({ districts: [] });

  const { rows } = await query<DistrictRow>(
    "SELECT dist_id, name FROM districts WHERE org_id = ? ORDER BY name",
    [orgId],
  );
  return NextResponse.json({ districts: rows });
}

// 구역 추가
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const orgId = session.organization_id;
  if (!orgId) return NextResponse.json({ error: "소속 기관이 없습니다." }, { status: 400 });

  const { name } = await req.json();
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "구역명을 입력해주세요." }, { status: 400 });

  // 중복 확인
  const { rows } = await query<DistrictRow>(
    "SELECT dist_id FROM districts WHERE org_id = ? AND name = ?",
    [orgId, trimmed],
  );
  if (rows.length > 0) return NextResponse.json({ error: "이미 존재하는 구역명입니다." }, { status: 409 });

  const { insertId } = await execute(
    "INSERT INTO districts (org_id, name) VALUES (?, ?)",
    [orgId, trimmed],
  );

  return NextResponse.json({ dist_id: insertId, name: trimmed }, { status: 201 });
}
