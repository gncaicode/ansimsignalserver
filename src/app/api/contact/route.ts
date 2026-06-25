import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const { org, name, phone, email, message } = await req.json();

  if (!org || !name || !phone || !email) {
    return NextResponse.json({ error: "필수 항목을 입력해 주세요." }, { status: 400 });
  }

  const body = `
[안심시그널 도입 문의]

기관명: ${org}
담당자명: ${name}
연락처: ${phone}
이메일: ${email}
문의내용:
${message || "(없음)"}
  `.trim();

  await transporter.sendMail({
    from: `"안심시그널 문의" <${process.env.GMAIL_USER}>`,
    to: "gncai.contact@gmail.com",
    subject: `[도입문의] ${org} / ${name}`,
    text: body,
  });

  return NextResponse.json({ ok: true });
}
