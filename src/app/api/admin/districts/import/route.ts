import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

interface DistrictRow extends RowDataPacket { dist_id: number; name: string; }

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const orgId = session.organization_id;
  if (!orgId) return NextResponse.json({ error: "소속 기관이 없습니다." }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

  if (rows.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  const { rows: existing } = await query<DistrictRow>(
    "SELECT dist_id, name FROM districts WHERE org_id = ?",
    [orgId],
  );
  const seenNames = new Set(existing.map((d) => d.name));

  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 헤더 제외
    const name = String(row["구역명"] ?? "").trim();

    if (!name) { errors.push(`${rowNum}행: 구역명이 없습니다.`); continue; }
    if (seenNames.has(name)) { errors.push(`${rowNum}행: 이미 존재하는 구역명입니다. (${name})`); continue; }

    try {
      await execute("INSERT INTO districts (org_id, name) VALUES (?, ?)", [orgId, name]);
      seenNames.add(name);
      inserted++;
    } catch {
      errors.push(`${rowNum}행: 저장 중 오류가 발생했습니다.`);
    }
  }

  return NextResponse.json({ inserted, errors }, { status: 200 });
}
