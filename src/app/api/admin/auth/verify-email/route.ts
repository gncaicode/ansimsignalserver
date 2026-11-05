import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { isPublicDomain, TRIAL_DAYS } from "@/lib/org-plan";
import type { RowDataPacket } from "mysql2";

interface TokenRow extends RowDataPacket {
  id: number;
  admin_id: number;
  email: string;
  role: string;
  organization_id: number | null;
}

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 만료 및 사용 여부를 MySQL NOW() 기준으로 비교 (타임존 문제 방지)
  const { rows } = await query<TokenRow>(
    `SELECT t.id, t.admin_id, a.email, a.role, a.organization_id
     FROM email_verification_tokens t
     JOIN admins a ON a.admin_id = t.admin_id
     WHERE t.token = ? AND t.used_flag = 0 AND t.expires_at > NOW()
     LIMIT 1`,
    [String(token)],
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "링크가 만료되었거나 유효하지 않습니다." }, { status: 400 });
  }

  await execute("UPDATE email_verification_tokens SET used_flag = 1 WHERE id = ?", [row.id]);
  await execute(
    "UPDATE admins SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE admin_id = ?",
    [row.admin_id],
  );

  // 기관을 만든 최고관리자가 처음 인증하면 체험 기간을 시작하고, 공공 도메인이면 기관 확인도 함께 처리한다.
  if (row.role === "superadmin" && row.organization_id) {
    await execute(
      `UPDATE organizations
       SET trial_ends_at = DATE_ADD(NOW(), INTERVAL ? DAY)
       WHERE org_id = ? AND plan_status = 'trial' AND trial_ends_at IS NULL`,
      [TRIAL_DAYS, row.organization_id],
    );
    if (isPublicDomain(row.email)) {
      await execute(
        "UPDATE organizations SET verified_at = NOW() WHERE org_id = ? AND verified_at IS NULL",
        [row.organization_id],
      );
    }
  }

  return NextResponse.json({ ok: true });
}
