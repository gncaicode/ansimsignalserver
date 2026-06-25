import { execute } from "./db";
import type { NextRequest } from "next/server";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export type AccessAction =
  | "login_success"
  | "login_fail"
  | "logout"
  | "view_dashboard"
  | "view_users"
  | "view_user"
  | "view_managers"
  | "view_reports"
  | "view_settings";

function extractIp(headers: NextRequest["headers"] | ReadonlyHeaders): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    null
  );
}

export async function logAccess({
  adminId,
  action,
  resource,
  req,
  headers,
  email,
}: {
  adminId?: number | null;
  action: AccessAction;
  resource?: string;
  req?: NextRequest;
  headers?: ReadonlyHeaders;
  email?: string;
}): Promise<void> {
  try {
    const h = req?.headers ?? headers ?? null;
    const ip = h ? extractIp(h) : null;
    const ua = h ? h.get("user-agent") : null;

    await execute(
      `INSERT INTO admin_access_logs (admin_id, action, resource, ip_address, user_agent, email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [adminId ?? null, action, resource ?? null, ip, ua, email ?? null],
    );
  } catch {
    // 로그 실패가 서비스에 영향을 주지 않도록 예외를 삼킴
  }
}
