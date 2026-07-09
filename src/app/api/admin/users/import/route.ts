import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import { logAccess } from "@/lib/access-log";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

interface DistrictRow extends RowDataPacket { dist_id: number; name: string; }

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

  if (rows.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  const orgId = session.organization_id ?? null;

  // 구역 목록 미리 로드
  const { rows: districts } = await query<DistrictRow>(
    orgId
      ? "SELECT dist_id, name FROM districts WHERE org_id = ?"
      : "SELECT dist_id, name FROM districts",
    orgId ? [orgId] : [],
  );

  const joinedAt = new Date().toISOString().slice(0, 10);
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 헤더 제외

    const name  = String(row["이름"] ?? "").trim();
    const age   = Number(row["연령"] ?? 0);
    const districtName  = String(row["관할구역"] ?? "").trim();
    const address       = String(row["주소"] ?? "").trim();
    const emergencyPhone = String(row["긴급연락처"] ?? "").trim();

    if (!name) { errors.push(`${rowNum}행: 이름이 없습니다.`); continue; }
    if (!age || age < 1 || age > 150) { errors.push(`${rowNum}행: 올바른 연령이 아닙니다.`); continue; }

    const district = districtName ? districts.find((d) => d.name === districtName) : null;

    if (districtName && !district) {
      errors.push(`${rowNum}행: 구역 '${districtName}'을 찾을 수 없습니다.`);
      continue;
    }

    try {
      const { insertId } = await execute(
        `INSERT INTO users
           (name, age, district_id, address, emergency_phone, joined_at, active_flag)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [name, age, district?.dist_id ?? null, address, emergencyPhone, joinedAt],
      );

      // 초대코드 발급
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await execute(
            "INSERT INTO invite_codes (code, admin_id, user_id) VALUES (?, ?, ?)",
            [generateCode(), session.admin_id, insertId],
          );
          break;
        } catch { /* 중복 재시도 */ }
      }

      await logAccess({ adminId: session.admin_id, action: "create_user", resource: `user_id=${insertId} (bulk)`, req });
      inserted++;
    } catch {
      errors.push(`${rowNum}행: 저장 중 오류가 발생했습니다.`);
    }
  }

  return NextResponse.json({ inserted, errors }, { status: 200 });
}
