import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { logAccess } from "@/lib/access-log";
import { calcSignalStatus } from "@/lib/dashboard-data";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

interface ExportRow extends RowDataPacket {
  name: string;
  age: number;
  district_name: string | null;
  address: string;
  emergency_phone: string;
  admin_name: string | null;
  interval_hours: number;
  last_checkin_at: string | null;
  register_flag: number;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const orgId = session.organization_id ?? null;
  const orgCond = orgId ? "AND d.org_id = ?" : "";
  const params: (string | number)[] = [];
  if (orgId) params.push(orgId);

  const { rows } = await query<ExportRow>(
    `SELECT
       u.user_id, u.name, u.age, d.name AS district_name, u.address,
       u.emergency_phone, GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS admin_name,
       u.interval_hours, u.last_checkin_at, u.register_flag
     FROM users u
     LEFT JOIN districts       d  ON u.district_id  = d.dist_id
     LEFT JOIN admin_districts ad ON u.district_id  = ad.district_id
     LEFT JOIN admins          a  ON ad.admin_id    = a.admin_id
                                  AND a.role = 'social_worker'
                                  AND a.active_flag = 1
                                  AND a.withdraw_flag = 0
     WHERE u.active_flag = 1 ${orgCond}
     GROUP BY u.user_id, u.name, u.age, d.name, u.address,
              u.emergency_phone, u.interval_hours, u.last_checkin_at, u.register_flag
     ORDER BY u.last_checkin_at ASC`,
    params,
  );

  const statusLabel: Record<string, string> = {
    danger: "위급", warn: "주의", safe: "안전", pending: "대기",
  };

  const data = rows
    .map((r) => ({ ...r, status: calcSignalStatus(r.last_checkin_at, r.interval_hours, r.register_flag) }))
    .sort((a, b) => {
      const order: Record<string, number> = { danger: 0, warn: 1, pending: 2, safe: 3 };
      return order[a.status] - order[b.status];
    })
    .map((r) => ({
      "이름":       r.name,
      "연령":       r.age,
      "관할구역":   r.district_name ?? "",
      "주소":       r.address,
      "긴급연락처": r.emergency_phone,
      "담당자":     r.admin_name ?? "",
      "상태":       statusLabel[r.status] ?? r.status,
      "체크인주기(시간)": r.interval_hours,
      "마지막체크인": r.last_checkin_at
        ? new Date(r.last_checkin_at.replace(' ', 'T') + '+09:00').toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
        : "",
      "앱가입":     r.register_flag === 1 ? "완료" : "미가입",
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 30 },
    { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "대상자목록");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const now = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\. /g, "-").replace(".", "");

  await logAccess({ adminId: session.admin_id, action: "export_users", resource: `count=${rows.length}`, req });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`대상자목록_${now}`)}.xlsx`,
    },
  });
}
