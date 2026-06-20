import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface DistrictRow extends RowDataPacket { org_id: number; }

// 구역 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const distId = Number(id);

  // 본인 기관 소속 구역인지 확인
  const { rows } = await query<DistrictRow>(
    "SELECT org_id FROM districts WHERE dist_id = ?",
    [distId],
  );
  if (rows.length === 0) return NextResponse.json({ error: "존재하지 않는 구역입니다." }, { status: 404 });
  if (rows[0].org_id !== session.organization_id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 이 구역에 배정된 대상자가 있으면 삭제 불가
  const { rows: userRows } = await query<RowDataPacket>(
    "SELECT COUNT(*) AS cnt FROM users WHERE district_id = ? AND active_flag = 1",
    [distId],
  );
  if (Number((userRows[0] as any).cnt) > 0) {
    return NextResponse.json({ error: "이 구역에 배정된 대상자가 있어 삭제할 수 없습니다." }, { status: 409 });
  }

  await execute("DELETE FROM districts WHERE dist_id = ?", [distId]);
  return NextResponse.json({ ok: true });
}
