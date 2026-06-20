import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

interface ExportRow extends RowDataPacket {
  name: string;
  age: number;
  district_name: string | null;
  address: string;
  emergency_phone: string;
  admin_name: string | null;
  status: string;
  last_checkin_at: string | null;
  register_flag: number;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const orgId = session.organization_id ?? null;
  const orgCond = orgId ? "AND d.org_id = ?" : "";
  const params: (string | number)[] = [];
  if (orgId) params.push(orgId);

  const { rows } = await query<ExportRow>(
    `SELECT
       u.name, u.age, d.name AS district_name, u.address,
       u.emergency_phone, a.name AS admin_name,
       u.status, u.last_checkin_at, u.register_flag
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     LEFT JOIN admins    a ON u.admin_id    = a.admin_id
     WHERE u.active_flag = 1 ${orgCond}
     ORDER BY FIELD(u.status,'danger','warning','safe'), u.last_checkin_at ASC`,
    params,
  );

  const statusLabel: Record<string, string> = {
    danger: "위급", warning: "주의", safe: "안전",
  };

  const data = rows.map((r) => ({
    "이름":       r.name,
    "연령":       r.age,
    "관할구역":   r.district_name ?? "",
    "주소":       r.address,
    "긴급연락처": r.emergency_phone,
    "담당자":     r.admin_name ?? "",
    "상태":       statusLabel[r.status] ?? r.status,
    "마지막체크인": r.last_checkin_at
      ? new Date(r.last_checkin_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      : "",
    "앱가입":     r.register_flag === 1 ? "완료" : "미가입",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 30 },
    { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "대상자목록");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const now = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\. /g, "-").replace(".", "");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`대상자목록_${now}`)}.xlsx`,
    },
  });
}
