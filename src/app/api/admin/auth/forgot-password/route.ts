import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, execute } from "@/lib/db";
import nodemailer from "nodemailer";
import type { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket { admin_id: number; name: string; email: string; }

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "이메일을 입력해 주세요." }, { status: 400 });
  }

  const { rows } = await query<AdminRow>(
    "SELECT admin_id, name, email FROM admins WHERE email = ? AND active_flag = 1 AND withdraw_flag = 0 LIMIT 1",
    [email],
  );

  // 이메일 미존재 시에도 동일 응답 (이메일 열거 공격 방지)
  if (rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const admin = rows[0];
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간
  const expiresStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  // 기존 미사용 토큰 무효화
  await execute(
    "UPDATE password_reset_tokens SET used_flag = 1 WHERE admin_id = ? AND used_flag = 0",
    [admin.admin_id],
  );

  await execute(
    "INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)",
    [admin.admin_id, token, expiresStr],
  );

  const host = req.headers.get("host") ?? "localhost:3003";
  const protocol = host.includes("localhost") ? "http" : "http";
  const resetUrl = `${protocol}://${host}/ko/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"안심시그널" <${process.env.GMAIL_USER}>`,
    to: admin.email,
    subject: "[안심시그널] 비밀번호 재설정 안내",
    html: `
      <p>${admin.name}님 안녕하세요.</p>
      <p>아래 버튼을 클릭하여 비밀번호를 재설정해 주세요.<br/>링크는 <strong>1시간</strong> 동안 유효합니다.</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          비밀번호 재설정
        </a>
      </p>
      <p style="color:#888;font-size:12px;">본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
