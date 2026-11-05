import { randomBytes } from "crypto";
import { execute } from "./db";
import { sendVerificationEmail, siteOrigin } from "./mailer";

// 기존 미사용 토큰을 무효화하고 새 인증 메일을 보낸다.
export async function issueEmailVerification(
  admin: { admin_id: number; name: string; email: string },
  headers: Headers,
  lang = "ko",
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await execute(
    "UPDATE email_verification_tokens SET used_flag = 1 WHERE admin_id = ? AND used_flag = 0",
    [admin.admin_id],
  );
  // expires_at은 MySQL NOW() 기준 +24시간 (타임존 문제 방지)
  await execute(
    "INSERT INTO email_verification_tokens (admin_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))",
    [admin.admin_id, token],
  );
  const url = `${siteOrigin(headers)}/${lang === "ja" ? "ja" : "ko"}/verify-email?token=${token}`;
  await sendVerificationEmail(admin.email, admin.name, url);
}
