import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import * as XLSX from "xlsx";
import type { RowDataPacket } from "mysql2";

interface LogRow extends RowDataPacket {
  created_at: string;
  action: string;
  resource: string | null;
  ip_address: string | null;
  email: string | null;
  admin_name: string | null;
  admin_role: string | null;
  org_name: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  login_success:  "로그인 성공",
  login_fail:     "로그인 실패",
  logout:         "로그아웃",
  view_dashboard: "대시보드 조회",
  view_users:     "대상자 목록 조회",
  view_user:      "대상자 상세 조회",
  view_managers:  "관리자 조회",
  view_reports:   "리포트 조회",
  view_settings:  "설정 조회",
  create_user:    "대상자 등록",
  edit_user:      "대상자 수정",
  delete_user:    "대상자 삭제",
  export_users:   "대상자 내보내기",
};

const ROLE_LABELS: Record<string, string> = {
  superadmin:    "최고관리자",
  admin:         "관리자",
  social_worker: "복지사",
  viewer:        "조회자",
};

const ACCESS_ACTIONS = [
  "login_success", "login_fail", "logout",
  "view_dashboard", "view_users", "view_user",
  "view_managers", "view_reports", "view_settings",
];
const PERSONAL_ACTIONS = ["create_user", "edit_user", "delete_user", "export_users"];

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const org = sp.get("org") ?? "";
  const action = sp.get("action") ?? "";
  const actionGroup = sp.get("actionGroup") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const adminName = sp.get("adminName") ?? "";

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (org) {
    conditions.push("o.name LIKE ?");
    params.push(`%${org}%`);
  }
  if (action) {
    conditions.push("l.action = ?");
    params.push(action);
  } else if (actionGroup === "access") {
    conditions.push(`l.action IN (${ACCESS_ACTIONS.map(() => "?").join(",")})`);
    params.push(...ACCESS_ACTIONS);
  } else if (actionGroup === "personal") {
    conditions.push(`l.action IN (${PERSONAL_ACTIONS.map(() => "?").join(",")})`);
    params.push(...PERSONAL_ACTIONS);
  }
  if (dateFrom) { conditions.push("l.created_at >= ?"); params.push(dateFrom + " 00:00:00"); }
  if (dateTo)   { conditions.push("l.created_at <= ?"); params.push(dateTo + " 23:59:59"); }
  if (adminName) { conditions.push("a.name LIKE ?"); params.push(`%${adminName}%`); }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query<LogRow>(
    `SELECT l.created_at, l.action, l.resource, l.ip_address, l.email,
            a.name AS admin_name, a.role AS admin_role,
            o.name AS org_name
     FROM admin_access_logs l
     LEFT JOIN admins a ON l.admin_id = a.admin_id
     LEFT JOIN organizations o ON a.organization_id = o.org_id
     ${whereClause}
     ORDER BY l.created_at DESC`,
    params,
  );

  const sheetName = actionGroup === "personal" ? "개인정보접근로그" : "접속로그";
  const fileName = actionGroup === "personal" ? "개인정보접근로그" : "접속로그";

  const data = rows.map((r) => ({
    "일시":     r.created_at,
    "기관":     r.org_name ?? "",
    "관리자":   r.admin_name ?? "",
    "역할":     ROLE_LABELS[r.admin_role ?? ""] ?? (r.admin_role ?? ""),
    "이메일":   r.email ?? "",
    "액션":     ACTION_LABELS[r.action] ?? r.action,
    "대상":     r.resource ?? "",
    "IP":       r.ip_address ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
    { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const now = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    .replace(/\. /g, "-").replace(".", "");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${fileName}_${now}`)}.xlsx`,
    },
  });
}
