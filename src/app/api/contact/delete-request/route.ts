import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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
  const { name, phone } = await req.json();

  if (!name || !phone) {
    return NextResponse.json({ error: "이름과 전화번호를 입력해 주세요." }, { status: 400 });
  }

  const receivedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const body = `
[안심시그널 계정 삭제 요청]

접수 일시: ${receivedAt}
이름: ${name}
전화번호: ${phone}

처리 요청 데이터:
- 서비스 인증 토큰
- 안부 신호 전송 기록 (체크인 시각, 상태)
- 체크인 주기 설정값

* 기본 정보(이름 등)는 복지사 관리 시스템 데이터로 별도 협의 후 처리 바랍니다.
* 영업일 기준 5일 이내 처리 및 결과 통보 목표
  `.trim();

  await transporter.sendMail({
    from: `"안심시그널" <${process.env.GMAIL_USER}>`,
    to: "gncai.contact@gmail.com",
    subject: `[계정삭제요청] ${name} / ${phone}`,
    text: body,
  });

  return NextResponse.json({ ok: true });
}
